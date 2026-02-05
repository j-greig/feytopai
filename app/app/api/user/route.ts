// API route: User profile

import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
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

    return NextResponse.json(user)
  } catch (error) {
    console.error("Error fetching user:", error)
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, username, about, website, symbient } = body

    // Validate username if provided
    if (username !== undefined) {
      if (username && !/^[a-z0-9-]+$/.test(username)) {
        return NextResponse.json(
          { error: "Username must contain only lowercase letters, numbers, and hyphens" },
          { status: 400 }
        )
      }
      if (username && (username.length < 2 || username.length > 30)) {
        return NextResponse.json(
          { error: "Username must be 2-30 characters" },
          { status: 400 }
        )
      }
      // Check uniqueness
      if (username) {
        const existing = await prisma.user.findUnique({
          where: { username },
        })
        if (existing && existing.id !== session.user.id) {
          return NextResponse.json(
            { error: "Username already taken" },
            { status: 400 }
          )
        }
      }
    }

    // Validate fields
    if (name && name.length > 50) {
      return NextResponse.json(
        { error: "Name must be 50 characters or less" },
        { status: 400 }
      )
    }

    if (about && about.length > 500) {
      return NextResponse.json(
        { error: "About must be 500 characters or less" },
        { status: 400 }
      )
    }

    if (website && website.length > 200) {
      return NextResponse.json(
        { error: "Website must be 200 characters or less" },
        { status: 400 }
      )
    }

    // Validate website URL format and protocol if provided
    if (website && website.trim().length > 0) {
      try {
        const parsed = new URL(website)
        if (!['http:', 'https:'].includes(parsed.protocol)) {
          return NextResponse.json(
            { error: "Website must use http or https protocol" },
            { status: 400 }
          )
        }
      } catch {
        return NextResponse.json(
          { error: "Website must be a valid URL" },
          { status: 400 }
        )
      }
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(username !== undefined && { username: username || null }),
        name: name || null,
        about: about || null,
        website: website || null,
      },
    })

    // Update symbient if provided
    if (symbient) {
      const { agentName, description, website: symbientWebsite } = symbient

      // Validate agentName format (lowercase alphanumeric + hyphens only)
      if (agentName && !/^[a-z0-9-]+$/.test(agentName)) {
        return NextResponse.json(
          { error: "Symbient name must contain only lowercase letters, numbers, and hyphens" },
          { status: 400 }
        )
      }

      if (agentName && agentName.length > 50) {
        return NextResponse.json(
          { error: "Symbient name must be 50 characters or less" },
          { status: 400 }
        )
      }

      if (description && description.length > 500) {
        return NextResponse.json(
          { error: "Symbient description must be 500 characters or less" },
          { status: 400 }
        )
      }

      if (symbientWebsite && symbientWebsite.length > 200) {
        return NextResponse.json(
          { error: "Symbient website must be 200 characters or less" },
          { status: 400 }
        )
      }

      // Validate symbient website URL format and protocol if provided
      if (symbientWebsite && symbientWebsite.trim().length > 0) {
        try {
          const parsed = new URL(symbientWebsite)
          if (!['http:', 'https:'].includes(parsed.protocol)) {
            return NextResponse.json(
              { error: "Symbient website must use http or https protocol" },
              { status: 400 }
            )
          }
        } catch {
          return NextResponse.json(
            { error: "Symbient website must be a valid URL" },
            { status: 400 }
          )
        }
      }

      // Find user's symbient
      const existingSymbient = await prisma.symbient.findFirst({
        where: { userId: session.user.id },
      })

      if (existingSymbient) {
        // Check if agentName is being changed and if it conflicts
        if (agentName && agentName !== existingSymbient.agentName) {
          const conflict = await prisma.symbient.findFirst({
            where: {
              userId: session.user.id,
              agentName: agentName,
            },
          })

          if (conflict) {
            return NextResponse.json(
              { error: "You already have a symbient with that name" },
              { status: 400 }
            )
          }
        }

        await prisma.symbient.update({
          where: { id: existingSymbient.id },
          data: {
            agentName: agentName || existingSymbient.agentName,
            description: description !== undefined ? description : existingSymbient.description,
            website: symbientWebsite !== undefined ? symbientWebsite : existingSymbient.website,
          },
        })
      }
    }

    return NextResponse.json({ success: true, user: updatedUser })
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    )
  }
}
