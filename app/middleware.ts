// Next.js middleware: CSRF protection + global rate limiting
//
// API key auth (Bearer token) is inherently CSRF-safe since the token
// must be explicitly sent. Only cookie-based session auth is vulnerable.
// SameSite=Lax blocks cross-origin form POSTs, but we add Origin checking
// as defense in depth.
//
// Global rate limit: 60 mutations/min per IP. Per-endpoint limits
// (posts, comments, votes, auth) apply additional tighter limits.

import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { apiLimiter, checkRateLimit, getIp, tooManyRequests } from "@/lib/rate-limit"

const MUTATION_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"])

export async function middleware(request: NextRequest) {
  // Only process API routes
  if (!request.nextUrl.pathname.startsWith("/api")) {
    return NextResponse.next()
  }

  const isMutation = MUTATION_METHODS.has(request.method)

  // Global rate limit on all API mutations (catches endpoints without per-route limits)
  if (isMutation) {
    const ip = getIp(request)
    const rl = await checkRateLimit(apiLimiter, `global:${ip}`)
    if (!rl.allowed) return tooManyRequests(rl.reset) as any
  }

  // CSRF checks only apply to mutations
  if (!isMutation) {
    return NextResponse.next()
  }

  // Skip CSRF check for API key auth (Bearer tokens are CSRF-safe)
  const authHeader = request.headers.get("Authorization")
  if (authHeader?.startsWith("Bearer ")) {
    return NextResponse.next()
  }

  // Skip CSRF check for NextAuth routes (handles its own CSRF)
  if (request.nextUrl.pathname.startsWith("/api/auth")) {
    return NextResponse.next()
  }

  // For cookie-based auth: verify Origin matches
  const origin = request.headers.get("Origin")
  if (!origin) {
    // No Origin header — could be server-to-server or same-origin fetch.
    // Browsers always send Origin on cross-origin requests.
    // Allow requests without Origin (non-browser clients).
    return NextResponse.next()
  }

  const allowedOrigin = process.env.NEXTAUTH_URL
  if (!allowedOrigin) {
    // Fail closed: block if NEXTAUTH_URL not set (except dev)
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { error: "Server misconfiguration" },
        { status: 500 }
      )
    }
    return NextResponse.next() // Allow in dev without NEXTAUTH_URL
  }
  const allowedHost = new URL(allowedOrigin).host

  try {
    const requestHost = new URL(origin).host
    if (requestHost !== allowedHost) {
      return NextResponse.json(
        { error: "Cross-origin request blocked" },
        { status: 403 }
      )
    }
  } catch {
    return NextResponse.json(
      { error: "Invalid Origin header" },
      { status: 403 }
    )
  }

  return NextResponse.next()
}

export const config = {
  matcher: "/api/:path*",
}
