"use client"

import * as React from "react"
import {
  Users,
  Search,
  User,
  Hash,
  Sparkles,
  Clock,
  Calendar,
  TrendingUp,
  Activity,
  Target,
  ArrowLeft,
  Lightbulb,
  BarChart3,
  Loader2,
  AlertCircle,
  Zap,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { PlatformBadge } from "@/components/platform-icon"
import { PLATFORM_LIST } from "@/lib/platforms"
import { formatNumber } from "@/lib/format"
import { useToast } from "@/hooks/use-toast"
import type { Platform, CompetitorAnalysis } from "@/lib/types"
import { cn } from "@/lib/utils"

interface CompetitorAnalysisProps {
  onNavigate: (tab: string, keyword?: string) => void
}

const LOADING_MESSAGES = [
  "جاري تحليل حساب المنافس بالذكاء الاصطناعي...",
  "استخراج الكلمات المفتاحية من المحتوى...",
  "تحليل الهاشتاقات والمواضيع الرئيسية...",
  "حساب معدل التفاعل والجمهور...",
  "تحديد أنماط النشر وأفضل الأوقات...",
]

export function CompetitorAnalysis({ onNavigate }: CompetitorAnalysisProps) {
  const { toast } = useToast()
  const [account, setAccount] = React.useState("")
  const [platform, setPlatform] = React.useState<Platform>("tiktok")
  const [loading, setLoading] = React.useState(false)
  const [result, setResult] = React.useState<CompetitorAnalysis | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [messageIndex, setMessageIndex] = React.useState(0)

  // Cycle through loading messages while waiting for AI
  React.useEffect(() => {
    if (!loading) {
      setMessageIndex(0)
      return
    }
    const id = setInterval(() => {
      setMessageIndex((i) => (i + 1) % LOADING_MESSAGES.length)
    }, 3000)
    return () => clearInterval(id)
  }, [loading])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = account.trim()
    if (!trimmed) {
      toast({
        title: "حقل مطلوب",
        description: "الرجاء إدخال حساب المنافس للبدء.",
        variant: "destructive",
      })
      return
    }
    if (!platform) {
      toast({
        title: "اختر منصة",
        description: "الرجاء اختيار المنصة الاجتماعية المناسبة.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const res = await fetch("/api/competitor/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ account: trimmed, platform }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(
          json?.error || json?.message || "فشل تحليل حساب المنافس"
        )
      }
      setResult(json.data as CompetitorAnalysis)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "حدث خطأ غير متوقع أثناء التحليل."
      setError(message)
      toast({
        title: "فشل التحليل",
        description: message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const topKeyword = result?.keywords?.[0]?.keyword

  return (
    <div className="space-y-8">
      {/* Section Header */}
      <header className="space-y-1.5">
        <h2 className="font-display text-xl font-bold flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          تحليل المنافسين
        </h2>
        <p className="text-sm text-muted-foreground">
          أداة ذكية مدعومة بالذكاء الاصطناعي تحلل حساب المنافس وتستخرج الكلمات
          المفتاحية والهاشتاقات وأنماط المحتوى لاستراتيجية أقوى.
        </p>
      </header>

      {/* Input Form Card */}
      <Card className="relative overflow-hidden border-border/60 shadow-sm">
        <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-brand" />
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Account input with User icon prefix */}
            <div className="space-y-2">
              <label
                htmlFor="competitor-account"
                className="text-sm font-semibold flex items-center gap-1.5"
              >
                <User className="w-3.5 h-3.5 text-primary" />
                حساب المنافس
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-muted-foreground">
                  <AtSign />
                </span>
                <Input
                  id="competitor-account"
                  value={account}
                  onChange={(e) => setAccount(e.target.value)}
                  placeholder="username"
                  autoComplete="off"
                  disabled={loading}
                  className="pr-10 h-11 rounded-xl"
                  aria-describedby="competitor-account-help"
                />
              </div>
              <p
                id="competitor-account-help"
                className="text-[11px] text-muted-foreground"
              >
                أدخل اسم المستخدم بدون @ — مثال: competitors_handle
              </p>
            </div>

            {/* Platform selector */}
            <div className="space-y-2">
              <label className="text-sm font-semibold flex items-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5 text-primary" />
                اختر المنصة
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {PLATFORM_LIST.map((p) => {
                  const selected = platform === p.id
                  return (
                    <button
                      type="button"
                      key={p.id}
                      onClick={() => setPlatform(p.id)}
                      disabled={loading}
                      aria-pressed={selected}
                      className={cn(
                        "flex items-center justify-center gap-2 px-3 py-3 rounded-xl border-2 transition-all duration-200 text-sm font-semibold",
                        selected
                          ? "bg-gradient-brand text-white border-transparent shadow-brand"
                          : "bg-card text-foreground border-border hover:border-primary/40 hover:bg-accent/50"
                      )}
                    >
                      <PlatformBadge
                        platform={p.id}
                        size="sm"
                        className={cn(selected && "[&_div]:ring-2 [&_div]:ring-white/60")}
                      />
                      <span>{p.arabicName}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Submit */}
            <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
              <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-primary" />
                يتم التحليل بواسطة الذكاء الاصطناعي وقد يستغرق 10-20 ثانية.
              </p>
              <Button
                type="submit"
                disabled={loading}
                size="lg"
                className="bg-gradient-brand text-white hover:opacity-95 shadow-brand rounded-xl h-11 px-6 font-bold w-full sm:w-auto"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    جاري التحليل...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    تحليل الحساب
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading && <LoadingState messageIndex={messageIndex} />}

      {/* Error State */}
      {!loading && error && (
        <Card className="border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="shrink-0 w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-900/40 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-rose-700 dark:text-rose-300 mb-1">
                  تعذّر إكمال التحليل
                </h3>
                <p className="text-sm text-rose-600/90 dark:text-rose-400/90 leading-relaxed">
                  {error}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 rounded-lg border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                  onClick={() => setError(null)}
                >
                  المحاولة مرة أخرى
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State (before first search) */}
      {!loading && !error && !result && <EmptyState />}

      {/* Results */}
      {!loading && !error && result && (
        <Results data={result} onNavigate={onNavigate} topKeyword={topKeyword} />
      )}
    </div>
  )
}

/* ----------------------------- Sub-components ----------------------------- */

function AtSign() {
  return (
    <span className="text-base font-semibold select-none" aria-hidden="true">
      @
    </span>
  )
}

function EmptyState() {
  return (
    <Card className="border-dashed border-2 bg-card/50">
      <CardContent className="pt-10 pb-12">
        <div className="flex flex-col items-center text-center max-w-md mx-auto">
          <div className="relative mb-5">
            <div className="absolute inset-0 bg-gradient-brand rounded-3xl blur-2xl opacity-30 animate-pulse-glow" />
            <div className="relative w-20 h-20 rounded-3xl bg-gradient-brand flex items-center justify-center shadow-brand">
              <Users className="w-10 h-10 text-white" />
            </div>
          </div>
          <h3 className="font-display text-lg font-bold mb-1.5">
            أدخل حساب منافس لبدء التحليل
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            اكتب اسم المستخدم في الأعلى، اختر المنصة المناسبة، واضغط
            &quot;تحليل الحساب&quot; لاكتشاف استراتيجية محتواه.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 mt-5">
            <Badge variant="outline" className="bg-accent/40 text-[11px] gap-1">
              <Hash className="w-3 h-3" /> كلمات مفتاحية
            </Badge>
            <Badge variant="outline" className="bg-accent/40 text-[11px] gap-1">
              <TrendingUp className="w-3 h-3" /> معدل التفاعل
            </Badge>
            <Badge variant="outline" className="bg-accent/40 text-[11px] gap-1">
              <Clock className="w-3 h-3" /> أنماط النشر
            </Badge>
            <Badge variant="outline" className="bg-accent/40 text-[11px] gap-1">
              <Sparkles className="w-3 h-3" /> ملخص ذكي
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function LoadingState({ messageIndex }: { messageIndex: number }) {
  return (
    <div className="space-y-5">
      {/* AI banner */}
      <Card className="relative overflow-hidden bg-gradient-brand text-white border-transparent shadow-brand-lg">
        <div className="absolute inset-0 bg-grid-pattern opacity-15" />
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-3xl animate-pulse-glow" />
        <CardContent className="relative z-10 pt-6 pb-6">
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
                <Loader2 className="w-7 h-7 animate-spin" />
              </div>
              <Sparkles className="w-4 h-4 absolute -top-1 -right-1 text-white/90" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-display text-base font-bold mb-1">
                جاري التحليل الذكي
              </h3>
              <p
                key={messageIndex}
                className="text-sm text-white/85 transition-opacity duration-300"
              >
                {LOADING_MESSAGES[messageIndex]}
              </p>
              <div className="mt-2 h-1 w-full bg-white/20 rounded-full overflow-hidden">
                <div className="h-full w-1/3 bg-white/80 rounded-full animate-[shimmer_1.5s_ease-in-out_infinite]" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Shimmer skeleton cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <div className="h-1.5 bg-gradient-brand opacity-50" />
            <CardContent className="pt-5 space-y-3">
              <div className="flex items-center gap-2">
                <Skeleton className="w-9 h-9 rounded-xl" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3 w-3/4" />
                  <Skeleton className="h-2.5 w-1/2" />
                </div>
              </div>
              <Skeleton className="h-2 w-full rounded-full" />
              <Skeleton className="h-2 w-2/3 rounded-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

interface ResultsProps {
  data: CompetitorAnalysis
  onNavigate: (tab: string, keyword?: string) => void
  topKeyword?: string
}

function Results({ data, onNavigate, topKeyword }: ResultsProps) {
  const sortedKeywords = React.useMemo(
    () =>
      [...(data.keywords || [])].sort((a, b) => b.relevance - a.relevance),
    [data.keywords]
  )

  return (
    <div className="space-y-6">
      {/* Profile hero card */}
      <Card className="relative overflow-hidden bg-gradient-brand text-white border-transparent shadow-brand-lg">
        <div className="absolute inset-0 bg-grid-pattern opacity-15" />
        <div className="absolute -top-20 -left-16 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse-glow" />
        <div className="absolute -bottom-24 -right-10 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse-glow" />
        <CardContent className="relative z-10 pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            {/* Avatar block */}
            <div className="flex items-center gap-4 sm:flex-1 min-w-0">
              <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center shrink-0 border border-white/20">
                <PlatformBadge platform={data.platform} size="md" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[11px] uppercase tracking-wide text-white/70 font-semibold">
                    حساب منافس
                  </span>
                  <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm text-[10px] h-5">
                    <Sparkles className="w-2.5 h-2.5 ml-1" />
                    تحليل AI
                  </Badge>
                </div>
                <h3 className="font-display text-2xl font-extrabold truncate">
                  @{data.account}
                </h3>
                <p className="text-sm text-white/80 mt-0.5 capitalize">
                  {data.platform}
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 sm:gap-5 sm:border-r sm:border-white/20 sm:pr-6">
              <div className="text-center sm:text-right">
                <div className="flex items-center justify-center sm:justify-end gap-1 text-white/70 mb-1">
                  <Users className="w-3 h-3" />
                  <span className="text-[11px] font-semibold">المتابعون</span>
                </div>
                <p className="text-2xl sm:text-3xl font-extrabold leading-none">
                  {formatNumber(data.followers)}
                </p>
              </div>
              <div className="text-center sm:text-right">
                <div className="flex items-center justify-center sm:justify-end gap-1 text-white/70 mb-1">
                  <Activity className="w-3 h-3" />
                  <span className="text-[11px] font-semibold">معدل التفاعل</span>
                </div>
                <p className="text-2xl sm:text-3xl font-extrabold leading-none">
                  {data.engagementRate}%
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary card */}
      <Card className="border-primary/20 bg-gradient-brand-soft/40 dark:bg-accent/20">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="shrink-0 w-9 h-9 rounded-xl bg-gradient-brand flex items-center justify-center text-white shadow-brand">
              <Lightbulb className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-sm mb-1.5 flex items-center gap-1.5">
                الملخص التحليلي
                <Badge
                  variant="outline"
                  className="text-[9px] h-4 px-1.5 border-primary/30 text-primary"
                >
                  AI
                </Badge>
              </h3>
              <p className="text-sm leading-relaxed text-foreground/90">
                {data.summary}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Keywords grid */}
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-display text-base font-bold flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            الكلمات المفتاحية المستخرجة
            <Badge variant="secondary" className="text-[10px] h-5">
              {sortedKeywords.length}
            </Badge>
          </h3>
          <p className="text-[11px] text-muted-foreground hidden sm:block">
            اضغط على الكلمة لتحليلها في بحث الكلمات
          </p>
        </div>

        <Card className="p-0">
          <ScrollArea className="max-h-96 overflow-y-auto scroll-area-brand">
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {sortedKeywords.map((kw, idx) => (
                <KeywordChip
                  key={`${kw.keyword}-${idx}`}
                  keyword={kw.keyword}
                  frequency={kw.frequency}
                  relevance={kw.relevance}
                  onClick={() => onNavigate("research", kw.keyword)}
                />
              ))}
            </div>
          </ScrollArea>
        </Card>
      </section>

      {/* Hashtags & Themes (two columns) */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top hashtags */}
        <Card className="border-border/60">
          <CardContent className="pt-6">
            <h3 className="font-display text-sm font-bold flex items-center gap-2 mb-4">
              <Hash className="w-4 h-4 text-primary" />
              الهاشتاقات الأكثر استخداماً
              <Badge variant="secondary" className="text-[10px] h-5">
                {data.topHashtags?.length || 0}
              </Badge>
            </h3>
            {data.topHashtags?.length ? (
              <div className="flex flex-wrap gap-2">
                {data.topHashtags.map((tag, i) => (
                  <Badge
                    key={`${tag}-${i}`}
                    variant="outline"
                    className="bg-gradient-brand-soft/50 dark:bg-accent/30 border-primary/20 text-foreground hover:border-primary/50 transition-colors cursor-default px-3 py-1.5 text-xs font-medium"
                  >
                    <Hash className="w-3 h-3 ml-0.5 text-primary" />
                    {tag.replace(/^#/, "")}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">لا توجد بيانات</p>
            )}
          </CardContent>
        </Card>

        {/* Content themes */}
        <Card className="border-border/60">
          <CardContent className="pt-6">
            <h3 className="font-display text-sm font-bold flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 text-primary" />
              المواضيع الرئيسية للمحتوى
              <Badge variant="secondary" className="text-[10px] h-5">
                {data.contentThemes?.length || 0}
              </Badge>
            </h3>
            {data.contentThemes?.length ? (
              <div className="flex flex-wrap gap-2">
                {data.contentThemes.map((theme, i) => (
                  <Badge
                    key={`${theme}-${i}`}
                    className="bg-gradient-brand text-white border-transparent px-3 py-1.5 text-xs font-medium shadow-sm"
                  >
                    {theme}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">لا توجد بيانات</p>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Posting info (two cards) */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Posting frequency */}
        <Card className="relative overflow-hidden border-border/60 hover:shadow-brand transition-shadow">
          <div className="absolute top-0 right-0 left-0 h-0.5 bg-gradient-brand opacity-60" />
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center text-primary">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">تكرار النشر</p>
                <h4 className="font-bold text-sm">جدول النشر</h4>
              </div>
            </div>
            <p className="text-lg font-extrabold text-gradient-brand leading-snug">
              {data.postingFrequency || "—"}
            </p>
          </CardContent>
        </Card>

        {/* Best posting times */}
        <Card className="relative overflow-hidden border-border/60 hover:shadow-brand transition-shadow">
          <div className="absolute top-0 right-0 left-0 h-0.5 bg-gradient-brand opacity-60" />
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center text-primary">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">
                  أفضل أوقات النشر
                </p>
                <h4 className="font-bold text-sm">التوقيت الأمثل</h4>
              </div>
            </div>
            {data.bestPostingTimes?.length ? (
              <div className="flex flex-wrap gap-2">
                {data.bestPostingTimes.map((t, i) => (
                  <span
                    key={`${t}-${i}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent/60 text-foreground text-xs font-semibold border border-border/50"
                  >
                    <Clock className="w-3 h-3 text-primary" />
                    {t}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-lg font-extrabold text-gradient-brand">—</p>
            )}
          </CardContent>
        </Card>
      </section>

      {/* CTA */}
      <Card className="relative overflow-hidden bg-gradient-brand text-white border-transparent shadow-brand">
        <div className="absolute inset-0 bg-grid-pattern opacity-15" />
        <CardContent className="relative z-10 pt-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center shrink-0">
                <Zap className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="font-display font-bold text-base mb-0.5">
                  حوّل التحليل إلى أفكار محتوى
                </h3>
                <p className="text-sm text-white/80">
                  {topKeyword
                    ? `ابدأ بتوليد أفكار مبنية على الكلمة: ${topKeyword}`
                    : "ولّد أفكاراً إبداعية بناءً على أعلى الكلمات تأثيراً"}
                </p>
              </div>
            </div>
            <Button
              size="lg"
              className="bg-white text-primary hover:bg-white/90 font-bold rounded-xl shadow-lg w-full sm:w-auto"
              onClick={() => onNavigate("generator", topKeyword)}
            >
              <Lightbulb className="w-4 h-4" />
              ولّد أفكار محتوى
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

interface KeywordChipProps {
  keyword: string
  frequency: number
  relevance: number
  onClick?: () => void
}

function KeywordChip({
  keyword,
  frequency,
  relevance,
  onClick,
}: KeywordChipProps) {
  const relevanceLabel =
    relevance >= 80
      ? "عالية"
      : relevance >= 60
        ? "متوسطة"
        : "منخفضة"

  return (
    <button
      type="button"
      onClick={onClick}
      className="group text-right p-3.5 rounded-xl border border-border/60 bg-card hover:border-primary/40 hover:bg-accent/40 hover:shadow-brand hover:-translate-y-0.5 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <Target className="w-3.5 h-3.5 text-primary shrink-0" />
          <span className="font-bold text-sm truncate text-foreground">
            {keyword}
          </span>
        </div>
        <ArrowLeft className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
      </div>

      <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1.5">
        <span className="flex items-center gap-1">
          <BarChart3 className="w-3 h-3" />
          التكرار:{" "}
          <span className="font-bold text-foreground">{frequency}</span>
        </span>
        <span className="font-semibold text-primary">
          {relevance}% · {relevanceLabel}
        </span>
      </div>

      <Progress
        value={relevance}
        className="h-2 [&>div]:bg-gradient-brand"
      />
    </button>
  )
}
