"use client"

import * as React from "react"
import {
  Plug,
  Plus,
  Check,
  CheckCircle2,
  X,
  Trash2,
  RefreshCw,
  Loader2,
  Users,
  Eye,
  Heart,
  TrendingUp,
  TrendingDown,
  Hash,
  Sparkles,
  AlertCircle,
  Zap,
  Link2,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { PlatformBadge } from "@/components/platform-icon"
import { formatNumber, formatGrowth } from "@/lib/format"
import { useToast } from "@/hooks/use-toast"
import type { Platform } from "@/lib/types"
import { cn } from "@/lib/utils"

interface TopKeyword {
  keyword: string
  volume: number
}

interface TopPost {
  title: string
  views: number
  likes: number
  engagement: number
}

interface ConnectedAccount {
  id: string
  account: string
  platform: Platform
  connectedAt: string
  followers: number
  following: number
  totalPosts: number
  avgEngagement: number
  avgViews: number
  topKeywords: TopKeyword[]
  topPosts: TopPost[]
  recentGrowth: number
  bestContent: string
  summary: string
}

interface SocialIntegrationProps {
  onNavigate?: (tab: string, keyword?: string) => void
}

const STORAGE_KEY = "keyword-key-connected-accounts"

const CONNECTABLE_PLATFORMS: Platform[] = ["tiktok", "youtube", "instagram"]

type DialogStep = "intro" | "connecting" | "handle" | "analyzing"

export function SocialIntegration({ onNavigate }: SocialIntegrationProps) {
  const { toast } = useToast()
  const [connectedAccounts, setConnectedAccounts] = React.useState<
    ConnectedAccount[]
  >([])
  const [hydrated, setHydrated] = React.useState(false)

  // Dialog state
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [dialogStep, setDialogStep] = React.useState<DialogStep>("intro")
  const [activePlatform, setActivePlatform] = React.useState<Platform | null>(
    null
  )
  const [handleInput, setHandleInput] = React.useState("")

  // Per-account refresh tracking
  const [refreshingId, setRefreshingId] = React.useState<string | null>(null)

  // Load from localStorage on mount
  React.useEffect(() => {
    if (typeof window === "undefined") return
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as ConnectedAccount[]
        if (Array.isArray(parsed)) {
          setConnectedAccounts(parsed)
        }
      }
    } catch {
      // ignore corrupt storage
    } finally {
      setHydrated(true)
    }
  }, [])

  // Persist on change
  React.useEffect(() => {
    if (!hydrated || typeof window === "undefined") return
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(connectedAccounts)
      )
    } catch {
      // storage full / unavailable — ignore
    }
  }, [connectedAccounts, hydrated])

  const isConnected = (p: Platform) =>
    connectedAccounts.some((a) => a.platform === p)

  function openConnectDialog(platform: Platform) {
    setActivePlatform(platform)
    setHandleInput("")
    setDialogStep("intro")
    setDialogOpen(true)
  }

  function closeDialog() {
    setDialogOpen(false)
    setActivePlatform(null)
    setHandleInput("")
    setDialogStep("intro")
  }

  async function confirmConnect() {
    if (!activePlatform) return
    setDialogStep("connecting")
    // simulate OAuth handshake delay
    await new Promise((r) => setTimeout(r, 1500))
    setDialogStep("handle")
  }

  async function analyzeAccount() {
    if (!activePlatform) return
    const cleanHandle = handleInput.trim().replace(/^@/, "")
    if (!cleanHandle) {
      toast({
        variant: "destructive",
        title: "اسم الحساب مطلوب",
        description: "أدخل اسم المستخدم الخاص بالحساب",
      })
      return
    }

    setDialogStep("analyzing")
    toast({
      title: "جاري التحليل...",
      description: `نسحب بيانات @${cleanHandle} من ${
        { tiktok: "TikTok", youtube: "YouTube", instagram: "Instagram" }[
          activePlatform
        ]
      }`,
    })

    try {
      const res = await fetch("/api/integration/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          account: cleanHandle,
          platform: activePlatform,
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error || "فشل الاتصال بالخدمة")
      }

      const json = (await res.json()) as {
        success: boolean
        data?: ConnectedAccount
        error?: string
      }

      if (!json.success || !json.data) {
        throw new Error(json.error || "استجابة غير صالحة")
      }

      const newAccount = json.data

      // Replace any existing entry for the same platform
      setConnectedAccounts((prev) => {
        const filtered = prev.filter((a) => a.platform !== newAccount.platform)
        return [...filtered, newAccount]
      })

      toast({
        title: "تم ربط الحساب بنجاح",
        description: `@${newAccount.account} متصل الآن`,
      })

      closeDialog()
    } catch (err) {
      toast({
        variant: "destructive",
        title: "فشل ربط الحساب",
        description: err instanceof Error ? err.message : "خطأ غير معروف",
      })
      setDialogStep("handle")
    }
  }

  function disconnect(id: string) {
    const target = connectedAccounts.find((a) => a.id === id)
    setConnectedAccounts((prev) => prev.filter((a) => a.id !== id))
    toast({
      title: "تم فصل الحساب",
      description: target
        ? `@${target.account} لم يعد متصلاً`
        : "تمت إزالة الحساب",
    })
  }

  async function refreshAccount(id: string) {
    const target = connectedAccounts.find((a) => a.id === id)
    if (!target) return

    setRefreshingId(id)
    toast({
      title: "جاري تحديث البيانات...",
      description: `نسحب أحدث بيانات @${target.account}`,
    })

    try {
      const res = await fetch("/api/integration/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          account: target.account,
          platform: target.platform,
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error || "فشل تحديث البيانات")
      }

      const json = (await res.json()) as {
        success: boolean
        data?: ConnectedAccount
        error?: string
      }

      if (!json.success || !json.data) {
        throw new Error(json.error || "استجابة غير صالحة")
      }

      const refreshed = json.data
      // keep original id + connectedAt to preserve identity
      const merged: ConnectedAccount = {
        ...refreshed,
        id: target.id,
        connectedAt: target.connectedAt,
      }

      setConnectedAccounts((prev) =>
        prev.map((a) => (a.id === id ? merged : a))
      )

      toast({
        title: "تم تحديث البيانات",
        description: `@${merged.account} محدّث بأحدث المؤشرات`,
      })
    } catch (err) {
      toast({
        variant: "destructive",
        title: "فشل التحديث",
        description: err instanceof Error ? err.message : "خطأ غير معروف",
      })
    } finally {
      setRefreshingId(null)
    }
  }

  function handleKeywordClick(keyword: string) {
    if (onNavigate) {
      onNavigate("research", keyword)
    }
  }

  return (
    <section className="w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* Section header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h2 className="font-display text-xl font-bold flex items-center gap-2">
              <span className="text-gradient-brand inline-flex items-center justify-center">
                <Plug className="w-6 h-6" />
              </span>
              التكامل مع منصات السوشيال ميديا
            </h2>
            <p className="text-muted-foreground text-sm mt-1">
              اربط حساباتك واسحب البيانات مباشرة للتحليل
            </p>
          </div>
          {connectedAccounts.length > 0 && (
            <Badge
              variant="secondary"
              className="bg-gradient-brand-soft text-foreground border-0 gap-1.5 self-start sm:self-auto"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              {connectedAccounts.length} حساب مربوط
            </Badge>
          )}
        </div>

        {/* Connect card */}
        <Card className="bg-gradient-brand-soft border-0 shadow-brand overflow-hidden">
          <CardContent className="p-6 sm:p-8">
            <div className="flex flex-col lg:flex-row lg:items-center gap-6">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-brand text-white shadow-brand">
                    <Link2 className="w-5 h-5" />
                  </span>
                  <h3 className="font-display text-lg font-bold">
                    اربط حساباتك
                  </h3>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed max-w-xl">
                  اربط حسابات TikTok و YouTube و Instagram لسحب البيانات
                  وتحليلها تلقائياً. نحلل المؤشرات، الكلمات المفتاحية، وأفضل
                  المنشورات لكل حساب.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full lg:w-auto lg:min-w-[28rem]">
                {CONNECTABLE_PLATFORMS.map((p) => {
                  const connected = isConnected(p)
                  return (
                    <Button
                      key={p}
                      type="button"
                      variant={connected ? "secondary" : "outline"}
                      onClick={() =>
                        connected ? undefined : openConnectDialog(p)
                      }
                      disabled={connected}
                      className={cn(
                        "h-auto py-3 px-3 flex items-center justify-between gap-2 rounded-xl border-2 transition-all",
                        connected
                          ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50"
                          : "bg-background border-border hover:border-primary/40 hover:shadow-brand"
                      )}
                    >
                      <PlatformBadge platform={p} size="lg" showName />
                      {connected ? (
                        <span className="flex items-center gap-1 text-xs font-semibold">
                          <Check className="w-4 h-4" />
                          متصل
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs font-semibold text-primary">
                          <Plus className="w-4 h-4" />
                          ربط
                        </span>
                      )}
                    </Button>
                  )
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Connected accounts dashboard or empty state */}
        {hydrated && connectedAccounts.length === 0 ? (
          <EmptyState />
        ) : (
          connectedAccounts.length > 0 && (
            <div className="mt-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-lg font-bold flex items-center gap-2">
                  الحسابات المربوطة
                  <Badge
                    variant="secondary"
                    className="bg-gradient-brand text-white border-0"
                  >
                    {connectedAccounts.length}
                  </Badge>
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {connectedAccounts.map((acc) => (
                  <AccountCard
                    key={acc.id}
                    account={acc}
                    onDisconnect={disconnect}
                    onRefresh={refreshAccount}
                    refreshing={refreshingId === acc.id}
                    onKeywordClick={handleKeywordClick}
                  />
                ))}
              </div>
            </div>
          )
        )}
      </div>

      {/* Connect dialog */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) closeDialog()
        }}
      >
        <DialogContent className="sm:max-w-md">
          {activePlatform && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <PlatformBadge platform={activePlatform} size="md" />
                  ربط حساب{" "}
                  {{
                    tiktok: "TikTok",
                    youtube: "YouTube",
                    instagram: "Instagram",
                  }[activePlatform]}
                </DialogTitle>
                <DialogDescription>
                  {dialogStep === "intro" &&
                    "سيتم توجيهك لتسجيل الدخول إلى حسابك ومنح الصلاحيات اللازمة."}
                  {dialogStep === "connecting" &&
                    "جاري الاتصال بمنصة السوشيال ميديا..."}
                  {dialogStep === "handle" &&
                    "أدخل اسم المستخدم الخاص بالحساب الذي تريد تحليله."}
                  {dialogStep === "analyzing" &&
                    "جاري سحب وتحليل بيانات الحساب بالذكاء الاصطناعي..."}
                </DialogDescription>
              </DialogHeader>

              {/* Intro / OAuth-like screen */}
              {dialogStep === "intro" && (
                <div className="space-y-4 py-2">
                  <div className="rounded-xl bg-gradient-brand-soft p-4 flex items-center gap-3">
                    <PlatformBadge platform={activePlatform} size="lg" />
                    <div className="text-sm">
                      <p className="font-semibold">
                        {
                          {
                            tiktok: "TikTok",
                            youtube: "YouTube",
                            instagram: "Instagram",
                          }[activePlatform]
                        }{" "}
                        OAuth
                      </p>
                      <p className="text-muted-foreground text-xs">
                        اتصال آمن ومشفر
                      </p>
                    </div>
                  </div>

                  <ul className="text-xs text-muted-foreground space-y-1.5">
                    <li className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                      سحب المؤشرات العامة (متابعون، مشاهدات، تفاعل)
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                      تحليل الكلمات المفتاحية وأفضل المنشورات
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                      لا ننشر أي شيء باسمك ولا نعدّل بياناتك
                    </li>
                  </ul>

                  <DialogFooter className="gap-2">
                    <Button
                      variant="outline"
                      onClick={closeDialog}
                      className="flex-1"
                    >
                      إلغاء
                    </Button>
                    <Button
                      onClick={confirmConnect}
                      className="flex-1 bg-gradient-brand text-white shadow-brand hover:shadow-brand-lg"
                    >
                      <Zap className="w-4 h-4" />
                      تأكيد الربط
                    </Button>
                  </DialogFooter>
                </div>
              )}

              {/* Connecting spinner */}
              {dialogStep === "connecting" && (
                <div className="py-10 flex flex-col items-center gap-4">
                  <div className="relative">
                    <Loader2 className="w-12 h-12 animate-spin text-primary" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <PlatformBadge
                        platform={activePlatform}
                        size="sm"
                      />
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground text-center">
                    جاري إنشاء اتصال آمن مع{" "}
                    {
                      {
                        tiktok: "TikTok",
                        youtube: "YouTube",
                        instagram: "Instagram",
                      }[activePlatform]
                    }
                    ...
                  </p>
                </div>
              )}

              {/* Handle input */}
              {dialogStep === "handle" && (
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <label
                      htmlFor="account-handle"
                      className="text-sm font-medium"
                    >
                      اسم المستخدم
                    </label>
                    <div className="relative">
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">
                        @
                      </span>
                      <Input
                        id="account-handle"
                        autoFocus
                        value={handleInput}
                        onChange={(e) => setHandleInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault()
                            analyzeAccount()
                          }
                        }}
                        placeholder="username"
                        className="pr-7"
                        dir="ltr"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      أدخل اسم المستخدم بدون @ — مثال: khaby.lame
                    </p>
                  </div>

                  <DialogFooter className="gap-2">
                    <Button
                      variant="outline"
                      onClick={closeDialog}
                      className="flex-1"
                    >
                      إلغاء
                    </Button>
                    <Button
                      onClick={analyzeAccount}
                      className="flex-1 bg-gradient-brand text-white shadow-brand hover:shadow-brand-lg"
                    >
                      <Sparkles className="w-4 h-4" />
                      تحليل الحساب
                    </Button>
                  </DialogFooter>
                </div>
              )}

              {/* Analyzing spinner */}
              {dialogStep === "analyzing" && (
                <div className="py-10 flex flex-col items-center gap-4">
                  <Loader2 className="w-12 h-12 animate-spin text-primary" />
                  <div className="text-center space-y-1">
                    <p className="text-sm font-medium">
                      جاري تحليل @{handleInput.replace(/^@/, "")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      يستغرق هذا عادةً بضع ثوانٍ...
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  )
}

/* ---------- Empty state ---------- */

function EmptyState() {
  return (
    <div className="mt-8">
      <Card className="border-dashed border-2 bg-background/50">
        <CardContent className="py-12 px-6 flex flex-col items-center text-center">
          <div className="relative mb-4">
            <div className="absolute inset-0 blur-2xl bg-gradient-brand opacity-20 rounded-full" />
            <div className="relative w-16 h-16 rounded-2xl bg-gradient-brand-soft flex items-center justify-center">
              <Plug className="w-8 h-8 text-primary" />
            </div>
          </div>
          <h3 className="font-display text-lg font-bold mb-1">
            لا توجد حسابات مربوطة بعد
          </h3>
          <p className="text-muted-foreground text-sm max-w-sm">
            ابدأ بربط حسابك الأول من TikTok أو YouTube أو Instagram لسحب
            البيانات وتحليلها تلقائياً
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

/* ---------- Account card ---------- */

interface AccountCardProps {
  account: ConnectedAccount
  onDisconnect: (id: string) => void
  onRefresh: (id: string) => void
  refreshing: boolean
  onKeywordClick: (keyword: string) => void
}

function AccountCard({
  account,
  onDisconnect,
  onRefresh,
  refreshing,
  onKeywordClick,
}: AccountCardProps) {
  const growthPositive = account.recentGrowth >= 0

  return (
    <Card className="relative group hover:shadow-brand-lg transition-shadow overflow-hidden">
      {/* Top accent strip */}
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-brand" />

      <CardContent className="p-5 pt-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-4">
          <div className="flex items-center gap-2 min-w-0">
            <PlatformBadge platform={account.platform} size="md" />
            <div className="min-w-0">
              <p className="font-semibold text-sm truncate" dir="ltr">
                @{account.account}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="relative flex">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="absolute inset-0 w-2 h-2 rounded-full bg-emerald-500 animate-ping opacity-75" />
                </span>
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                  متصل
                </span>
              </div>
            </div>
          </div>

          <Button
            size="icon"
            variant="ghost"
            onClick={() => onDisconnect(account.id)}
            aria-label="فصل الحساب"
            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <Stat
            icon={<Users className="w-3.5 h-3.5" />}
            label="متابعون"
            value={formatNumber(account.followers)}
          />
          <Stat
            icon={<Eye className="w-3.5 h-3.5" />}
            label="مشاهدات"
            value={formatNumber(account.avgViews)}
          />
          <Stat
            icon={<Heart className="w-3.5 h-3.5" />}
            label="تفاعل"
            value={`${account.avgEngagement.toFixed(1)}%`}
          />
        </div>

        {/* Growth badge */}
        <div className="flex items-center justify-between mb-4">
          <Badge
            variant="outline"
            className={cn(
              "gap-1 font-medium",
              growthPositive
                ? "text-emerald-600 border-emerald-200 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/30 dark:border-emerald-900"
                : "text-rose-600 border-rose-200 bg-rose-50 dark:text-rose-400 dark:bg-rose-950/30 dark:border-rose-900"
            )}
          >
            {growthPositive ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            {formatGrowth(account.recentGrowth)} آخر 30 يوم
          </Badge>
          <span className="text-xs text-muted-foreground">
            {formatNumber(account.totalPosts)} منشور
          </span>
        </div>

        <Separator className="mb-4" />

        {/* Top keywords */}
        {account.topKeywords.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
              <Hash className="w-3 h-3" />
              الكلمات المفتاحية الأكثر تكراراً
            </p>
            <div className="flex flex-wrap gap-1.5">
              {account.topKeywords.slice(0, 4).map((kw, i) => (
                <button
                  key={`${kw.keyword}-${i}`}
                  type="button"
                  onClick={() => onKeywordClick(kw.keyword)}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-secondary hover:bg-gradient-brand hover:text-white text-xs font-medium transition-colors"
                >
                  <Hash className="w-3 h-3 opacity-70" />
                  {kw.keyword}
                  <span className="text-[10px] opacity-60">
                    {formatNumber(kw.volume)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Top posts */}
        {account.topPosts.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-medium text-muted-foreground mb-2">
              أفضل المنشورات
            </p>
            <div className="space-y-1.5">
              {account.topPosts.slice(0, 2).map((post, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-2 rounded-lg bg-secondary/50 px-2.5 py-1.5"
                >
                  <span className="text-xs truncate flex-1" title={post.title}>
                    {post.title}
                  </span>
                  <span className="flex items-center gap-2 text-[10px] text-muted-foreground shrink-0">
                    <span className="flex items-center gap-0.5">
                      <Eye className="w-3 h-3" />
                      {formatNumber(post.views)}
                    </span>
                    <span className="flex items-center gap-0.5">
                      <Heart className="w-3 h-3" />
                      {formatNumber(post.likes)}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI summary */}
        <div className="rounded-lg bg-gradient-brand-soft p-3 mb-4">
          <p className="text-xs font-medium flex items-center gap-1 mb-1">
            <Sparkles className="w-3 h-3 text-primary" />
            ملخص ذكي
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
            {account.summary}
          </p>
        </div>

        {/* Refresh button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onRefresh(account.id)}
          disabled={refreshing}
          className="w-full h-8 text-xs"
        >
          {refreshing ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              جاري التحديث...
            </>
          ) : (
            <>
              <RefreshCw className="w-3.5 h-3.5" />
              تحديث البيانات
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="rounded-lg bg-secondary/50 px-2.5 py-2 text-center">
      <div className="flex items-center justify-center text-muted-foreground mb-0.5">
        {icon}
      </div>
      <p className="font-bold text-sm leading-none">{value}</p>
      <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
    </div>
  )
}
