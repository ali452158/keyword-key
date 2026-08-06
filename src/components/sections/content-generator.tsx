"use client"

import * as React from "react"
import {
  Lightbulb,
  Sparkles,
  Wand2,
  Copy,
  Check,
  Clock,
  Hash,
  Target,
  TrendingUp,
  ArrowLeft,
  ArrowUpRight,
  Flame,
  Link2,
  Quote,
  Video,
  Film,
  Loader2,
  AlertCircle,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { PlatformBadge } from "@/components/platform-icon"
import { PLATFORMS } from "@/lib/platforms"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { formatGrowth } from "@/lib/format"
import type { Platform, ContentIdea, KeywordTrend } from "@/lib/types"

interface ContentGeneratorProps {
  initialKeyword?: string
  onNavigate?: (tab: string, keyword?: string) => void
}

const COUNT_OPTIONS = [3, 6, 9] as const

const LOADING_MESSAGES = [
  "الذكاء الاصطناعي يبتكر أفكاراً إبداعية لك...",
  "يحلل الكلمة المفتاحية ويدرس الترندات...",
  "يكتب العناوين الجذابة والجُمل الافتتاحية...",
  "يقترح الهاشتاقات المثالية لمحتواك...",
]

export function ContentGenerator({
  initialKeyword,
  onNavigate,
}: ContentGeneratorProps) {
  const { toast } = useToast()

  const [keyword, setKeyword] = React.useState(initialKeyword ?? "")
  const [platform, setPlatform] = React.useState<Platform>("tiktok")
  const [count, setCount] = React.useState<number>(6)

  const [loading, setLoading] = React.useState(false)
  const [ideas, setIdeas] = React.useState<ContentIdea[]>([])
  const [hasGenerated, setHasGenerated] = React.useState(false)

  const [copiedId, setCopiedId] = React.useState<string | null>(null)
  const [loadingMsgIdx, setLoadingMsgIdx] = React.useState(0)

  // Related trends state
  const [allTrends, setAllTrends] = React.useState<KeywordTrend[]>([])
  const [trendsLoading, setTrendsLoading] = React.useState(false)
  const [trendsError, setTrendsError] = React.useState(false)

  // Fetch trends from /api/trending?period=daily&limit=20
  const fetchTrends = React.useCallback(async function fetchTrends() {
    setTrendsLoading(true)
    setTrendsError(false)
    try {
      const res = await fetch(
        "/api/trending?period=daily&limit=20",
        { cache: "no-store" }
      )
      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json?.error || "فشل تحميل الترندات")
      }
      const data: KeywordTrend[] = json.data ?? []
      setAllTrends(data)
    } catch {
      setTrendsError(true)
    } finally {
      setTrendsLoading(false)
    }
  }, [])

  // Fetch trends on mount (once) so we always have data ready
  const didFetchOnMount = React.useRef(false)
  React.useEffect(() => {
    if (didFetchOnMount.current) return
    didFetchOnMount.current = true
    void fetchTrends()
  }, [fetchTrends])

  // Debounced keyword change -> refetch trends (500ms)
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  React.useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    debounceRef.current = setTimeout(() => {
      void fetchTrends()
    }, 500)
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
    // Re-fetch when keyword changes (debounced). fetchTrends is stable.
  }, [keyword, fetchTrends])

  // Compute related trends based on the current keyword
  const relatedTrends = React.useMemo<KeywordTrend[]>(() => {
    const kw = keyword.trim().toLowerCase()
    if (!allTrends.length) return []
    if (!kw) {
      // No keyword: show top trends sorted by trendScore
      return [...allTrends]
        .sort((a, b) => b.trendScore - a.trendScore)
        .slice(0, 8)
    }
    // Match by keyword text contains OR category contains OR hashtag
    const matches = allTrends.filter((t) => {
      const tKw = t.keyword.toLowerCase()
      const tCat = (t.category || "").toLowerCase()
      const tHash = (t.hashtag || "").toLowerCase()
      return (
        tKw.includes(kw) ||
        kw.includes(tKw) ||
        tCat.includes(kw) ||
        kw.includes(tCat) ||
        tHash.includes(kw)
      )
    })
    if (matches.length > 0) {
      return matches
        .sort((a, b) => b.trendScore - a.trendScore)
        .slice(0, 8)
    }
    // No direct match: fall back to top trends
    return [...allTrends]
      .sort((a, b) => b.trendScore - a.trendScore)
      .slice(0, 8)
  }, [allTrends, keyword])

  // Match an idea to a trending keyword
  const findIdeaTrend = React.useCallback(
    function findIdeaTrend(idea: ContentIdea): KeywordTrend | undefined {
      if (!relatedTrends.length) return undefined
      const title = (idea.title || "").toLowerCase()
      const hashText = (idea.hashtags || []).join(" ").toLowerCase()
      const haystack = `${title} ${hashText}`
      // Find a trend whose keyword appears in the idea text
      const matched = relatedTrends.find((t) => {
        const tKw = t.keyword.toLowerCase()
        const tHash = (t.hashtag || "").toLowerCase()
        return (
          (tKw.length > 2 && haystack.includes(tKw)) ||
          (tHash.length > 2 && haystack.includes(tHash))
        )
      })
      if (matched) return matched
      // Fall back: deterministic-ish pick by hashing idea title
      const idx =
        Math.abs(
          [...idea.title].reduce(
            (acc, ch) => acc + ch.charCodeAt(0),
            0
          )
        ) % relatedTrends.length
      return relatedTrends[idx]
    },
    [relatedTrends]
  )

  // Auto-generate when navigated with initialKeyword
  const didAutoGen = React.useRef(false)
  React.useEffect(() => {
    if (initialKeyword && initialKeyword.trim() && !didAutoGen.current) {
      didAutoGen.current = true
      void generate(initialKeyword.trim(), platform, count)
    }
    // Intentionally run once on mount when initialKeyword is provided
  }, [initialKeyword])

  // Rotate loading messages while waiting
  React.useEffect(() => {
    if (!loading) return
    setLoadingMsgIdx(0)
    const id = window.setInterval(() => {
      setLoadingMsgIdx((i) => (i + 1) % LOADING_MESSAGES.length)
    }, 2800)
    return () => window.clearInterval(id)
  }, [loading])

  async function generate(kw: string, plat: Platform, cnt: number) {
    setLoading(true)
    try {
      const res = await fetch("/api/content/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: kw, platform: plat, count: cnt }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json?.error || "فشل توليد الأفكار")
      }
      const data: ContentIdea[] = json.data ?? []
      setIdeas(data)
      setHasGenerated(true)
      toast({
        title: "تم توليد الأفكار بنجاح",
        description: `${data.length} فكرة محتوى جاهزة للاستخدام`,
      })
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "حدث خطأ غير متوقع"
      toast({
        title: "تعذّر توليد الأفكار",
        description: message,
        variant: "destructive",
      })
      setIdeas([])
      setHasGenerated(true)
    } finally {
      setLoading(false)
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = keyword.trim()
    if (!trimmed) {
      toast({
        title: "حقل مطلوب",
        description: "أدخل كلمة مفتاحية لتوليد أفكار المحتوى",
        variant: "destructive",
      })
      return
    }
    if (!platform) {
      toast({
        title: "اختر منصة",
        description: "اختر إحدى المنصات لاستهداف المحتوى",
        variant: "destructive",
      })
      return
    }
    void generate(trimmed, platform, count)
  }

  async function handleCopy(idea: ContentIdea, id: string) {
    const text = [
      idea.title,
      "",
      `🗣️ ${idea.hook}`,
      "",
      idea.description,
      "",
      idea.hashtags.join(" "),
    ].join("\n")

    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(id)
      toast({ title: "تم نسخ الفكرة" })
      window.setTimeout(() => {
        setCopiedId((c) => (c === id ? null : c))
      }, 1800)
    } catch {
      toast({
        title: "تعذّر النسخ",
        description: "لم نتمكن من الوصول إلى الحافظة",
        variant: "destructive",
      })
    }
  }

  function handleTrendClick(trendKw: string) {
    setKeyword(trendKw)
    toast({
      title: "تم اختيار الترند",
      description: `اضغط «ولّد الأفكار» لتوليد أفكار لـ ${trendKw}`,
    })
  }

  const platformEntries = Object.values(PLATFORMS)

  const showResults = !loading && ideas.length > 0

  return (
    <div className="space-y-8">
      {/* Section header */}
      <header className="space-y-2">
        <h2 className="font-display text-xl font-bold flex items-center gap-2">
          <Wand2 className="w-5 h-5 text-primary" />
          مولّد أفكار المحتوى
          <Sparkles className="w-4 h-4 text-brand-purple" />
        </h2>
        <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
          أدخل كلمة مفتاحية واختر منصتك المفضلة، وسيقوم الذكاء الاصطناعي
          بتوليد أفكار محتوى إبداعية جاهزة للتنفيذ مع عناوين جذابة، جُمل افتتاحية،
          هاشتاقات، وتقدير للوصول. مرتبطة بالترندات الحالية.
        </p>
      </header>

      {/* Input form card */}
      <Card className="overflow-hidden border-primary/15 shadow-brand">
        <CardContent className="p-5 sm:p-6 space-y-5">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Keyword input */}
            <div className="space-y-2">
              <label
                htmlFor="cg-keyword"
                className="text-sm font-semibold flex items-center gap-1.5"
              >
                <Hash className="w-4 h-4 text-primary" />
                الكلمة المفتاحية
              </label>
              <div className="relative">
                <Input
                  id="cg-keyword"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="مثال: تصوير المنتجات، تربية القطط، تعلم الإنجليزية..."
                  className="h-11 pr-10 text-base rounded-lg"
                  autoComplete="off"
                  disabled={loading}
                />
                <Sparkles className="w-4 h-4 text-muted-foreground absolute top-1/2 -translate-y-1/2 left-3 pointer-events-none" />
              </div>
            </div>

            {/* Platform selector */}
            <div className="space-y-2">
              <span className="text-sm font-semibold flex items-center gap-1.5">
                <Target className="w-4 h-4 text-primary" />
                المنصة المستهدفة
              </span>
              <div
                role="radiogroup"
                aria-label="اختيار المنصة"
                className="grid grid-cols-2 sm:grid-cols-4 gap-2"
              >
                {platformEntries.map((p) => {
                  const active = platform === p.id
                  return (
                    <button
                      key={p.id}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => setPlatform(p.id)}
                      disabled={loading}
                      className={cn(
                        "flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-semibold transition-all",
                        active
                          ? "bg-gradient-brand text-white border-transparent shadow-brand"
                          : "bg-card text-foreground border-border hover:bg-accent hover:border-primary/30"
                      )}
                    >
                      <PlatformBadge
                        platform={p.id}
                        size="sm"
                        className={cn(active && "brightness-0 invert")}
                      />
                      <span>{p.arabicName}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Count selector */}
            <div className="space-y-2">
              <span className="text-sm font-semibold flex items-center gap-1.5">
                <Film className="w-4 h-4 text-primary" />
                عدد الأفكار
              </span>
              <div
                role="radiogroup"
                aria-label="عدد الأفكار"
                className="inline-flex p-1 bg-secondary rounded-lg gap-1"
              >
                {COUNT_OPTIONS.map((n) => {
                  const active = count === n
                  return (
                    <button
                      key={n}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => setCount(n)}
                      disabled={loading}
                      className={cn(
                        "px-5 py-1.5 rounded-md text-sm font-semibold transition-all min-w-[64px]",
                        active
                          ? "bg-gradient-brand text-white shadow-sm"
                          : "text-muted-foreground hover:text-foreground hover:bg-accent"
                      )}
                    >
                      {n} أفكار
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Submit */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-1">
              <Button
                type="submit"
                disabled={loading}
                className="bg-gradient-brand text-white hover:opacity-95 font-bold rounded-xl h-11 px-6 shadow-brand transition-all hover:shadow-brand-lg disabled:opacity-70"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    جاري التوليد...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    ولّد الأفكار
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                قد يستغرق التوليد 10-20 ثانية
              </p>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* States */}
      {loading && <LoadingState count={count} messageIdx={loadingMsgIdx} />}

      {!loading && hasGenerated && ideas.length === 0 && <ErrorState />}

      {!loading && !hasGenerated && ideas.length === 0 && (
        <EmptyState
          trends={relatedTrends}
          loading={trendsLoading}
          onTrendClick={handleTrendClick}
        />
      )}

      {showResults && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Ideas — 2 cols on lg */}
          <div className="lg:col-span-2 space-y-4">
            <section aria-label="نتائج الأفكار" className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-display text-lg font-bold flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-primary" />
                  أفكار مقترحة
                  <Badge
                    variant="secondary"
                    className="bg-primary/10 text-primary border border-primary/20"
                  >
                    {ideas.length}
                  </Badge>
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-primary"
                  onClick={() => {
                    setIdeas([])
                    setHasGenerated(false)
                  }}
                >
                  مسح
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {ideas.map((idea, idx) => {
                  const trend = findIdeaTrend(idea)
                  return (
                    <IdeaCard
                      key={`${idea.title}-${idx}`}
                      idea={idea}
                      index={idx}
                      copied={copiedId === `${idea.title}-${idx}`}
                      onCopy={() => handleCopy(idea, `${idea.title}-${idx}`)}
                      relatedTrend={trend}
                      onNavigate={onNavigate}
                    />
                  )
                })}
              </div>
            </section>
          </div>

          {/* Related Trends sidebar — 1 col on lg */}
          <aside className="lg:sticky lg:top-4 lg:self-start">
            <RelatedTrendsCard
              trends={relatedTrends}
              loading={trendsLoading}
              error={trendsError}
              onRefresh={() => void fetchTrends()}
              onTrendClick={handleTrendClick}
              currentKeyword={keyword.trim()}
            />
          </aside>
        </div>
      )}
    </div>
  )
}

