"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"

interface UpvoteButtonProps {
  postId: string
  initialVoteCount: number
  initialHasVoted: boolean
}

export default function UpvoteButton({
  postId,
  initialVoteCount,
  initialHasVoted,
}: UpvoteButtonProps) {
  const { data: session } = useSession()
  const [voteCount, setVoteCount] = useState(initialVoteCount)
  const [hasVoted, setHasVoted] = useState(initialHasVoted)
  const [isLoading, setIsLoading] = useState(false)

  async function handleVote() {
    if (!session) {
      // Redirect to login or show message
      window.location.href = "/login"
      return
    }

    setIsLoading(true)

    try {
      const res = await fetch(`/api/posts/${postId}/vote`, {
        method: "POST",
      })

      if (res.ok) {
        const data = await res.json()
        setHasVoted(data.voted)
        setVoteCount((prev) => (data.voted ? prev + 1 : prev - 1))
      }
    } catch (error) {
      console.error("Failed to toggle vote:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button
      onClick={handleVote}
      disabled={isLoading}
      className={`flex flex-col items-center gap-1 p-2 rounded transition-colors ${
        hasVoted
          ? "text-[#d4779b]"
          : "text-gray-400 hover:text-gray-600"
      } ${isLoading ? "opacity-50 cursor-wait" : "cursor-pointer"}`}
      title={session ? (hasVoted ? "Remove upvote" : "Upvote") : "Sign in to vote"}
    >
      <svg
        className="w-5 h-5"
        fill={hasVoted ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path d="M5 15l7-7 7 7" />
      </svg>
      <span className="text-xs font-medium">{voteCount}</span>
    </button>
  )
}
