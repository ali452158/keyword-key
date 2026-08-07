"use client"

import * as React from "react"
import { Hash, Clapperboard, Clock, Type, DollarSign, Rocket } from "lucide-react"
import { cn } from "@/lib/utils"
import { HashtagGenerator } from "@/components/growth-tools/hashtag-generator"
import { ScriptGenerator } from "@/components/growth-tools/script-generator"
import { BestTimeAnalyzer } from "@/components/growth-tools/best-time-analyzer"
import { TitleOptimizer } from "@/components/growth-tools/title-optimizer"
import { EarningsCalculator } from "@/components/growth-tools/earnings-calculator"

type ToolId =
  | "hashtags"
  | "script"
  | "best-time"
  | "title"
  | "earnings"

interface ToolTab {
  id: ToolId
  label: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  gradient: string
}

const TOOLS: ToolTab[] = [
  {
    id: "hashtags",
    label: "مولّد الهاشتاجات",
    description: "مجموعات هاشتاجات محسّنة لكل منصة",
    icon: Hash,
    gradient: "from-pink-500 to-rose-500",
  },
  {
    id: "script",
    label: "سكربتات الفيديو",
    description: "سكربت كامل جاهز للتصوير",
    icon: Clapperboard,
    gradient: "from-violet-500 to-purple-500",
  },
  {
    id: "best-time",
    label: "أفضل وقت للنشر",
    description: "خريطة حرارية لأوقات الذروة",
    icon: Clock,
    gradient: "from-blue-500 to-indigo-500",
  },
  {
    id: "title",
    label: "محلل العناوين",
    description: "قِيم وحسّن عناوين الفيديو",
    icon: Type,
    gradient: "from-emerald-500 to-teal-500",
  },
  {
    id: "earnings",
    label: "حاسبة الأرباح",
    description: "قدّر أرباحك المحتملة",
    icon: DollarSign,
    gradient: "from-amber-500 to-orange-500",
  },
]

export function GrowthTools() {
  const [activeTool, setActiveTool] = React.useState<ToolId>("hashtags")

  return (
    <div className="space-y-6">
      {/* Section intro */}
      <header className="space-y-2">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-brand flex items-center justify-center text-white shadow-brand">
            <Rocket className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-display text-xl font-bold">
              أدوات نمو القنوات
            </h2>
            <p className="text-sm text-muted-foreground">
              مجموعة احترافية من الأدوات المدعومة بالذكاء الاصطناعي لنمو قنواتك
              على يوتيوب وتيك توك
            </p>
          </div>
        </div>
      </header>

      {/* Tool tabs — horizontal scrollable on mobile, grid on desktop */}
      <nav
        role="tablist"
        aria-label="أدوات النمو"
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5"
      >
        {TOOLS.map((tool) => {
          const Icon = tool.icon
          const isActive = activeTool === tool.id
          return (
            <button
              key={tool.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTool(tool.id)}
              className={cn(
                "group relative overflow-hidden rounded-2xl p-3 sm:p-4 text-right transition-all duration-300 border",
                isActive
                  ? "bg-gradient-brand text-white border-transparent shadow-brand-lg"
                  : "bg-card border-border/60 hover:border-primary/40 hover:shadow-brand text-foreground"
              )}
            >
              {isActive && (
                <div className="absolute inset-0 bg-grid-pattern opacity-20" />
              )}
              <div className="relative flex items-start gap-2.5">
                <div
                  className={cn(
                    "shrink-0 w-9 h-9 rounded-lg flex items-center justify-center transition-colors",
                    isActive
                      ? "bg-white/20 text-white"
                      : cn(
                          "bg-gradient-to-br text-white",
                          tool.gradient
                        )
                  )}
                >
                  <Icon className="w-4.5 h-4.5" />
                </div>
                <div className="min-w-0">
                  <p
                    className={cn(
                      "font-bold text-sm leading-tight",
                      isActive ? "text-white" : "text-foreground"
                    )}
                  >
                    {tool.label}
                  </p>
                  <p
                    className={cn(
                      "text-[11px] leading-tight mt-0.5 line-clamp-1",
                      isActive ? "text-white/80" : "text-muted-foreground"
                    )}
                  >
                    {tool.description}
                  </p>
                </div>
              </div>
            </button>
          )
        })}
      </nav>

      {/* Active tool content */}
      <div role="tabpanel">
        {activeTool === "hashtags" && <HashtagGenerator />}
        {activeTool === "script" && <ScriptGenerator />}
        {activeTool === "best-time" && <BestTimeAnalyzer />}
        {activeTool === "title" && <TitleOptimizer />}
        {activeTool === "earnings" && <EarningsCalculator />}
      </div>
    </div>
  )
}
