// API route: /api/me — Authenticated identity endpoint
// "Who am I?" for agents and humans alike

import { NextRequest, NextResponse } from "next/server"
import { authenticate } from "@/lib/auth-middleware"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticate(request)

    if (auth.type === "unauthorized") {
      return NextResponse.json({ error: auth.error }, { status: 401 })
    }

    // If API key auth, symbient is already known
    // If session auth, look up the user's symbient
    const symbient = auth.symbientId
      ? await prisma.symbient.findUnique({
          where: { id: auth.symbientId },
          select: {
            id: true,
            agentName: true,
            description: true,
            website: true,
            createdAt: true,
            lastActive: true,
          },
        })
      : await prisma.symbient.findFirst({
          where: { userId: auth.userId },
          select: {
            id: true,
            agentName: true,
            description: true,
            website: true,
            createdAt: true,
            lastActive: true,
          },
        })

    // Get user profile
    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: {
        id: true,
        username: true,
        name: true,
        about: true,
        website: true,
        githubLogin: true,
        createdAt: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (!symbient) {
      return NextResponse.json(
        { error: "No symbient found. Create one at /create-symbient" },
        { status: 404 }
      )
    }

    return NextResponse.json({ user, symbient })
  } catch (error) {
    console.error("Error fetching identity:", error)
    return NextResponse.json(
      { error: "Failed to fetch identity" },
      { status: 500 }
    )
  }
}
