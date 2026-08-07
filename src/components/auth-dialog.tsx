"use client"

import * as React from "react"
import { signIn } from "next-auth/react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { KeyRound, Mail, Lock, User, Loader2, Sparkles, X } from "lucide-react"

interface AuthDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Called after a successful login or registration. */
  onSuccess?: () => void
  /** Whether the user explicitly closed the dialog (e.g. clicked outside). */
  onDismissed?: () => void
}

export function AuthDialog({
  open,
  onOpenChange,
  onSuccess,
  onDismissed,
}: AuthDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        // Block closing via overlay click / escape for unauthenticated users.
        if (!next) {
          onDismissed?.()
          return
        }
        onOpenChange(next)
      }}
    >
      <DialogContent
        className="sm:max-w-md gap-0 p-0 overflow-hidden"
        showCloseButton={false}
      >
        {/* Accessibility: Radix requires a Title + Description. They are
            visually hidden because we render a custom branded header. */}
        <DialogHeader className="sr-only">
          <DialogTitle>تسجيل الدخول أو إنشاء حساب</DialogTitle>
          <DialogDescription>
            سجّل الدخول أو أنشئ حساباً جديداً للوصول إلى جميع أدوات المنصة.
          </DialogDescription>
        </DialogHeader>
        {/* Brand header */}
        <div className="relative bg-gradient-brand text-white p-5 text-center overflow-hidden">
          <div className="absolute inset-0 bg-grid-pattern opacity-20" />
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
          {/* Close button */}
          <button
            type="button"
            onClick={() => onDismissed?.()}
            aria-label="إغلاق"
            className="absolute top-3 left-3 z-20 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm flex items-center justify-center text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="relative z-10 flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <KeyRound className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-display font-extrabold text-lg leading-tight">
                مرحباً بك في Keyword Key
              </h2>
              <p className="text-white/80 text-xs flex items-center gap-1 justify-center mt-0.5">
                <Sparkles className="w-3 h-3" />
                سجّل الدخول أو أنشئ حساباً للوصول لكل الأدوات
              </p>
            </div>
          </div>
        </div>

        <AuthTabs onSuccess={onSuccess} />
      </DialogContent>
    </Dialog>
  )
}

/* ------------------------------------------------------------------ */
/* Tabs (login + register)                                             */
/* ------------------------------------------------------------------ */

function AuthTabs({ onSuccess }: { onSuccess?: () => void }) {
  return (
    <Tabs defaultValue="login" className="w-full p-5">
      <TabsList className="grid grid-cols-2 w-full mb-5">
        <TabsTrigger value="login">تسجيل الدخول</TabsTrigger>
        <TabsTrigger value="register">حساب جديد</TabsTrigger>
      </TabsList>

      <TabsContent value="login">
        <LoginForm onSuccess={onSuccess} />
      </TabsContent>
      <TabsContent value="register">
        <RegisterForm onSuccess={onSuccess} />
      </TabsContent>
    </Tabs>
  )
}

/* ------------------------------------------------------------------ */
/* Login form                                                          */
/* ------------------------------------------------------------------ */

function LoginForm({ onSuccess }: { onSuccess?: () => void }) {
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })
      if (!res || res.error) {
        // NextAuth wraps authorize() throws into res.error string.
        setError(res?.error ?? "فشل تسجيل الدخول")
        return
      }
      onSuccess?.()
    } catch (err) {
      setError("حدث خطأ غير متوقع")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field
        id="login-email"
        label="البريد الإلكتروني"
        icon={<Mail className="w-4 h-4" />}
      >
        <Input
          id="login-email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="pr-9"
        />
      </Field>

      <Field
        id="login-password"
        label="كلمة المرور"
        icon={<Lock className="w-4 h-4" />}
      >
        <Input
          id="login-password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="pr-9"
        />
      </Field>

      {error && <ErrorBox message={error} />}

      <Button
        type="submit"
        disabled={loading}
        className="w-full bg-gradient-brand text-white font-bold hover:shadow-brand-lg"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 ml-2 animate-spin" />
        ) : (
          <KeyRound className="w-4 h-4 ml-2" />
        )}
        دخول
      </Button>
    </form>
  )
}

/* ------------------------------------------------------------------ */
/* Register form                                                       */
/* ------------------------------------------------------------------ */

function RegisterForm({ onSuccess }: { onSuccess?: () => void }) {
  const [name, setName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        setError(data.error ?? "فشل إنشاء الحساب")
        return
      }
      // Auto-login after successful registration.
      const signInRes = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })
      if (!signInRes || signInRes.error) {
        // Account created but auto-login failed — ask user to log in.
        setError("تم إنشاء الحساب، يرجى تسجيل الدخول الآن")
        return
      }
      onSuccess?.()
    } catch (err) {
      setError("حدث خطأ غير متوقع")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field
        id="register-name"
        label="الاسم"
        icon={<User className="w-4 h-4" />}
      >
        <Input
          id="register-name"
          type="text"
          autoComplete="name"
          placeholder="اسمك"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="pr-9"
        />
      </Field>

      <Field
        id="register-email"
        label="البريد الإلكتروني"
        icon={<Mail className="w-4 h-4" />}
      >
        <Input
          id="register-email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="pr-9"
        />
      </Field>

      <Field
        id="register-password"
        label="كلمة المرور"
        icon={<Lock className="w-4 h-4" />}
      >
        <Input
          id="register-password"
          type="password"
          autoComplete="new-password"
          placeholder="6 أحرف على الأقل"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="pr-9"
        />
      </Field>

      {error && <ErrorBox message={error} />}

      <Button
        type="submit"
        disabled={loading}
        className="w-full bg-gradient-brand text-white font-bold hover:shadow-brand-lg"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 ml-2 animate-spin" />
        ) : (
          <Sparkles className="w-4 h-4 ml-2" />
        )}
        إنشاء حساب
      </Button>
    </form>
  )
}

/* ------------------------------------------------------------------ */
/* Shared field helpers                                                */
/* ------------------------------------------------------------------ */

function Field({
  id,
  label,
  icon,
  children,
}: {
  id: string
  label: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm font-medium">
        {label}
      </Label>
      <div className="relative">
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
          {icon}
        </span>
        {children}
      </div>
    </div>
  )
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="rounded-lg bg-destructive/10 border border-destructive/30 px-3 py-2 text-sm text-destructive">
      {message}
    </div>
  )
}
