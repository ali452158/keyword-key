"use client"

import * as React from "react"
import {
  Type,
  PenLine,
  Gauge,
  Check,
  Copy,
  Lightbulb,
  Loader2,
  TrendingUp,
  Sparkles,
  Replace,
  AlertCircle,
  Wand2,
} from "lucide-react"

import type { Platform } from "@/lib/types"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { PlatformBadge } from "@/components/platform-icon"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"

interface TitleGrade {
  criteria: string
  score: number
  note: string
}

interface TitleAnalysis {
  score: number
  grades: TitleGrade[]
  suggestions: string[]
  improvedTitles: string[]
}

const PLATFORMS: Platform[] = ["youtube", "tiktok", "instagram", "facebook"]

const PLATFORM_OPTIMAL_LENGTH: Record<Platform, { min: number; max: number }> = {
  tiktok: { min: 20, max: 60 },
  youtube: { min: 40, max: 70 },
  instagram: { min: 25, max: 65 },
  facebook: { min: 30, max: 80 },
}

function scoreColor(score: number): string {
  if (score >= 70) return "#10b981"
  if (score >= 40) return "#f59e0b"
  return "#ef4444"
}

function scoreLabel(score: number): string {
  if (score >= 85) return "ممتاز"
  if (score >= 70) return "جيد جداً"
  if (score >= 55) return "جيد"
  if (score >= 40) return "مقبول"
  return "يحتاج تحسين"
}

function progressColorClass(score: number): string {
  if (score >= 70) return "[&>div]:bg-emerald-500"
  if (score >= 40) return "[&>div]:bg-amber-500"
  return "[&>div]:bg-rose-500"
}

function ScoreGauge({ score }: { score: number }) {
  const radius = 80
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  const color = scoreColor(score)
  const label = scoreLabel(score)

  return (
    <div className="relative w-48 h-48 shrink-0">
      <svg
        className="w-full h-full -rotate-90"
        viewBox="0 0 200 200"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="gauge-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.7" />
            <stop offset="100%" stopColor={color} stopOpacity="1" />
          </linearGradient>
        </defs>
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="14"
          className="text-secondary"
        />
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke="url(#gauge-gradient)"
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="text-4xl font-extrabold font-display leading-none"
          style={{ color }}
        >
          {score}
        </span>
        <span className="text-xs text-muted-foreground mt-1">/ 100</span>
        <span
          className="text-xs font-bold mt-2 px-2 py-0.5 rounded-full"
          style={{ color, backgroundColor: `${color}1a` }}
        >
          {label}
        </span>
      </div>
    </div>
  )
}

interface CriterionRowProps {
  grade: TitleGrade
}

function CriterionRow({ grade }: CriterionRowProps) {
  const color = scoreColor(grade.score)
  return (
    <div className="space-y-1.5">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm">{grade.criteria}</span>
            <span
              className="text-xs font-bold px-1.5 py-0.5 rounded-md shrink-0"
              style={{ color, backgroundColor: `${color}1a` }}
            >
              {grade.score}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            {grade.note}
          </p>
        </div>
      </div>
      <Progress
        value={grade.score}
        className={cn("h-2", progressColorClass(grade.score))}
      />
    </div>
  )
}

interface ImprovedTitleCardProps {
  title: string
  index: number
  onCopy: (title: string) => void
  onUse: (title: string) => void
  copied: boolean
}

function ImprovedTitleCard({
  title,
  index,
  onCopy,
  onUse,
  copied,
}: ImprovedTitleCardProps) {
  return (
    <Card className="bg-card border-2 border-primary/20 hover:border-primary/40 hover:shadow-brand transition-all duration-300 py-4">
      <CardContent className="px-4 space-y-3">
        <div className="flex items-start gap-2">
          <span className="shrink-0 mt-0.5 w-6 h-6 rounded-md bg-gradient-brand text-white text-xs font-bold flex items-center justify-center">
            {index + 1}
          </span>
          <p className="font-bold text-sm leading-relaxed flex-1">{title}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => onCopy(title)}
            className="h-8 gap-1.5 text-xs"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-emerald-600">تم النسخ</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                نسخ
              </>
            )}
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => onUse(title)}
            className="h-8 gap-1.5 text-xs bg-gradient-brand text-white hover:opacity-90"
          >
            <Replace className="w-3.5 h-3.5" />
            استبدال
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

interface LoadingStateProps {
  title: string
}

