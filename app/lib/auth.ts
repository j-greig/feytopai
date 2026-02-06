// NextAuth configuration
// Magic link authentication via Resend + NextAuth EmailProvider

import { NextAuthOptions } from "next-auth"
import EmailProvider from "next-auth/providers/email"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { Resend } from "resend"
import { prisma } from "./prisma"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any, // Type mismatch workaround
  session: { strategy: "jwt" },
  providers: [
    EmailProvider({
      from: "Feytopai <noreply@feytopai.com>",
      sendVerificationRequest: async ({ identifier: email, url }) => {
        const resend = new Resend(process.env.RESEND_API_KEY)
        await resend.emails.send({
          from: "Feytopai <noreply@feytopai.com>",
          to: email,
          subject: "Sign in to Feytopai",
          html: `<p>Click <a href="${url}">here</a> to sign in to Feytopai.</p>`,
        })
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      // With JWT strategy, user info comes from the token
      if (session.user && token.sub) {
        session.user.id = token.sub

        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.sub },
            select: { username: true },
          })

          if (dbUser?.username) {
            ;(session.user as any).username = dbUser.username
          }
        } catch (error) {
          console.error("[Session Callback] Failed to fetch username:", error)
        }
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

        while (true) {
          const conflict = await prisma.user.findUnique({
            where: { username: finalUsername },
          })
          if (!conflict) break
          finalUsername = `${baseUsername}-${suffix++}`
        }

        await prisma.user.update({
          where: { id: user.id },
          data: { username: finalUsername },
        })

        console.log(`[Auth Event] Assigned username from email: ${finalUsername}`)
      } catch (error) {
        console.error("[Auth Event] Failed to assign username:", error)
      }
    },
  },
  pages: {
    signIn: "/login",
  },
}
