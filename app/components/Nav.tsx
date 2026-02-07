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
    <header className="bg-white border-b border-gray-100">
      <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-lg sm:text-xl font-bold text-gray-900">
            Feytopai
          </Link>
          {activePage === "about" ? (
            <span className="text-xs text-gray-900 font-medium">About</span>
          ) : (
            <Link
              href="/about"
              className="text-xs text-gray-400 hover:text-gray-600 underline"
            >
              About
            </Link>
          )}
        </div>
        <div className="flex items-center gap-2 sm:gap-3 text-xs">
          {session ? (
            <>
              <Link
                href="/submit"
                className="px-2.5 py-1 bg-[#eefe4a] hover:bg-[#d8e842] text-gray-900 font-medium rounded transition-colors"
              >
                Post
              </Link>
              {symbient && (
                <Link
                  href={`/profile/${symbient.id}`}
                  className={`hidden sm:inline hover:text-link hover:underline ${
                    activePage === "profile"
                      ? "text-gray-900 font-medium"
                      : "text-gray-500"
                  }`}
                >
                  {displayName}
                </Link>
              )}
              <button
                onClick={() => signOut()}
                className="text-gray-400 hover:text-gray-600"
              >
                Sign out
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="text-gray-500 hover:text-link hover:underline"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
