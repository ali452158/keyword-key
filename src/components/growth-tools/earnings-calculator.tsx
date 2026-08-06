"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import {
  Calculator,
  Users,
  Eye,
  TrendingUp,
  Lightbulb,
  Loader2,
  Info,
  AlertCircle,
  DollarSign,
  Sparkles,
  Cpu,
  Gamepad2,
  GraduationCap,
  UtensilsCrossed,
  Banknote,
  Heart,
  Film,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { PlatformBadge } from "@/components/platform-icon"
import type { Platform } from "@/lib/types"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type Niche =
  | "entertainment"
  | "tech"
  | "gaming"
  | "beauty"
  | "education"
  | "food"
  | "finance"
  | "lifestyle"

interface NicheOption {
  value: Niche
  label: string
  icon: React.ReactNode
}

const NICHE_OPTIONS: NicheOption[] = [
  { value: "entertainment", label: "ترفيه", icon: <Film className="size-4" /> },
  { value: "tech", label: "تقنية", icon: <Cpu className="size-4" /> },
  { value: "gaming", label: "ألعاب", icon: <Gamepad2 className="size-4" /> },
  { value: "beauty", label: "جمال", icon: <Sparkles className="size-4" /> },
  { value: "education", label: "تعليم", icon: <GraduationCap className="size-4" /> },
  { value: "food", label: "طعام", icon: <UtensilsCrossed className="size-4" /> },
  { value: "finance", label: "مال", icon: <Banknote className="size-4" /> },
  { value: "lifestyle", label: "لايف ستايل", icon: <Heart className="size-4" /> },
]

const PLATFORMS: Platform[] = ["youtube", "tiktok", "instagram", "facebook"]

interface EarningsEstimate {
  low: number
  mid: number
  high: number
}

interface RevenueBreakdownItem {
  source: string
  amount: number
}

interface EarningsResult {
  platform: Platform
  niche: Niche
  nicheLabel: string
  followers: number
  viewsPerMonth: number
  rpm: number
  monthlyEstimate: EarningsEstimate
  yearlyEstimate: EarningsEstimate
  breakdown: RevenueBreakdownItem[]
  tips: string[]
}

function formatCurrency(n: number): string {
  return `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`
}

function formatPlainNumber(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "0"
  return n.toLocaleString("en-US")
}

