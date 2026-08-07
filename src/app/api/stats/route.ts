import { NextResponse } from "next/server"
import { getPlatformKeywordStats } from "@/lib/keyword-data"
import { fetchRealPlatformStats } from "@/lib/real-search"
import { PLATFORM_LIST } from "@/lib/platforms"

export const dynamic = "force-dynamic"
export const maxDuration = 60

export async function GET() {
  try {
    // Try real (web-search-backed) stats first; fall back to mock.
    let platforms: any[] = []
    let summary: any = null
    let live = false

    try {
      const real = await fetchRealPlatformStats()
      if (real.platforms.length > 0) {
        platforms = real.platforms
        summary = {
          ...real.summary,
          platformsTracked: platforms.length,
        }
        live = true
      }
    } catch (err) {
      console.error("[stats] real search failed, falling back:", err)
    }

    if (platforms.length === 0) {
      platforms = PLATFORM_LIST.map((p) => ({
        platform: p.id,
        name: p.arabicName,
        ...getPlatformKeywordStats(p.id),
      }))
      const totalKeywords = platforms.reduce(
        (sum, s) => sum + s.totalKeywords,
        0
      )
      const totalTrending = platforms.reduce(
        (sum, s) => sum + s.trendingToday,
        0
      )
      const avgGrowth = Math.round(
        platforms.reduce((sum, s) => sum + s.avgGrowth, 0) / platforms.length
      )
      summary = {
        totalKeywords,
        totalTrending,
        avgGrowth,
        platformsTracked: platforms.length,
      }
    }

    return NextResponse.json({
      success: true,
      data: { platforms, summary },
      meta: { live },
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch stats",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
