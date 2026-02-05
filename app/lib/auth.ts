// NextAuth configuration
// GitHub OAuth + Prisma adapter for database sessions

import { NextAuthOptions } from "next-auth"
import GithubProvider from "next-auth/providers/github"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "./prisma"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any, // Type mismatch workaround
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
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
  ],
  callbacks: {
    async session({ session, user }) {
      // Add user ID to session
      if (session.user) {
        session.user.id = user.id
      }
      return session
    },
  },
  events: {
    async signIn({ user, account, profile }) {
      // Store GitHub-specific data after user is created
      // Using events instead of callbacks to avoid blocking sign-in
      if (account?.provider === "github" && profile) {
        try {
          const githubProfile = profile as any
          console.log("[Auth Event] GitHub sign-in detected")
          console.log("[Auth Event] FULL Profile object:", JSON.stringify(githubProfile, null, 2))
          console.log("[Auth Event] User data:", {
            id: user.id,
            email: user.email,
          })

          // Use user.id instead of user.email for more reliable lookup
          const updated = await prisma.user.update({
            where: { id: user.id },
            data: {
              githubId: parseInt(String(githubProfile.id)),
              githubLogin: githubProfile.login,
            },
          })

          console.log("[Auth Event] Successfully updated user:", {
            id: updated.id,
            githubId: updated.githubId,
            githubLogin: updated.githubLogin,
          })
        } catch (error) {
          console.error("[Auth Event] Failed to update GitHub data:", error)
          // Don't block sign-in on error
        }
      }
    },
  },
  pages: {
    signIn: "/login",
  },
}
