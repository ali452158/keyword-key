"use client"

import * as React from "react"
import { SessionProvider } from "next-auth/react"

/**
 * Client-side providers wrapper. Keeps SessionProvider (which must be a
 * client component) out of the server-rendered root layout.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>
}
