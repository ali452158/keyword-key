"use client"

import * as React from "react"
import { TrendingUp, TrendingDown, Hash } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PlatformBadge } from "@/components/platform-icon"
import {
  formatNumber,
  formatGrowth,
  competitionColor,
  competitionLabel,
} from "@/lib/format"
import type { KeywordTrend } from "@/lib/types"
import { cn } from "@/lib/utils"

interface KeywordCardProps {
  trend: KeywordTrend
  onSelect?: (trend: KeywordTrend) => void
  compact?: boolean
}

export function KeywordCard({ trend, onSelect, compact }: KeywordCardProps) {
  const isPositive = trend.growth >= 0

  return (
    <Card
      className={cn(
        "group relative overflow-hidden border-border/60 hover:border-primary/40 transition-all duration-300 hover:shadow-brand",
        "bg-card hover:-translate-y-0.5"
      )}
    >
      {/* gradient accent */}
      <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-brand opacity-80" />

      <div className={cn("p-4", compact ? "p-3" : "p-5")}>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <PlatformBadge platform={trend.platform} size="sm" />
            <div className="min-w-0">
              <h3 className="font-bold text-sm truncate text-foreground">
                {trend.keyword}
              </h3>
              <p className="text-[11px] text-muted-foreground">
                {trend.category}
              </p>
            </div>
          </div>
          <Badge
            variant="outline"
            className={cn(
              "shrink-0 text-[10px] font-semibold",
              competitionColor(trend.competition)
            )}
          >
            {competitionLabel(trend.competition)}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <p className="text-[10px] text-muted-foreground mb-0.5">
              حجم البحث
            </p>
            <p className="font-bold text-base text-foreground">
              {formatNumber(trend.searchVolume)}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground mb-0.5">النمو</p>
            <p
              className={cn(
                "font-bold text-base flex items-center gap-1",
                isPositive ? "text-emerald-600" : "text-rose-600"
              )}
            >
              {isPositive ? (
                <TrendingUp className="w-3.5 h-3.5" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5" />
              )}
              {formatGrowth(trend.growth)}
            </p>
          </div>
        </div>

        {!compact && (
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <Hash className="w-3 h-3 text-muted-foreground shrink-0" />
              <span className="text-[11px] text-muted-foreground truncate">
                {trend.hashtag}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <div className="text-left">
                <p className="text-[9px] text-muted-foreground leading-none">
                  مؤشر الترند
                </p>
                <p className="text-xs font-bold text-primary leading-tight">
                  {trend.trendScore}
                </p>
              </div>
              {onSelect && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-[11px] opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => onSelect(trend)}
                >
                  تحليل
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
