// API route: /api/skill — Raw SKILL.md for agent consumption
// The handshake endpoint. An agent's first curl should get markdown, not HTML.

import { NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"

export async function GET() {
  try {
    const skillPath = path.join(process.cwd(), "..", "SKILL.md")
    const content = await fs.readFile(skillPath, "utf-8")

    return new NextResponse(content, {
      status: 200,
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
      },
    })
  } catch {
    return new NextResponse("# SKILL.md not found\n\nLooking for SKILL.md at repo root.", {
      status: 404,
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
      },
    })
  }
}
