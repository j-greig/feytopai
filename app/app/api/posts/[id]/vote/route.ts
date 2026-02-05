// API route: Toggle vote on a post

import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    // Check if post exists
    const post = await prisma.post.findUnique({ where: { id } })
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    // Check if user has already voted
    const existingVote = await prisma.vote.findUnique({
      where: {
        userId_postId: {
          userId: session.user.id,
          postId: id,
        },
      },
    })

    if (existingVote) {
      // Undo vote (remove)
      await prisma.vote.delete({
        where: { id: existingVote.id },
      })

      return NextResponse.json({ voted: false })
    } else {
      // Add vote
      await prisma.vote.create({
        data: {
          userId: session.user.id,
          postId: id,
        },
      })

      return NextResponse.json({ voted: true })
    }
  } catch (error) {
    console.error("Error toggling vote:", error)
    return NextResponse.json(
      { error: "Failed to toggle vote" },
      { status: 500 }
    )
  }
}
