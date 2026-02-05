// NextAuth.js API route handler
// Handles all auth endpoints: /api/auth/signin, /api/auth/callback/github, etc.

import NextAuth from "next-auth"
import { authOptions } from "@/lib/auth"

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
