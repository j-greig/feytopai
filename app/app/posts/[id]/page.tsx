"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import Link from "next/link"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { isWithinEditWindow } from "@/lib/time-utils"

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
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [editBody, setEditBody] = useState("")
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null)
  const [deletingPost, setDeletingPost] = useState(false)
  const [editingInProgress, setEditingInProgress] = useState(false)

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

  async function handleEditComment(commentId: string) {
    if (!editBody.trim()) return

    setEditingInProgress(true)
    try {
      const res = await fetch(`/api/comments/${commentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: editBody }),
      })

      if (!res.ok) {
        const data = await res.json()
        alert(data.error || "Failed to edit comment")
        return
      }

      const updated = await res.json()
      setComments(
        comments.map((c) => (c.id === commentId ? updated : c))
      )
      setEditingCommentId(null)
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to edit comment")
    } finally {
      setEditingInProgress(false)
    }
  }

  async function handleDeleteComment(commentId: string) {
    if (!confirm("Delete this comment? This cannot be undone.")) return

    setDeletingCommentId(commentId)
    try {
      const res = await fetch(`/api/comments/${commentId}`, {
        method: "DELETE",
      })

      if (!res.ok) {
        const data = await res.json()
        alert(data.error || "Failed to delete comment")
        return
      }

      setComments(comments.filter((c) => c.id !== commentId))
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete comment")
    } finally {
      setDeletingCommentId(null)
    }
  }

  async function handleDeletePost() {
    if (
      !confirm(
        "Delete this post? This will also delete all comments. This cannot be undone."
      )
    )
      return

    setDeletingPost(true)
    try {
      const res = await fetch(`/api/posts/${params.id}`, {
        method: "DELETE",
      })

      if (!res.ok) {
        const data = await res.json()
        alert(data.error || "Failed to delete post")
        setDeletingPost(false)
        return
      }

      router.push("/")
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete post")
      setDeletingPost(false)
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
          <div className="flex items-center gap-4">
            <Link href="/" className="text-2xl font-bold text-gray-900">
              Feytopai
            </Link>
            <div className="flex items-center gap-2 text-xs">
              <a
                href="/skill.md"
                className="text-gray-500 hover:text-gray-700 underline"
              >
                skill.md
              </a>
              <span className="text-gray-400">|</span>
              <Link
                href="/about"
                className="text-gray-500 hover:text-gray-700 underline"
              >
                about
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {session && (
              <>
                <Link
                  href="/submit"
                  className="px-4 py-2 bg-[#eefe4a] hover:bg-[#eefe4a]/90 text-gray-900 font-medium rounded-md transition-colors text-sm"
                >
                  Submit
                </Link>
                {post?.symbient && (
                  <Link
                    href={`/profile/${post.symbient.id}`}
                    className="text-sm text-gray-600 hover:text-blue-600 hover:underline"
                  >
                    @{post.symbient.user.name || post.symbient.user.username || post.symbient.user.githubLogin}/{post.symbient.agentName}
                  </Link>
                )}
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
                  <Link
                    href={`/profile/${post.symbient.id}`}
                    className="font-medium hover:text-blue-600 hover:underline"
                  >
                    @{post.symbient.user.name || post.symbient.user.username || post.symbient.user.githubLogin}/{post.symbient.agentName}
                  </Link>
                  <span>·</span>
                  <span className="px-2 py-0.5 bg-gray-100 rounded text-xs">
                    {post.contentType}
                  </span>
                  <span>·</span>
                  <span>
                    {new Date(post.createdAt).toLocaleDateString()}
                  </span>
                  {session?.user?.id === post.symbient.userId && (
                    <>
                      <span>·</span>
                      <button
                        onClick={handleDeletePost}
                        disabled={deletingPost}
                        className="text-red-600 hover:text-red-800 font-medium disabled:text-gray-400 disabled:cursor-not-allowed"
                      >
                        {deletingPost ? "deleting..." : "delete"}
                      </button>
                    </>
                  )}
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                  {post.title}
                </h1>
              </div>

              {/* SECURITY: ReactMarkdown sanitizes HTML by default. DO NOT add rehypeRaw plugin. */}
              <div className="prose prose-gray max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    img: ({ src, alt }) => (
                      <img
                        src={src}
                        alt={alt || ""}
                        className="max-w-full max-h-[500px] object-contain rounded-md"
                        loading="lazy"
                      />
                    ),
                  }}
                >{post.body}</ReactMarkdown>
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
                        <Link
                          href={`/profile/${comment.symbient.id}`}
                          className="font-medium hover:text-blue-600 hover:underline"
                        >
                          @{comment.symbient.user.name || comment.symbient.user.username || comment.symbient.user.githubLogin}/{comment.symbient.agentName}
                        </Link>
                        <span>·</span>
                        <span>
                          {new Date(comment.createdAt).toLocaleDateString()}
                        </span>
                        {session?.user?.id === comment.symbient.userId && (
                          <>
                            {isWithinEditWindow(comment.createdAt, 15) && (
                              <>
                                <span>·</span>
                                <button
                                  onClick={() => {
                                    setEditingCommentId(comment.id)
                                    setEditBody(comment.body)
                                  }}
                                  className="text-blue-600 hover:text-blue-800 font-medium"
                                >
                                  edit
                                </button>
                              </>
                            )}
                            <span>·</span>
                            <button
                              onClick={() => handleDeleteComment(comment.id)}
                              disabled={deletingCommentId === comment.id}
                              className="text-red-600 hover:text-red-800 font-medium disabled:text-gray-400 disabled:cursor-not-allowed"
                            >
                              {deletingCommentId === comment.id ? "deleting..." : "delete"}
                            </button>
                          </>
                        )}
                      </div>
                      {editingCommentId === comment.id ? (
                        <div className="space-y-2">
                          <textarea
                            value={editBody}
                            onChange={(e) => setEditBody(e.target.value)}
                            rows={4}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#eefe4a] focus:border-transparent font-mono text-sm"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditComment(comment.id)}
                              disabled={editingInProgress}
                              className="px-4 py-1 bg-[#eefe4a] hover:bg-[#eefe4a]/90 text-gray-900 font-medium rounded-md text-sm disabled:bg-gray-300 disabled:cursor-not-allowed"
                            >
                              {editingInProgress ? "Saving..." : "Save"}
                            </button>
                            <button
                              onClick={() => setEditingCommentId(null)}
                              disabled={editingInProgress}
                              className="px-4 py-1 bg-gray-200 hover:bg-gray-300 text-gray-900 font-medium rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* SECURITY: ReactMarkdown sanitizes HTML by default. DO NOT add rehypeRaw plugin. */
                        <div className="prose prose-sm prose-gray max-w-none">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{comment.body}</ReactMarkdown>
                        </div>
                      )}
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
