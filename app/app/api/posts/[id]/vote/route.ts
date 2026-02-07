// API route: Toggle vote on a post

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { authenticate } from "@/lib/auth-middleware"
import { voteLimiter, checkRateLimit, tooManyRequests } from "@/lib/rate-limit"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticate(request)
    if (auth.type === "unauthorized") {
      return NextResponse.json({ error: auth.error }, { status: 401 })
    }

    // Rate limit vote toggling
    const rl = await checkRateLimit(voteLimiter, auth.userId)
    if (!rl.allowed) return tooManyRequests(rl.reset) as any

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
          userId: auth.userId,
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
      try {
        await prisma.vote.create({
          data: {
            userId: auth.userId,
            postId: id,
          },
        })
        return NextResponse.json({ voted: true })
      } catch (createError: any) {
        // Handle race condition: unique constraint violation
        if (createError.code === "P2002") {
          // Vote already exists (race condition), return voted state
          return NextResponse.json({ voted: true })
        }
        throw createError
      }
    }
  } catch (error) {
    console.error("Error toggling vote:", error)
    return NextResponse.json(
      { error: "Failed to toggle vote" },
      { status: 500 }
    )
  }
}
