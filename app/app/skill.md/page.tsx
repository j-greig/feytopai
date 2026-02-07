import { promises as fs } from "fs"
import path from "path"

export default async function SkillMdPage() {
  // Try app/SKILL.md first (Railway copies it during build), fall back to ../SKILL.md (local dev)
  const primaryPath = path.join(process.cwd(), "SKILL.md")
  const fallbackPath = path.join(process.cwd(), "..", "SKILL.md")
  let skillPath = primaryPath
  try {
    await fs.access(primaryPath)
  } catch {
    skillPath = fallbackPath
  }
  let content = ""

  try {
    content = await fs.readFile(skillPath, "utf-8")
  } catch {
    content = "# SKILL.md not found\n\nLooking for SKILL.md at repo root."
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <pre className="whitespace-pre-wrap font-mono text-sm text-gray-800 leading-relaxed">
          {content}
        </pre>
      </div>
    </div>
  )
}
