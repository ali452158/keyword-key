import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { Wifi, Database } from "lucide-react"
import { cn } from "@/lib/utils"

interface LiveBadgeProps {
  /** Whether the data came from real web search. */
  live: boolean
  className?: string
  /** Light variant (for use on gradient/dark backgrounds). */
  variant?: "default" | "light"
}

/**
 * Small badge that indicates whether the displayed data is live
 * (from real web search) or illustrative (cached/mock fallback).
 */
export function LiveBadge({ live, className, variant = "default" }: LiveBadgeProps) {
  if (live) {
    return (
      <Badge
        className={cn(
          "gap-1.5 border-transparent",
          variant === "light"
            ? "bg-white/20 text-white border-white/30 backdrop-blur-sm"
            : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
          className
        )}
      >
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75 animate-ping" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>
        بيانات حقيقية مباشرة
      </Badge>
    )
  }

  return (
    <Badge
      className={cn(
        "gap-1 border-transparent",
        variant === "light"
          ? "bg-white/15 text-white/80 border-white/20 backdrop-blur-sm"
          : "bg-secondary text-muted-foreground",
        className
      )}
    >
      <Database className="w-3 h-3" />
      بيانات تجريبية
    </Badge>
  )
}
