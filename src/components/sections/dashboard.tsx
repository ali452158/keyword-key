"use client"

import * as React from "react"
import {
  TrendingUp,
  TrendingDown,
  Sparkles,
  ArrowLeft,
  Activity,
  Globe,
  BarChart3,
} from "lucide-react"
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Label,
  ResponsiveContainer,
} from "recharts"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { PlatformBadge } from "@/components/platform-icon"
import { KeywordCard } from "@/components/keyword-card"
import { PLATFORMS, PLATFORM_LIST } from "@/lib/platforms"
import { formatNumber } from "@/lib/format"
import type { Platform, KeywordTrend } from "@/lib/types"
import { cn } from "@/lib/utils"

interface DashboardProps {
  onNavigate: (tab: string, keyword?: string) => void
}

interface PlatformStat {
  platform: Platform
  name: string
  totalKeywords: number
  trendingToday: number
  avgGrowth: number
  topCategory: string
}

/* ------------------------------------------------------------------ */
/* Chart helpers                                                       */
/* ------------------------------------------------------------------ */

// Platform brand colors used across all three charts.
// TikTok uses its pink-red accent (#FE2C55) for visibility on white
// backgrounds (true brand black would be invisible in dark mode too).
const PLATFORM_COLORS: Record<Platform, string> = {
  tiktok: "#FE2C55",
  youtube: "#FF0000",
  instagram: "#E4405F",
  facebook: "#1877F2",
}

const PLATFORMS_FOR_CHART: Platform[] = [
  "tiktok",
  "youtube",
  "instagram",
  "facebook",
]

const ARABIC_DAYS = [
  "السبت",
  "الأحد",
  "الاثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة",
]

// Deterministic daily variation factors (no Math.random) so the chart
// stays stable across re-renders. Values mimic a weekly engagement curve
// where Thu/Fri (weekend in many Arabic locales) peak.
const DAILY_FACTORS = [0.82, 0.9, 0.98, 0.95, 1.08, 1.25, 1.18]

interface BarDatum {
  keyword: string
  tiktok: number
  youtube: number
  instagram: number
  facebook: number
}

interface AreaDatum {
  day: string
  tiktok: number
  youtube: number
  instagram: number
  facebook: number
}

interface PieDatum {
  name: string
  value: number
  color: string
  platform: Platform
}

/**
 * Group trends by keyword, summing each platform's volume. Returns the
 * top 5 keywords by total volume. Missing platform => 0.
 */
