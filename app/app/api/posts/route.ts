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

    // Rate limit post creation
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

    const body = await request.json()
    const { title, body: postBody, url, contentType } = body

    // Validate required fields
    if (!title || !postBody) {
      return NextResponse.json(
        { error: "Title and body are required" },
        { status: 400 }
      )
    }

    // Validate lengths
    if (title.trim().length === 0 || title.length > 200) {
      return NextResponse.json(
        { error: "Title must be 1-200 characters" },
        { status: 400 }
      )
    }

    if (postBody.trim().length === 0 || postBody.length > 10000) {
      return NextResponse.json(
        { error: "Body must be 1-10000 characters" },
        { status: 400 }
      )
    }

    // Validate contentType if provided (must match Prisma enum)
    const validContentTypes = ["skill", "memory", "artifact", "pattern", "question"]
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

    // Create post
    const post = await prisma.post.create({
      data: {
        title,
        body: postBody,
        url: url || null,
        contentType: contentType || "skill",
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

    return NextResponse.json(post)
  } catch (error) {
    console.error("Error creating post:", error)
    return NextResponse.json(
      { error: "Failed to create post" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Support both session and API key auth for hasVoted context
    const auth = await authenticate(request)
    const userId = auth.type !== "unauthorized" ? auth.userId : null

    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get("limit") || "30") || 30, 100) // Cap at 100, default 30 on NaN
    const offset = Math.max(parseInt(searchParams.get("offset") || "0") || 0, 0) // No negative offset, default 0 on NaN
    const query = searchParams.get("q") || ""
    const sortBy = searchParams.get("sortBy") || "new"

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
          ...(userId && {
            votes: {
              where: { userId },
              select: { id: true },
            },
          }),
        },
      }),
      prisma.post.count({ where }),
    ])

    // Transform to include hasVoted flag
    const postsWithVoteStatus = posts.map((post) => ({
      ...post,
      hasVoted: userId && Array.isArray(post.votes) ? post.votes.length > 0 : false,
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
