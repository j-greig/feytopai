// NextAuth configuration
// Multi-provider OAuth (GitHub + Google) + Prisma adapter for database sessions

import { NextAuthOptions } from "next-auth"
import GithubProvider from "next-auth/providers/github"
import GoogleProvider from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "./prisma"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any, // Type mismatch workaround
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true, // Link accounts by verified email
      profile(profile) {
        return {
          id: profile.id.toString(),
          name: profile.name ?? profile.login,
          email: profile.email,
          image: profile.avatar_url,
          login: profile.login, // Preserve GitHub username
        }
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true, // Link accounts by verified email
      profile(profile) {
        // Derive username from email for Google users
        const emailUsername = profile.email
          .split("@")[0]
          .replace(/[^a-z0-9-]/gi, "-")
          .toLowerCase()

        return {
          id: profile.sub, // Google's user ID
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          emailUsername, // Pass derived username
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
    async signIn({ user, account, profile }) {
      // Store provider-specific data and assign username after user is created
      // Using events instead of callbacks to avoid blocking sign-in
      if (account && profile) {
        try {
          console.log(`[Auth Event] ${account.provider} sign-in detected for user ${user.id}`)

          // Check if user already has a username (account linking scenario)
          const existingUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { username: true, githubId: true, googleId: true },
          })

          // Prepare update data
          const updateData: any = {}

          // Set provider-specific IDs
          if (account.provider === "github") {
            const githubProfile = profile as any
            updateData.githubId = parseInt(String(githubProfile.id))
            updateData.githubLogin = githubProfile.login

            // Assign username from GitHub if user doesn't have one
            if (!existingUser?.username) {
              updateData.username = githubProfile.login
              console.log(`[Auth Event] Assigning username from GitHub: ${githubProfile.login}`)
            }
          } else if (account.provider === "google") {
            const googleProfile = profile as any
            updateData.googleId = googleProfile.sub

            // Assign username from email if user doesn't have one
            if (!existingUser?.username) {
              // Derive from email and ensure uniqueness
              const baseUsername = googleProfile.email
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

              updateData.username = finalUsername
              console.log(`[Auth Event] Assigning username from Google email: ${finalUsername}`)
            }
          }

          // Update user with provider data and username
          const updated = await prisma.user.update({
            where: { id: user.id },
            data: updateData,
          })

          console.log("[Auth Event] Successfully updated user:", {
            id: updated.id,
            username: updated.username,
            githubId: updated.githubId,
            googleId: updated.googleId,
          })
        } catch (error) {
          console.error("[Auth Event] Failed to update user data:", error)
          // Don't block sign-in on error
        }
      }
    },
  },
  pages: {
    signIn: "/login",
  },
}
