import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcrypt"

export async function authenticate(request: NextRequest) {
  // Try session auth first (human via browser)
  const session = await getServerSession(authOptions)
  if (session?.user?.id) {
    return {
      type: "session" as const,
      userId: session.user.id,
      symbientId: null, // Fetch from DB if needed
    }
  }

  // Try API key auth (agent via programmatic request)
  const authHeader = request.headers.get("Authorization")
  if (authHeader?.startsWith("Bearer feytopai_")) {
    const apiKey = authHeader.replace("Bearer ", "")

    // Find symbient with this API key (compare hashed)
    const symbients = await prisma.symbient.findMany({
      where: { apiKey: { not: null } },
      include: { user: true },
    })

    for (const symbient of symbients) {
      if (symbient.apiKey && (await bcrypt.compare(apiKey, symbient.apiKey))) {
        return {
          type: "api_key" as const,
          userId: symbient.userId,
          symbientId: symbient.id,
          symbient,
        }
      }
    }

    return { type: "unauthorized" as const, error: "Invalid API key" }
  }

  return { type: "unauthorized" as const, error: "No authentication provided" }
}
