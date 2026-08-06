"use client"

import * as React from "react"
import {
  Hash,
  Copy,
  Check,
  Sparkles,
  Lightbulb,
  Loader2,
  TrendingUp,
  Target,
  AlertCircle,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { PlatformBadge } from "@/components/platform-icon"
import { PLATFORMS } from "@/lib/platforms"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import type { Platform } from "@/lib/types"

interface HashtagsResult {
  hashtags: string[]
  mix: string
  reach: string
  tips: string[]
}

const COUNT_OPTIONS = [10, 20, 30] as const

const LOADING_MESSAGES = [
  "الذكاء الاصطناعي يولّد أفضل الهاشتاجات...",
  "يحلّل المنصة ويختار الترندات المناسبة...",
  "يوازن بين الهاشتاجات العامة والنيش...",
  "يكتب لك نصائح للاستخدام الأمثل...",
]

export function HashtagGenerator() {
  const { toast } = useToast()

  const [keyword, setKeyword] = React.useState("")
  const [platform, setPlatform] = React.useState<Platform>("tiktok")
  const [count, setCount] = React.useState<number>(20)

  const [loading, setLoading] = React.useState(false)
  const [result, setResult] = React.useState<HashtagsResult | null>(null)
  const [hasGenerated, setHasGenerated] = React.useState(false)
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null)

  const [copiedAll, setCopiedAll] = React.useState(false)
  const [copiedTag, setCopiedTag] = React.useState<string | null>(null)
  const [loadingMsgIdx, setLoadingMsgIdx] = React.useState(0)

  const platformEntries = Object.values(PLATFORMS)

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
    setErrorMsg(null)
    try {
      const res = await fetch("/api/tools/hashtags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: kw, platform: plat, count: cnt }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json?.error || "فشل توليد الهاشتاجات")
      }
      const data: HashtagsResult = json.data
      setResult(data)
      setHasGenerated(true)
      toast({
        title: "تم توليد الهاشتاجات",
        description: `${data.hashtags.length} هاشتاج جاهز للاستخدام`,
      })
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "حدث خطأ غير متوقع"
      setErrorMsg(message)
      setResult(null)
      setHasGenerated(true)
      toast({
        title: "تعذّر توليد الهاشتاجات",
        description: message,
        variant: "destructive",
      })
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
        description: "أدخل كلمة أو موضوع لتوليد الهاشتاجات",
        variant: "destructive",
      })
      return
    }
    void generate(trimmed, platform, count)
  }

  async function handleCopyAll() {
    if (!result?.mix) return
    try {
      await navigator.clipboard.writeText(result.mix)
      setCopiedAll(true)
      toast({ title: "تم نسخ الهاشتاجات" })
      window.setTimeout(() => setCopiedAll(false), 1800)
    } catch {
      toast({
        title: "تعذّر النسخ",
        description: "لم نتمكن من الوصول إلى الحافظة",
        variant: "destructive",
      })
    }
  }

  async function handleCopyTag(tag: string) {
    try {
      await navigator.clipboard.writeText(tag)
      setCopiedTag(tag)
      toast({ title: "تم النسخ", description: tag })
      window.setTimeout(() => {
        setCopiedTag((t) => (t === tag ? null : t))
      }, 1500)
    } catch {
      toast({
        title: "تعذّر النسخ",
        description: "لم نتمكن من الوصول إلى الحافظة",
        variant: "destructive",
      })
    }
  }

  const showLoading = loading
  const showResults = !loading && !errorMsg && result && result.hashtags.length > 0
  const showEmpty = !loading && !errorMsg && (!hasGenerated || !result)
  const showError = !loading && !!errorMsg

  return (
    <section className="space-y-6">
      {/* Tool header */}
      <header className="flex items-start gap-3">
        <div className="bg-gradient-brand text-white p-3 rounded-2xl shadow-brand shrink-0">
          <Hash className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h2 className="font-display text-xl font-bold flex items-center gap-2">
            مولّد الهاشتاجات
          </h2>
          <p className="text-sm text-muted-foreground">
            ولّد مجموعات هاشتاجات محسّنة لكل منصة
          </p>
        </div>
      </header>

      {/* Input card */}
      <Card className="bg-gradient-brand-soft border-primary/20 shadow-brand overflow-hidden">
        <CardContent className="p-5 sm:p-6 space-y-5">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Keyword */}
            <div className="space-y-2">
              <label htmlFor="hashtag-keyword" className="text-sm font-semibold">
                الكلمة أو الموضوع
              </label>
              <div className="relative">
                <Hash className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="hashtag-keyword"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="مثال: مكياج، طبخ، تكنولوجيا، لياقة..."
                  className="pr-9 h-11 bg-background/70 border-primary/20 focus-visible:border-primary"
                  disabled={loading}
                  aria-describedby="hashtag-keyword-help"
                />
              </div>
              <p
                id="hashtag-keyword-help"
                className="text-xs text-muted-foreground"
              >
                اكتب الكلمة المفتاحية التي يركز عليها محتواك
              </p>
            </div>

            {/* Platform selector */}
            <div className="space-y-2">
              <label className="text-sm font-semibold">المنصة</label>
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="اختر المنصة">
                {platformEntries.map((p) => {
                  const selected = platform === p.id
                  return (
                    <button
                      key={p.id}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => setPlatform(p.id)}
                      disabled={loading}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-xl border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed",
                        selected
                          ? "bg-gradient-brand text-white border-transparent shadow-brand"
                          : "bg-background/70 border-border hover:border-primary/40 hover:bg-accent"
                      )}
                    >
                      <PlatformBadge platform={p.id} size="sm" />
                      <span className="text-sm font-medium">{p.arabicName}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Count selector */}
            <div className="space-y-2">
              <label className="text-sm font-semibold">عدد الهاشتاجات</label>
              <div
                className="inline-flex p-1 bg-background/70 border border-border rounded-lg gap-1"
                role="radiogroup"
                aria-label="عدد الهاشتاجات"
              >
                {COUNT_OPTIONS.map((opt) => {
                  const selected = count === opt
                  return (
                    <button
                      key={opt}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => setCount(opt)}
                      disabled={loading}
                      className={cn(
                        "px-4 py-1.5 rounded-md text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:cursor-not-allowed min-w-[3rem]",
                        selected
                          ? "bg-gradient-brand text-white shadow-sm"
                          : "text-muted-foreground hover:text-foreground hover:bg-accent"
                      )}
                    >
                      {opt}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Generate button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-gradient-brand text-white hover:opacity-90 shadow-brand"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  جاري التوليد...
                </>
              ) : (
                <>
                  <Hash className="w-4 h-4" />
                  ولّد الهاشتاجات
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Loading state */}
      {showLoading && (
        <Card className="border-primary/20">
          <CardContent className="p-6 space-y-5">
            <div className="flex items-center gap-3 bg-gradient-brand-soft rounded-xl p-4 border border-primary/10">
              <div className="bg-gradient-brand text-white p-2.5 rounded-xl shrink-0">
                <Hash className="w-5 h-5 animate-pulse" />
              </div>
              <div className="space-y-1.5 min-w-0 flex-1">
                <p className="text-sm font-semibold text-gradient-brand">
                  {LOADING_MESSAGES[loadingMsgIdx]}
                </p>
                <div className="h-1.5 w-full rounded-full bg-primary/10 overflow-hidden">
                  <div className="h-full w-1/3 bg-gradient-brand animate-pulse" />
                </div>
              </div>
              <Loader2 className="w-5 h-5 animate-spin text-primary shrink-0" />
            </div>

            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 12 }).map((_, i) => (
                <Skeleton
                  key={i}
                  className="h-8 rounded-lg"
                  style={{ width: `${60 + ((i * 13) % 60)}px` }}
                />
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Skeleton className="h-16 rounded-xl" />
              <Skeleton className="h-16 rounded-xl" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {showResults && result && (
        <div className="space-y-4">
          {/* Copy bar */}
          <Card className="bg-gradient-brand-soft border-primary/20 shadow-brand">
            <CardContent className="p-4 flex flex-wrap items-center gap-3 justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="bg-gradient-brand text-white p-2 rounded-lg shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold">
                    {result.hashtags.length} هاشتاج جاهز للاستخدام
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    انسخها جميعاً أو اضغط على أي هاشتاج لنسخه فردياً
                  </p>
                </div>
              </div>
              <Button
                type="button"
                onClick={handleCopyAll}
                className="bg-gradient-brand text-white hover:opacity-90 shadow-brand shrink-0"
              >
                {copiedAll ? (
                  <>
                    <Check className="w-4 h-4" />
                    تم النسخ
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    نسخ الكل
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Reach badge */}
          {result.reach && (
            <div className="flex flex-wrap items-center gap-3">
              <Badge
                variant="outline"
                className="gap-1.5 px-3 py-1 text-sm bg-background/70 border-primary/30"
              >
                <TrendingUp className="w-3.5 h-3.5 text-primary" />
                <span className="text-muted-foreground font-normal">
                  تقدير الوصول:
                </span>
                <span className="text-gradient-brand font-bold">
                  {result.reach}
                </span>
              </Badge>
              <Badge
                variant="outline"
                className="gap-1.5 px-3 py-1 text-sm bg-background/70"
              >
                <Target className="w-3.5 h-3.5 text-primary" />
                <span className="text-muted-foreground font-normal">
                  المنصة:
                </span>
                <span className="font-semibold">{PLATFORMS[platform].arabicName}</span>
              </Badge>
            </div>
          )}

          {/* Hashtag grid */}
          <Card>
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Hash className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-bold">الهاشتاجات المقترحة</h3>
                <Separator className="flex-1" />
              </div>
              <div className="flex flex-wrap gap-2">
                {result.hashtags.map((tag, idx) => {
                  const copied = copiedTag === tag
                  return (
                    <button
                      key={`${tag}-${idx}`}
                      type="button"
                      onClick={() => handleCopyTag(tag)}
                      title="اضغط للنسخ"
                      aria-label={`نسخ الهاشتاج ${tag}`}
                      className={cn(
                        "group inline-flex items-center gap-1.5 bg-secondary hover:bg-accent px-3 py-1.5 rounded-lg text-sm font-medium cursor-pointer transition-all border border-transparent hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                        copied && "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-950/60"
                      )}
                    >
                      <span dir="ltr" className="truncate max-w-[14rem]">
                        {tag}
                      </span>
                      {copied ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      ) : (
                        <Copy className="w-3 h-3 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
                      )}
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Tips section */}
          {result.tips.length > 0 && (
            <Card className="border-primary/20">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="bg-gradient-brand text-white p-1.5 rounded-lg shrink-0">
                    <Lightbulb className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold">نصائح للاستخدام الأمثل</h3>
                  <Separator className="flex-1" />
                </div>
                <ul className="space-y-2.5">
                  {result.tips.map((tip, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2.5 text-sm leading-relaxed"
                    >
                      <span className="bg-gradient-brand text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="text-foreground/90">{tip}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Empty state */}
      {showEmpty && (
        <Card className="border-dashed border-2 border-border/70">
          <CardContent className="p-10 sm:p-14 flex flex-col items-center justify-center text-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-brand opacity-20 blur-2xl rounded-full" />
              <div className="relative bg-gradient-brand-soft p-5 rounded-2xl border border-primary/20">
                <Hash className="w-10 h-10 text-primary" />
              </div>
            </div>
            <div className="space-y-1.5">
              <p className="text-base font-bold">ابدأ بتوليد الهاشتاجات</p>
              <p className="text-sm text-muted-foreground max-w-md">
                أدخل كلمة أو موضوع لتوليد هاشتاجات محسّنة
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              <Badge variant="outline" className="gap-1 text-xs">
                <Sparkles className="w-3 h-3 text-primary" />
                مدعوم بالذكاء الاصطناعي
              </Badge>
              <Badge variant="outline" className="text-xs">
                4 منصات
              </Badge>
              <Badge variant="outline" className="text-xs">
                حتى 30 هاشتاج
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error state */}
      {showError && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-6 flex flex-col items-center text-center gap-3">
            <div className="bg-destructive/10 text-destructive p-3 rounded-2xl">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-destructive">
                تعذّر توليد الهاشتاجات
              </p>
              <p className="text-xs text-muted-foreground">{errorMsg}</p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (keyword.trim()) void generate(keyword.trim(), platform, count)
              }}
              disabled={loading}
              className="gap-2"
            >
              <Loader2 className={cn("w-4 h-4", loading && "animate-spin")} />
              إعادة المحاولة
            </Button>
          </CardContent>
        </Card>
      )}
    </section>
  )
}
