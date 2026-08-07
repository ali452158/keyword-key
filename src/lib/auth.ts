import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { db } from "@/lib/db"

/**
 * NextAuth configuration.
 *
 * Uses the JWT session strategy (stateless, no session table needed)
 * with a Credentials provider that validates email + password against
 * the SQLite `User` table.
 */
export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  pages: {
    // We use a dialog instead of a dedicated sign-in page, but keep this
    // pointing at "/" so NextAuth redirects there if needed.
    signIn: "/",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("البريد الإلكتروني وكلمة المرور مطلوبان")
        }

        const email = credentials.email.trim().toLowerCase()
        const user = await db.user.findUnique({
          where: { email },
        })

        if (!user) {
          throw new Error("البريد الإلكتروني غير مسجّل")
        }

        const valid = await bcrypt.compare(credentials.password, user.password)
        if (!valid) {
          throw new Error("كلمة المرور غير صحيحة")
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? undefined,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        ;(session.user as { id?: string }).id = token.id as string
      }
      return session
    },
  },
}