function LoadingState({ title }: LoadingStateProps) {
  return (
    <Card className="bg-gradient-brand-soft border-primary/20 overflow-hidden">
      <CardContent className="px-6 py-8 space-y-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-brand flex items-center justify-center text-white shadow-brand">
              <Type className="w-5 h-5" />
            </div>
            <div className="absolute inset-0 rounded-xl bg-gradient-brand animate-pulse-glow" />
          </div>
          <div className="space-y-1">
            <p className="font-bold text-sm">
              الذكاء الاصطناعي يحلل العنوان...
            </p>
            <p className="text-xs text-muted-foreground line-clamp-1 max-w-md">
              {title}
            </p>
          </div>
        </div>
        <div className="h-1 w-full overflow-hidden rounded-full bg-secondary">
          <div className="h-full w-1/3 bg-gradient-brand animate-shimmer rounded-full" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2 p-3 rounded-lg bg-card/60">
              <div className="flex items-center justify-between">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-5 w-10 rounded-md" />
              </div>
              <Skeleton className="h-2 w-full rounded-full" />
              <Skeleton className="h-2 w-3/4" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

interface EmptyStateProps {
  hasTitle: boolean
}

function EmptyState({ hasTitle }: EmptyStateProps) {
  return (
    <Card className="border-dashed border-2 bg-gradient-brand-soft/40">
      <CardContent className="px-6 py-12 flex flex-col items-center text-center gap-3">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-gradient-brand flex items-center justify-center text-white shadow-brand-lg">
            <Type className="w-8 h-8" />
          </div>
          <div className="absolute -inset-2 rounded-2xl bg-gradient-brand/20 blur-xl -z-10" />
        </div>
        <p className="font-bold text-base">
          {hasTitle
            ? "اضغط على «حلّل العنوان» لبدء التحليل"
            : "أدخل عنوان الفيديو لتحليله وتحسينه"}
        </p>
        <p className="text-xs text-muted-foreground max-w-md">
          يحلل الذكاء الاصطناعي العنوان بناءً على الطول، الكلمات القوية، الفضول،
          الوضوح، الكلمة المفتاحية، والتطابق مع المنصة.
        </p>
      </CardContent>
    </Card>
  )
}

interface AnalysisResultProps {
  analysis: TitleAnalysis
  onCopy: (title: string) => void
  onUse: (title: string) => void
  copiedTitle: string | null
}

function AnalysisResult({
  analysis,
  onCopy,
  onUse,
  copiedTitle,
}: AnalysisResultProps) {
  return (
    <div className="space-y-4">
      {/* Score hero card */}
      <Card className="overflow-hidden border-primary/20">
        <CardContent className="px-6 py-6">
          <div className="flex flex-col items-center gap-6 md:flex-row md:items-center md:gap-8">
            <ScoreGauge score={analysis.score} />
            <div className="flex-1 space-y-4 text-center md:text-right w-full">
              <div>
                <div className="flex items-center justify-center md:justify-start gap-2">
                  <Gauge className="w-5 h-5 text-primary" />
                  <h3 className="font-display text-lg font-bold">
                    النتيجة الإجمالية
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  تقييم شامل لجودة العنوان بناءً على 6 معايير حاسمة لنسبة النقر
                  إلى الظهور (CTR).
                </p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-lg bg-emerald-500/10 p-2 text-center">
                  <p className="text-xs text-muted-foreground">ممتاز</p>
                  <p className="text-xs font-bold text-emerald-600">70-100</p>
                </div>
                <div className="rounded-lg bg-amber-500/10 p-2 text-center">
                  <p className="text-xs text-muted-foreground">جيد</p>
                  <p className="text-xs font-bold text-amber-600">40-70</p>
                </div>
                <div className="rounded-lg bg-rose-500/10 p-2 text-center">
                  <p className="text-xs text-muted-foreground">ضعيف</p>
                  <p className="text-xs font-bold text-rose-600">0-40</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Criteria breakdown */}
      <Card>
        <CardContent className="px-6 space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h2 className="font-display text-xl font-bold">
              تحليل المعايير
            </h2>
          </div>
          <Separator />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            {analysis.grades.map((g, i) => (
              <CriterionRow key={i} grade={g} />
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Suggestions */}
        <Card>
          <CardContent className="px-6 space-y-4">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-amber-500" />
              <h2 className="font-display text-xl font-bold">نصائح التحسين</h2>
            </div>
            <Separator />
            <ul className="space-y-2.5 max-h-72 overflow-y-auto scroll-area-brand pl-1">
              {analysis.suggestions.map((s, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-sm leading-relaxed"
                >
                  <span className="shrink-0 mt-0.5 w-5 h-5 rounded-md bg-amber-500/15 text-amber-600 flex items-center justify-center">
                    <Sparkles className="w-3 h-3" />
                  </span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Improved titles */}
        <Card className="border-primary/20">
          <CardContent className="px-6 space-y-4">
            <div className="flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-primary" />
              <h2 className="font-display text-xl font-bold">
                عناوين محسّنة مقترحة
              </h2>
            </div>
            <Separator />
            <div className="space-y-3 max-h-96 overflow-y-auto scroll-area-brand pl-1">
              {analysis.improvedTitles.map((t, i) => (
                <ImprovedTitleCard
                  key={i}
                  title={t}
                  index={i}
                  onCopy={onCopy}
                  onUse={onUse}
                  copied={copiedTitle === t}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export function TitleOptimizer() {
  const { toast } = useToast()
  const [title, setTitle] = React.useState("")
  const [platform, setPlatform] = React.useState<Platform>("youtube")
  const [keyword, setKeyword] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [analysis, setAnalysis] = React.useState<TitleAnalysis | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [copiedTitle, setCopiedTitle] = React.useState<string | null>(null)

  const titleLength = title.length
  const optimal = PLATFORM_OPTIMAL_LENGTH[platform]
  const lengthStatus: "short" | "ideal" | "long" =
    titleLength < optimal.min
      ? "short"
      : titleLength > optimal.max
        ? "long"
        : "ideal"

  const analyze = React.useCallback(async () => {
    if (!title.trim()) {
      toast({
        variant: "destructive",
        title: "العنوان مطلوب",
        description: "أدخل عنوان الفيديو لتحليله.",
      })
      return
    }
    setLoading(true)
    setError(null)
    setAnalysis(null)
    try {
      const res = await fetch("/api/tools/title-analyzer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          platform,
          keyword: keyword.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || "فشل تحليل العنوان")
      }
      setAnalysis(data.data as TitleAnalysis)
      toast({
        title: "اكتمل التحليل",
        description: `النتيجة: ${data.data.score}/100 — ${scoreLabel(data.data.score)}`,
      })
    } catch (e) {
      const msg = e instanceof Error ? e.message : "خطأ غير معروف"
      setError(msg)
      toast({
        variant: "destructive",
        title: "تعذّر التحليل",
        description: msg,
      })
    } finally {
      setLoading(false)
    }
  }, [title, platform, keyword, toast])

  const handleCopy = React.useCallback(
    async (t: string) => {
      try {
        await navigator.clipboard.writeText(t)
        setCopiedTitle(t)
        toast({ title: "تم النسخ", description: "تم نسخ العنوان إلى الحافظة." })
        setTimeout(() => setCopiedTitle((cur) => (cur === t ? null : cur)), 1800)
      } catch {
        toast({
          variant: "destructive",
          title: "فشل النسخ",
          description: "تعذّر نسخ العنوان، حاول مرة أخرى.",
        })
      }
    },
    [toast]
  )

  const handleUse = React.useCallback(
    (t: string) => {
      setTitle(t)
      setAnalysis(null)
      toast({
        title: "تم استبدال العنوان",
        description: "اضغط «حلّل العنوان» لتقييم النسخة الجديدة.",
      })
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" })
      }
    },
    [toast]
  )

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    void analyze()
  }

  return (
    <section className="space-y-5">
      {/* Header */}
      <header className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-gradient-brand flex items-center justify-center text-white shadow-brand shrink-0">
          <PenLine className="w-6 h-6" />
        </div>
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold leading-tight">
            محلل ومحسّن العناوين
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            قِيم عنوان الفيديو واحصل على نسخ محسّنة بالذكاء الاصطناعي
          </p>
        </div>
      </header>

      {/* Input card */}
      <Card className="bg-gradient-brand-soft border-primary/20">
        <CardContent className="px-6 py-6 space-y-5">
          <form onSubmit={onSubmit} className="space-y-5">
            {/* Title input */}
            <div className="space-y-2">
              <label
                htmlFor="title-input"
                className="flex items-center justify-between text-sm font-semibold"
              >
                <span className="flex items-center gap-1.5">
                  <Type className="w-4 h-4 text-primary" />
                  عنوان الفيديو
                </span>
                <span
                  className={cn(
                    "text-xs font-mono px-2 py-0.5 rounded-md",
                    lengthStatus === "ideal"
                      ? "bg-emerald-500/15 text-emerald-600"
                      : "bg-secondary text-muted-foreground"
                  )}
                  aria-live="polite"
                >
                  {titleLength} حرف
                </span>
              </label>
              <Input
                id="title-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثال: 5 أسرار مذهلة لتصوير فيديوهات احترافية بآيفونك"
                className="h-12 text-base font-medium"
                maxLength={150}
                disabled={loading}
                aria-describedby="title-length-hint"
              />
              <p
                id="title-length-hint"
                className="text-xs text-muted-foreground"
              >
                الطول المثالي لـ{" "}
                {platform === "youtube"
                  ? "يوتيوب"
                  : platform === "tiktok"
                    ? "تيك توك"
                    : platform === "instagram"
                      ? "انستجرام"
                      : "فيسبوك"}
                :{" "}
                <span
                  className={cn(
                    "font-semibold",
                    lengthStatus === "ideal"
                      ? "text-emerald-600"
                      : lengthStatus === "short"
                        ? "text-amber-600"
                        : "text-rose-600"
                  )}
                >
                  {optimal.min}-{optimal.max} حرف
                </span>
              </p>
            </div>

            {/* Platform selector */}
            <div className="space-y-2">
              <span className="text-sm font-semibold">المنصة</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {PLATFORMS.map((p) => {
                  const selected = platform === p
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPlatform(p)}
                      disabled={loading}
                      aria-pressed={selected}
                      className={cn(
                        "flex items-center justify-center gap-2 rounded-xl border-2 px-3 py-2.5 transition-all",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                        selected
                          ? "border-transparent bg-gradient-brand text-white shadow-brand"
                          : "border-border bg-card hover:bg-accent hover:border-primary/30"
                      )}
                    >
                      <PlatformBadge
                        platform={p}
                        size="sm"
                        className={selected ? "[&_div]:ring-2 [&_div]:ring-white/40" : ""}
                      />
                      <span className="text-xs font-semibold">
                        {p === "youtube"
                          ? "يوتيوب"
                          : p === "tiktok"
                            ? "تيك توك"
                            : p === "instagram"
                              ? "انستجرام"
                              : "فيسبوك"}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Optional keyword */}
            <div className="space-y-2">
              <label
                htmlFor="keyword-input"
                className="text-sm font-semibold flex items-center gap-1.5"
              >
                <Sparkles className="w-4 h-4 text-primary" />
                الكلمة المفتاحية المستهدفة (اختياري)
              </label>
              <Input
                id="keyword-input"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="مثال: تصوير الموبايل"
                className="h-10"
                disabled={loading}
                maxLength={60}
              />
            </div>

            {/* Submit button */}
            <Button
              type="submit"
              disabled={loading || !title.trim()}
              className="w-full h-12 bg-gradient-brand text-white shadow-brand hover:opacity-90 text-base font-bold gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  جاري التحليل...
                </>
              ) : (
                <>
                  <Gauge className="w-5 h-5" />
                  حلّل العنوان
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Loading state */}
      {loading && <LoadingState title={title} />}

      {/* Error state */}
      {!loading && error && (
        <Card className="border-rose-500/30 bg-rose-500/5">
          <CardContent className="px-6 py-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <div className="flex-1 space-y-1">
              <p className="font-bold text-sm text-rose-600">
                تعذّر إكمال التحليل
              </p>
              <p className="text-xs text-muted-foreground">{error}</p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => void analyze()}
              className="shrink-0"
            >
              إعادة المحاولة
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {!loading && !error && analysis && (
        <AnalysisResult
          analysis={analysis}
          onCopy={handleCopy}
          onUse={handleUse}
          copiedTitle={copiedTitle}
        />
      )}

      {/* Empty state */}
      {!loading && !error && !analysis && (
        <EmptyState hasTitle={title.trim().length > 0} />
      )}

      {/* Footer hint */}
      <p className="text-xs text-muted-foreground text-center pt-2">
        <Badge variant="outline" className="gap-1">
          <Sparkles className="w-3 h-3 text-primary" />
          مدعوم بالذكاء الاصطناعي
        </Badge>
      </p>
    </section>
  )
}

export default TitleOptimizer
