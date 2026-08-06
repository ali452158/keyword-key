import { NextRequest, NextResponse } from "next/server"
import type { Platform, Country } from "@/lib/types"

export const dynamic = "force-dynamic"

// Arabic day names: index 0 = السبت (Saturday) ... 6 = الجمعة (Friday)
const DAYS_AR = [
  "السبت",
  "الأحد",
  "الاثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة",
] as const

// Local hour offset (relative to UTC). Positive = east of UTC.
const COUNTRY_OFFSET: Record<Country, number> = {
  global: 0,
  eg: 2,
  sa: 3,
  ae: 4,
  kw: 3,
  qa: 3,
  ma: 1,
  dz: 1,
  us: -5,
}

const COUNTRY_TIMEZONE: Record<Country, string> = {
  global: "UTC (عالمي)",
  eg: "UTC+2 (توقيت القاهرة)",
  sa: "UTC+3 (توقيت الرياض)",
  ae: "UTC+4 (توقيت دبي)",
  kw: "UTC+3 (توقيت الكويت)",
  qa: "UTC+3 (توقيت الدوحة)",
  ma: "UTC+1 (توقيت الدار البيضاء)",
  dz: "UTC+1 (توقيت الجزائر)",
  us: "UTC-5 (التوقيت الشرقي الأمريكي)",
}

// Seeded random for stable results per platform+country
function seededRandom(seed: number): () => number {
  let s = seed % 2147483647
  if (s <= 0) s += 2147483646
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash |= 0
  }
  return Math.abs(hash)
}

// Circular distance between two hours on a 24h clock
function hourDistance(a: number, b: number): number {
  const d = Math.abs(a - b)
  return Math.min(d, 24 - d)
}

// Gaussian peak contribution
function peakScore(hour: number, peakHour: number, width: number, peakHeight: number): number {
  const diff = hourDistance(hour, peakHour)
  return peakHeight * Math.exp(-(diff * diff) / (2 * width * width))
}

// Base engagement score (0-100) for a given platform + hour (local) + day (0-6, 0=Sat)
function computeBaseScore(platform: Platform, hour: number, day: number): number {
  const isFriday = day === 6
  const isSaturday = day === 0
  const isWeekend = isFriday || isSaturday

  // Baseline noise floor — there's always some traffic
  let score = 10

  if (platform === "tiktok") {
    // Evening peak 7-11pm, max at 21:00
    score += peakScore(hour, 21, 2.4, 65)
    // Lunch 12-2pm, max at 13:00
    score += peakScore(hour, 13, 1.6, 32)
    // Late morning bump
    score += peakScore(hour, 10, 1.8, 14)
    // Dead hours 1-6am
    if (hour >= 1 && hour <= 6) score -= 6
    if (isWeekend) score += 10
    if (isFriday) score += 4
  } else if (platform === "youtube") {
    // Evening 5-9pm, max at 19:00
    score += peakScore(hour, 19, 2.4, 60)
    // Lunch bump
    score += peakScore(hour, 13, 1.5, 18)
    if (isWeekend) {
      // Weekend afternoon peak 14-17, max at 15:00
      score += peakScore(hour, 15, 2, 38)
      score += 6
    } else {
      // Weekdays slightly lower overall
      score -= 4
    }
  } else if (platform === "instagram") {
    // Lunch 11am-1pm, max at 12:00
    score += peakScore(hour, 12, 1.7, 48)
    // Evening 7-9pm, max at 20:00
    score += peakScore(hour, 20, 1.8, 52)
    // Morning bump
    score += peakScore(hour, 8, 1.5, 18)
    if (isWeekend) score += 6
    if (isFriday) score += 3
  } else if (platform === "facebook") {
    // Morning 9-11am, max at 10:00
    score += peakScore(hour, 10, 1.7, 44)
    // Noon, max at 13:00
    score += peakScore(hour, 13, 1.4, 30)
    // Evening 6-8pm, max at 19:00
    score += peakScore(hour, 19, 1.8, 42)
    if (!isWeekend) score += 4
    if (hour >= 1 && hour <= 5) score -= 5
  }

  return score
}

// Format hour in Arabic 12h notation: 0 -> "12ص", 13 -> "1م"
function formatHour(h: number): string {
  if (h === 0) return "12ص"
  if (h < 12) return `${h}ص`
  if (h === 12) return "12م"
  return `${h - 12}م`
}

function formatTimeRange(hour: number): string {
  const next = (hour + 1) % 24
  return `${formatHour(hour)} - ${formatHour(next)}`
}

