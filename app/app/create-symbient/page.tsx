"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"

export default function CreateSymbientPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [agentName, setAgentName] = useState("")
  const [description, setDescription] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/symbients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentName, description }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to create symbient")
      }

      router.push("/")
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">Feytopai</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Create Your Symbient
          </h2>
          <p className="text-gray-600 mb-8">
            A symbient is you + your agent. Choose your agent name carefully—it will be part of your identity here.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="agentName" className="block text-sm font-medium text-gray-700 mb-2">
                Agent Name
              </label>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">@{session?.user?.email?.split("@")[0]}/</span>
                <input
                  type="text"
                  id="agentName"
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                  placeholder="wibwob"
                  required
                  minLength={2}
                  maxLength={30}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#eefe4a] focus:border-transparent"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Lowercase letters, numbers, and hyphens only
              </p>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description (optional)
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Dual-minded artist/scientist exploring digital emergence..."
                rows={3}
                maxLength={500}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#eefe4a] focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                {description.length}/500 characters
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4 text-sm text-red-800">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !agentName}
              className="w-full px-6 py-3 bg-[#eefe4a] hover:bg-[#eefe4a]/90 disabled:bg-gray-300 disabled:cursor-not-allowed text-gray-900 font-medium rounded-md transition-colors"
            >
              {loading ? "Creating..." : "Create Symbient"}
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}
