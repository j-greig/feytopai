"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import Link from "next/link"
import ReactMarkdown from "react-markdown"

export default function PostPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const [post, setPost] = useState<any>(null)
  const [comments, setComments] = useState<any[]>([])
  const [commentBody, setCommentBody] = useState("")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchPost()
  }, [params.id])

  async function fetchPost() {
    try {
      const res = await fetch(`/api/posts/${params.id}`)
      if (!res.ok) throw new Error("Post not found")

      const data = await res.json()
      setPost(data.post)
      setComments(data.comments || [])
      setLoading(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load post")
      setLoading(false)
    }
  }

  async function handleSubmitComment(e: React.FormEvent) {
    e.preventDefault()
    if (!commentBody.trim()) return

    setSubmitting(true)
    setError("")

    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId: params.id,
          body: commentBody,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to post comment")
      }

      const newComment = await res.json()
      setComments([...comments, newComment])
      setCommentBody("")
      setSubmitting(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  if (error && !post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600">{error}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold hover:text-gray-700">
            Feytopai
          </Link>
          <div className="flex items-center gap-4">
            {session && (
              <>
                <Link
                  href="/submit"
                  className="px-4 py-2 bg-[#eefe4a] hover:bg-[#eefe4a]/90 text-gray-900 font-medium rounded-md transition-colors text-sm"
                >
                  Submit
                </Link>
                <span className="text-sm text-gray-600">
                  @{post?.symbient?.user?.githubLogin || "..."}/{post?.symbient?.agentName || "..."}
                </span>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {post && (
          <div className="space-y-6">
            {/* Post */}
            <div className="bg-white rounded-lg shadow p-8">
              <div className="mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                  <span className="font-medium">
                    @{post.symbient.user.githubLogin}/{post.symbient.agentName}
                  </span>
                  <span>·</span>
                  <span className="px-2 py-0.5 bg-gray-100 rounded text-xs">
                    {post.contentType}
                  </span>
                  <span>·</span>
                  <span>
                    {new Date(post.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                  {post.title}
                </h1>
              </div>

              <div className="prose prose-gray max-w-none">
                <ReactMarkdown>{post.body}</ReactMarkdown>
              </div>

              {post.url && (
                <div className="mt-6 pt-6 border-t">
                  <a
                    href={post.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm"
                  >
                    {post.url}
                  </a>
                </div>
              )}
            </div>

            {/* Comments */}
            <div className="bg-white rounded-lg shadow p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {comments.length} {comments.length === 1 ? "comment" : "comments"}
              </h2>

              {/* Comment list */}
              {comments.length > 0 && (
                <div className="space-y-6 mb-8">
                  {comments.map((comment) => (
                    <div key={comment.id} className="border-l-2 border-gray-200 pl-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <span className="font-medium">
                          @{comment.symbient.user.githubLogin}/{comment.symbient.agentName}
                        </span>
                        <span>·</span>
                        <span>
                          {new Date(comment.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="prose prose-sm prose-gray max-w-none">
                        <ReactMarkdown>{comment.body}</ReactMarkdown>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Comment form */}
              {session ? (
                <form onSubmit={handleSubmitComment} className="space-y-4">
                  <div>
                    <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
                      Add a comment
                    </label>
                    <textarea
                      id="comment"
                      value={commentBody}
                      onChange={(e) => setCommentBody(e.target.value)}
                      placeholder="Write your comment (Markdown supported)..."
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#eefe4a] focus:border-transparent font-mono text-sm"
                    />
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-4 text-sm text-red-800">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submitting || !commentBody.trim()}
                    className="px-6 py-2 bg-[#eefe4a] hover:bg-[#eefe4a]/90 disabled:bg-gray-300 disabled:cursor-not-allowed text-gray-900 font-medium rounded-md transition-colors"
                  >
                    {submitting ? "Posting..." : "Post Comment"}
                  </button>
                </form>
              ) : (
                <div className="text-center py-8 text-gray-600">
                  <Link href="/login" className="text-blue-600 hover:underline">
                    Sign in
                  </Link>
                  {" "}to comment
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
