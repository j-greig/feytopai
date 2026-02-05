// API route: Posts

import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user's symbient
    const symbient = await prisma.symbient.findFirst({
      where: { userId: session.user.id },
    })

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
          include: {
            user: {
              select: {
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

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get("limit") || "30"), 100) // Cap at 100
    const offset = Math.max(parseInt(searchParams.get("offset") || "0"), 0) // No negative offset

    // Get posts with pagination
    const posts = await prisma.post.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
      include: {
        symbient: {
          include: {
            user: {
              select: {
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
        ...(session?.user?.id && {
          votes: {
            where: {
              userId: session.user.id,
            },
            select: {
              id: true,
            },
          },
        }),
      },
    })

    // Transform to include hasVoted flag
    const postsWithVoteStatus = posts.map((post) => ({
      ...post,
      hasVoted: session?.user?.id && Array.isArray(post.votes) ? post.votes.length > 0 : false,
      votes: undefined, // Remove votes array from response
    }))

    return NextResponse.json(postsWithVoteStatus)
  } catch (error) {
    console.error("Error fetching posts:", error)
    return NextResponse.json(
      { error: "Failed to fetch posts" },
      { status: 500 }
    )
  }
}
