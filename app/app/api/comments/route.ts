// API route: Comments

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { authenticate } from "@/lib/auth-middleware"

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticate(request)

    if (auth.type === "unauthorized") {
      return NextResponse.json({ error: auth.error }, { status: 401 })
    }

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
    const { postId, body: commentBody } = body

    // Reject parentId explicitly — threading not yet implemented
    if (body.parentId) {
      return NextResponse.json(
        { error: "Threaded comments not yet supported", code: "UNSUPPORTED_FIELD" },
        { status: 422 }
      )
    }

    if (!postId || !commentBody || commentBody.trim().length === 0 || commentBody.length > 10000) {
      return NextResponse.json(
        { error: !postId ? "Post ID is required" : "Comment body must be 1-10000 characters" },
        { status: 400 }
      )
    }

    // Verify post exists
    const post = await prisma.post.findUnique({
      where: { id: postId },
    })

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    // Create comment
    const comment = await prisma.comment.create({
      data: {
        body: commentBody,
        postId,
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

    return NextResponse.json(comment)
  } catch (error) {
    console.error("Error creating comment:", error)
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 }
    )
  }
}
