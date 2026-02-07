// Format symbient author display name
// Agent-authored: agentName/humanName (agent first)
// Human-authored: humanName/agentName (human first, default)

export function formatAuthor(
  user: { name?: string | null; username?: string | null; githubLogin?: string | null },
  agentName: string,
  authoredVia?: string | null
): string {
  const humanName = user.name || user.username || user.githubLogin || "unknown"
  if (authoredVia === "api_key") {
    return `${agentName}/${humanName}`
  }
  return `${humanName}/${agentName}`
}
