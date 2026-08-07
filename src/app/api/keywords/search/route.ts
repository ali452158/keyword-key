import { NextRequest, NextResponse } from "next/server"
import { searchKeywords } from "@/lib/keyword-data"
import { fetchRealKeywordInsights } from "@/lib/real-search"
import type { Platform, KeywordDetail } from "@/lib/types"

export const dynamic = "force-dynamic"
export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { query, platform } = body as {
      query?: string
      platform?: Platform
    }

    if (!query || !query.trim()) {
      return NextResponse.json(
        { success: false, error: "Query is required" },
        { status: 400 }
      )
    }

    if (
      platform &&
      !["tiktok", "youtube", "instagram", "facebook"].includes(platform)
    ) {
      return NextResponse.json(
        { success: false, error: "Invalid platform" },
        { status: 400 }
      )
    }

    const cleanQuery = query.trim()

    // Try real web-search-backed insights first. The real search returns a
    // single aggregated insight (across the requested platforms); we expand
    // it into per-platform KeywordDetail entries so the existing UI works.
    let results: KeywordDetail[] = []
    let live = false

    try {
      const real = await fetchRealKeywordInsights(cleanQuery, platform)
      if (real) {
        live = true
        const platformsToReport: Platform[] = platform
          ? [platform]
          : (real.bestPlatforms
              .map((b) => b.platform)
              .filter((p) =>
                ["tiktok", "youtube", "instagram", "facebook"].includes(p)
              ) as Platform[])

        // Ensure at least the requested platform (or a default) is present
        if (platformsToReport.length === 0) {
          platformsToReport.push(platform || "tiktok")
        }

        const months = [
          "ينا",
          "فبر",
          "مار",
          "أبر",
          "ماي",
          "يون",
          "يول",
          "أغس",
          "سبت",
          "أكت",
          "نوف",
          "ديس",
        ]

        results = platformsToReport.map((p, idx) => {
          // Distribute the aggregate volume across platforms with variation
          const factor = 1 - idx * 0.18
          const vol = Math.round(real.searchVolume * factor)
          const bp = real.bestPlatforms.find((b) => b.platform === p)
          const score = bp?.score ?? 50
          return {
            keyword: cleanQuery,
            platform: p,
            searchVolume: vol,
            competition: real.competition,
            competitionScore: score,
            cpc: Math.round(real.cpc * 10) / 10,
            difficulty: real.difficulty,
            growth: Math.round(real.growth * factor),
            relatedKeywords: real.related.map((r) => ({
              keyword: r.keyword,
              volume: r.volume,
            })),
            trendHistory: real.trendHistory.map((value, i) => ({
              date: months[i % 12],
              value: Math.round((value / 100) * vol),
            })),
            suggestions: [
              `${cleanQuery} ${new Date().getFullYear()}`,
              `${cleanQuery} للمبتدئين`,
              `أفضل ${cleanQuery}`,
              `${cleanQuery} بالعربي`,
              `شرح ${cleanQuery}`,
              `${cleanQuery} tips`,
            ],
            bestPlatforms: real.bestPlatforms,
          } as KeywordDetail & { bestPlatforms?: typeof real.bestPlatforms }
        })
      }
    } catch (err) {
      console.error("[keyword-search] real search failed, falling back:", err)
    }

    if (results.length === 0) {
      results = searchKeywords(cleanQuery, platform)
    }

    return NextResponse.json({
      success: true,
      data: results,
      meta: {
        query: cleanQuery,
        platform: platform || "all",
        count: results.length,
        live,
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Search failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
