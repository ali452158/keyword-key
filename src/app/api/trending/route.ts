import { NextRequest, NextResponse } from "next/server"
import { generateTrends } from "@/lib/keyword-data"
import { fetchRealTrends } from "@/lib/real-search"
import type { Platform, Country, TrendPeriod, KeywordTrend } from "@/lib/types"

export const dynamic = "force-dynamic"
export const maxDuration = 60 // allow up to 60s for the parallel web searches

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const platform = searchParams.get("platform") as Platform | null
    const country = (searchParams.get("country") as Country) || "global"
    const period = (searchParams.get("period") as TrendPeriod) || "daily"
    const limit = Math.min(Number(searchParams.get("limit") || 12), 30)

    // Try real web-search-backed data first. Falls back to mock data on
    // any error so the UI always renders something.
    let trends: KeywordTrend[] = []
    let live = false
    try {
      const real = await fetchRealTrends(
        platform || "all",
        country,
        period,
        limit
      )
      if (real.length > 0) {
        trends = real.map((t, i) => ({
          id: `${t.platform}-${t.keyword}-${i}`,
          keyword: t.keyword,
          platform: t.platform,
          searchVolume: t.searchVolume,
          competition:
            t.searchVolume > 100_000_000
              ? "high"
              : t.searchVolume > 10_000_000
                ? "medium"
                : "low",
          growth: t.growth,
          trendScore: t.trendScore,
          category: t.category,
          country,
          period,
          hashtag: t.hashtag,
        }))
        live = true
      }
    } catch (err) {
      console.error("[trending] real search failed, falling back:", err)
    }

    if (trends.length === 0) {
      trends = generateTrends(platform || undefined, country, period, limit)
    }

    return NextResponse.json({
      success: true,
      data: trends,
      meta: {
        platform: platform || "all",
        country,
        period,
        count: trends.length,
        live, // true when data came from real web search
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch trends",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
