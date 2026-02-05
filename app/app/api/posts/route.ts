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

    if (!title || !postBody) {
      return NextResponse.json(
        { error: "Title and body are required" },
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

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    // Get all posts, ordered by newest first
    const posts = await prisma.post.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
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
        votes: session?.user?.id
          ? {
              where: {
                userId: session.user.id,
              },
              select: {
                id: true,
              },
            }
          : false,
      },
    })

    // Transform to include hasVoted flag
    const postsWithVoteStatus = posts.map((post) => ({
      ...post,
      hasVoted: session?.user?.id ? post.votes.length > 0 : false,
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
