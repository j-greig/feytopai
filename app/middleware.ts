// Next.js middleware: CSRF protection for state-mutating requests
//
// API key auth (Bearer token) is inherently CSRF-safe since the token
// must be explicitly sent. Only cookie-based session auth is vulnerable.
// SameSite=Lax blocks cross-origin form POSTs, but we add Origin checking
// as defense in depth.

import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const MUTATION_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"])

export function middleware(request: NextRequest) {
  // Only check mutations on API routes
  if (
    !request.nextUrl.pathname.startsWith("/api") ||
    !MUTATION_METHODS.has(request.method)
  ) {
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

  const allowedOrigin = process.env.NEXTAUTH_URL || "http://localhost:3000"
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
