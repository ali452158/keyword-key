"use client"

import * as React from "react"
import {
  TrendingUp,
  TrendingDown,
  Sparkles,
  ArrowLeft,
  Activity,
  Globe,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { PlatformBadge } from "@/components/platform-icon"
import { KeywordCard } from "@/components/keyword-card"
import { PLATFORM_LIST } from "@/lib/platforms"
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