/* ---------- Related Trends card ---------- */

interface RelatedTrendsCardProps {
  trends: KeywordTrend[]
  loading: boolean
  error: boolean
  onRefresh: () => void
  onTrendClick: (keyword: string) => void
  currentKeyword: string
}

function RelatedTrendsCard({
  trends,
  loading,
  error,
  onRefresh,
  onTrendClick,
  currentKeyword,
}: RelatedTrendsCardProps) {
  return (
    <Card className="overflow-hidden border-primary/15 shadow-brand">
      {/* Header */}
      <div className="bg-gradient-brand-soft dark:bg-card/60 px-5 py-4 border-b border-border/60 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-brand flex items-center justify-center text-white shadow-brand shrink-0">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div className="flex flex-col leading-tight">
            <h3 className="font-display text-sm font-bold flex items-center gap-1.5">
              الترندات المرتبطة الآن
              <span
                aria-hidden="true"
                className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"
              />
            </h3>
            <span className="text-[11px] text-muted-foreground">
              {currentKeyword
                ? `مرتبطة بـ: ${currentKeyword}`
                : "أحدث الترندات اليومية"}
            </span>
          </div>
        </div>
        {error && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={onRefresh}
            aria-label="إعادة التحميل"
          >
            إعادة
          </Button>
        )}
      </div>

      <CardContent className="p-3">
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-2 p-2 rounded-lg border border-border/40"
              >
                <Skeleton className="w-8 h-8 rounded-lg" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3 w-2/3 rounded" />
                  <Skeleton className="h-2.5 w-1/2 rounded" />
                </div>
                <Skeleton className="h-5 w-10 rounded-md" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-6 flex flex-col items-center text-center gap-3">
            <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-destructive" />
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              تعذّر تحميل الترندات الآن. حاول مرة أخرى.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              className="h-8 text-xs"
            >
              إعادة المحاولة
            </Button>
          </div>
        ) : trends.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-xs text-muted-foreground">
              لا توجد ترندات متاحة حالياً
            </p>
          </div>
        ) : (
          <ScrollArea className="max-h-72 overflow-y-auto scroll-area-brand pr-1">
            <ul className="space-y-1.5">
              {trends.map((t) => (
                <li key={t.id}>
                  <TrendChip
                    trend={t}
                    onClick={() => onTrendClick(t.keyword)}
                  />
                </li>
              ))}
            </ul>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}

