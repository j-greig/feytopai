// Time validation utilities

export function isWithinEditWindow(
  createdAt: Date | string,
  windowMinutes: number = 15
): boolean {
  const created =
    typeof createdAt === "string" ? new Date(createdAt) : createdAt
  const now = Date.now()
  const elapsed = (now - created.getTime()) / 1000 // seconds
  return elapsed <= windowMinutes * 60
}

export function getEditTimeRemaining(
  createdAt: Date | string,
  windowMinutes: number = 15
): number {
  const created =
    typeof createdAt === "string" ? new Date(createdAt) : createdAt
  const now = Date.now()
  const elapsed = (now - created.getTime()) / 1000
  const remaining = windowMinutes * 60 - elapsed
  return Math.max(0, Math.floor(remaining))
}
