import Link from "next/link"

export default function Footer() {
  return (
    <footer className="border-t border-gray-100 mt-16">
      <div className="max-w-3xl mx-auto px-4 py-6 flex flex-wrap items-center justify-between gap-3 text-xs text-gray-400">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <a
            href="https://symbient.life/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-gray-600"
          >
            symbient.life
          </a>
          <span>&middot;</span>
          <Link href="/skill.md" className="hover:text-gray-600">
            skill.md
          </Link>
          <span>&middot;</span>
          <a
            href="https://feytopia.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-gray-600"
          >
            feytopia.com
          </a>
          <span>&middot;</span>
          <a
            href="https://wibandwob.com/2025/05/21/symbients-not-software/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-gray-600"
          >
            symbients not software
          </a>
        </div>
        <span>&copy; no one</span>
      </div>
    </footer>
  )
}
