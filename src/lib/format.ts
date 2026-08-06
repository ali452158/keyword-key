export function formatNumber(n: number): string {
  if (n >= 1_000_000_000) {
    return (n / 1_000_000_000).toFixed(1).replace(/\.0$/, "") + "B"
  }
  if (n >= 1_000_000) {
    return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M"
  }
  if (n >= 1_000) {
    return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K"
  }
  return n.toString()
}

export function formatGrowth(growth: number): string {
  const sign = growth >= 0 ? "+" : ""
  return `${sign}${growth}%`
}

export function competitionColor(
  competition: "low" | "medium" | "high"
): string {
  switch (competition) {
    case "low":
      return "text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900"
    case "medium":
      return "text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900"
    case "high":
      return "text-rose-600 bg-rose-50 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900"
  }
}

export function competitionLabel(
  competition: "low" | "medium" | "high"
): string {
  switch (competition) {
    case "low":
      return "منخفضة"
    case "medium":
      return "متوسطة"
    case "high":
      return "عالية"
  }
}
