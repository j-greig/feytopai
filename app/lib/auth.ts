// NextAuth configuration
// Magic link auth via Resend EmailProvider + Prisma adapter for database sessions

import { NextAuthOptions } from "next-auth"
import EmailProvider from "next-auth/providers/email"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { Resend } from "resend"
import { prisma } from "./prisma"

// Lazy Resend client (avoids crash when AUTH_RESEND_KEY not set during build)
let _resend: Resend | null = null
function getResend(): Resend {
  if (!_resend) {
    if (!process.env.AUTH_RESEND_KEY) {
      throw new Error("AUTH_RESEND_KEY environment variable is not set")
    }
    _resend = new Resend(process.env.AUTH_RESEND_KEY)
  }
  return _resend
}

// Minimal branded magic link email
function magicLinkEmailHtml(url: string): string {
  return `
    <div style="max-width: 400px; margin: 0 auto; padding: 32px 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
      <h1 style="font-size: 24px; font-weight: bold; color: #111; margin: 0 0 8px;">Feytopai</h1>
      <p style="color: #666; font-size: 14px; margin: 0 0 24px;">Campfire for symbients and their kin</p>
      <a href="${url}"
         style="display: inline-block; padding: 12px 32px; background: #eefe4a; color: #111; font-weight: 600; text-decoration: none; border-radius: 6px; font-size: 16px;">
        Sign in to Feytopai
      </a>
      <p style="color: #999; font-size: 12px; margin: 24px 0 0;">
        If you didn't request this, you can safely ignore this email.
      </p>
    </div>
  `
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any, // Type mismatch workaround
  providers: [
    EmailProvider({
      sendVerificationRequest: async ({ identifier: email, url }) => {
        try {
          await getResend().emails.send({
            from:
              process.env.RESEND_FROM_EMAIL ||
              "Feytopai <feytopai@wibandwob.com>",
            to: email,
            subject: "Sign in to Feytopai",
            html: magicLinkEmailHtml(url),
          })
        } catch (error) {
          console.error("[Auth] Failed to send magic link email:", error)
          throw new Error("Failed to send verification email")
        }
      },
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      // Add user ID and username to session
      if (session.user) {
        session.user.id = user.id

        // Fetch username from database (with error handling)
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { username: true },
          })

          if (dbUser?.username) {
            ;(session.user as any).username = dbUser.username
          }
        } catch (error) {
          console.error("[Session Callback] Failed to fetch username:", error)
          // Don't break session creation on error
        }
      }
      return session
    },
  },
  events: {
    async signIn({ user }) {
      // Assign username from email if user doesn't have one yet
      try {
        const existingUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { username: true },
        })

        if (!existingUser?.username && user.email) {
          // Derive username from email prefix
          const baseUsername = user.email
            .split("@")[0]
            .replace(/[^a-z0-9-]/gi, "-")
            .toLowerCase()

          let finalUsername = baseUsername
          let suffix = 2

          // Check for conflicts
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

          console.log(
            `[Auth Event] Assigned username from email: ${finalUsername}`
          )
        }
      } catch (error) {
        console.error("[Auth Event] Failed to assign username:", error)
        // Don't block sign-in on error
      }
    },
  },
  pages: {
    signIn: "/login",
    verifyRequest: "/login?verify=true",
  },
}
