// NextAuth configuration
// Magic link authentication via Resend + NextAuth EmailProvider

import { NextAuthOptions } from "next-auth"
import EmailProvider from "next-auth/providers/email"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { Resend } from "resend"
import { prisma } from "./prisma"

const resend = new Resend(process.env.RESEND_API_KEY)

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any, // Type mismatch workaround
  session: { strategy: "jwt" },
  providers: [
    EmailProvider({
      sendVerificationRequest: async ({ identifier: email, url }) => {
        if (!process.env.RESEND_API_KEY) {
          console.error("[Auth] RESEND_API_KEY is not configured")
          throw new Error("Email service not configured")
        }

        const { error } = await resend.emails.send({
          from: "Feytopai <noreply@feytopai.com>",
          to: email,
          subject: "Sign in to Feytopai",
          html: `<p>Click <a href="${url}">here</a> to sign in to Feytopai.</p>`,
        })

        if (error) {
          console.error("[Auth] Resend API error:", error)
          throw new Error(`Failed to send magic link: ${error.message}`)
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      // On initial sign-in, populate token with user data
      if (user) {
        token.sub = user.id
      }

      // Fetch username on sign-in or when explicitly refreshed
      if (trigger === "signIn" || trigger === "update" || !token.username) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.sub! },
            select: { username: true },
          })
          token.username = dbUser?.username ?? null
        } catch {
          // Don't break token creation on DB error
        }
      }

      return token
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub
        ;(session.user as any).username = token.username ?? null
      }
      return session
    },
  },
  events: {
    async signIn({ user }) {
      // Assign username from email on first sign-in
      if (!user.id) return

      try {
        const existingUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { username: true },
        })

        if (existingUser?.username) return

        // Derive username from email prefix
        const baseUsername = (user.email || "user")
          .split("@")[0]
          .replace(/[^a-z0-9-]/gi, "-")
          .toLowerCase()

        let finalUsername = baseUsername
        let suffix = 2
        const maxAttempts = 100

        while (suffix <= maxAttempts + 1) {
          const conflict = await prisma.user.findUnique({
            where: { username: finalUsername },
          })
          if (!conflict) break
          finalUsername = `${baseUsername}-${suffix++}`
        }

        // Fallback if all suffixed variants are taken
        if (suffix > maxAttempts + 1) {
          finalUsername = `${baseUsername}-${user.id.slice(0, 8)}`
        }

        await prisma.user.update({
          where: { id: user.id },
          data: { username: finalUsername },
        })

        console.log(`[Auth Event] Assigned username from email: ${finalUsername}`)
      } catch (error) {
        // Handle race condition: unique constraint violation means another
        // concurrent sign-in claimed this username first. The user still gets
        // created — they just won't have a username until next sign-in, when
        // the signIn event re-runs and finds a non-conflicting one.
        const isUniqueViolation =
          error instanceof Error && error.message.includes("Unique constraint")
        if (isUniqueViolation) {
          console.warn("[Auth Event] Username conflict (race condition), will retry on next sign-in")
        } else {
          console.error("[Auth Event] Failed to assign username:", error)
        }
      }
    },
  },
  pages: {
    signIn: "/login",
  },
}
