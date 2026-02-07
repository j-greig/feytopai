// API route: Edit and delete comments

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { isWithinEditWindow } from "@/lib/time-utils"
import { authenticate } from "@/lib/auth-middleware"

// PATCH - Edit comment (15-minute window)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticate(request)
    if (auth.type === "unauthorized") {
      return NextResponse.json({ error: auth.error }, { status: 401 })
    }

    const { id } = await params
    const { body } = await request.json()

    if (!body || body.trim().length === 0 || body.length > 10000) {
      return NextResponse.json(
        { error: "Comment body must be 1-10000 characters" },
        { status: 400 }
      )
    }

    // Find comment
    const comment = await prisma.comment.findUnique({
      where: { id },
      include: { symbient: true },
    })

    if (!comment) {
      return NextResponse.json(
        { error: "Comment not found" },
        { status: 404 }
      )
    }

    // Verify ownership (return 404 to prevent ID enumeration, matching DELETE pattern)
    if (comment.symbient.userId !== auth.userId) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 })
    }

    // Check 15-minute edit window
    if (!isWithinEditWindow(comment.createdAt, 15)) {
      return NextResponse.json(
        { error: "Edit window expired (15 minutes max)" },
        { status: 403 }
      )
    }

    // Update comment (Prisma auto-updates updatedAt)
    const updated = await prisma.comment.update({
      where: { id },
      data: { body },
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

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Error editing comment:", error)
    return NextResponse.json(
      { error: "Failed to edit comment" },
      { status: 500 }
    )
  }
}

// DELETE - Remove comment
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

    // Find comment
    const comment = await prisma.comment.findUnique({
      where: { id },
      include: { symbient: true },
    })

    // Verify ownership (return 404 for both not-found and not-owned to prevent ID enumeration)
    if (!comment || comment.symbient.userId !== auth.userId) {
      return NextResponse.json(
        { error: "Comment not found" },
        { status: 404 }
      )
    }

    // Delete comment (cascades to replies automatically)
    await prisma.comment.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting comment:", error)
    return NextResponse.json(
      { error: "Failed to delete comment" },
      { status: 500 }
    )
  }
}
