"use client"

import * as React from "react"
import {
  FileText,
  Clapperboard,
  Zap,
  BookOpen,
  Mic,
  Camera,
  Megaphone,
  Flag,
  Lightbulb,
  Copy,
  Check,
  Loader2,
  GraduationCap,
  Smile,
  Sparkles,
  Laugh,
  Clock,
  AlertCircle,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { PlatformBadge } from "@/components/platform-icon"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import type { Platform } from "@/lib/types"

type Duration = "short" | "medium" | "long"
type Tone = "educational" | "entertainment" | "inspirational" | "comedic"

interface ScriptScene {
  title: string
  narration: string
  visual: string
}

interface ScriptData {
  hook: string
  intro: string
  scenes: ScriptScene[]
  cta: string
  outro: string
  estimatedDuration: string
  tips: string[]
}

const PLATFORM_OPTIONS: Platform[] = ["youtube", "tiktok", "instagram", "facebook"]

const DURATION_OPTIONS: {
  id: Duration
  label: string
  subtitle: string
}[] = [
  { id: "short", label: "قصير", subtitle: "15-30 ث" },
  { id: "medium", label: "متوسط", subtitle: "1-3 د" },
  { id: "long", label: "طويل", subtitle: "5-10 د" },
]

const TONE_OPTIONS: {
  id: Tone
  label: string
  icon: React.ElementType
}[] = [
  { id: "educational", label: "تعليمي", icon: GraduationCap },
  { id: "entertainment", label: "ترفيهي", icon: Smile },
  { id: "inspirational", label: "ملهم", icon: Sparkles },
  { id: "comedic", label: "كوميدي", icon: Laugh },
]

const LOADING_MESSAGES = [
  "يكتب الذكاء الاصطناعي السكربت...",
  "يصمم المشاهد...",
  "يحسّن الجملة الافتتاحية...",
]

export function ScriptGenerator() {
  const { toast } = useToast()

  const [topic, setTopic] = React.useState("")
  const [platform, setPlatform] = React.useState<Platform>("youtube")
  const [duration, setDuration] = React.useState<Duration>("medium")
  const [tone, setTone] = React.useState<Tone>("educational")

  const [loading, setLoading] = React.useState(false)
  const [script, setScript] = React.useState<ScriptData | null>(null)
  const [hasGenerated, setHasGenerated] = React.useState(false)

  const [copiedFull, setCopiedFull] = React.useState(false)
  const [loadingMsgIdx, setLoadingMsgIdx] = React.useState(0)

  // Rotate loading messages
  React.useEffect(() => {
    if (!loading) return
    setLoadingMsgIdx(0)
    const id = window.setInterval(() => {
      setLoadingMsgIdx((i) => (i + 1) % LOADING_MESSAGES.length)
    }, 3000)
    return () => window.clearInterval(id)
  }, [loading])

  async function generate() {
    const trimmed = topic.trim()
    if (!trimmed) {
      toast({
        title: "حقل مطلوب",
        description: "أدخل موضوع الفيديو لتوليد السكربت",
        variant: "destructive",
      })
      return
    }
    if (!platform) {
      toast({
        title: "اختيار مطلوب",
        description: "اختر المنصة المستهدفة",
        variant: "destructive",
      })
      return
    }
    if (!duration) {
      toast({
        title: "اختيار مطلوب",
        description: "اختر مدة الفيديو",
        variant: "destructive",
      })
      return
    }
    if (!tone) {
      toast({
        title: "اختيار مطلوب",
        description: "اختر نبرة الفيديو",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/tools/script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: trimmed,
          platform,
          duration,
          tone,
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json?.error || "فشل توليد السكربت")
      }
      const data: ScriptData = json.data
      setScript(data)
      setHasGenerated(true)
      toast({
        title: "تم توليد السكربت بنجاح",
        description: `${data.scenes.length} مشاهد • ${data.estimatedDuration}`,
      })
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "حدث خطأ غير متوقع"
      toast({
        title: "تعذّر توليد السكربت",
        description: message,
        variant: "destructive",
      })
      setScript(null)
      setHasGenerated(true)
    } finally {
      setLoading(false)
    }
  }

  function formatScriptForCopy(s: ScriptData): string {
    const lines: string[] = []
    lines.push("🎬 سكربت الفيديو")
    lines.push("═══════════════════════")
    lines.push("")
    lines.push(`⚡ الجملة الافتتاحية (Hook):`)
    lines.push(s.hook)
    lines.push("")
    lines.push(`📖 المقدمة:`)
    lines.push(s.intro)
    lines.push("")
    lines.push(`🎬 المشاهد (${s.scenes.length}):`)
    s.scenes.forEach((sc, i) => {
      lines.push("")
      lines.push(`  المشهد ${i + 1}: ${sc.title}`)
      lines.push(`  • التعليق الصوتي: ${sc.narration}`)
      lines.push(`  • المشهد البصري: ${sc.visual}`)
    })
    lines.push("")
    lines.push(`📢 دعوة لإجراء (CTA):`)
    lines.push(s.cta)
    lines.push("")
    lines.push(`🏁 الخاتمة:`)
    lines.push(s.outro)
    lines.push("")
    lines.push(`⏱️ المدة المقدّرة: ${s.estimatedDuration}`)
    if (s.tips.length > 0) {
      lines.push("")
      lines.push(`💡 نصائح للتصوير والمونتاج:`)
      s.tips.forEach((t, i) => {
        lines.push(`  ${i + 1}. ${t}`)
      })
    }
    return lines.join("\n")
  }

  async function handleCopyFull() {
    if (!script) return
    try {
      await navigator.clipboard.writeText(formatScriptForCopy(script))
      setCopiedFull(true)
      window.setTimeout(() => setCopiedFull(false), 2000)
      toast({
        title: "تم نسخ السكربت",
        description: "السكربت الكامل جاهز للصق في أي مكان",
      })
    } catch {
      toast({
        title: "تعذّر النسخ",
        description: "حاول مرة أخرى",
        variant: "destructive",
      })
    }
  }

  return (
    <section className="w-full">
      {/* Tool header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="bg-gradient-brand shadow-brand flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white">
            <Clapperboard className="h-6 w-6" />
          </div>
          <div>
            <h2 className="font-display text-xl font-bold sm:text-2xl">
              مولّد سكربتات الفيديو
            </h2>
            <p className="text-muted-foreground mt-0.5 text-sm">
              سكربت كامل جاهز للتصوير بالذكاء الاصطناعي
            </p>
          </div>
        </div>
        {script && (
          <Badge
            variant="secondary"
            className="bg-gradient-brand-soft border-primary/20 w-fit shrink-0"
          >
            <Clock className="ml-1 h-3 w-3" />
            {script.estimatedDuration}
          </Badge>
        )}
      </div>

      <Separator className="my-6" />

      {/* Input card */}
      <Card className="bg-gradient-brand-soft border-primary/20 shadow-brand">
        <CardContent className="flex flex-col gap-5 p-4 sm:p-6">
          {/* Topic */}
          <div className="flex flex-col gap-2">
            <label
              htmlFor="script-topic"
              className="flex items-center gap-2 text-sm font-semibold"
            >
              <FileText className="text-primary h-4 w-4" />
              موضوع الفيديو
            </label>
            <Textarea
              id="script-topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="مثال: كيف تبدأ التداول في البورصة للمبتدئين، وصفة الكنافة النابلسية الأصلية، نصائح لتنظيم الوقت..."
              className="bg-background min-h-20 resize-y text-base"
              maxLength={300}
              disabled={loading}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault()
                  void generate()
                }
              }}
            />
            <span className="text-muted-foreground text-left text-xs">
              {topic.length}/300
            </span>
          </div>

          {/* Platform selector */}
          <div className="flex flex-col gap-2">
            <span className="text-sm font-semibold">المنصة المستهدفة</span>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {PLATFORM_OPTIONS.map((p) => {
                const selected = platform === p
                return (
                  <button
                    key={p}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setPlatform(p)}
                    disabled={loading}
                    className={cn(
                      "flex items-center justify-center gap-2 rounded-xl border p-2.5 transition-all",
                      "hover:shadow-brand focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-2",
                      selected
                        ? "bg-gradient-brand border-transparent text-white shadow-brand"
                        : "bg-card hover:border-primary/40"
                    )}
                  >
                    <PlatformBadge platform={p} size="sm" />
                    <span className="text-sm font-semibold">
                      {p === "tiktok"
                        ? "تيك توك"
                        : p === "youtube"
                          ? "يوتيوب"
                          : p === "instagram"
                            ? "انستجرام"
                            : "فيسبوك"}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Duration selector */}
          <div className="flex flex-col gap-2">
            <span className="text-sm font-semibold">مدة الفيديو</span>
            <div className="bg-secondary inline-flex w-full rounded-xl p-1 sm:w-fit">
              {DURATION_OPTIONS.map((d) => {
                const selected = duration === d.id
                return (
                  <button
                    key={d.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setDuration(d.id)}
                    disabled={loading}
                    className={cn(
                      "flex flex-1 flex-col items-center justify-center rounded-lg px-3 py-2 transition-all sm:flex-none",
                      "focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-2",
                      selected
                        ? "bg-gradient-brand text-white shadow-brand"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <span className="text-sm font-bold">{d.label}</span>
                    <span
                      className={cn(
                        "text-xs",
                        selected ? "text-white/80" : "text-muted-foreground"
                      )}
                    >
                      {d.subtitle}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Tone selector */}
          <div className="flex flex-col gap-2">
            <span className="text-sm font-semibold">نبرة الفيديو</span>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {TONE_OPTIONS.map((t) => {
                const selected = tone === t.id
                const Icon = t.icon
                return (
                  <button
                    key={t.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setTone(t.id)}
                    disabled={loading}
                    className={cn(
                      "flex items-center justify-center gap-2 rounded-xl border p-2.5 transition-all",
                      "focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-2",
                      selected
                        ? "bg-gradient-brand border-transparent text-white shadow-brand"
                        : "bg-card hover:border-primary/40"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-sm font-semibold">{t.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Submit */}
          <Button
            type="button"
            onClick={() => void generate()}
            disabled={loading}
            className="bg-gradient-brand hover:shadow-brand-lg h-12 w-full text-base font-bold shadow-brand transition-all hover:opacity-95"
          >
            {loading ? (
              <>
                <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                جاري كتابة السكربت...
              </>
            ) : (
              <>
                <FileText className="ml-2 h-5 w-5" />
                ولّد السكربت
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Content area */}
      <div className="mt-6">
        {loading ? (
          <LoadingState messageIdx={loadingMsgIdx} />
        ) : script ? (
          <ScriptResult
            script={script}
            copiedFull={copiedFull}
            onCopyFull={handleCopyFull}
          />
        ) : hasGenerated ? (
          <ErrorState onRetry={() => void generate()} />
        ) : (
          <EmptyState />
        )}
      </div>
    </section>
  )
}

/* ---------------- Subcomponents ---------------- */

function EmptyState() {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center gap-4 px-4 py-16 text-center sm:py-20">
        <div className="bg-gradient-brand-soft relative flex h-20 w-20 items-center justify-center rounded-3xl">
          <div className="bg-gradient-brand shadow-brand-lg absolute flex h-16 w-16 items-center justify-center rounded-2xl text-white">
            <Clapperboard className="h-8 w-8" />
          </div>
        </div>
        <div className="space-y-1">
          <p className="font-display text-lg font-bold">
            أدخل موضوع الفيديو لتوليد سكربت احترافي
          </p>
          <p className="text-muted-foreground text-sm">
            اختر المنصة والمدة والنبرة، ودع الذكاء الاصطناعي يكتب لك سكربتاً متكاملاً
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <Card className="border-destructive/30 bg-destructive/5">
      <CardContent className="flex flex-col items-center justify-center gap-4 px-4 py-14 text-center">
        <div className="bg-destructive/10 flex h-14 w-14 items-center justify-center rounded-2xl text-destructive">
          <AlertCircle className="h-7 w-7" />
        </div>
        <div className="space-y-1">
          <p className="font-display text-lg font-bold">تعذّر توليد السكربت</p>
          <p className="text-muted-foreground text-sm">
            حدث خطأ أثناء كتابة السكربت. حاول مرة أخرى.
          </p>
        </div>
        <Button onClick={onRetry} variant="outline" className="gap-2">
          <Loader2 className="h-4 w-4" />
          إعادة المحاولة
        </Button>
      </CardContent>
    </Card>
  )
}

function LoadingState({ messageIdx }: { messageIdx: number }) {
  return (
    <div className="space-y-4">
      <Card className="bg-gradient-brand-soft border-primary/20 overflow-hidden">
        <CardContent className="flex items-center gap-4 p-4 sm:p-6">
          <div className="bg-gradient-brand shadow-brand flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-white">
            <Clapperboard className="h-7 w-7 animate-pulse" />
          </div>
          <div className="flex-1 space-y-2">
            <p className="font-display text-base font-bold">
              {LOADING_MESSAGES[messageIdx]}
            </p>
            <div className="bg-primary/20 h-1.5 w-full overflow-hidden rounded-full">
              <div className="bg-gradient-brand h-full w-1/3 animate-pulse rounded-full" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Skeleton: hook */}
      <Card className="bg-gradient-brand-soft">
        <CardContent className="space-y-3 p-4 sm:p-6">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-7 w-full" />
          <Skeleton className="h-7 w-3/4" />
        </CardContent>
      </Card>

      {/* Skeleton: scenes */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="space-y-3 p-4 sm:p-6">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-16 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

function ScriptResult({
  script,
  copiedFull,
  onCopyFull,
}: {
  script: ScriptData
  copiedFull: boolean
  onCopyFull: () => void
}) {
  return (
    <div className="space-y-4">
      {/* Copy full script bar */}
      <div className="bg-gradient-brand-soft border-primary/20 flex flex-col items-stretch justify-between gap-3 rounded-xl border p-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          <FileText className="text-primary h-5 w-5" />
          <span className="text-sm font-semibold">
            السكربت جاهز — انسخه كاملاً للصقه في أداة المونتاج أو المستند
          </span>
        </div>
        <Button
          onClick={onCopyFull}
          className="bg-gradient-brand hover:shadow-brand shrink-0 shadow-brand"
          size="sm"
        >
          {copiedFull ? (
            <>
              <Check className="ml-1.5 h-4 w-4" />
              تم النسخ
            </>
          ) : (
            <>
              <Copy className="ml-1.5 h-4 w-4" />
              نسخ السكربت كاملاً
            </>
          )}
        </Button>
      </div>

      {/* Hook card (most prominent) */}
      <Card className="border-primary/20 bg-gradient-brand overflow-hidden shadow-brand-lg">
        <CardContent className="p-5 text-white sm:p-7">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 backdrop-blur">
              <Zap className="h-5 w-5" />
            </div>
            <span className="font-display text-sm font-bold tracking-wide uppercase">
              الجملة الافتتاحية (Hook)
            </span>
          </div>
          <p className="text-xl leading-relaxed font-bold sm:text-2xl sm:leading-relaxed">
            {script.hook}
          </p>
          <p className="mt-3 text-sm text-white/70">
            أول 3 ثوانٍ تحدّد إن كان المشاهد سيكمل المشاهدة أم لا — اجعلها قوية!
          </p>
        </CardContent>
      </Card>

      {/* Intro */}
      <Card className="hover:shadow-brand transition-shadow">
        <CardContent className="flex flex-col gap-2 p-4 sm:p-6">
          <div className="flex items-center gap-2">
            <BookOpen className="text-primary h-5 w-5" />
            <h3 className="font-display text-base font-bold">المقدمة</h3>
          </div>
          <p className="text-foreground/90 leading-relaxed">{script.intro}</p>
        </CardContent>
      </Card>

      {/* Scenes */}
      <div className="space-y-3">
        <h2 className="font-display text-xl font-bold flex items-center gap-2">
          <Clapperboard className="text-primary h-5 w-5" />
          المشاهد ({script.scenes.length})
        </h2>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {script.scenes.map((scene, idx) => (
            <SceneCard key={idx} scene={scene} index={idx} />
          ))}
        </div>
      </div>

      {/* CTA + Outro grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card className="bg-gradient-brand-soft border-primary/20">
          <CardContent className="flex flex-col gap-2 p-4 sm:p-6">
            <div className="flex items-center gap-2">
              <Megaphone className="text-primary h-5 w-5" />
              <h3 className="font-display text-base font-bold">دعوة لإجراء</h3>
            </div>
            <p className="text-foreground/90 leading-relaxed font-medium">
              {script.cta}
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-brand transition-shadow">
          <CardContent className="flex flex-col gap-2 p-4 sm:p-6">
            <div className="flex items-center gap-2">
              <Flag className="text-primary h-5 w-5" />
              <h3 className="font-display text-base font-bold">الخاتمة</h3>
            </div>
            <p className="text-foreground/90 leading-relaxed">{script.outro}</p>
          </CardContent>
        </Card>
      </div>

      {/* Estimated duration badge row */}
      <div className="flex flex-wrap items-center gap-2">
        <Badge
          variant="secondary"
          className="bg-gradient-brand-soft border-primary/20 gap-1"
        >
          <Clock className="h-3 w-3" />
          المدة المقدّرة: {script.estimatedDuration}
        </Badge>
        <Badge variant="outline" className="gap-1">
          <Clapperboard className="h-3 w-3" />
          {script.scenes.length} مشهد
        </Badge>
      </div>

      {/* Tips */}
      {script.tips.length > 0 && (
        <Card className="hover:shadow-brand transition-shadow">
          <CardContent className="flex flex-col gap-3 p-4 sm:p-6">
            <div className="flex items-center gap-2">
              <div className="bg-gradient-brand-soft flex h-8 w-8 items-center justify-center rounded-lg">
                <Lightbulb className="text-primary h-4 w-4" />
              </div>
              <h3 className="font-display text-base font-bold">
                نصائح للتصوير والمونتاج
              </h3>
            </div>
            <ul className="space-y-2">
              {script.tips.map((tip, i) => (
                <li
                  key={i}
                  className="bg-accent/40 flex items-start gap-2 rounded-lg p-2.5"
                >
                  <Lightbulb className="text-primary mt-0.5 h-4 w-4 shrink-0" />
                  <span className="text-sm leading-relaxed">{tip}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function SceneCard({ scene, index }: { scene: ScriptScene; index: number }) {
  return (
    <Card className="hover:shadow-brand flex flex-col transition-shadow">
      <CardContent className="flex flex-col gap-3 p-4 sm:p-5">
        {/* Header */}
        <div className="flex items-center gap-2">
          <div className="bg-gradient-brand text-primary-foreground shadow-brand flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold">
            {index + 1}
          </div>
          <h4 className="font-display text-base leading-tight font-bold">
            {scene.title}
          </h4>
        </div>

        {/* Narration */}
        <div className="border-border bg-card rounded-lg border p-3">
          <div className="mb-1.5 flex items-center gap-1.5">
            <Mic className="text-primary h-4 w-4" />
            <span className="text-muted-foreground text-xs font-semibold">
              التعليق الصوتي
            </span>
          </div>
          <p className="text-sm leading-relaxed">{scene.narration}</p>
        </div>

        {/* Visual */}
        <div className="bg-accent/50 rounded-lg border border-transparent p-3">
          <div className="mb-1.5 flex items-center gap-1.5">
            <Camera className="text-primary h-4 w-4" />
            <span className="text-muted-foreground text-xs font-semibold">
              المشهد البصري
            </span>
          </div>
          <p className="text-sm leading-relaxed">{scene.visual}</p>
        </div>
      </CardContent>
    </Card>
  )
}

export default ScriptGenerator
