import { NextResponse } from "next/server"
import { getPlatformKeywordStats } from "@/lib/keyword-data"
import { PLATFORM_LIST } from "@/lib/platforms"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const stats = PLATFORM_LIST.map((p) => ({
      platform: p.id,
      name: p.arabicName,
      ...getPlatformKeywordStats(p.id),
    }))

    const totalKeywords = stats.reduce(
      (sum, s) => sum + s.totalKeywords,
      0
    )
    const totalTrending = stats.reduce(
      (sum, s) => sum + s.trendingToday,
      0
    )
    const avgGrowth = Math.round(
      stats.reduce((sum, s) => sum + s.avgGrowth, 0) / stats.length
    )

    return NextResponse.json({
      success: true,
      data: {
        platforms: stats,
        summary: {
          totalKeywords,
          totalTrending,
          avgGrowth,
          platformsTracked: stats.length,
        },
      },
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