// Build human-readable Arabic reasons per platform/peak
function buildReason(
  platform: Platform,
  hour: number,
  day: number,
  score: number
): string {
  const isWeekend = day === 0 || day === 6
  const dayName = DAYS_AR[day]
  const timeLabel = formatHour(hour)

  if (platform === "tiktok") {
    if (hour >= 19 && hour <= 23) {
      return `ذروة المساء على تيك توك${isWeekend ? " في نهاية الأسبوع" : ""} — الجمهور نشط بعد العمل`
    }
    if (hour >= 12 && hour <= 14) {
      return `استراحة الغداء على تيك توك — تصفح سريع أثناء الأكل`
    }
    return `نافذة نشاط جيدة على تيك توك (${timeLabel} ${dayName})`
  }
  if (platform === "youtube") {
    if (hour >= 17 && hour <= 21) {
      return `وقت المشاهدة المسائي على يوتيوب — الجمهور يسترخي ويشاهد محتوى أطول`
    }
    if (isWeekend && hour >= 14 && hour <= 17) {
      return `بعد ظهر نهاية الأسبوع على يوتيوب — أعلى تفاعل في عطلة نهاية الأسبوع`
    }
    return `نافذة جيدة على يوتيوب (${timeLabel} ${dayName})`
  }
  if (platform === "instagram") {
    if (hour >= 11 && hour <= 13) {
      return `ذروة الغداء على انستجرام — تصفح القصص والريلز أثناء الاستراحة`
    }
    if (hour >= 19 && hour <= 21) {
      return `مساء انستجرام — أفضل وقت للريلز والمنشورات التفاعلية`
    }
    return `نافذة جيدة على انستجرام (${timeLabel} ${dayName})`
  }
  // facebook
  if (hour >= 9 && hour <= 11) {
    return `صباح فيسبوك — تصفح الأخبار والمحتوى اليومي بعد الاستيقاظ`
  }
  if (hour >= 18 && hour <= 20) {
    return `مساء فيسبوك — أعلى تفاعل للمنشورات الطويلة والنقاشات`
  }
  return `نافذة جيدة على فيسبوك (${timeLabel} ${dayName})`
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const platform = (searchParams.get("platform") as Platform) || "tiktok"
    const country = (searchParams.get("country") as Country) || "global"

    const validPlatforms: Platform[] = ["tiktok", "youtube", "instagram", "facebook"]
    const validCountries: Country[] = [
      "global",
      "eg",
      "sa",
      "ae",
      "us",
      "kw",
      "qa",
      "ma",
      "dz",
    ]
    if (!validPlatforms.includes(platform)) {
      return NextResponse.json(
        { success: false, error: "منصة غير صالحة" },
        { status: 400 }
      )
    }
    if (!validCountries.includes(country)) {
      return NextResponse.json(
        { success: false, error: "دولة غير صالحة" },
        { status: 400 }
      )
    }

    const offset = COUNTRY_OFFSET[country]
    const seed = hashString(`${platform}-${country}`)
    const random = seededRandom(seed)

    // Build 7×24 heatmap. Each entry corresponds to a (day, hour) cell.
    // Hour stored is the LOCAL hour (the user's wall-clock time).
    // Score is computed against the corresponding UTC hour (hour - offset).
    const heatmap: { day: number; hour: number; score: number }[] = []
    for (let day = 0; day < 7; day++) {
      for (let hour = 0; hour < 24; hour++) {
        const utcHour = ((hour - offset) % 24 + 24) % 24
        const base = computeBaseScore(platform, utcHour, day)
        // Add ±5 deterministic noise
        const noise = (random() - 0.5) * 10
        const raw = base + noise
        const score = Math.max(0, Math.min(100, Math.round(raw)))
        heatmap.push({ day, hour, score })
      }
    }

    // Compute day-aggregated average score for insights
    const dayAverages: { day: number; avg: number }[] = []
    for (let day = 0; day < 7; day++) {
      const sum = heatmap
        .filter((c) => c.day === day)
        .reduce((s, c) => s + c.score, 0)
      dayAverages.push({ day, avg: sum / 24 })
    }
    const bestDay = dayAverages.reduce((a, b) => (b.avg > a.avg ? b : a))
    const worstDay = dayAverages.reduce((a, b) => (b.avg < a.avg ? b : a))

    // Top 5 best times: sort all cells by score desc, take top 5
    const topCells = [...heatmap]
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)

    const bestTimes = topCells.map((cell) => ({
      day: DAYS_AR[cell.day],
      timeRange: formatTimeRange(cell.hour),
      score: cell.score,
      reason: buildReason(platform, cell.hour, cell.day, cell.score),
    }))

    // Build insights
    const peakCell = topCells[0]
    const peakHour = peakCell.hour
    const worstCells = [...heatmap].sort((a, b) => a.score - b.score)
    const worstHour = worstCells[0].hour
    const worstHourScore = worstCells[0].score

    const weekendAvg =
      (dayAverages[0].avg + dayAverages[6].avg) / 2 // Sat + Fri
    const weekdayAvg =
      (dayAverages[1].avg +
        dayAverages[2].avg +
        dayAverages[3].avg +
        dayAverages[4].avg +
        dayAverages[5].avg) /
      5

    const platformNameMap: Record<Platform, string> = {
      tiktok: "تيك توك",
      youtube: "يوتيوب",
      instagram: "انستجرام",
      facebook: "فيسبوك",
    }
    const platformName = platformNameMap[platform]

    const insights: string[] = []
    insights.push(
      `أفضل يوم للنشر على ${platformName} هو ${DAYS_AR[bestDay.day]} بمتوسط تفاعل ${Math.round(bestDay.avg)}%.`
    )
    insights.push(
      `الذروة اليومية تقع عند الساعة ${formatHour(peakHour)} (توقيت محلي) بدرجة تفاعل ${peakCell.score}%.`
    )
    if (weekendAvg > weekdayAvg) {
      const diff = Math.round(weekendAvg - weekdayAvg)
      insights.push(
        `التفاعل في عطلة نهاية الأسبوع (الجمعة والسبت) أعلى بمقدار ${diff} نقطة عن أيام العمل.`
      )
    } else {
      const diff = Math.round(weekdayAvg - weekendAvg)
      insights.push(
        `أيام العمل تتفوق على عطلة نهاية الأسبوع بمقدار ${diff} نقطة تفاعل.`
      )
    }
    insights.push(
      `تجنّب النشر في الساعة ${formatHour(worstHour)} — أدنى درجة تفاعل (${worstHourScore}%).`
    )

    return NextResponse.json({
      success: true,
      data: {
        heatmap,
        bestTimes,
        timezone: COUNTRY_TIMEZONE[country],
        insights,
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "فشل تحليل أفضل وقت للنشر",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
