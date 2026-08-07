"use client"

import * as React from "react"
import { useSession } from "next-auth/react"
import { AuthDialog } from "@/components/auth-dialog"

interface AuthContextValue {
  isAuthenticated: boolean
  /**
   * If authenticated, runs `action` immediately. Otherwise opens the auth
   * dialog and runs `action` after a successful login. Use this to guard
   * any action that should require an account (navigating to a service,
   * submitting a tool, etc.).
   */
  requireAuth: (action: () => void) => void
  /** Open the auth dialog directly (e.g. from a "Login" button). */
  openAuthDialog: () => void
}

const AuthContext = React.createContext<AuthContextValue | null>(null)

export function useAuth() {
  const ctx = React.useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within <AuthGate>")
  return ctx
}

interface AuthGateProps {
  children: React.ReactNode
}

/**
 * AuthGate — soft authentication gate.
 *
 * Behavior (per user request):
 * - The main page (dashboard) is ALWAYS fully visible and browseable for
 *   everyone. No blur, no locked overlay.
 * - Individual "services" (other tabs, CTA buttons, keyword cards, tools)
 *   call `requireAuth(action)` — if the visitor is unauthenticated, the
 *   auth dialog opens and the action is run after a successful login.
 * - The dialog is dismissible; closing it just cancels the pending action
 *   and the visitor keeps browsing the dashboard.
 */
export function AuthGate({ children }: AuthGateProps) {
  const { data: session, status } = useSession()
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const pendingAction = React.useRef<(() => void) | null>(null)

  const isAuthenticated = status === "authenticated" && !!session?.user

  const requireAuth = React.useCallback(
    (action: () => void) => {
      if (isAuthenticated) {
        action()
      } else {
        pendingAction.current = action
        setDialogOpen(true)
      }
    },
    [isAuthenticated]
  )

  const openAuthDialog = React.useCallback(() => {
    if (!isAuthenticated) {
      pendingAction.current = null
      setDialogOpen(true)
    }
  }, [isAuthenticated])

  const handleSuccess = React.useCallback(() => {
    setDialogOpen(false)
    const action = pendingAction.current
    pendingAction.current = null
    if (action) {
      // Defer so the dialog closes cleanly before the action runs.
      setTimeout(action, 0)
    }
  }, [])

  const handleDismissed = React.useCallback(() => {
    setDialogOpen(false)
    pendingAction.current = null
  }, [])

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, requireAuth, openAuthDialog }}
    >
      {children}
      <AuthDialog
        open={dialogOpen}
        onOpenChange={(next) => {
          if (!next) handleDismissed()
          else setDialogOpen(true)
        }}
        onSuccess={handleSuccess}
        onDismissed={handleDismissed}
      />
    </AuthContext.Provider>
  )
}
