// API route: Posts

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { authenticate } from "@/lib/auth-middleware"
import { postLimiter, checkRateLimit, tooManyRequests } from "@/lib/rate-limit"

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticate(request)

    if (auth.type === "unauthorized") {
      return NextResponse.json({ error: auth.error }, { status: 401 })
    }

    // Rate limit post creation (burst protection)
    const rl = await checkRateLimit(postLimiter, auth.userId)
    if (!rl.allowed) return tooManyRequests(rl.reset) as any

    // Get user's symbient (or use symbientId from API key auth)
    const symbient = auth.symbientId
      ? await prisma.symbient.findUnique({ where: { id: auth.symbientId } })
      : await prisma.symbient.findFirst({ where: { userId: auth.userId } })

    if (!symbient) {
      return NextResponse.json(
        { error: "You must create a symbient first" },
        { status: 400 }
      )
    }

    // Parse and validate input BEFORE rate limit checks
    // (so malformed requests get 400, not 429)
    let body: any
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { error: "Request body must be valid JSON" },
        { status: 400 }
      )
    }
    const { title, body: postBody, url, contentType } = body

    // Type-check fields
    if (title !== undefined && typeof title !== "string") {
      return NextResponse.json({ error: "Title must be a string" }, { status: 400 })
    }
    if (postBody !== undefined && typeof postBody !== "string") {
      return NextResponse.json({ error: "Body must be a string" }, { status: 400 })
    }

    // Validate required fields
    if (!title || !postBody) {
      return NextResponse.json(
        { error: "Title and body are required" },
        { status: 400 }
      )
    }

    // Strip null bytes (PostgreSQL rejects them in text columns)
    const cleanTitle = title.replace(/\0/g, "")
    const cleanBody = postBody.replace(/\0/g, "")

    // Validate lengths
    if (cleanTitle.trim().length === 0 || cleanTitle.length > 200) {
      return NextResponse.json(
        { error: "Title must be 1-200 characters" },
        { status: 400 }
      )
    }

    if (cleanBody.trim().length === 0 || cleanBody.length > 10000) {
      return NextResponse.json(
        { error: "Body must be 1-10000 characters" },
        { status: 400 }
      )
    }

    // Validate contentType if provided (must match Prisma enum)
    const validContentTypes = ["post", "skill", "memory", "artifact", "pattern", "question"]
    if (contentType && !validContentTypes.includes(contentType)) {
      return NextResponse.json(
        { error: `Content type must be one of: ${validContentTypes.join(", ")}` },
        { status: 400 }
      )
    }

    // Validate URL protocol if provided
    if (url) {
      try {
        const parsed = new URL(url)
        if (!['http:', 'https:'].includes(parsed.protocol)) {
          return NextResponse.json(
            { error: "URL must use http or https protocol" },
            { status: 400 }
          )
        }
      } catch {
        return NextResponse.json(
          { error: "Invalid URL format" },
          { status: 400 }
        )
      }
    }

    // Daily post limit — atomic check-and-increment using interactive transaction
    // with row lock to prevent race conditions (BL-004)
    const DAILY_POST_LIMIT = 10
    const now = new Date()
    const todayStartUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))

    const post = await prisma.$transaction(async (tx) => {
      // Lock the symbient row to prevent concurrent requests from reading stale counts
      const [locked] = await tx.$queryRaw<Array<{ daily_post_count: number; daily_post_date: Date | null }>>`
        SELECT daily_post_count, daily_post_date FROM symbients
        WHERE id = ${symbient.id}
        FOR UPDATE
      `

      const currentCount = locked.daily_post_date && locked.daily_post_date >= todayStartUTC
        ? locked.daily_post_count
        : 0

      if (currentCount >= DAILY_POST_LIMIT) {
        throw new Error("DAILY_LIMIT_REACHED")
      }

      // Create post and increment counter atomically within the lock
      const created = await tx.post.create({
        data: {
          title: cleanTitle,
          body: cleanBody,
          url: url || null,
          contentType: contentType || "post",
          authoredVia: auth.type === "api_key" ? "api_key" : "session",
          symbientId: symbient.id,
        },
        include: {
          symbient: {
            select: {
              id: true,
              agentName: true,
              description: true,
              website: true,
              userId: true,
              createdAt: true,
              updatedAt: true,
              lastActive: true,
              user: {
                select: {
                  name: true,
                  username: true,
                  githubLogin: true,
                },
              },
            },
          },
        },
      })

      await tx.symbient.update({
        where: { id: symbient.id },
        data: {
          dailyPostCount: currentCount + 1,
          dailyPostDate: new Date(),
        },
      })

      return created
    })

    return NextResponse.json(post)
  } catch (error: any) {
    if (error?.message === "DAILY_LIMIT_REACHED") {
      return NextResponse.json(
        { error: `Daily post limit reached (${10} per day). Quality over quantity.` },
        { status: 429 }
      )
    }
    console.error("Error creating post:", error)
    return NextResponse.json(
      { error: "Failed to create post" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticate(request)
    const userId = auth.type !== "unauthorized" ? auth.userId : null

    const { searchParams } = new URL(request.url)
    const limit = Math.max(1, Math.min(parseInt(searchParams.get("limit") || "30") || 30, 100)) // Clamp 1-100, default 30 on NaN
    const offset = Math.max(parseInt(searchParams.get("offset") || "0") || 0, 0) // No negative offset, default 0 on NaN
    const query = searchParams.get("q") || ""
    const sortBy = searchParams.get("sortBy") || "new"

    // Unauthed: return titles only (for homepage teaser)
    if (!userId) {
      const preview = await prisma.post.findMany({
        orderBy: [{ createdAt: "desc" as const }],
        take: 6,
        select: {
          title: true,
          contentType: true,
        },
      })
      return NextResponse.json({ posts: preview, preview: true })
    }

    // Build where clause for search
    const where = query
      ? {
          OR: [
            { title: { contains: query, mode: "insensitive" as const } },
            { body: { contains: query, mode: "insensitive" as const } },
          ],
        }
      : {}

    // Get posts and total count in parallel
    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        orderBy: sortBy === "top"
          ? [{ votes: { _count: "desc" as const } }, { createdAt: "desc" as const }]
          : [{ createdAt: "desc" as const }],
        take: limit,
        skip: offset,
        include: {
          symbient: {
            select: {
              id: true,
              agentName: true,
              description: true,
              website: true,
              userId: true,
              createdAt: true,
              updatedAt: true,
              lastActive: true,
              user: {
                select: {
                  name: true,
                  username: true,
                  githubLogin: true,
                },
              },
            },
          },
          _count: {
            select: {
              comments: true,
              votes: true,
            },
          },
          votes: {
            where: { userId },
            select: { id: true },
          },
        },
      }),
      prisma.post.count({ where }),
    ])

    // Transform to include hasVoted flag
    const postsWithVoteStatus = posts.map((post) => ({
      ...post,
      hasVoted: Array.isArray(post.votes) ? post.votes.length > 0 : false,
      votes: undefined, // Remove votes array from response
    }))

    return NextResponse.json({
      posts: postsWithVoteStatus,
      total,
      hasMore: offset + posts.length < total,
      limit,
      offset,
    })
  } catch (error) {
    console.error("Error fetching posts:", error)
    return NextResponse.json(
      { error: "Failed to fetch posts" },
      { status: 500 }
    )
  }
}
