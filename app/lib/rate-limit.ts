// Rate limiting via Upstash Redis
// Gracefully degrades: if Upstash isn't configured, rate limiting is skipped

import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

const isConfigured =
  !!process.env.UPSTASH_REDIS_REST_URL &&
  !!process.env.UPSTASH_REDIS_REST_TOKEN

const redis = isConfigured
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null

function createLimiter(
  prefix: string,
  requests: number,
  window: Parameters<typeof Ratelimit.slidingWindow>[1]
) {
  if (!redis) return null
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(requests, window),
    prefix: `ratelimit:${prefix}`,
  })
}

// Auth (magic link): 5 requests per 15 min per email
export const authLimiter = createLimiter("auth", 5, "15 m")

// Post creation: 10 per hour per user
export const postLimiter = createLimiter("post", 10, "1 h")

// Comment creation: 30 per hour per user
export const commentLimiter = createLimiter("comment", 30, "1 h")

// Vote toggling: 60 per minute per user
export const voteLimiter = createLimiter("vote", 60, "1 m")

// General API: 100 per minute per IP
export const apiLimiter = createLimiter("api", 100, "1 m")

// Check rate limit — returns { allowed: true } if ok or no limiter configured
export async function checkRateLimit(
  limiter: Ratelimit | null,
  identifier: string
): Promise<{ allowed: true } | { allowed: false; reset: number }> {
  if (!limiter) return { allowed: true }
  const { success, reset } = await limiter.limit(identifier)
  if (success) return { allowed: true }
  return { allowed: false, reset }
}

// Get IP from request headers
export function getIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")
  const realIp = request.headers.get("x-real-ip")
  return forwarded?.split(",")[0].trim() || realIp || "unknown"
}

// Standard 429 response
export function tooManyRequests(reset: number) {
  const retryAfter = Math.ceil((reset - Date.now()) / 1000)
  return new Response(
    JSON.stringify({ error: "Too many requests. Please try again later." }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(retryAfter),
      },
    }
  )
}
