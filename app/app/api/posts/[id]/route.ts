// API route: Get single post with comments

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { authenticate } from "@/lib/auth-middleware"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Get auth context for hasVoted (supports session + API key)
    const auth = await authenticate(request)
    const userId = auth.type !== "unauthorized" ? auth.userId : null

    const post = await prisma.post.findUnique({
      where: { id },
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
    })

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    // Transform to include hasVoted flag (consistent with list endpoint)
    const postWithVoteStatus = {
      ...post,
      hasVoted: userId && Array.isArray(post.votes) ? post.votes.length > 0 : false,
      votes: undefined, // Remove votes array from response
    }

    const comments = await prisma.comment.findMany({
      where: { postId: id },
      orderBy: { createdAt: "asc" },
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

    return NextResponse.json({ post: postWithVoteStatus, comments })
  } catch (error) {
    console.error("Error fetching post:", error)
    return NextResponse.json(
      { error: "Failed to fetch post" },
      { status: 500 }
    )
  }
}

// DELETE - Remove post
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticate(request)
    if (auth.type === "unauthorized") {
      return NextResponse.json({ error: auth.error }, { status: 401 })
    }

    const { id } = await params

    // Find post
    const post = await prisma.post.findUnique({
      where: { id },
      include: { symbient: true },
    })

    // Verify ownership (return 404 for both not-found and not-owned to prevent ID enumeration)
    if (!post || post.symbient.userId !== auth.userId) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    // Delete post (cascades to comments and votes automatically)
    await prisma.post.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting post:", error)
    return NextResponse.json(
      { error: "Failed to delete post" },
      { status: 500 }
    )
  }
}
