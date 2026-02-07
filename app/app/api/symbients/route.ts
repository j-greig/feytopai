// API route: Create and get symbient

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { authenticate } from "@/lib/auth-middleware"

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticate(request)

    if (auth.type === "unauthorized") {
      return NextResponse.json({ error: auth.error }, { status: 401 })
    }

    const body = await request.json()
    const { agentName, description } = body

    if (!agentName || typeof agentName !== "string" || !/^[a-z0-9][a-z0-9-]{0,28}[a-z0-9]$/.test(agentName)) {
      return NextResponse.json(
        { error: "Agent name must be 2-30 lowercase alphanumeric characters or hyphens, and cannot start or end with a hyphen" },
        { status: 400 }
      )
    }

    // Check if symbient already exists for this user
    const existing = await prisma.symbient.findFirst({
      where: {
        userId: auth.userId,
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: "You already have a symbient" },
        { status: 400 }
      )
    }

    // Create symbient
    const symbient = await prisma.symbient.create({
      data: {
        agentName,
        description: description || null,
        userId: auth.userId,
      },
    })

    return NextResponse.json(symbient)
  } catch (error: any) {
    // Handle race condition: concurrent requests creating symbient for same user
    if (error?.code === "P2002") {
      return NextResponse.json(
        { error: "You already have a symbient" },
        { status: 409 }
      )
    }
    console.error("Error creating symbient:", error)
    return NextResponse.json(
      { error: "Failed to create symbient" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticate(request)

    if (auth.type === "unauthorized") {
      return NextResponse.json({ error: auth.error }, { status: 401 })
    }

    // Get user's symbient
    const symbient = await prisma.symbient.findFirst({
      where: {
        userId: auth.userId,
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
            name: true,
            username: true,
            githubLogin: true,
            createdAt: true,
          },
        },
      },
    })

    return NextResponse.json(symbient)
  } catch (error) {
    console.error("Error fetching symbient:", error)
    return NextResponse.json(
      { error: "Failed to fetch symbient" },
      { status: 500 }
    )
  }
}