export function EarningsCalculator() {
  const { toast } = useToast()
  const [platform, setPlatform] = useState<Platform>("youtube")
  const [followersInput, setFollowersInput] = useState<string>("100000")
  const [viewsInput, setViewsInput] = useState<string>("500000")
  const [niche, setNiche] = useState<Niche>("tech")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<EarningsResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Live formatted preview
  const followers = Number(followersInput) || 0
  const views = Number(viewsInput) || 0

  async function calculate() {
    if (!Number.isFinite(followers) || followers <= 0) {
      toast({
        title: "إدخال غير صالح",
        description: "عدد المتابعين يجب أن يكون أكبر من صفر",
        variant: "destructive",
      })
      return
    }
    if (!Number.isFinite(views) || views <= 0) {
      toast({
        title: "إدخال غير صالح",
        description: "المشاهدات الشهرية يجب أن تكون أكبر من صفر",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/tools/earnings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform,
          followers,
          viewsPerMonth: views,
          niche,
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        const msg = json?.error || "فشل حساب الأرباح"
        throw new Error(msg)
      }
      setResult(json.data as EarningsResult)
    } catch (e) {
      const msg = e instanceof Error ? e.message : "حدث خطأ غير متوقع"
      setError(msg)
      toast({
        title: "خطأ",
        description: msg,
        variant: "destructive",
      })
    } finally {
      // Brief skeleton for instant computation
      setTimeout(() => setLoading(false), 350)
    }
  }

  // Auto-calculate on platform change
  useEffect(() => {
    if (result || loading) {
      calculate()
    }
  }, [platform])

  return (
    <section className="space-y-6">
      {/* Tool header */}
      <div className="flex items-start gap-3">
        <div className="bg-gradient-brand flex size-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-brand">
          <DollarSign className="size-6" />
        </div>
        <div>
          <h2 className="font-display text-xl font-bold flex items-center gap-2">
            حاسبة الأرباح
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            قدّر أرباحك المحتملة من يوتيوب وتيك توك
          </p>
        </div>
      </div>

      {/* Input card */}
      <Card className="bg-gradient-brand-soft border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Calculator className="size-4 text-primary" />
            بيانات الحساب
          </CardTitle>
          <CardDescription>
            اختر المنصة وأدخل بياناتك لحساب الأرباح التقديرية
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Platform selector */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">المنصة</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PLATFORMS.map((p) => {
                const selected = p === platform
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPlatform(p)}
                    aria-pressed={selected}
                    className={cn(
                      "flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-medium transition-all",
                      selected
                        ? "bg-gradient-brand text-white border-transparent shadow-brand"
                        : "bg-card hover:bg-accent border-border"
                    )}
                  >
                    <PlatformBadge
                      platform={p}
                      size="sm"
                      showName
                      className={selected ? "[&_span]:text-white" : ""}
                    />
                  </button>
                )
              })}
            </div>
          </div>

          {/* Followers + Views grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="followers" className="flex items-center gap-1.5 text-xs">
                <Users className="size-3.5 text-primary" />
                عدد المتابعين
              </Label>
              <Input
                id="followers"
                type="number"
                inputMode="numeric"
                min={0}
                value={followersInput}
                onChange={(e) => setFollowersInput(e.target.value)}
                placeholder="100000"
                className="bg-card"
              />
              <p className="text-xs text-muted-foreground">
                {formatPlainNumber(followers)} متابع
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="views" className="flex items-center gap-1.5 text-xs">
                <Eye className="size-3.5 text-primary" />
                المشاهدات الشهرية
              </Label>
              <Input
                id="views"
                type="number"
                inputMode="numeric"
                min={0}
                value={viewsInput}
                onChange={(e) => setViewsInput(e.target.value)}
                placeholder="500000"
                className="bg-card"
              />
              <p className="text-xs text-muted-foreground">
                {formatPlainNumber(views)} مشاهدة / شهر
              </p>
            </div>
          </div>

          {/* Niche selector */}
          <div className="space-y-2">
            <Label htmlFor="niche" className="text-xs text-muted-foreground">
              المجال
            </Label>
            <Select
              value={niche}
              onValueChange={(v) => setNiche(v as Niche)}
            >
              <SelectTrigger id="niche" className="w-full bg-card">
                <SelectValue placeholder="اختر المجال" />
              </SelectTrigger>
              <SelectContent>
                {NICHE_OPTIONS.map((n) => (
                  <SelectItem key={n.value} value={n.value}>
                    <span className="flex items-center gap-2">
                      {n.icon}
                      <span>{n.label}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Submit button */}
          <Button
            type="button"
            onClick={calculate}
            disabled={loading}
            className="w-full bg-gradient-brand text-white shadow-brand hover:opacity-90 h-11"
          >
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                جاري الحساب...
              </>
            ) : (
              <>
                <Calculator className="size-4" />
                احسب الأرباح
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Loading state */}
      {loading && <LoadingSkeleton />}

      {/* Error state */}
      {!loading && error && (
        <Card className="border-rose-200 bg-rose-50/60 dark:bg-rose-950/20 dark:border-rose-900">
          <CardContent className="flex items-center gap-3 py-4 text-rose-700 dark:text-rose-300">
            <AlertCircle className="size-5 shrink-0" />
            <p className="text-sm">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {!loading && !error && result && <EarningsResultView result={result} />}

      {/* Empty state */}
      {!loading && !error && !result && (
        <Card className="border-dashed bg-card/50">
          <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
            <div className="bg-gradient-brand-soft flex size-16 items-center justify-center rounded-2xl">
              <Calculator className="size-8 text-primary" />
            </div>
            <p className="text-muted-foreground text-sm">
              أدخل بياناتك لحساب الأرباح المحتملة
            </p>
          </CardContent>
        </Card>
      )}

      {/* Disclaimer */}
      <div className="flex items-start gap-2 text-xs text-muted-foreground">
        <Info className="size-3.5 shrink-0 mt-0.5" />
        <p>
          هذه تقديرات تقريبية لأغراض توضيحية فقط. الأرباح الفعلية تختلف حسب عوامل كثيرة.
        </p>
      </div>
    </section>
  )
}

// ---------- Sub-components ----------

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-40 w-full rounded-2xl bg-gradient-brand-soft" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
      </div>
      <Skeleton className="h-48 w-full rounded-2xl" />
      <Skeleton className="h-40 w-full rounded-2xl" />
    </div>
  )
}

