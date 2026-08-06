"use client"

import * as React from "react"
import {
  CalendarClock,
  Clock,
  Flame,
  TrendingUp,
  Lightbulb,
  AlertCircle,
  MapPin,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select"
import { PlatformBadge } from "@/components/platform-icon"
import { PLATFORM_LIST, COUNTRIES } from "@/lib/platforms"
import { useToast } from "@/hooks/use-toast"
import type { Platform, Country } from "@/lib/types"
import { cn } from "@/lib/utils"

const DAYS_AR = [
  "السبت",
  "الأحد",
  "الاثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة",
] as const

interface HeatmapCell {
  day: number
  hour: number
  score: number
}

interface BestTime {
  day: string
  timeRange: string
  score: number
  reason: string
}

interface BestTimeData {
  heatmap: HeatmapCell[]
  bestTimes: BestTime[]
  timezone: string
  insights: string[]
}

// Color tier function — blue → purple gradient scale via oklch
function scoreColor(score: number): string {
  if (score >= 80) return "oklch(0.45 0.25 285)" // deep purple
  if (score >= 60) return "oklch(0.55 0.22 280)"
  if (score >= 40) return "oklch(0.7 0.15 275)"
  if (score >= 20) return "oklch(0.85 0.08 270)"
  return "oklch(0.95 0.02 270)" // very light
}

// Format hour to Arabic 12h notation: 0 -> "12ص", 13 -> "1م"
function formatHourLabel(h: number): string {
  if (h === 0) return "12ص"
  if (h < 12) return `${h}ص`
  if (h === 12) return "12م"
  return `${h - 12}م`
}

export function BestTimeAnalyzer() {
  const { toast } = useToast()

  const [platform, setPlatform] = React.useState<Platform>("tiktok")
  const [country, setCountry] = React.useState<Country>("global")

  const [data, setData] = React.useState<BestTimeData | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const fetchData = React.useCallback(() => {
    setLoading(true)
    setError(null)

    const params = new URLSearchParams({ platform, country })
    fetch(`/api/tools/best-time?${params.toString()}`)
      .then((r) => {
        if (!r.ok) throw new Error("فشل الاتصال بالخادم")
        return r.json()
      })
      .then((res) => {
        if (res.success) {
          setData(res.data as BestTimeData)
        } else {
          throw new Error(res.message || "فشل تحميل البيانات")
        }
      })
      .catch((err) => {
        const msg = err instanceof Error ? err.message : "حدث خطأ غير متوقع"
        setError(msg)
        toast({
          title: "خطأ في تحميل التحليل",
          description: msg,
          variant: "destructive",
        })
      })
      .finally(() => setLoading(false))
  }, [platform, country, toast])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  // Build a 7×24 matrix from the flat heatmap array
  const heatmapMatrix = React.useMemo(() => {
    if (!data) return null
    const matrix: (HeatmapCell | null)[][] = Array.from({ length: 7 }, () =>
      Array.from({ length: 24 }, () => null)
    )
    for (const cell of data.heatmap) {
      if (cell.day >= 0 && cell.day < 7 && cell.hour >= 0 && cell.hour < 24) {
        matrix[cell.day][cell.hour] = cell
      }
    }
    return matrix
  }, [data])

  return (
    <div className="space-y-6">
      {/* Tool Header */}
      <div className="flex flex-col gap-1.5">
        <h2 className="font-display text-xl font-bold flex items-center gap-2">
          <CalendarClock className="w-5 h-5 text-primary" />
          محلل أفضل وقت للنشر
        </h2>
        <p className="text-sm text-muted-foreground flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" />
          اكتشف أوقات الذروة لمحتواك حسب المنصة والدولة
        </p>
      </div>

      {/* Filter Card */}
      <Card className="bg-gradient-brand-soft border-primary/15 p-4 sm:p-5 gap-4 rounded-2xl">
        <div className="flex flex-col md:flex-row md:items-end gap-4">
          {/* Platform chips */}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-muted-foreground mb-2">
              المنصة
            </p>
            <div className="flex gap-2 overflow-x-auto pb-1 scroll-area-brand">
              {PLATFORM_LIST.map((p) => {
                const selected = platform === p.id
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPlatform(p.id)}
                    aria-pressed={selected}
                    className={cn(
                      "shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5",
                      selected
                        ? "bg-gradient-brand text-white shadow-brand"
                        : "bg-card text-foreground hover:bg-accent border border-border"
                    )}
                  >
                    <PlatformBadge
                      platform={p.id}
                      size="sm"
                      className="scale-75 origin-center"
                    />
                    {p.arabicName}
                  </button>
                )
              })}
            </div>
          </div>

          <Separator
            orientation="vertical"
            className="hidden md:block h-12 mx-1"
          />

          {/* Country select */}
          <div className="md:w-56 shrink-0">
            <p className="text-xs font-semibold text-muted-foreground mb-2">
              الدولة
            </p>
            <label htmlFor="country-select-bt" className="sr-only">
              اختر الدولة
            </label>
            <Select
              value={country}
              onValueChange={(v) => setCountry(v as Country)}
            >
              <SelectTrigger
                id="country-select-bt"
                className="w-full rounded-xl bg-card"
                aria-label="اختر الدولة"
              >
                <span className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  <SelectValue placeholder="اختر الدولة" />
                </span>
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {COUNTRIES.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    <span className="text-base mr-1">{c.flag}</span>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Loading state — skeleton heatmap grid */}
      {loading && (
        <Card className="p-4 sm:p-6 rounded-2xl gap-4">
          <div className="flex items-center justify-between gap-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-5 w-40 rounded-full" />
          </div>
          <div className="overflow-x-auto scroll-area-brand pb-2">
            <div className="min-w-[640px] space-y-1">
              {/* skeleton hour header */}
              <div className="flex gap-0.5 mb-1">
                <Skeleton className="w-12 h-4 shrink-0" />
                {Array.from({ length: 24 }).map((_, h) => (
                  <Skeleton key={h} className="w-5 h-4 shrink-0 rounded-sm" />
                ))}
              </div>
              {/* skeleton day rows */}
              {Array.from({ length: 7 }).map((_, dayIdx) => (
                <div key={dayIdx} className="flex gap-0.5 items-center">
                  <Skeleton className="w-12 h-5 shrink-0" />
                  {Array.from({ length: 24 }).map((_, h) => (
                    <Skeleton
                      key={h}
                      className="w-5 h-5 shrink-0 rounded-sm"
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
          <Skeleton className="h-2.5 w-full max-w-xs mx-auto rounded-full" />
        </Card>
      )}

      {/* Error state */}
      {!loading && error && (
        <Card className="p-8 text-center border-destructive/30 bg-destructive/5 rounded-2xl">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-destructive" />
            </div>
            <p className="text-sm font-semibold text-foreground">
              تعذّر تحميل التحليل
            </p>
            <p className="text-xs text-muted-foreground max-w-sm">{error}</p>
            <Button
              size="sm"
              variant="outline"
              className="mt-2 rounded-lg"
              onClick={fetchData}
            >
              إعادة المحاولة
            </Button>
          </div>
        </Card>
      )}

      {/* Results */}
      {!loading && !error && data && heatmapMatrix && (
        <div className="space-y-4 sm:space-y-6">
          {/* Heatmap Card */}
          <Card className="p-4 sm:p-6 rounded-2xl gap-4">
            <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
              <h3 className="font-display text-lg font-bold flex items-center gap-2">
                <CalendarClock className="w-4 h-4 text-primary" />
                خريطة حرارية للتفاعل
              </h3>
              <Badge
                variant="outline"
                className="gap-1.5 text-xs font-medium"
              >
                <MapPin className="w-3 h-3 text-primary" />
                {data.timezone}
              </Badge>
            </div>

            {/* Heatmap grid — horizontally scrollable on mobile */}
            <div className="overflow-x-auto scroll-area-brand pb-2 -mx-1 px-1">
              <div className="min-w-[640px]">
                {/* Hour header row */}
                <div className="flex gap-0.5 mb-1">
                  <div className="w-12 shrink-0" aria-hidden />
                  {Array.from({ length: 24 }).map((_, h) => (
                    <div
                      key={h}
                      className="w-5 h-4 text-[9px] text-muted-foreground text-center leading-4 shrink-0 font-medium"
                    >
                      {h % 3 === 0 ? formatHourLabel(h) : ""}
                    </div>
                  ))}
                </div>
                {/* Day rows */}
                {DAYS_AR.map((dayName, dayIdx) => (
                  <div
                    key={dayIdx}
                    className="flex gap-0.5 items-center mb-0.5"
                  >
                    <div
                      className="w-12 shrink-0 text-xs text-muted-foreground text-left pl-1 truncate font-medium"
                      title={dayName}
                    >
                      {dayName}
                    </div>
                    {Array.from({ length: 24 }).map((_, h) => {
                      const cell = heatmapMatrix[dayIdx][h]
                      const score = cell?.score ?? 0
                      return (
                        <div
                          key={h}
                          title={`${dayName} ${formatHourLabel(h)}: درجة ${score}`}
                          className={cn(
                            "w-5 h-5 rounded-sm shrink-0 transition-all relative cursor-default",
                            "hover:ring-2 hover:ring-foreground/40 hover:z-10 hover:scale-110"
                          )}
                          style={{ backgroundColor: scoreColor(score) }}
                        />
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Color scale legend */}
            <div className="flex items-center justify-between gap-3 mt-3 pt-3 border-t border-border">
              <span className="text-xs text-muted-foreground font-medium">
                منخفض
              </span>
              <div
                className="h-2.5 flex-1 max-w-xs rounded-full border border-border/60"
                style={{
                  background:
                    "linear-gradient(90deg, oklch(0.95 0.02 270), oklch(0.85 0.08 270), oklch(0.7 0.15 275), oklch(0.55 0.22 280), oklch(0.45 0.25 285))",
                }}
                aria-hidden
              />
              <span className="text-xs text-muted-foreground font-medium">
                مرتفع
              </span>
            </div>
          </Card>

          {/* Top 5 + Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Top 5 Best Times */}
            <Card className="p-4 sm:p-6 rounded-2xl gap-4">
              <h3 className="font-display text-lg font-bold flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-500" />
                أفضل 5 أوقات للنشر
              </h3>
              <div className="space-y-2.5">
                {data.bestTimes.map((bt, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-xl border transition-colors",
                      idx === 0
                        ? "bg-gradient-brand-soft border-primary/20"
                        : "bg-card border-border hover:bg-accent/50"
                    )}
                  >
                    <div
                      className={cn(
                        "shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold",
                        idx === 0
                          ? "bg-gradient-brand text-white shadow-brand"
                          : "bg-secondary text-foreground"
                      )}
                      aria-label={`المرتبة ${idx + 1}`}
                    >
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm">
                          {bt.day}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {bt.timeRange}
                        </span>
                        <Badge
                          className={cn(
                            "ml-auto text-xs gap-1 font-bold",
                            bt.score >= 80
                              ? "bg-gradient-brand text-white border-transparent"
                              : "bg-secondary text-foreground border-transparent"
                          )}
                        >
                          <TrendingUp className="w-3 h-3" />
                          {bt.score}%
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        {bt.reason}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Insights */}
            <Card className="p-4 sm:p-6 rounded-2xl gap-4">
              <h3 className="font-display text-lg font-bold flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                رؤى وتوصيات
              </h3>
              <ul className="space-y-3">
                {data.insights.map((insight, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <div className="shrink-0 w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center">
                      <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                    </div>
                    <p className="text-sm leading-relaxed pt-0.5">
                      {insight}
                    </p>
                  </li>
                ))}
              </ul>
              <Separator />
              <div className="flex items-start gap-2 text-xs text-muted-foreground">
                <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5 text-primary" />
                <span>
                  جميع الأوقات معروضة بالتوقيت المحلي: {data.timezone}
                </span>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