interface TrendChipProps {
  trend: KeywordTrend
  onClick: () => void
}

function TrendChip({ trend, onClick }: TrendChipProps) {
  const growthColor =
    trend.growth >= 0
      ? "text-emerald-600 dark:text-emerald-400"
      : "text-rose-600 dark:text-rose-400"
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-2.5 p-2 rounded-lg border border-border/60 hover:border-primary/40 hover:bg-accent/60 transition-all text-right group"
      title={`استخدام ${trend.keyword} ككلمة مفتاحية`}
    >
      <PlatformBadge platform={trend.platform} size="sm" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <span className="text-sm font-semibold truncate">
            {trend.keyword}
          </span>
          {trend.hashtag && (
            <span className="text-[10px] text-muted-foreground truncate">
              {trend.hashtag}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <Badge
            variant="outline"
            className="h-4 px-1.5 text-[10px] font-medium border-border/70 bg-secondary/60"
          >
            {trend.category}
          </Badge>
          <span
            className={cn(
              "text-[11px] font-bold flex items-center gap-0.5",
              growthColor
            )}
          >
            <Flame className="w-3 h-3" />
            {formatGrowth(trend.growth)}
          </span>
        </div>
      </div>
      <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
    </button>
  )
}

/* ---------- Loading state ---------- */

function LoadingState({
  count,
  messageIdx,
}: {
  count: number
  messageIdx: number
}) {
  return (
    <section aria-busy="true" aria-live="polite" className="space-y-6">
      {/* Animated loader banner */}
      <Card className="overflow-hidden border-primary/20 shadow-brand">
        <CardContent className="p-6 sm:p-8 flex flex-col items-center text-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-brand rounded-full blur-xl opacity-40 animate-pulse-glow" />
            <div className="relative w-16 h-16 rounded-full bg-gradient-brand flex items-center justify-center shadow-brand">
              <Sparkles className="w-8 h-8 text-white animate-pulse" />
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-center gap-2 text-base font-bold">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <span key={messageIdx} className="animate-in fade-in duration-500">
                {LOADING_MESSAGES[messageIdx]}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              الذكاء الاصطناعي يبتكر محتوى مخصصاً لك
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Shimmer skeleton cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: Math.min(count, 9) }).map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Skeleton className="w-9 h-9 rounded-xl" />
                <Skeleton className="h-5 w-20 rounded-md" />
                <div className="flex-1" />
                <Skeleton className="h-5 w-16 rounded-md" />
              </div>
              <Skeleton className="h-6 w-5/6 rounded-md" />
              <Skeleton className="h-16 w-full rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="h-3 w-full rounded" />
                <Skeleton className="h-3 w-11/12 rounded" />
              </div>
              <div className="flex flex-wrap gap-1.5">
                <Skeleton className="h-6 w-16 rounded-md" />
                <Skeleton className="h-6 w-20 rounded-md" />
                <Skeleton className="h-6 w-14 rounded-md" />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-24 rounded-md" />
                <Skeleton className="h-8 w-16 rounded-md" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}

