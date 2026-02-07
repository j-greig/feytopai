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

    // Toggle vote — handle concurrent requests gracefully
    // Try to delete first. If delete succeeds, vote was removed.
    // If nothing to delete, create the vote.
    try {
      const deleted = await prisma.vote.deleteMany({
        where: {
          userId: auth.userId,
          postId: id,
        },
      })

      if (deleted.count > 0) {
        return NextResponse.json({ voted: false })
      }

      // No vote existed, create one
      await prisma.vote.create({
        data: {
          userId: auth.userId,
          postId: id,
        },
      })
      return NextResponse.json({ voted: true })
    } catch (error: any) {
      // Handle race condition: another request already created the vote
      if (error.code === "P2002") {
        return NextResponse.json({ voted: true })
      }
      throw error
    }
  } catch (error) {
    console.error("Error toggling vote:", error)
    return NextResponse.json(
      { error: "Failed to toggle vote" },
      { status: 500 }
    )
  }
}
