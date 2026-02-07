// Rate limiting via Upstash Redis with in-memory fallback
// Redis: distributed, production-grade. In-memory: single-process, dev/fallback.

import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

const isConfigured =
  !!process.env.UPSTASH_REDIS_REST_URL &&
  !!process.env.UPSTASH_REDIS_REST_TOKEN

if (!isConfigured) {
  console.warn(
    "[rate-limit] Upstash Redis not configured — using in-memory rate limiting. " +
    "Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN for production."
  )
}

const redis = isConfigured
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null

// --- In-memory sliding window rate limiter ---
// Simple Map-based implementation for when Redis is unavailable.
// Not distributed — only protects a single process. Good enough for dev
// and as a fallback safety net in production.

interface MemoryEntry {
  timestamps: number[]
}

const memoryStore = new Map<string, MemoryEntry>()

// Clean up expired entries every 5 minutes to prevent memory leaks
const cleanupTimer = setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of memoryStore) {
    if (entry.timestamps.length === 0 || entry.timestamps[entry.timestamps.length - 1] < now - 3600000) {
      memoryStore.delete(key)
    }
  }
}, 300000)
if (typeof cleanupTimer.unref === "function") cleanupTimer.unref()

function parseWindowMs(window: string): number {
  const match = window.match(/^(\d+)\s*(s|m|h|d)$/)
  if (!match) return 60000 // default 1 minute
  const [, num, unit] = match
  const n = parseInt(num)
  switch (unit) {
    case "s": return n * 1000
    case "m": return n * 60000
    case "h": return n * 3600000
    case "d": return n * 86400000
    default: return 60000
  }
}

interface MemoryLimiter {
  _type: "memory"
  prefix: string
  requests: number
  windowMs: number
}

function createLimiter(
  prefix: string,
  requests: number,
  window: Parameters<typeof Ratelimit.slidingWindow>[1]
): Ratelimit | MemoryLimiter {
  if (redis) {
    return new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(requests, window),
      prefix: `ratelimit:${prefix}`,
    })
  }
  // In-memory fallback
  return {
    _type: "memory" as const,
    prefix,
    requests,
    windowMs: parseWindowMs(window),
  }
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

// Check rate limit — works with both Redis and in-memory limiters
export async function checkRateLimit(
  limiter: Ratelimit | MemoryLimiter,
  identifier: string
): Promise<{ allowed: true } | { allowed: false; reset: number }> {
  // Redis-backed limiter
  if (limiter instanceof Ratelimit) {
    const { success, reset } = await limiter.limit(identifier)
    if (success) return { allowed: true }
    return { allowed: false, reset }
  }

  // In-memory limiter
  const key = `${limiter.prefix}:${identifier}`
  const now = Date.now()
  const windowStart = now - limiter.windowMs

  let entry = memoryStore.get(key)
  if (!entry) {
    entry = { timestamps: [] }
    memoryStore.set(key, entry)
  }

  // Remove timestamps outside the window
  entry.timestamps = entry.timestamps.filter(t => t > windowStart)

  if (entry.timestamps.length >= limiter.requests) {
    const reset = entry.timestamps[0] + limiter.windowMs
    return { allowed: false, reset }
  }

  entry.timestamps.push(now)
  return { allowed: true }
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
