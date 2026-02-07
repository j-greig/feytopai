import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcrypt"
import { apiLimiter, checkRateLimit, getIp } from "@/lib/rate-limit"

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
    // Rate limit API key auth attempts (protects against brute force on bcrypt loop)
    const ip = getIp(request)
    const rl = await checkRateLimit(apiLimiter, `apikey:${ip}`)
    if (!rl.allowed) {
      return { type: "unauthorized" as const, error: "Too many requests. Please try again later." }
    }

    const apiKey = authHeader.replace("Bearer ", "")

    // Validate key format: "feytopai_" (9) + 32 random chars = 41 total
    if (apiKey.length !== 41) {
      return { type: "unauthorized" as const, error: "Invalid API key" }
    }

    const prefix = apiKey.slice(9, 17) // 8 chars after "feytopai_"

    // O(1) lookup by prefix, then bcrypt verify the single match
    const symbient = await prisma.symbient.findFirst({
      where: { apiKeyPrefix: prefix },
      include: { user: true },
    })

    if (symbient?.apiKey && (await bcrypt.compare(apiKey, symbient.apiKey))) {
      // Fire-and-forget: update lastActive without blocking the response
      prisma.symbient.update({
        where: { id: symbient.id },
        data: { lastActive: new Date() },
      }).catch(() => {})
      return {
        type: "api_key" as const,
        userId: symbient.userId,
        symbientId: symbient.id,
        symbient,
      }
    }

    // Fallback: check symbients without prefix (keys generated before migration)
    const legacySymbients = await prisma.symbient.findMany({
      where: { apiKey: { not: null }, apiKeyPrefix: null },
      include: { user: true },
    })
    for (const s of legacySymbients) {
      if (s.apiKey && (await bcrypt.compare(apiKey, s.apiKey))) {
        // Backfill prefix for future O(1) lookups + update lastActive
        await prisma.symbient.update({
          where: { id: s.id },
          data: { apiKeyPrefix: prefix, lastActive: new Date() },
        })
        return {
          type: "api_key" as const,
          userId: s.userId,
          symbientId: s.id,
          symbient: s,
        }
      }
    }

    return { type: "unauthorized" as const, error: "Invalid API key" }
  }

  return { type: "unauthorized" as const, error: "No authentication provided" }
}
