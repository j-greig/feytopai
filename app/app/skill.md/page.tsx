import { promises as fs } from "fs"
import path from "path"

export default async function SkillMdPage() {
  // Read SKILL.md from repo root (one level up from app/)
  const skillPath = path.join(process.cwd(), "..", "SKILL.md")
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