/* ---------- Empty state ---------- */

interface EmptyStateProps {
  trends: KeywordTrend[]
  loading: boolean
  onTrendClick: (keyword: string) => void
}

function EmptyState({ trends, loading, onTrendClick }: EmptyStateProps) {
  return (
    <div className="space-y-4">
      <Card className="border-dashed border-2 border-border bg-gradient-brand-soft/40">
        <CardContent className="p-10 sm:p-16 flex flex-col items-center text-center gap-5">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-brand rounded-full blur-2xl opacity-20 animate-pulse-glow" />
            <div className="relative w-24 h-24 rounded-3xl bg-gradient-brand-soft flex items-center justify-center shadow-brand">
              <Lightbulb className="w-12 h-12 text-primary" />
            </div>
          </div>
          <div className="space-y-2 max-w-md">
            <h3 className="font-display text-xl font-bold">
              ابدأ بتوليد أفكار محتوى إبداعية
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              أدخل كلمة مفتاحية واختر منصتك المفضلة، ثم اضغط «ولّد الأفكار»
              ليقوم الذكاء الاصطناعي باقتراح أفكار محتوى جاهزة للتنفيذ.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Sparkles className="w-3.5 h-3.5 text-brand-purple" />
            مدعوم بالذكاء الاصطناعي
          </div>
        </CardContent>
      </Card>

      {/* Related trends preview on empty state (mobile-first: above ideas) */}
      <RelatedTrendsCard
        trends={trends}
        loading={loading}
        error={false}
        onRefresh={() => undefined}
        onTrendClick={onTrendClick}
        currentKeyword=""
      />
    </div>
  )
}