function buildBarChartData(trends: KeywordTrend[]): BarDatum[] {
  const grouped = new Map<string, BarDatum>()
  for (const t of trends) {
    let entry = grouped.get(t.keyword)
    if (!entry) {
      entry = {
        keyword: t.keyword,
        tiktok: 0,
        youtube: 0,
        instagram: 0,
        facebook: 0,
      }
      grouped.set(t.keyword, entry)
    }
    entry[t.platform] += t.searchVolume
  }
  return Array.from(grouped.values())
    .map((d) => ({
      datum: d,
      total: d.tiktok + d.youtube + d.instagram + d.facebook,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)
    .map((x) => x.datum)
}

/**
 * Build 7 days of stacked area data. For each platform we take its total
 * volume from the trends, divide by 7 to get a daily baseline, then apply
 * a per-day variation factor.
 */
function buildAreaChartData(trends: KeywordTrend[]): AreaDatum[] {
  const totals: Record<Platform, number> = {
    tiktok: 0,
    youtube: 0,
    instagram: 0,
    facebook: 0,
  }
  for (const t of trends) totals[t.platform] += t.searchVolume

  return ARABIC_DAYS.map((day, i) => {
    const f = DAILY_FACTORS[i]
    return {
      day,
      tiktok: Math.round((totals.tiktok / 7) * f),
      youtube: Math.round((totals.youtube / 7) * f),
      instagram: Math.round((totals.instagram / 7) * f),
      facebook: Math.round((totals.facebook / 7) * f),
    }
  })
}

/**
 * Count how many trends belong to each platform (count > 0 only).
 */
function buildPieChartData(trends: KeywordTrend[]): PieDatum[] {
  const counts: Record<Platform, number> = {
    tiktok: 0,
    youtube: 0,
    instagram: 0,
    facebook: 0,
  }
  for (const t of trends) counts[t.platform]++
  return PLATFORMS_FOR_CHART.filter((p) => counts[p] > 0).map((p) => ({
    name: PLATFORMS[p].arabicName,
    value: counts[p],
    color: PLATFORM_COLORS[p],
    platform: p,
  }))
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-popover border border-border rounded-lg p-2 shadow-md text-xs">
      {label && <p className="font-semibold mb-1">{label}</p>}
      {payload.map((p: any, i: number) => (
        <p key={i} className="flex items-center gap-1.5">
          <span
            className="w-2 h-2 rounded-full"
            style={{ background: p.color || p.fill }}
          />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-semibold">{formatNumber(p.value)}</span>
        </p>
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Dashboard component                                                 */
/* ------------------------------------------------------------------ */

export function Dashboard({ onNavigate }: DashboardProps) {
  const [stats, setStats] = React.useState<PlatformStat[]>([])
  const [trends, setTrends] = React.useState<KeywordTrend[]>([])
  const [loading, setLoading] = React.useState(true)
  const [activePlatform, setActivePlatform] = React.useState<
    Platform | "all"
  >("all")

  React.useEffect(() => {
    Promise.all([
      fetch("/api/stats").then((r) => r.json()),
      fetch("/api/trending?period=daily&limit=8").then((r) => r.json()),
    ])
      .then(([statsRes, trendsRes]) => {
        if (statsRes.success) setStats(statsRes.data.platforms)
        if (trendsRes.success) setTrends(trendsRes.data)
      })
      .finally(() => setLoading(false))
  }, [])

  const filteredTrends =
    activePlatform === "all"
      ? trends
      : trends.filter((t) => t.platform === activePlatform)

  // Derive chart data from the existing `trends` state (no extra fetch).
  const barData = React.useMemo(() => buildBarChartData(trends), [trends])
  const areaData = React.useMemo(() => buildAreaChartData(trends), [trends])
  const pieData = React.useMemo(() => buildPieChartData(trends), [trends])
  const pieTotal = React.useMemo(
    () => pieData.reduce((s, d) => s + d.value, 0),
    [pieData]
  )

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-brand p-6 sm:p-10 lg:p-14 text-white shadow-brand-lg">
        <div className="absolute inset-0 bg-grid-pattern opacity-20" />
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse-glow" />
        <div className="absolute -bottom-32 -right-16 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse-glow" />

        <div className="relative z-10 max-w-3xl">
          <Badge className="mb-4 bg-white/20 text-white border-white/30 backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5 ml-1.5" />
            منصة التحليل رقم 1 للسوشيال ميديا
          </Badge>
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight mb-4">
            اكتشف الكلمات المفتاحية الأكثر انتشاراً
            <br />
            <span className="text-white/90">
              على TikTok و YouTube و Instagram و Facebook
            </span>
          </h1>
          <p className="text-white/80 text-base sm:text-lg leading-relaxed mb-6 max-w-2xl">
            حلل الترندات اليومية، اكتشف فرص المحتوى، حلل منافسيك، وولّد أفكاراً
            إبداعية بضغطة زر — كل ذلك في منصة واحدة ذكية.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button
              size="lg"
              variant="secondary"
              className="bg-white text-primary hover:bg-white/90 font-bold rounded-xl"
              onClick={() => onNavigate("research")}
            >
              ابدأ البحث الآن
              <ArrowLeft className="w-4 h-4 mr-1" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="bg-white/10 text-white border-white/30 hover:bg-white/20 font-bold rounded-xl backdrop-blur-sm"
              onClick={() => onNavigate("generator")}
            >
              <Sparkles className="w-4 h-4 ml-1.5" />
              ولّد أفكار محتوى
            </Button>
          </div>

          {/* platform icons row */}
          <div className="flex items-center gap-4 mt-8 flex-wrap">
            {PLATFORM_LIST.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-2 text-white/90 text-sm font-medium"
              >
                <PlatformBadge platform={p.id} size="sm" />
                <span>{p.arabicName}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Grid */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-bold flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            نظرة عامة على المنصات
          </h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-36 rounded-2xl" />
              ))
            : stats.map((stat) => (
                <Card
                  key={stat.platform}
                  className="relative overflow-hidden p-4 sm:p-5 hover:shadow-brand transition-shadow cursor-pointer group"
                  onClick={() => {
                    setActivePlatform(stat.platform)
                    document
                      .getElementById("trending-grid")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <PlatformBadge platform={stat.platform} size="md" />
                    {stat.avgGrowth >= 0 ? (
                      <TrendingUp className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-rose-500" />
                    )}
                  </div>
                  <p className="text-2xl font-extrabold text-foreground">
                    {formatNumber(stat.totalKeywords)}
                  </p>
                  <p className="text-xs text-muted-foreground mb-2">
                    إجمالي الكلمات المفتاحية
                  </p>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground">
                      ترند اليوم:{" "}
                      <span className="font-bold text-primary">
                        {formatNumber(stat.trendingToday)}
                      </span>
                    </span>
                    <span
                      className={cn(
                        "font-bold",
                        stat.avgGrowth >= 0
                          ? "text-emerald-600"
                          : "text-rose-600"
                      )}
                    >
                      {stat.avgGrowth >= 0 ? "+" : ""}
                      {stat.avgGrowth}%
                    </span>
                  </div>
                </Card>
              ))}
        </div>
      </section>

      {/* Visual Analytics — charts section */}
      <section>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-4">
          <div>
            <h2 className="font-display text-xl font-bold flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              تحليلات بصرية
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              حجم البحث والانتشار عبر المنصات
            </p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-80 rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Chart 1 — Bar chart: search volume comparison */}
            <Card className="p-4 sm:p-5 gap-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4 text-primary" />
                  مقارنة حجم البحث بين المنصات
                </h3>
              </div>
              <div className="h-64 w-full -mx-1">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={barData}
                    margin={{ top: 8, right: 8, left: 0, bottom: 28 }}
                    barCategoryGap="28%"
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="currentColor"
                      className="text-border"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="keyword"
                      tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                      tickLine={false}
                      axisLine={false}
                      interval={0}
                      angle={-20}
                      textAnchor="end"
                      height={48}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                      tickLine={false}
                      axisLine={false}
                      width={38}
                      tickFormatter={(v: number) => formatNumber(v)}
                    />
                    <Tooltip
                      content={<ChartTooltip />}
                      cursor={{
                        fill: "var(--accent)",
                        opacity: 0.35,
                      }}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: 11, paddingTop: 4 }}
                      iconType="circle"
                      iconSize={8}
                    />
                    <Bar
                      dataKey="tiktok"
                      name="تيك توك"
                      fill={PLATFORM_COLORS.tiktok}
                      radius={[4, 4, 0, 0]}
                      maxBarSize={22}
                    />
                    <Bar
                      dataKey="youtube"
                      name="يوتيوب"
                      fill={PLATFORM_COLORS.youtube}
                      radius={[4, 4, 0, 0]}
                      maxBarSize={22}
                    />
                    <Bar
                      dataKey="instagram"
                      name="انستجرام"
                      fill={PLATFORM_COLORS.instagram}
                      radius={[4, 4, 0, 0]}
                      maxBarSize={22}
                    />
                    <Bar
                      dataKey="facebook"
                      name="فيسبوك"
                      fill={PLATFORM_COLORS.facebook}
                      radius={[4, 4, 0, 0]}
                      maxBarSize={22}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Chart 2 — Area chart: weekly spread trend */}
            <Card className="p-4 sm:p-5 gap-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4 text-primary" />
                  اتجاه الانتشار خلال الأسبوع
                </h3>
              </div>
              <div className="h-64 w-full -mx-1">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={areaData}
                    margin={{ top: 8, right: 8, left: 0, bottom: 8 }}
                  >
                    <defs>
                      {PLATFORMS_FOR_CHART.map((p) => (
                        <linearGradient
                          key={p}
                          id={`grad-${p}`}
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor={PLATFORM_COLORS[p]}
                            stopOpacity={0.4}
                          />
                          <stop
                            offset="100%"
                            stopColor={PLATFORM_COLORS[p]}
                            stopOpacity={0.05}
                          />
                        </linearGradient>
                      ))}
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="currentColor"
                      className="text-border"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="day"
                      tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                      tickLine={false}
                      axisLine={false}
                      interval={0}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                      tickLine={false}
                      axisLine={false}
                      width={38}
                      tickFormatter={(v: number) => formatNumber(v)}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Legend
                      wrapperStyle={{ fontSize: 11, paddingTop: 4 }}
                      iconType="circle"
                      iconSize={8}
                    />
                    {PLATFORMS_FOR_CHART.map((p) => (
                      <Area
                        key={p}
                        type="monotone"
                        dataKey={p}
                        name={PLATFORMS[p].arabicName}
                        stackId="1"
                        stroke={PLATFORM_COLORS[p]}
                        strokeWidth={2}
                        fill={`url(#grad-${p})`}
                        dot={false}
                        activeDot={{ r: 3, strokeWidth: 0 }}
                      />
                    ))}
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Chart 3 — Donut: trends distribution per platform */}
            <Card className="p-4 sm:p-5 gap-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4 text-primary" />
                  توزيع الترندات حسب المنصة
                </h3>
              </div>
              <div className="h-64 w-full -mx-1 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="48%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={2}
                      stroke="none"
                    >
                      {pieData.map((d) => (
                        <Cell key={d.platform} fill={d.color} />
                      ))}
                      <Label
                        content={(props: any) => {
                          const { cx, cy } = props.viewBox ?? {}
                          if (cx == null || cy == null) return null
                          return (
                            <g>
                              <text
                                x={cx}
                                y={cy - 4}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                style={{
                                  fontSize: 22,
                                  fontWeight: 800,
                                  fill: "var(--foreground)",
                                }}
                              >
                                {pieTotal}
                              </text>
                              <text
                                x={cx}
                                y={cy + 14}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                style={{
                                  fontSize: 10,
                                  fill: "var(--muted-foreground)",
                                }}
                              >
                                إجمالي الترندات
                              </text>
                            </g>
                          )
                        }}
                      />
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                    <Legend
                      wrapperStyle={{ fontSize: 11, paddingTop: 4 }}
                      iconType="circle"
                      iconSize={8}
                      formatter={(value: string, entry: any) => {
                        const total = pieTotal || 1
                        const pct = Math.round(
                          ((entry?.payload?.value ?? 0) / total) * 100
                        )
                        return (
                          <span
                            style={{ color: "var(--foreground)" }}
                            className="text-[11px]"
                          >
                            {value} · {entry?.payload?.value ?? 0} ({pct}%)
                          </span>
                        )
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        )}
      </section>

      {/* Trending Keywords */}
      <section id="trending-grid">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="font-display text-xl font-bold flex items-center gap-2">
              <Globe className="w-5 h-5 text-primary" />
              الكلمات الأكثر انتشاراً اليوم
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              ترندات حية من جميع المنصات
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="rounded-lg"
            onClick={() => onNavigate("trends")}
          >
            عرض كل الترندات
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
          </Button>
        </div>

        {/* Platform filter chips */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scroll-area-brand">
          <button
            onClick={() => setActivePlatform("all")}
            className={cn(
              "shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-all",
              activePlatform === "all"
                ? "bg-gradient-brand text-white shadow-brand"
                : "bg-secondary text-secondary-foreground hover:bg-accent"
            )}
          >
            الكل
          </button>
          {PLATFORM_LIST.map((p) => (
            <button
              key={p.id}
              onClick={() => setActivePlatform(p.id)}
              className={cn(
                "shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5",
                activePlatform === p.id
                  ? "bg-gradient-brand text-white shadow-brand"
                  : "bg-secondary text-secondary-foreground hover:bg-accent"
              )}
            >
              <PlatformBadge platform={p.id} size="sm" className="scale-75 origin-center" />
              {p.arabicName}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-36 rounded-2xl" />
              ))
            : filteredTrends.slice(0, 8).map((trend) => (
                <KeywordCard
                  key={trend.id}
                  trend={trend}
                  onSelect={(t) => onNavigate("research", t.keyword)}
                />
              ))}
        </div>
      </section>
    </div>
  )
}
