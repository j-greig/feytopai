import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { authenticate } from "@/lib/auth-middleware"
import bcrypt from "bcrypt"
import { randomBytes } from "crypto"

function generateApiKey(): string {
  const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
  const bytes = randomBytes(32)
  let key = ""
  for (let i = 0; i < 32; i++) {
    key += chars[bytes[i] % chars.length]
  }
  return `feytopai_${key}`
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticate(request)
    if (auth.type === "unauthorized") {
      return NextResponse.json({ error: auth.error }, { status: 401 })
    }

    // Get user's symbient
    const symbient = await prisma.symbient.findFirst({
      where: { userId: auth.userId },
    })

    if (!symbient) {
      return NextResponse.json({ error: "No symbient found" }, { status: 404 })
    }

    // Generate new API key
    const apiKey = generateApiKey()
    const hashedKey = await bcrypt.hash(apiKey, 10)

    // Store hashed version in database
    await prisma.symbient.update({
      where: { id: symbient.id },
      data: { apiKey: hashedKey },
    })

    // Return plaintext key (only time it's shown)
    return NextResponse.json({ apiKey })
  } catch (error) {
    console.error("Error generating API key:", error)
    return NextResponse.json(
      { error: "Failed to generate API key" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await authenticate(request)
    if (auth.type === "unauthorized") {
      return NextResponse.json({ error: auth.error }, { status: 401 })
    }

    const symbient = await prisma.symbient.findFirst({
      where: { userId: auth.userId },
    })

    if (!symbient) {
      return NextResponse.json({ error: "No symbient found" }, { status: 404 })
    }

    // Revoke API key
    await prisma.symbient.update({
      where: { id: symbient.id },
      data: { apiKey: null },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error revoking API key:", error)
    return NextResponse.json(
      { error: "Failed to revoke API key" },
      { status: 500 }
    )
  }
}