/* ---------- Error state ---------- */

function ErrorState() {
  return (
    <Card className="border-destructive/30 bg-destructive/5">
      <CardContent className="p-10 flex flex-col items-center text-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-destructive" />
        </div>
        <div className="space-y-1.5">
          <h3 className="font-display text-lg font-bold">
            تعذّر توليد الأفكار
          </h3>
          <p className="text-sm text-muted-foreground max-w-md">
            حدث خطأ أثناء محاولة توليد الأفكار. حاول مرة أخرى بعد لحظات،
            أو جرّب كلمة مفتاحية مختلفة.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

/* ---------- Idea card ---------- */

interface IdeaCardProps {
  idea: ContentIdea
  index: number
  copied: boolean
  onCopy: () => void
  relatedTrend?: KeywordTrend
  onNavigate?: (tab: string, keyword?: string) => void
}

function IdeaCard({
  idea,
  index,
  copied,
  onCopy,
  relatedTrend,
  onNavigate,
}: IdeaCardProps) {
  const trendKeyword = relatedTrend?.keyword
  const trendClickable = Boolean(onNavigate && trendKeyword)

  function handleTrendClick() {
    if (onNavigate && trendKeyword) {
      onNavigate("research", trendKeyword)
    }
  }

  return (
    <Card className="group relative overflow-hidden hover:shadow-brand-lg transition-all duration-300 hover:-translate-y-1 flex flex-col">
      {/* subtle gradient accent on top */}
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-brand opacity-80" />

      <CardContent className="p-5 space-y-4 flex-1 flex flex-col">
        {/* Header: badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <PlatformBadge platform={idea.platform} size="sm" />
          <Badge
            variant="outline"
            className="bg-primary/10 text-primary border-primary/20 gap-1"
          >
            <Video className="w-3 h-3" />
            {idea.type}
          </Badge>
          <div className="flex-1" />
          <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-50">
            <TrendingUp className="w-3 h-3" />
            {idea.estimatedReach}
          </Badge>
        </div>

        {/* Title */}
        <h4 className="font-display text-lg font-bold leading-snug text-gradient-brand">
          {idea.title}
        </h4>

        {/* Hook callout */}
        <div className="bg-accent/50 border-r-4 border-primary rounded-lg p-3 pr-3 flex items-start gap-2">
          <Quote className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <p className="text-sm font-medium text-accent-foreground leading-relaxed">
            {idea.hook}
          </p>
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground leading-relaxed">
          {idea.description}
        </p>

        {/* Hashtags */}
        {idea.hashtags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {idea.hashtags.map((tag, i) => {
              const tagText = tag.startsWith("#") ? tag : `#${tag}`
              return (
                <span
                  key={i}
                  className="bg-secondary text-secondary-foreground px-2.5 py-1 rounded-md text-xs font-medium hover:bg-accent cursor-default transition-colors"
                >
                  {tagText}
                </span>
              )
            })}
          </div>
        )}

        {/* Related trend badge */}
        {relatedTrend && trendKeyword && (
          <div className="flex items-center gap-2">
            {trendClickable ? (
              <button
                type="button"
                onClick={handleTrendClick}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-gradient-brand-soft text-primary border border-primary/20 hover:border-primary/40 hover:shadow-sm transition-all"
                title="ابحث عن هذا الترند"
              >
                <Link2 className="w-3 h-3" />
                مرتبط بالترند:
                <span className="font-bold">#{trendKeyword}</span>
                <ArrowUpRight className="w-3 h-3 opacity-70" />
              </button>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-gradient-brand-soft text-primary border border-primary/20">
                <Link2 className="w-3 h-3" />
                مرتبط بالترند:
                <span className="font-bold">#{trendKeyword}</span>
              </span>
            )}
          </div>
        )}

        <div className="flex-1" />

        <Separator />

        {/* Footer */}
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="w-3.5 h-3.5" />
            {idea.duration}
          </span>
          <Button
            variant="secondary"
            size="sm"
            onClick={onCopy}
            className="h-8 px-3 rounded-lg gap-1.5 text-xs font-semibold"
            aria-label="نسخ الفكرة"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                تم النسخ
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                نسخ
              </>
            )}
          </Button>
        </div>

        {/* Idea number watermark */}
        <span className="absolute top-3 left-3 text-[10px] font-bold text-muted-foreground/40">
          #{index + 1}
        </span>
      </CardContent>
    </Card>
  )
}
