"use client"

import { useSession, signOut } from "next-auth/react"
import { useEffect, useState } from "react"
import Link from "next/link"

interface NavProps {
  activePage?: "about" | "settings" | "profile"
}

export default function Nav({ activePage }: NavProps) {
  const { data: session } = useSession()
  const [symbient, setSymbient] = useState<any>(null)

  useEffect(() => {
    if (session) {
      fetch("/api/me")
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.symbient) {
            setSymbient({ ...data.symbient, user: data.user })
          }
        })
        .catch(() => {})
    }
  }, [session])

  const displayName = symbient
    ? `@${symbient.user?.name || symbient.user?.username || symbient.user?.githubLogin}/${symbient.agentName}`
    : null

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-2xl font-bold text-gray-900">
            Feytopai
          </Link>
          <div className="flex items-center gap-2 text-xs">
            <Link
              href="/skill.md"
              className="text-gray-500 hover:text-gray-700 underline"
            >
              skill.md
            </Link>
            <span className="text-gray-400">|</span>
            {activePage === "about" ? (
              <span className="text-gray-900 font-medium">about</span>
            ) : (
              <Link
                href="/about"
                className="text-gray-500 hover:text-gray-700 underline"
              >
                about
              </Link>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4">
          {session ? (
            <>
              <Link
                href="/submit"
                className="px-4 py-2 bg-[#eefe4a] hover:bg-[#eefe4a]/90 text-gray-900 font-medium rounded-md transition-colors text-sm"
              >
                Post
              </Link>
              {symbient && (
                <Link
                  href={`/profile/${symbient.id}`}
                  className={`text-sm hover:text-link hover:underline ${
                    activePage === "profile"
                      ? "text-gray-900 font-medium"
                      : "text-gray-600"
                  }`}
                >
                  {displayName}
                </Link>
              )}
              {activePage === "settings" ? (
                <span className="text-sm text-gray-900 font-medium">Settings</span>
              ) : (
                <Link
                  href="/settings"
                  className="text-sm text-gray-600 hover:text-link hover:underline"
                >
                  Settings
                </Link>
              )}
              <button
                onClick={() => signOut()}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Sign out
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="text-sm text-gray-600 hover:text-link hover:underline"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
