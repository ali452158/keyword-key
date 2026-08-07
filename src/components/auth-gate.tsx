"use client"

import * as React from "react"
import { useSession } from "next-auth/react"
import { AuthDialog } from "@/components/auth-dialog"
import { KeyRound, Loader2, ShieldCheck } from "lucide-react"

interface AuthGateProps {
  children: React.ReactNode
}

/**
 * AuthGate — enforces mandatory authentication.
 *
 * Behavior:
 * 1. While the session is loading, show a branded splash screen.
 * 2. If the user is authenticated, render `children` normally.
 * 3. If the user is NOT authenticated:
 *    - The site content is rendered behind a blurred, non-interactive overlay
 *      so the visitor can preview the design without using it.
 *    - The auth dialog stays hidden until the visitor clicks ANYWHERE inside
 *      the page. On that first click, the dialog opens.
 *    - The dialog cannot be dismissed while the user is unauthenticated
 *      (overlay/escape clicks are blocked inside AuthDialog).
 *
 * The "first click anywhere" trigger is implemented by attaching a one-shot
 * `click` listener on `document` that opens the dialog.
 */
export function AuthGate({ children }: AuthGateProps) {
  const { data: session, status } = useSession()
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [hintVisible, setHintVisible] = React.useState(true)

  const isAuthenticated = status === "authenticated" && !!session?.user

  /* Open the dialog on the first click anywhere on the page. */
  React.useEffect(() => {
    if (isAuthenticated) return
    if (dialogOpen) return

    const handleFirstClick = () => {
      setDialogOpen(true)
      setHintVisible(false)
    }

    document.addEventListener("click", handleFirstClick, { once: true })
    return () => {
      document.removeEventListener("click", handleFirstClick)
    }
  }, [isAuthenticated, dialogOpen])

  /* ---- Loading state ---- */
  if (status === "loading") {
    return <AuthSplash loading />
  }

  /* ---- Authenticated: render normally ---- */
  if (isAuthenticated) {
    return <>{children}</>
  }

  /* ---- Unauthenticated: locked preview + dialog trigger ---- */
  return (
    <>
      <div aria-hidden className="pointer-events-none select-none">
        <div className="filter blur-[6px] opacity-70 pointer-events-none">
          {children}
        </div>
      </div>

      {/* Locked overlay */}
      <div className="fixed inset-0 z-40 bg-background/60 backdrop-blur-[2px] flex items-center justify-center p-4">
        <LockedCard
          hintVisible={hintVisible}
          onClick={() => {
            setDialogOpen(true)
            setHintVisible(false)
          }}
        />
      </div>

      <AuthDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={() => {
          setDialogOpen(false)
          // useSession will refresh automatically; the gate flips to authed.
        }}
        onDismissed={() => {
          // User tried to dismiss without authing — keep dialog open.
          setDialogOpen(true)
        }}
      />
    </>
  )
}

/* ------------------------------------------------------------------ */
/* Loading splash + locked card                                        */
/* ------------------------------------------------------------------ */

function AuthSplash({ loading }: { loading?: boolean }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-brand-soft gap-4">
      <div className="w-16 h-16 rounded-2xl bg-gradient-brand flex items-center justify-center text-white shadow-brand-lg animate-pulse-glow">
        <KeyRound className="w-8 h-8" />
      </div>
      <div className="flex items-center gap-2 text-muted-foreground">
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        <span className="text-sm font-medium">جارٍ التحقق من الجلسة...</span>
      </div>
    </div>
  )
}

function LockedCard({
  hintVisible,
  onClick,
}: {
  hintVisible: boolean
  onClick: () => void
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onClick()
        }
      }}
      className="group relative max-w-md w-full rounded-3xl border border-border/60 bg-card/95 backdrop-blur-md p-7 sm:p-9 text-center shadow-brand-lg cursor-pointer transition-transform hover:scale-[1.01]"
    >
      <div className="absolute -top-16 -left-10 w-40 h-40 bg-primary/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -right-10 w-40 h-40 bg-accent/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-brand flex items-center justify-center text-white shadow-brand mb-4 group-hover:scale-105 transition-transform">
          <ShieldCheck className="w-8 h-8" />
        </div>

        <h2 className="font-display font-extrabold text-xl sm:text-2xl text-foreground mb-2">
          سجّل الدخول للوصول إلى المنصة
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mb-5">
          منصة Keyword Key متاحة فقط للأعضاء المسجّلين. أنشئ حساباً مجانياً
          أو سجّل الدخول لاكتشاف الكلمات المفتاحية والترندات والأدوات الذكية.
        </p>

        <div
          className={`inline-flex items-center gap-2 rounded-full bg-gradient-brand text-white font-bold text-sm px-5 py-2.5 shadow-brand transition-all ${
            hintVisible
              ? "animate-pulse-glow"
              : "opacity-70"
          }`}
        >
          <KeyRound className="w-4 h-4" />
          اضغط في أي مكان للمتابعة
        </div>

        <p className="text-[11px] text-muted-foreground mt-4">
          سيظهر نموذج تسجيل الدخول / إنشاء حساب فور الضغط
        </p>
      </div>
    </div>
  )
}
