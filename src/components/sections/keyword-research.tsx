"use client"

import * as React from "react"
import {
  Search,
  Target,
  TrendingUp,
  TrendingDown,
  Hash,
  Lightbulb,
  DollarSign,
  Gauge,
  BarChart3,
  ChevronDown,
  Sparkles,
  AlertCircle,
  Compass,
  Trophy,
} from "lucide-react"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible"
import { PlatformBadge } from "@/components/platform-icon"
import {
  formatNumber,
  formatGrowth,
  competitionColor,
  competitionLabel,
} from "@/lib/format"
import { PLATFORM_LIST } from "@/lib/platforms"
import { useToast } from "@/hooks/use-toast"
import type { Platform, KeywordDetail } from "@/lib/types"
import { cn } from "@/lib/utils"

interface KeywordResearchProps {
  initialKeyword?: string
  onNavigate: (tab: string, keyword?: string) => void
}

type PlatformFilter = Platform | "all"

interface MetricItemProps {
  icon: React.ReactNode
  label: string
  value: string
  valueClassName?: string
  sub?: string
}

function MetricItem({
  icon,
  label,
  value,
  valueClassName,
  sub,
}: MetricItemProps) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl bg-muted/40 dark:bg-muted/20 px-3 py-2.5 border border-border/50">
      <div className="shrink-0 w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10.5px] text-muted-foreground leading-tight">
          {label}
        </p>
        <div className="flex items-baseline gap-1">
          <span
            className={cn(
              "text-sm font-bold leading-tight truncate",
              valueClassName
            )}
          >
            {value}
          </span>
          {sub && (
            <span className="text-[10px] text-muted-foreground">{sub}</span>
          )}
        </div>
      </div>
    </div>
  )
}

interface KeywordDetailCardProps {
  detail: KeywordDetail
  expanded: boolean
  onToggle: () => void
  onSuggestionClick: (s: string) => void
  onGenerate: (keyword: string) => void
}

/**
 * Performance score for a platform keyword result.
 * Higher = better opportunity. Volume is the primary driver,
 * growth adds positively, difficulty & competition penalize.
 */
function computePlatformScore(d: KeywordDetail): number {
  return (
    d.searchVolume / 1000 +
    d.growth * 10 -
    d.difficulty * 5 -
    d.competitionScore * 3
  )
}

interface BestPlatformsSectionProps {
  results: KeywordDetail[]
  onSelectPlatform: (platform: Platform) => void
}

