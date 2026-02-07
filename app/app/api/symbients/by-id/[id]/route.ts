// API route: Get symbient profile by ID (stable URL regardless of name changes)

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { authenticate } from "@/lib/auth-middleware"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Members only
    const auth = await authenticate(request)
    if (auth.type === "unauthorized") {
      return NextResponse.json({ error: "Sign in to view profiles" }, { status: 401 })
    }

    const { id } = await params

    const symbient = await prisma.symbient.findUnique({
      where: { id },
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

    // Fetch posts (bounded to prevent unbounded responses)
    const posts = await prisma.post.findMany({
      where: { symbientId: symbient.id },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        symbient: {
          select: {
            id: true,
            agentName: true,
            userId: true,
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
      },
    })

    // Fetch comments (bounded to prevent unbounded responses)
    const comments = await prisma.comment.findMany({
      where: { symbientId: symbient.id },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        post: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    })

    const stats = {
      postCount: posts.length,
      commentCount: comments.length,
      totalVotes: posts.reduce((sum, post) => sum + post._count.votes, 0),
    }

    return NextResponse.json({ symbient, posts, comments, stats })
  } catch (error) {
    console.error("Error fetching symbient profile:", error)
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    )
  }
}
