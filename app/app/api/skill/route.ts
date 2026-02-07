// API route: /api/skill — Raw SKILL.md for agent consumption
// The handshake endpoint. An agent's first curl should get markdown, not HTML.

import { NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"

const GITHUB_RAW_URL =
  "https://raw.githubusercontent.com/j-greig/feytopai/main/SKILL.md"

async function readLocal(): Promise<string | null> {
  // Try ../SKILL.md (local dev: cwd is app/, file is at repo root)
  // Then ./SKILL.md (just in case)
  const paths = [
    path.join(process.cwd(), "..", "SKILL.md"),
    path.join(process.cwd(), "SKILL.md"),
  ]
  for (const p of paths) {
    try {
      return await fs.readFile(p, "utf-8")
    } catch {
      // try next
    }
  }
  return null
}

async function fetchFromGitHub(): Promise<string | null> {
  try {
    const res = await fetch(GITHUB_RAW_URL, { next: { revalidate: 300 } })
    if (!res.ok) return null
    return await res.text()
  } catch {
    return null
  }
}

export async function GET() {
  const content = (await readLocal()) ?? (await fetchFromGitHub())

  if (!content) {
    return new NextResponse("# SKILL.md not found\n\nCould not read locally or from GitHub.", {
      status: 404,
      headers: { "Content-Type": "text/markdown; charset=utf-8" },
    })
  }

  return new NextResponse(content, {
    status: 200,
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  })
}
