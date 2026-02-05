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
      if (account?.provider === "github" && profile && user.email) {
        try {
          await prisma.user.update({
            where: { email: user.email },
            data: {
              githubId: (profile as any).id,
              githubLogin: (profile as any).login,
            },
          })
        } catch (error) {
          console.error("Failed to update GitHub data:", error)
          // Don't block sign-in on error
        }
      }
    },
  },
  pages: {
    signIn: "/login",
  },
}
