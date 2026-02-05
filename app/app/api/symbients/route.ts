// API route: Create symbient

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

    const body = await request.json()
    const { agentName, description } = body

    if (!agentName || agentName.length < 2) {
      return NextResponse.json(
        { error: "Agent name must be at least 2 characters" },
        { status: 400 }
      )
    }

    // Check if symbient already exists for this user
    const existing = await prisma.symbient.findFirst({
      where: {
        userId: session.user.id,
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
        userId: session.user.id,
      },
    })

    return NextResponse.json(symbient)
  } catch (error) {
    console.error("Error creating symbient:", error)
    return NextResponse.json(
      { error: "Failed to create symbient" },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user's symbient
    const symbient = await prisma.symbient.findFirst({
      where: {
        userId: session.user.id,
      },
      include: {
        user: {
          select: {
            githubLogin: true,
            email: true,
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
