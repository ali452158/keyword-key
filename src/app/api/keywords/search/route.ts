import { NextRequest, NextResponse } from "next/server"
import { searchKeywords } from "@/lib/keyword-data"
import type { Platform } from "@/lib/types"

export const dynamic = "force-dynamic"

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

    if (platform && !["tiktok", "youtube", "instagram", "facebook"].includes(platform)) {
      return NextResponse.json(
        { success: false, error: "Invalid platform" },
        { status: 400 }
      )
    }

    const results = searchKeywords(query.trim(), platform)

    return NextResponse.json({
      success: true,
      data: results,
      meta: {
        query: query.trim(),
        platform: platform || "all",
        count: results.length,
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
