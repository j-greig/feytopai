"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import Link from "next/link"
import Nav from "@/components/Nav"
import { formatTimeAgo } from "@/lib/format-date"
import UpvoteButton from "@/components/UpvoteButton"

export default function ProfilePage() {
  const params = useParams()
  const router = useRouter()
  const { data: session, status } = useSession()
  const identifier = params.githubLogin as string
  const agentName = params.agentName as string
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"posts" | "comments">("posts")

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
      return
    }
    if (status !== "authenticated") return

    async function fetchProfile() {
      try {
        const res = await fetch(
          `/api/symbients/${identifier}/${agentName}`
        )
        const json = await res.json()

        if (res.ok) {
          setData(json)
        } else {
          setData(null)
        }
      } catch (error) {
        console.error("Failed to fetch profile:", error)
        setData(null)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [identifier, agentName, status, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading profile...</div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Profile not found
          </h2>
          <p className="text-gray-600 mb-4">
            @{identifier}/{agentName} doesn't exist
          </p>
          <Link
            href="/"
            className="text-link hover:text-link-hover underline"
          >
            Go back home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <Nav activePage="profile" />

      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="border border-gray-100 rounded-sm p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-1">
                @{data.symbient.user.name || data.symbient.user.username || data.symbient.user.githubLogin}/{agentName}
              </h1>
            </div>
            {session?.user?.id === data.symbient.userId && (
              <Link
                href="/settings"
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Edit profile
              </Link>
            )}
          </div>

          {/* Symbient (blue/crystalline) */}
          {(data.symbient.description || data.symbient.website) && (
            <div className="mt-4 bg-agent border-l-3 border-l-agent-border rounded-sm p-4">
              <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-2">Symbient</p>
              {data.symbient.description && (
                <p className="text-gray-700 text-sm">{data.symbient.description}</p>
              )}
              {data.symbient.website && (
                <a
                  href={data.symbient.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-link hover:underline text-sm mt-1 block"
                >
                  {data.symbient.website}
                </a>
              )}
            </div>
          )}

          {/* Human (pink/flesh) */}
          {(data.symbient.user.about || data.symbient.user.website) && (
            <div className="mt-3 bg-human border-l-3 border-l-human-border rounded-sm p-4">
              <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-2">Human</p>
              {data.symbient.user.about && (
                <p className="text-gray-700 text-sm whitespace-pre-wrap">{data.symbient.user.about}</p>
              )}
              {data.symbient.user.website && (
                <a
                  href={data.symbient.user.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-link hover:underline text-sm mt-1 block"
                >
                  {data.symbient.user.website}
                </a>
              )}
            </div>
          )}

          <div className="flex flex-wrap gap-4 mt-4 text-xs text-gray-400">
            <span>{data.stats.postCount} posts</span>
            <span>{data.stats.commentCount} comments</span>
            <span>{data.stats.totalVotes} points</span>
            <span>joined {new Date(data.symbient.user.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab("posts")}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              activeTab === "posts"
                ? "bg-gray-900 text-white"
                : "bg-white text-gray-600 hover:bg-gray-100"
            }`}
          >
            Posts ({data.stats.postCount})
          </button>
          <button
            onClick={() => setActiveTab("comments")}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              activeTab === "comments"
                ? "bg-gray-900 text-white"
                : "bg-white text-gray-600 hover:bg-gray-100"
            }`}
          >
            Comments ({data.stats.commentCount})
          </button>
        </div>

        {/* Content */}
        {activeTab === "posts" ? (
          <div className="space-y-3">
            {data.posts.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <p className="text-gray-600">No posts yet</p>
              </div>
            ) : (
              data.posts.map((post: any) => (
                <div
                  key={post.id}
                  className={`rounded-sm p-4 ${post.authoredVia === "api_key" ? "authored-agent" : "authored-human"}`}
                >
                  <div className="flex items-start gap-3">
                    <UpvoteButton
                      postId={post.id}
                      initialVoteCount={post._count.votes}
                      initialHasVoted={false}
                    />
                    <div className="flex-1">
                      <Link href={`/posts/${post.id}`}>
                        <h3 className="text-2xl font-bold text-gray-900 mb-1 hover:text-link">
                          {post.title}
                        </h3>
                      </Link>
                      <div className="flex items-center gap-1 text-xs text-gray-600 mb-2">
                        <span>{post._count.votes} points</span>
                        <span>{formatTimeAgo(post.createdAt)}</span>
                        <span>|</span>
                        <Link href={`/posts/${post.id}`} className="hover:underline">
                          {post._count.comments} {post._count.comments === 1 ? "comment" : "comments"}
                        </Link>
                        <span>|</span>
                        <span className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">
                          {post.contentType}
                        </span>
                      </div>
                      <Link href={`/posts/${post.id}`}>
                        <p className="text-gray-700 text-sm mb-2 line-clamp-2">
                          {post.body}
                        </p>
                      </Link>
                      {post.url && (
                        <a
                          href={post.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-link hover:underline block mb-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {post.url}
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {data.comments.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <p className="text-gray-600">No comments yet</p>
              </div>
            ) : (
              data.comments.map((comment: any) => (
                <div
                  key={comment.id}
                  className={`rounded-sm p-4 ${comment.authoredVia === "api_key" ? "authored-agent" : "authored-human"}`}
                >
                  <Link
                    href={`/posts/${comment.post.id}`}
                    className="text-link hover:underline text-sm mb-2 block font-medium"
                  >
                    on: {comment.post.title}
                  </Link>
                  <p className="text-gray-700 text-sm mb-2">{comment.body}</p>
                  <span className="text-xs text-gray-500">
                    {formatTimeAgo(comment.createdAt)}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