function EarningsResultView({ result }: { result: EarningsResult }) {
  const breakdownTotal = result.breakdown.reduce((s, b) => s + b.amount, 0)

  return (
    <div className="space-y-4">
      {/* Hero earnings card + yearly */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Monthly hero */}
        <Card className="lg:col-span-2 bg-gradient-brand border-transparent text-white shadow-brand-lg overflow-hidden relative">
          <div className="absolute inset-0 bg-grid-pattern opacity-20 pointer-events-none" />
          <CardContent className="relative p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-1.5">
                  <DollarSign className="size-4" />
                </div>
                <span className="text-sm text-white/90">
                  الأرباح الشهرية المقدّرة
                </span>
              </div>
              <TrendingUp className="size-5 text-white/80" />
            </div>

            <div>
              <div className="text-4xl sm:text-5xl font-display font-bold tracking-tight">
                ≈ {formatCurrency(result.monthlyEstimate.mid)}
              </div>
              <div className="text-sm text-white/80 mt-2">
                النطاق: {formatCurrency(result.monthlyEstimate.low)} —{" "}
                {formatCurrency(result.monthlyEstimate.high)}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Badge className="bg-white/20 text-white border-transparent hover:bg-white/25">
                {result.nicheLabel}
              </Badge>
              <Badge className="bg-white/20 text-white border-transparent hover:bg-white/25">
                RPM: ${result.rpm.toFixed(2)} لكل 1000 مشاهدة
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Yearly card */}
        <Card className="bg-card">
          <CardContent className="p-6 flex flex-col gap-3 h-full">
            <div className="flex items-center gap-2">
              <div className="bg-gradient-brand-soft rounded-lg p-1.5">
                <TrendingUp className="size-4 text-primary" />
              </div>
              <span className="text-sm text-muted-foreground">
                الأرباح السنوية المقدّرة
              </span>
            </div>
            <div className="text-3xl font-display font-bold text-gradient-brand">
              ≈ {formatCurrency(result.yearlyEstimate.mid)}
            </div>
            <div className="text-xs text-muted-foreground">
              النطاق: {formatCurrency(result.yearlyEstimate.low)} —{" "}
              {formatCurrency(result.yearlyEstimate.high)}
            </div>
            <Separator className="my-1" />
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">شهرياً × 12</span>
              <span className="font-semibold">
                {formatCurrency(result.monthlyEstimate.mid)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* RPM badge row */}
      <div className="flex flex-wrap items-center gap-2">
        <Badge
          variant="outline"
          className="bg-card py-1.5 px-3 text-sm border-border/60"
        >
          <DollarSign className="size-3.5 text-primary ml-1" />
          RPM: ${result.rpm.toFixed(2)} لكل 1000 مشاهدة
        </Badge>
        <Badge
          variant="outline"
          className="bg-card py-1.5 px-3 text-sm border-border/60"
        >
          <Eye className="size-3.5 text-primary ml-1" />
          {formatPlainNumber(result.viewsPerMonth)} مشاهدة / شهر
        </Badge>
        <Badge
          variant="outline"
          className="bg-card py-1.5 px-3 text-sm border-border/60"
        >
          <Users className="size-3.5 text-primary ml-1" />
          {formatPlainNumber(result.followers)} متابع
        </Badge>
      </div>

      {/* Revenue breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <DollarSign className="size-4 text-primary" />
            تفصيل مصادر الدخل
          </CardTitle>
          <CardDescription>
            توزيع الأرباح الشهرية حسب المصدر — رتب من الأعلى
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {result.breakdown.map((item) => {
            const pct =
              breakdownTotal > 0
                ? Math.round((item.amount / breakdownTotal) * 100)
                : 0
            return (
              <div key={item.source} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{item.source}</span>
                  <span className="font-semibold tabular-nums">
                    {formatCurrency(item.amount)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Progress
                    value={pct}
                    className="h-2.5 [&>div]:bg-gradient-brand"
                  />
                  <span className="text-xs text-muted-foreground tabular-nums w-10 text-left">
                    {pct}%
                  </span>
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Tips section */}
      <Card className="bg-gradient-brand-soft border-border/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Lightbulb className="size-4 text-primary" />
            نصائح لزيادة أرباحك
          </CardTitle>
          <CardDescription>
            نصائح مخصصة لمنصة {platformName(result.platform)} ومجال {result.nicheLabel}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {result.tips.map((tip, i) => (
            <div
              key={i}
              className="flex items-start gap-3 rounded-xl bg-card/60 border border-border/40 p-3"
            >
              <div className="bg-gradient-brand flex size-6 shrink-0 items-center justify-center rounded-md text-white text-xs font-bold">
                {i + 1}
              </div>
              <p className="text-sm leading-relaxed pt-0.5">{tip}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

function platformName(p: Platform): string {
  switch (p) {
    case "youtube":
      return "يوتيوب"
    case "tiktok":
      return "تيك توك"
    case "instagram":
      return "انستجرام"
    case "facebook":
      return "فيسبوك"
  }
}

export default EarningsCalculator
