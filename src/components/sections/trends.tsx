"use client"

import * as React from "react"
import {
  Flame,
  TrendingUp,
  Globe,
  MapPin,
  CalendarDays,
  Filter,
  ArrowLeft,
  Sparkles,
  AlertCircle,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select"
import { PlatformBadge } from "@/components/platform-icon"
import { KeywordCard } from "@/components/keyword-card"
import { PLATFORM_LIST, COUNTRIES, COUNTRY_MAP } from "@/lib/platforms"
import { useToast } from "@/hooks/use-toast"
import type {
  Platform,
  Country,
  TrendPeriod,
  KeywordTrend,
} from "@/lib/types"
import { cn } from "@/lib/utils"

interface TrendsProps {
  onNavigate: (tab: string, keyword?: string) => void
}

const PERIOD_OPTIONS: { value: TrendPeriod; label: string }[] = [
  { value: "daily", label: "يومي" },
  { value: "weekly", label: "أسبوعي" },
]

export function Trends({ onNavigate }: TrendsProps) {
  const { toast } = useToast()

  const [period, setPeriod] = React.useState<TrendPeriod>("daily")
  const [platform, setPlatform] = React.useState<Platform | "all">("all")
  const [country, setCountry] = React.useState<Country>("global")

  const [trends, setTrends] = React.useState<KeywordTrend[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [live, setLive] = React.useState(false)

  const fetchTrends = React.useCallback(() => {
    setLoading(true)
    setError(null)

    const params = new URLSearchParams({
      country,
      period,
      limit: "12",
    })
    if (platform !== "all") params.set("platform", platform)

    fetch(`/api/trending?${params.toString()}`)
      .then((r) => {
        if (!r.ok) throw new Error("فشل الاتصال بالخادم")
        return r.json()
      })
      .then((res) => {
        if (res.success) {
          setTrends(res.data)
          setLive(!!res.meta?.live)
        } else {
          throw new Error(res.message || "فشل تحميل الترندات")
        }
      })
      .catch((err) => {
        const msg =
          err instanceof Error ? err.message : "حدث خطأ غير متوقع"
        setError(msg)
        toast({
          title: "خطأ في تحميل الترندات",
          description: msg,
          variant: "destructive",
        })
      })
      .finally(() => setLoading(false))
  }, [country, period, platform, toast])

  React.useEffect(() => {
    fetchTrends()
  }, [fetchTrends])

  const selectedCountry = COUNTRY_MAP[country]
  const periodLabel =
    PERIOD_OPTIONS.find((p) => p.value === period)?.label || "يومي"

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex flex-col gap-1.5">
        <h2 className="font-display text-xl font-bold flex items-center gap-2">
          <Flame className="w-5 h-5 text-primary" />
          الترندات اليومية والأسبوعية
        </h2>
        <p className="text-sm text-muted-foreground flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5" />
          تابع أحدث الكلمات المفتاحية الرائجة عبر جميع المنصات والدول
        </p>
      </div>

      {/* Summary Banner */}
      <Card className="relative overflow-hidden border-0 bg-gradient-brand text-white shadow-brand-lg rounded-2xl">
        <div className="absolute inset-0 bg-grid-pattern opacity-20" />
        <div className="absolute -top-20 -left-20 w-56 h-56 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -right-16 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
        <div className="relative z-10 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center shrink-0">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-extrabold leading-none">
                  {loading ? "—" : trends.length}
                </span>
                <span className="text-sm text-white/80 font-medium">
                  كلمة مفتاحية رائجة
                </span>
              </div>
              <p className="text-xs sm:text-sm text-white/70 mt-1">
                ترندات {periodLabel} من {selectedCountry.flag}{" "}
                {selectedCountry.name}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {live && (
              <Badge className="bg-emerald-500/25 text-white border-emerald-300/40 backdrop-blur-sm gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75 animate-ping" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-300" />
                </span>
                بيانات حقيقية مباشرة
              </Badge>
            )}
            <Badge className="bg-white/15 text-white border-white/25 backdrop-blur-sm gap-1.5">
              <CalendarDays className="w-3.5 h-3.5" />
              {periodLabel}
            </Badge>
            <Badge className="bg-white/15 text-white border-white/25 backdrop-blur-sm gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              {selectedCountry.flag} {selectedCountry.name}
            </Badge>
            <Badge className="bg-white/15 text-white border-white/25 backdrop-blur-sm gap-1.5">
              <Filter className="w-3.5 h-3.5" />
              {platform === "all"
                ? "كل المنصات"
                : PLATFORM_LIST.find((p) => p.id === platform)?.arabicName}
            </Badge>
          </div>
        </div>
      </Card>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        {/* Period toggle (segmented control) */}
        <div className="inline-flex items-center bg-secondary rounded-xl p-1 gap-1 self-start">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setPeriod(opt.value)}
              aria-pressed={period === opt.value}
              className={cn(
                "px-4 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5",
                period === opt.value
                  ? "bg-gradient-brand text-white shadow-brand"
                  : "text-secondary-foreground hover:bg-accent"
              )}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              {opt.label}
            </button>
          ))}
        </div>

        {/* Platform chips */}
        <div className="flex-1 min-w-0">
          <div className="flex gap-2 overflow-x-auto pb-1 scroll-area-brand">
            <button
              type="button"
              onClick={() => setPlatform("all")}
              aria-pressed={platform === "all"}
              className={cn(
                "shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5",
                platform === "all"
                  ? "bg-gradient-brand text-white shadow-brand"
                  : "bg-secondary text-secondary-foreground hover:bg-accent"
              )}
            >
              <Globe className="w-3.5 h-3.5" />
              الكل
            </button>
            {PLATFORM_LIST.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPlatform(p.id)}
                aria-pressed={platform === p.id}
                className={cn(
                  "shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5",
                  platform === p.id
                    ? "bg-gradient-brand text-white shadow-brand"
                    : "bg-secondary text-secondary-foreground hover:bg-accent"
                )}
              >
                <PlatformBadge
                  platform={p.id}
                  size="sm"
                  className="scale-75 origin-center"
                />
                {p.arabicName}
              </button>
            ))}
          </div>
        </div>

        {/* Country select */}
        <div className="self-start sm:self-auto">
          <label htmlFor="country-select" className="sr-only">
            اختر الدولة
          </label>
          <Select
            value={country}
            onValueChange={(v) => setCountry(v as Country)}
          >
            <SelectTrigger
              id="country-select"
              size="default"
              className="w-full sm:w-[180px] rounded-xl"
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

      {/* Results count */}
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {loading
            ? "جارٍ تحميل الترندات..."
            : `عرض ${trends.length} ترند`}
        </p>
        {!loading && trends.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground hover:text-primary"
            onClick={() => onNavigate("research")}
          >
            بحث متقدم
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
          </Button>
        )}
      </div>

      {/* Results Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-2xl" />
          ))}
        </div>
      ) : error ? (
        <Card className="p-8 text-center border-destructive/30 bg-destructive/5">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-destructive" />
            </div>
            <p className="text-sm font-semibold text-foreground">
              تعذّر تحميل الترندات
            </p>
            <p className="text-xs text-muted-foreground max-w-sm">{error}</p>
            <Button
              size="sm"
              variant="outline"
              className="mt-2 rounded-lg"
              onClick={fetchTrends}
            >
              إعادة المحاولة
            </Button>
          </div>
        </Card>
      ) : trends.length === 0 ? (
        <Card className="p-10 text-center border-dashed">
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center">
              <Flame className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-semibold text-foreground">
              لا توجد ترندات مطابقة للفلتر المحدد
            </p>
            <p className="text-xs text-muted-foreground">
              جرّب تغيير المنصة أو الدولة أو الفترة الزمنية
            </p>
            <Button
              size="sm"
              variant="outline"
              className="mt-2 rounded-lg"
              onClick={() => {
                setPeriod("daily")
                setPlatform("all")
                setCountry("global")
              }}
            >
              إعادة ضبط الفلاتر
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {trends.map((trend) => (
            <KeywordCard
              key={trend.id}
              trend={trend}
              onSelect={(t) => onNavigate("research", t.keyword)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