function BestPlatformsSection({
  results,
  onSelectPlatform,
}: BestPlatformsSectionProps) {
  const ranked = React.useMemo(() => {
    return [...results]
      .map((d) => ({ detail: d, score: computePlatformScore(d) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 4)
  }, [results])

  if (ranked.length === 0) return null

  const top = ranked[0].detail
  const topPlatformName =
    PLATFORM_LIST.find((p) => p.id === top.platform)?.arabicName ||
    top.platform

  return (
    <section
      className="space-y-3"
      aria-label="أفضل المنصات لهذه الكلمة"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-display text-lg font-bold flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-gradient-brand text-white flex items-center justify-center shadow-brand">
            <Trophy className="w-4 h-4" />
          </span>
          أفضل المنصات لهذه الكلمة
        </h3>
        <span className="text-xs text-muted-foreground">
          ترتيب {ranked.length} منصات
        </span>
      </div>

      {/* Ranking cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {ranked.map((entry, idx) => {
          const d = entry.detail
          const isTop = idx === 0
          const isGrowthPositive = d.growth >= 0
          return (
            <Card
              key={`${d.keyword}-${d.platform}`}
              role="button"
              tabIndex={0}
              onClick={() => onSelectPlatform(d.platform)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  onSelectPlatform(d.platform)
                }
              }}
              aria-label={`المرتبة ${idx + 1}: ${
                PLATFORM_LIST.find((p) => p.id === d.platform)?.arabicName ||
                d.platform
              }، حجم البحث ${formatNumber(d.searchVolume)}، النمو ${formatGrowth(
                d.growth
              )}`}
              className={cn(
                "p-4 cursor-pointer transition-all hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                isTop
                  ? "bg-gradient-brand text-white border-transparent shadow-brand-lg"
                  : "bg-card hover:shadow-brand"
              )}
            >
              {/* Top row: rank number + medal/badge */}
              <div className="flex items-center justify-between mb-3">
                <span
                  className={cn(
                    "font-display text-2xl font-extrabold leading-none",
                    isTop ? "text-white/90" : "text-primary"
                  )}
                >
                  #{idx + 1}
                </span>
                {isTop ? (
                  <Badge className="bg-white/20 text-white border-transparent backdrop-blur-sm">
                    <Trophy className="w-3 h-3 ml-1" />
                    الأفضل
                  </Badge>
                ) : idx === 1 ? (
                  <span className="text-xl leading-none" aria-hidden>
                    🥈
                  </span>
                ) : idx === 2 ? (
                  <span className="text-xl leading-none" aria-hidden>
                    🥉
                  </span>
                ) : (
                  <span className="w-6 h-6 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-[10px] font-bold">
                    {idx + 1}
                  </span>
                )}
              </div>

              {/* Platform badge */}
              <PlatformBadge platform={d.platform} size="md" showName />

              {/* Stats */}
              <div className="mt-3 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span
                    className={isTop ? "text-white/80" : "text-muted-foreground"}
                  >
                    حجم البحث
                  </span>
                  <span
                    className={cn(
                      "font-bold",
                      isTop ? "text-white" : "text-foreground"
                    )}
                  >
                    {formatNumber(d.searchVolume)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span
                    className={isTop ? "text-white/80" : "text-muted-foreground"}
                  >
                    النمو
                  </span>
                  <span
                    className={cn(
                      "font-bold inline-flex items-center gap-0.5",
                      isTop
                        ? "text-white"
                        : isGrowthPositive
                        ? "text-emerald-600"
                        : "text-rose-600"
                    )}
                  >
                    {isGrowthPositive ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    {formatGrowth(d.growth)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span
                    className={isTop ? "text-white/80" : "text-muted-foreground"}
                  >
                    المنافسة
                  </span>
                  <span
                    className={cn(
                      "font-bold",
                      isTop ? "text-white" : "text-foreground"
                    )}
                  >
                    {competitionLabel(d.competition)}
                  </span>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Recommendation banner */}
      <div className="bg-gradient-brand-soft border border-primary/20 rounded-xl p-3 text-sm flex items-start gap-2">
        <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <p className="text-foreground leading-relaxed">
          ننصح بالبدء بـ{" "}
          <strong className="text-gradient-brand font-bold">
            {topPlatformName}
          </strong>{" "}
          لأنها تحقق أعلى حجم بحث ({" "}
          <strong className="text-gradient-brand font-bold">
            {formatNumber(top.searchVolume)}
          </strong>
          ) مع منافسة{" "}
          <strong className="text-gradient-brand font-bold">
            {competitionLabel(top.competition)}
          </strong>
          .
        </p>
      </div>
    </section>
  )
}

function KeywordDetailCard({
  detail,
  expanded,
  onToggle,
  onSuggestionClick,
  onGenerate,
}: KeywordDetailCardProps) {
  const isGrowthPositive = detail.growth >= 0
  const cardId = `${detail.keyword}-${detail.platform}`

  return (
    <Card
      data-result-card={detail.platform}
      className="overflow-hidden p-0 gap-0 hover:shadow-brand transition-shadow scroll-mt-24"
    >
      {/* Header (clickable) */}
      <Collapsible open={expanded} onOpenChange={onToggle}>
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="w-full text-right p-4 sm:p-5 flex items-start gap-3 hover:bg-accent/40 transition-colors"
            aria-expanded={expanded}
            aria-controls={`detail-content-${cardId}`}
          >
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <h3 className="font-display text-base font-bold text-foreground truncate">
                  {detail.keyword}
                </h3>
                <PlatformBadge platform={detail.platform} size="sm" />
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px] px-2 py-0.5",
                    competitionColor(detail.competition)
                  )}
                >
                  منافسة {competitionLabel(detail.competition)}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <MetricItem
                  icon={<BarChart3 className="w-4 h-4" />}
                  label="حجم البحث"
                  value={formatNumber(detail.searchVolume)}
                />
                <MetricItem
                  icon={
                    isGrowthPositive ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4" />
                    )
                  }
                  label="النمو"
                  value={formatGrowth(detail.growth)}
                  valueClassName={
                    isGrowthPositive ? "text-emerald-600" : "text-rose-600"
                  }
                />
                <MetricItem
                  icon={<Gauge className="w-4 h-4" />}
                  label="الصعوبة"
                  value={`${detail.difficulty}`}
                  sub="/100"
                  valueClassName={
                    detail.difficulty >= 70
                      ? "text-rose-600"
                      : detail.difficulty >= 40
                      ? "text-amber-600"
                      : "text-emerald-600"
                  }
                />
                <MetricItem
                  icon={<DollarSign className="w-4 h-4" />}
                  label="CPC"
                  value={`$${detail.cpc.toFixed(2)}`}
                />
              </div>
            </div>
            <ChevronDown
              className={cn(
                "shrink-0 w-5 h-5 text-muted-foreground transition-transform duration-300 mt-1",
                expanded && "rotate-180"
              )}
            />
          </button>
        </CollapsibleTrigger>

        {/* Collapsible detail content */}
        <CollapsibleContent id={`detail-content-${cardId}`}>
          <div className="px-4 sm:px-5 pb-4 sm:pb-5 space-y-4 border-t border-border/50 pt-4">
            {/* Trend chart */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-primary" />
                  اتجاه البحث عبر الوقت
                </p>
                <span className="text-[10px] text-muted-foreground">
                  آخر {detail.trendHistory.length} نقطة
                </span>
              </div>
              <div className="h-32 w-full -mx-1">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={detail.trendHistory}
                    margin={{ top: 5, right: 8, left: 8, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id={`grad-${cardId}`}
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#7c3aed"
                          stopOpacity={0.35}
                        />
                        <stop
                          offset="100%"
                          stopColor="#7c3aed"
                          stopOpacity={0.02}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="currentColor"
                      className="text-border"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                      interval="preserveStartEnd"
                      minTickGap={20}
                    />
                    <YAxis
                      tick={{ fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                      width={32}
                      tickFormatter={(v: number) => formatNumber(v)}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 12,
                        border: "1px solid var(--border)",
                        background: "var(--popover)",
                        color: "var(--popover-foreground)",
                        fontSize: 12,
                        boxShadow: "0 10px 30px -10px rgba(0,0,0,0.15)",
                      }}
                      labelStyle={{ fontWeight: 600 }}
                      formatter={(value: number) => [
                        formatNumber(value),
                        "حجم البحث",
                      ]}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#7c3aed"
                      strokeWidth={2.5}
                      fill={`url(#grad-${cardId})`}
                      dot={false}
                      activeDot={{
                        r: 4,
                        fill: "#7c3aed",
                        stroke: "#fff",
                        strokeWidth: 2,
                      }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Related keywords */}
            {detail.relatedKeywords.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 mb-2">
                  <Hash className="w-3.5 h-3.5 text-primary" />
                  كلمات مفتاحية مرتبطة
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {detail.relatedKeywords.map((rk) => (
                    <button
                      key={rk.keyword}
                      type="button"
                      onClick={() => onSuggestionClick(rk.keyword)}
                      className="group inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-muted/30 hover:bg-accent hover:border-primary/40 px-2.5 py-1 text-xs transition-colors"
                    >
                      <span className="font-medium text-foreground">
                        {rk.keyword}
                      </span>
                      <span className="text-[10px] text-primary font-bold">
                        {formatNumber(rk.volume)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Suggestions */}
            {detail.suggestions.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 mb-2">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                  اقتراحات للبحث
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {detail.suggestions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => onSuggestionClick(s)}
                      className="inline-flex items-center gap-1 rounded-full bg-gradient-brand-soft border border-primary/20 hover:border-primary/40 px-2.5 py-1 text-xs font-medium text-foreground transition-colors"
                    >
                      <Search className="w-3 h-3 text-primary" />
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Generate ideas CTA */}
            <Button
              type="button"
              onClick={() => onGenerate(detail.keyword)}
              className="w-full bg-gradient-brand text-white hover:opacity-90 shadow-brand rounded-xl font-semibold"
            >
              <Sparkles className="w-4 h-4" />
              ولّد أفكار محتوى
            </Button>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}

export function KeywordResearch({
  initialKeyword,
  onNavigate,
}: KeywordResearchProps) {
  const { toast } = useToast()
  const [query, setQuery] = React.useState(initialKeyword || "")
  const [selectedPlatform, setSelectedPlatform] =
    React.useState<PlatformFilter>("all")
  const [results, setResults] = React.useState<KeywordDetail[]>([])
  const [loading, setLoading] = React.useState(false)
  const [hasSearched, setHasSearched] = React.useState(false)
  const [expandedId, setExpandedId] = React.useState<string | null>(null)

  const runSearch = React.useCallback(
    async (q: string, platform: PlatformFilter) => {
      const trimmed = q.trim()
      if (!trimmed) {
        toast({
          title: "أدخل كلمة مفتاحية للبحث",
          description: "لا يمكن إجراء البحث بدون كلمة مفتاحية.",
          variant: "destructive",
        })
        return
      }
      setLoading(true)
      setHasSearched(true)
      try {
        const res = await fetch("/api/keywords/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: trimmed,
            platform: platform === "all" ? undefined : platform,
          }),
        })
        const json = await res.json()
        if (!json.success) {
          throw new Error(json.error || "تعذّر إكمال البحث")
        }
        const data: KeywordDetail[] = json.data || []
        setResults(data)
        if (data.length > 0) {
          setExpandedId(`${data[0].keyword}-${data[0].platform}`)
        } else {
          setExpandedId(null)
          toast({
            title: "لا توجد نتائج مطابقة",
            description: "جرّب كلمة مفتاحية أخرى أو غيّر المنصة.",
            variant: "destructive",
          })
        }
      } catch (err) {
        toast({
          title: "تعذّر البحث عن الكلمات المفتاحية",
          description:
            err instanceof Error ? err.message : "حدث خطأ غير متوقع.",
          variant: "destructive",
        })
        setResults([])
        setExpandedId(null)
      } finally {
        setLoading(false)
      }
    },
    [toast]
  )

  // Auto-search when navigated with initialKeyword
  React.useEffect(() => {
    if (initialKeyword && initialKeyword.trim()) {
      setQuery(initialKeyword)
      runSearch(initialKeyword, "all")
    }
  }, [initialKeyword, runSearch])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    runSearch(query, selectedPlatform)
  }

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion)
    runSearch(suggestion, selectedPlatform)
    // Scroll to top of results for visibility
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  const handleGenerate = (keyword: string) => {
    onNavigate("generator", keyword)
  }

  const toggleCard = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  // Expand the matching platform's card and scroll it into view.
  const handleSelectPlatform = React.useCallback(
    (platform: Platform) => {
      const match = results.find((r) => r.platform === platform)
      if (!match) return
      const id = `${match.keyword}-${match.platform}`
      setExpandedId(id)
      // Defer scroll until after the collapsible opens
      requestAnimationFrame(() => {
        if (typeof document === "undefined") return
        const el = document.querySelector(
          `[data-result-card="${platform}"]`
        )
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" })
        }
      })
    },
    [results]
  )

  return (
    <div className="space-y-6">
      {/* Section header */}
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-xl font-bold flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" />
          بحث الكلمات المفتاحية
        </h2>
      </div>

      {/* Search card */}
      <Card className="p-4 sm:p-6 shadow-brand gap-0">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ابحث عن كلمة مفتاحية... مثل: تسوق، طبخ، رياضة"
                className="h-11 pr-10 pl-3 text-base rounded-xl"
                aria-label="كلمة البحث المفتاحية"
                autoComplete="off"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="h-11 px-6 bg-gradient-brand text-white hover:opacity-90 shadow-brand rounded-xl font-semibold shrink-0"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  جارٍ البحث...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  بحث
                </>
              )}
            </Button>
          </div>

          {/* Platform selector chips */}
          <div
            className="flex gap-2 overflow-x-auto pb-1 scroll-area-brand"
            role="group"
            aria-label="اختر المنصة"
          >
            <button
              type="button"
              onClick={() => setSelectedPlatform("all")}
              className={cn(
                "shrink-0 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all border",
                selectedPlatform === "all"
                  ? "bg-gradient-brand text-white border-transparent shadow-brand"
                  : "bg-secondary text-secondary-foreground hover:bg-accent border-transparent"
              )}
            >
              <Compass className="w-3.5 h-3.5" />
              الكل
            </button>
            {PLATFORM_LIST.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedPlatform(p.id)}
                aria-pressed={selectedPlatform === p.id}
                className={cn(
                  "shrink-0 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all border",
                  selectedPlatform === p.id
                    ? "bg-gradient-brand text-white border-transparent shadow-brand"
                    : "bg-secondary text-secondary-foreground hover:bg-accent border-transparent"
                )}
              >
                <PlatformBadge
                  platform={p.id}
                  size="sm"
                  className="scale-[0.7] origin-center -mx-1"
                />
                {p.arabicName}
              </button>
            ))}
          </div>
        </form>
      </Card>

      {/* Results area */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-2xl" />
          ))}
        </div>
      ) : !hasSearched ? (
        <EmptyState
          icon={<Search className="w-10 h-10" />}
          title="ابدأ بالبحث عن كلمة مفتاحية لاكتشاف بياناتها التفصيلية"
          description="أدخل كلمة في حقل البحث أعلاه لعرض حجم البحث، المنافسة، الاتجاهات، الكلمات المرتبطة، واقتراحات المحتوى عبر المنصات المختلفة."
        />
      ) : results.length === 0 ? (
        <EmptyState
          icon={<AlertCircle className="w-10 h-10" />}
          title="لا توجد نتائج مطابقة"
          description="جرّب كلمة مفتاحية أخرى أو غيّر المنصة المحددة. يمكنك أيضاً النقر على أحد الاقتراحات الظاهرة داخل النتائج."
        />
      ) : (
        <>
          <BestPlatformsSection
            results={results}
            onSelectPlatform={handleSelectPlatform}
          />
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              عرض{" "}
              <span className="font-bold text-foreground">
                {results.length}
              </span>{" "}
              نتيجة
              {selectedPlatform !== "all" && (
                <>
                  {" "}
                  على منصة{" "}
                  <span className="font-bold text-foreground">
                    {
                      PLATFORM_LIST.find((p) => p.id === selectedPlatform)
                        ?.arabicName
                    }
                  </span>
                </>
              )}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {results.map((detail) => {
              const id = `${detail.keyword}-${detail.platform}`
              return (
                <KeywordDetailCard
                  key={id}
                  detail={detail}
                  expanded={expandedId === id}
                  onToggle={() => toggleCard(id)}
                  onSuggestionClick={handleSuggestionClick}
                  onGenerate={handleGenerate}
                />
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

interface EmptyStateProps {
  icon: React.ReactNode
  title: string
  description: string
}

function EmptyState({ icon, title, description }: EmptyStateProps) {
  return (
    <Card className="p-10 sm:p-14 text-center border-dashed">
      <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-brand-soft text-primary flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="font-display text-lg font-bold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
        {description}
      </p>
    </Card>
  )
}
