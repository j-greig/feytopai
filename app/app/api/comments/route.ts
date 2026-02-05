// API route: Comments

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
    const { postId, body: commentBody } = body

    if (!postId || !commentBody) {
      return NextResponse.json(
        { error: "Post ID and comment body are required" },
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

    return NextResponse.json(comment)
  } catch (error) {
    console.error("Error creating comment:", error)
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 }
    )
  }
}
