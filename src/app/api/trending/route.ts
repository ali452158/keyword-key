import { NextRequest, NextResponse } from "next/server"
import { generateTrends } from "@/lib/keyword-data"
import type { Platform, Country, TrendPeriod } from "@/lib/types"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const platform = searchParams.get("platform") as Platform | null
    const country = (searchParams.get("country") as Country) || "global"
    const period = (searchParams.get("period") as TrendPeriod) || "daily"
    const limit = Math.min(Number(searchParams.get("limit") || 12), 30)

    const trends = generateTrends(
      platform || undefined,
      country,
      period,
      limit
    )

    return NextResponse.json({
      success: true,
      data: trends,
      meta: {
        platform: platform || "all",
        country,
        period,
        count: trends.length,
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
