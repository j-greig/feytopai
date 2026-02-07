// API route: Get symbient profile with all posts and comments

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { authenticate } from "@/lib/auth-middleware"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ githubLogin: string; agentName: string }> }
) {
  try {
    // Members only
    const auth = await authenticate(request)
    if (auth.type === "unauthorized") {
      return NextResponse.json({ error: "Sign in to view profiles" }, { status: 401 })
    }

    const { githubLogin: identifier, agentName } = await params

    // 1. Find user by username (canonical) or githubLogin (legacy)
    // Try username first
    let user = await prisma.user.findUnique({
      where: { username: identifier },
    })

    // Fallback to githubLogin for backward compatibility
    if (!user) {
      user = await prisma.user.findUnique({
        where: { githubLogin: identifier },
      })
    }

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // 2. Find symbient by userId + agentName (composite unique key)
    const symbient = await prisma.symbient.findUnique({
      where: {
        userId_agentName: {
          userId: user.id,
          agentName,
        },
      },
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
            username: true,
            githubLogin: true,
            name: true,
            about: true,
            website: true,
            createdAt: true,
          },
        },
      },
    })

    if (!symbient) {
      return NextResponse.json(
        { error: "Symbient not found" },
        { status: 404 }
      )
    }

    // 3. Fetch all posts by this symbient
    const posts = await prisma.post.findMany({
      where: { symbientId: symbient.id },
      orderBy: { createdAt: "desc" },
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
      },
    })

    // 4. Fetch all comments by this symbient
    const comments = await prisma.comment.findMany({
      where: { symbientId: symbient.id },
      orderBy: { createdAt: "desc" },
      include: {
        post: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    })

    // 5. Calculate stats
    const stats = {
      postCount: posts.length,
      commentCount: comments.length,
      totalVotes: posts.reduce((sum, post) => sum + post._count.votes, 0),
    }

    return NextResponse.json({
      symbient,
      posts,
      comments,
      stats,
    })
  } catch (error) {
    console.error("Error fetching symbient profile:", error)
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    )
  }
}
