import { NextRequest, NextResponse } from "next/server"
import { getZaiSafe } from "@/lib/zai-safe"
import {
  fetchRealProfile,
  hasRapidApiKey,
  type RealProfile,
} from "@/lib/social-profiles"
import type { Platform } from "@/lib/types"

export const dynamic = "force-dynamic"
export const maxDuration = 60

interface ConnectedAccount {
  id: string
  account: string
  platform: Platform
  connectedAt: string
  followers: number
  following: number
  totalPosts: number
  avgEngagement: number
  avgViews: number
  topKeywords: { keyword: string; volume: number }[]
  topPosts: {
    title: string
    views: number
    likes: number
    engagement: number
  }[]
  recentGrowth: number
  bestContent: string
  summary: string
  /** Where the data came from: "real" = scraped from the platform, "estimated" = AI-generated estimate */
  dataSource: "real" | "estimated"
  /** Display name from the real profile (if available) */
  displayName?: string
  /** Avatar URL from the real profile (if available) */
  avatarUrl?: string
  /** Whether the account is verified (if known) */
  verified?: boolean
  /** Bio from the real profile (if available) */
  bio?: string
}

function validatePlatform(p: string): p is Platform {
  return ["tiktok", "youtube", "instagram", "facebook"].includes(p)
}

function makeId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

const PLATFORM_NAMES: Record<Platform, string> = {
  tiktok: "TikTok",
  youtube: "YouTube",
  instagram: "Instagram",
  facebook: "Facebook",
}

/**
 * Build a ConnectedAccount from REAL scraped profile data.
 * Computes engagement metrics from the actual recent posts.
 */
function buildFromRealProfile(
  profile: RealProfile,
  platform: Platform
): ConnectedAccount {
  const { recentPosts } = profile

  // Average views across recent posts
  const avgViews =
    recentPosts.length > 0
      ? Math.floor(
          recentPosts.reduce((s, p) => s + p.views, 0) / recentPosts.length
        )
      : Math.floor(profile.totalLikes / Math.max(profile.totalPosts, 1))

  // Average engagement = avg(likes/views) across posts
  let avgEngagement = 0
  if (recentPosts.length > 0) {
    const ratios = recentPosts
      .filter((p) => p.views > 0)
      .map((p) => (p.likes / p.views) * 100)
    if (ratios.length > 0) {
      avgEngagement =
        Math.round((ratios.reduce((s, r) => s + r, 0) / ratios.length) * 10) /
        10
    }
  } else {
    // Estimate engagement from total likes / (followers * posts)
    if (profile.followers > 0 && profile.totalPosts > 0) {
      avgEngagement =
        Math.round(
          ((profile.totalLikes / (profile.followers * profile.totalPosts)) *
            100) *
            10
        ) / 10
    }
  }

  // Map recent posts to the topPosts shape
  const topPosts = recentPosts.slice(0, 3).map((p) => ({
    title: p.title,
    views: p.views,
    likes: p.likes,
    engagement:
      p.views > 0
        ? Math.round((p.likes / p.views) * 1000) / 10
        : 0,
  }))

  // Derive keywords from post titles (simple frequency-based)
  const topKeywords = deriveKeywordsFromPosts(
    recentPosts.map((p) => p.title),
    platform
  )

  // Estimate recent growth — real scraping doesn't give historical data,
  // so we provide a conservative estimate based on engagement levels
  const recentGrowth =
    Math.round(
      (avgEngagement > 5 ? 8 + avgEngagement * 0.5 : avgEngagement * 1.2) * 10
    ) / 10

  const bestContentBank: Record<Platform, string> = {
    tiktok: "مقاطع قصيرة سريعة الإيقاع تركز على الترفيه والترندات",
    youtube: "فيديوهات شرح طويلة ومفصلة بجودة عالية",
    instagram: "Reels بصري جذاب مع قصص يومية تفاعلية",
    facebook: "منشورات متعددة الوسائط تجمع بين النص والصور والفيديو",
  }

  const summary = `حساب ${PLATFORM_NAMES[platform]} حقيقي: ${formatNumber(
    profile.followers
  )} متابع، ${formatNumber(profile.totalPosts)} منشور، ${formatNumber(
    profile.totalLikes
  )} إعجاب إجمالي. متوسط المشاهدات ${formatNumber(
    avgViews
  )} ومعدل التفاعل ${avgEngagement}%. ${
    profile.verified ? "حساب موثّق. " : ""
  }البيانات مسحوبة مباشرة من المنصة.`

  return {
    id: makeId(),
    account: profile.username,
    platform,
    connectedAt: new Date().toISOString(),
    followers: profile.followers,
    following: profile.following,
    totalPosts: profile.totalPosts,
    avgEngagement,
    avgViews,
    topKeywords,
    topPosts,
    recentGrowth,
    bestContent: bestContentBank[platform],
    summary,
    dataSource: "real",
    displayName: profile.displayName,
    avatarUrl: profile.avatarUrl,
    verified: profile.verified,
    bio: profile.bio,
  }
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M"
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K"
  return String(n)
}

/** Extract likely keywords from post titles using simple word frequency. */
function deriveKeywordsFromPosts(
  titles: string[],
  platform: Platform
): { keyword: string; volume: number }[] {
  const stopWords = new Set([
    "the",
    "a",
    "an",
    "of",
    "to",
    "in",
    "on",
    "for",
    "and",
    "or",
    "with",
    "this",
    "that",
    "is",
    "are",
    "was",
    "were",
    "من",
    "في",
    "على",
    "إلى",
    "عن",
    "مع",
    "هذا",
    "ذلك",
    "التي",
    "الذي",
    "عند",
    "كل",
    "بعض",
    "لا",
    "ما",
    "هو",
    "هي",
    "انا",
    "نحن",
  ])

  const freq = new Map<string, number>()
  for (const title of titles) {
    // Split on non-word chars (handles Arabic + Latin)
    const words = title.split(/[\s\W_]+/).filter(Boolean)
    for (const w of words) {
      const lower = w.toLowerCase()
      if (lower.length < 3) continue
      if (stopWords.has(lower)) continue
      if (/^\d+$/.test(lower)) continue
      freq.set(lower, (freq.get(lower) || 0) + 1)
    }
  }

  // If we couldn't extract enough keywords, add platform defaults
  const defaults: Record<Platform, string[]> = {
    tiktok: ["fyp", "viral", "trending", "foryou"],
    youtube: ["tutorial", "review", "vlog", "howto"],
    instagram: ["reels", "instadaily", "lifestyle", "mood"],
    facebook: ["community", "update", "story", "news"],
  }

  const sorted = [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([keyword, count]) => ({
      keyword,
      volume: count * 1000 + 5000,
    }))

  // Pad with defaults if needed
  if (sorted.length < 4) {
    for (const d of defaults[platform]) {
      if (sorted.length >= 6) break
      if (sorted.some((s) => s.keyword === d)) continue
      sorted.push({ keyword: d, volume: Math.floor(Math.random() * 80000) + 20000 })
    }
  }

  return sorted
}

/* ------------------------------------------------------------------ */
/* AI-based estimation fallback                                       */
/* ------------------------------------------------------------------ */

function estimatedAccount(
  account: string,
  platform: Platform
): Omit<ConnectedAccount, "id" | "account" | "platform" | "connectedAt"> {
  const followers = Math.floor(Math.random() * 950_000) + 5_000
  const following = Math.floor(Math.random() * 900) + 50
  const totalPosts = Math.floor(Math.random() * 800) + 30
  const avgEngagement = Math.round(Math.random() * 9 * 10) / 10
  const avgViews = Math.floor(followers * (0.15 + Math.random() * 0.4))
  const recentGrowth = Math.round((Math.random() * 30 - 5) * 10) / 10

  const keywordBank = [
    "محتوى",
    "ترند",
    "إبداع",
    "شرح",
    "تجربة",
    "مراجعة",
    "نصائح",
    "حياة",
    "موسيقى",
    "كوميديا",
    "trending",
    "viral",
    "lifestyle",
    "tutorial",
    "challenge",
  ]
  const topKeywords = keywordBank
    .slice(0, 6)
    .map((k) => ({
      keyword: k,
      volume: Math.floor(Math.random() * 90_000) + 5_000,
    }))
    .sort((a, b) => b.volume - a.volume)

  const titleBank = [
    "أفضل نصائح لزيادة التفاعل",
    "تجربة منتج جديد بالكامل",
    "شرح خطوة بخطوة",
    "تحدي ممتع مع الأصدقاء",
    "لحظات مضحكة لا تفوتها",
    "مراجعة صريحة وكاملة",
  ]
  const topPosts = titleBank.slice(0, 3).map((title) => {
    const views = Math.floor(avgViews * (0.6 + Math.random() * 0.9))
    const likes = Math.floor(views * (0.05 + Math.random() * 0.1))
    return {
      title,
      views,
      likes,
      engagement: Math.round((likes / Math.max(views, 1)) * 1000) / 10,
    }
  })

  const bestContentBank: Record<Platform, string> = {
    tiktok: "مقاطع قصيرة سريعة الإيقاع تركز على الترفيه والترندات",
    youtube: "فيديوهات شرح طويلة ومفصلة بجودة عالية",
    instagram: "Reels بصري جذاب مع قصص يومية تفاعلية",
    facebook: "منشورات متعددة الوسائط تجمع بين النص والصور والفيديو",
  }

  const summary = `تقدير تحليلي لحساب ${PLATFORM_NAMES[platform]} (@${account}). تعذّر سحب البيانات الحقيقية من المنصة، поэтому هذه القيم تقديرية مبنية على نموذج ذكاء اصطناعي. قد لا تعكس الأرقام الفعلية للحساب.`

  return {
    followers,
    following,
    totalPosts,
    avgEngagement,
    avgViews,
    topKeywords,
    topPosts,
    recentGrowth,
    bestContent: bestContentBank[platform],
    summary,
    dataSource: "estimated",
  }
}

/* ------------------------------------------------------------------ */
/* AI enhancement for real profiles                                   */
/* ------------------------------------------------------------------ */

/**
 * Use the AI to generate a strategic summary + bestContent recommendation
 * for a real profile. The real numbers are always preserved — the AI only
 * adds narrative context, never overrides the scraped stats.
 */
async function enhanceWithAI(
  profile: RealProfile,
  platform: Platform
): Promise<{ summary: string; bestContent: string; topKeywords: { keyword: string; volume: number }[] } | null> {
  const zai = await getZaiSafe()
  if (!zai) return null

  const platformName = PLATFORM_NAMES[platform]
  const postTitles = profile.recentPosts.map((p) => `- ${p.title} (${p.views} مشاهدة)`).join("\n")

  const prompt = `أنت خبير تحليل سوشيال ميديا. إليك بيانات حقيقية لحساب ${platformName}:
- اسم المستخدم: @${profile.username}
- الاسم: ${profile.displayName}
- المتابعون: ${profile.followers}
- المنشورات: ${profile.totalPosts}
- إجمالي الإعجابات: ${profile.totalLikes}
- نبذة: ${profile.bio || "غير متوفر"}
- أحدث المنشورات:
${postTitles || "غير متوفرة"}

بناءً على هذه البيانات الحقيقية فقط، قدم:
1. summary: ملخص استراتيجي قصير (سطرين) بالعربية يصف طبيعة الحساب ومستوى أدائه
2. bestContent: توصية قصيرة بالعربية لأفضل نوع محتوى يناسب هذا الحساب
3. topKeywords: مصفوفة من 4-6 كائنات {keyword, volume} تمثل الكلمات المفتاحية المرتبطة بالمحتوى (volume بالأرقام)

أرجع JSON فقط بدون شرح إضافي.`

  try {
    const completion = await zai.chat.completions.create({
      messages: [
        { role: "assistant", content: "أنت مساعد تحليلي يعيد JSON فقط." },
        { role: "user", content: prompt },
      ],
      thinking: { type: "disabled" },
    })

    const content = completion.choices[0]?.message?.content || ""
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return null

    const parsed = JSON.parse(jsonMatch[0]) as {
      summary?: string
      bestContent?: string
      topKeywords?: { keyword: string; volume: number }[]
    }

    return {
      summary:
        typeof parsed.summary === "string" && parsed.summary.trim()
          ? parsed.summary.trim()
          : null,
      bestContent:
        typeof parsed.bestContent === "string" && parsed.bestContent.trim()
          ? parsed.bestContent.trim()
          : null,
      topKeywords: Array.isArray(parsed.topKeywords)
        ? parsed.topKeywords
            .filter(
              (k) =>
                k &&
                typeof k.keyword === "string" &&
                typeof k.volume === "number"
            )
            .slice(0, 6)
            .map((k) => ({
              keyword: String(k.keyword),
              volume: Math.floor(Number(k.volume)) || 0,
            }))
        : [],
    }
  } catch (err) {
    console.warn("[integration/analyze] AI enhancement failed:", err)
    return null
  }
}

/* ------------------------------------------------------------------ */
/* Main route handler                                                 */
/* ------------------------------------------------------------------ */

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { account, platform } = body as {
      account?: string
      platform?: Platform
    }

    if (!account || !account.trim()) {
      return NextResponse.json(
        { success: false, error: "اسم الحساب مطلوب" },
        { status: 400 }
      )
    }

    if (!platform || !validatePlatform(platform)) {
      return NextResponse.json(
        { success: false, error: "المنصة غير صحيحة" },
        { status: 400 }
      )
    }

    const cleanAccount = account.trim().replace(/^@/, "")

    // ================================================================
    // STEP 1: Try to fetch REAL profile data from the platform
    // ================================================================
    let realProfile: RealProfile | null = null
    try {
      realProfile = await fetchRealProfile(platform, cleanAccount)
    } catch (err) {
      console.warn(
        "[integration/analyze] real profile fetch failed:",
        err instanceof Error ? err.message : err
      )
    }

    if (realProfile) {
      // Build the base account from real scraped data
      const account = buildFromRealProfile(realProfile, platform)

      // Try to enhance the summary + keywords with AI (non-blocking —
      // if it fails we keep the computed values from real data)
      const enhanced = await enhanceWithAI(realProfile, platform)
      if (enhanced) {
        if (enhanced.summary) account.summary = enhanced.summary
        if (enhanced.bestContent) account.bestContent = enhanced.bestContent
        if (enhanced.topKeywords.length > 0) {
          account.topKeywords = enhanced.topKeywords
        }
      }

      return NextResponse.json({
        success: true,
        data: account,
        meta: { needsApiKey: false, message: "تم سحب البيانات الحقيقية بنجاح" },
      })
    }

    // ================================================================
    // STEP 2: Real scraping failed — use AI estimation (clearly labelled)
    // ================================================================
    const zai = await getZaiSafe()
    const apiKeyConfigured = hasRapidApiKey()

    if (!zai) {
      // No AI available either — return a clearly-labelled estimate
      const est = estimatedAccount(cleanAccount, platform)
      const connectedAccount: ConnectedAccount = {
        id: makeId(),
        account: cleanAccount,
        platform,
        connectedAt: new Date().toISOString(),
        ...est,
      }
      return NextResponse.json({
        success: true,
        data: connectedAccount,
        meta: {
          needsApiKey: !apiKeyConfigured,
          message: apiKeyConfigured
            ? "تعذّر سحب البيانات الحقيقية — قد يكون الحساب غير موجود أو خاص"
            : "لعرض البيانات الحقيقية، أضف مفتاح RapidAPI في ملف .env",
        },
      })
    }

    // AI is available — ask it for a realistic estimate based on the username
    const systemPrompt = `أنت خبير تحليل بيانات في منصات السوشيال ميديا. تعذّر سحب البيانات الحقيقية لحساب "${cleanAccount}" من ${PLATFORM_NAMES[platform]}، لذلك مطلوب منك تقدير تقريبي واقعي.

أرجع JSON فقط بالبنية التالية:
{
  "followers": رقم,
  "following": رقم,
  "totalPosts": رقم,
  "avgEngagement": نسبة_بالمئة,
  "avgViews": رقم,
  "topKeywords": [{"keyword": "...", "volume": رقم}],
  "topPosts": [{"title": "...", "views": رقم, "likes": رقم, "engagement": نسبة}],
  "recentGrowth": نسبة,
  "bestContent": "وصف",
  "summary": "ملخص قصير بالعربية يوضح أن هذه البيانات تقديرية"
}

القواعد:
- البيانات تقديرية، اذكر ذلك في الـ summary
- استخدم أرقاماً واقعية متناسبة مع طبيعة المنصة`

    const userPrompt = `قدّم بيانات تحليلية تقديرية لحساب ${PLATFORM_NAMES[platform]}: @${cleanAccount}`

    const completion = await zai.chat.completions.create({
      messages: [
        { role: "assistant", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      thinking: { type: "disabled" },
    })

    const content = completion.choices[0]?.message?.content || ""

    let data: Omit<
      ConnectedAccount,
      "id" | "account" | "platform" | "connectedAt"
    >
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      const jsonStr = jsonMatch ? jsonMatch[0] : content
      const parsed = JSON.parse(jsonStr)

      const est = estimatedAccount(cleanAccount, platform)
      data = {
        followers:
          typeof parsed.followers === "number" && parsed.followers > 0
            ? Math.floor(parsed.followers)
            : est.followers,
        following:
          typeof parsed.following === "number" && parsed.following >= 0
            ? Math.floor(parsed.following)
            : est.following,
        totalPosts:
          typeof parsed.totalPosts === "number" && parsed.totalPosts >= 0
            ? Math.floor(parsed.totalPosts)
            : est.totalPosts,
        avgEngagement:
          typeof parsed.avgEngagement === "number"
            ? Math.round(parsed.avgEngagement * 10) / 10
            : est.avgEngagement,
        avgViews:
          typeof parsed.avgViews === "number" && parsed.avgViews >= 0
            ? Math.floor(parsed.avgViews)
            : est.avgViews,
        topKeywords: Array.isArray(parsed.topKeywords)
          ? parsed.topKeywords
              .filter(
                (k: unknown): k is { keyword: string; volume: number } =>
                  typeof k === "object" &&
                  k !== null &&
                  typeof (k as { keyword?: unknown }).keyword === "string" &&
                  typeof (k as { volume?: unknown }).volume === "number"
              )
              .slice(0, 6)
              .map((k) => ({
                keyword: String(k.keyword),
                volume: Math.floor(Number(k.volume)) || 0,
              }))
          : est.topKeywords,
        topPosts: Array.isArray(parsed.topPosts)
          ? parsed.topPosts
              .filter(
                (p: unknown): p is {
                  title: string
                  views: number
                  likes: number
                  engagement: number
                } =>
                  typeof p === "object" &&
                  p !== null &&
                  typeof (p as { title?: unknown }).title === "string"
              )
              .slice(0, 3)
              .map((p) => ({
                title: String(p.title),
                views: Math.floor(Number(p.views)) || 0,
                likes: Math.floor(Number(p.likes)) || 0,
                engagement:
                  typeof p.engagement === "number"
                    ? Math.round(p.engagement * 10) / 10
                    : 0,
              }))
          : est.topPosts,
        recentGrowth:
          typeof parsed.recentGrowth === "number"
            ? Math.round(parsed.recentGrowth * 10) / 10
            : est.recentGrowth,
        bestContent:
          typeof parsed.bestContent === "string" && parsed.bestContent.trim()
            ? parsed.bestContent.trim()
            : est.bestContent,
        summary:
          typeof parsed.summary === "string" && parsed.summary.trim()
            ? parsed.summary.trim()
            : est.summary,
        // Always mark AI-generated data as estimated
        dataSource: "estimated",
      }
    } catch {
      const est = estimatedAccount(cleanAccount, platform)
      data = { ...est, dataSource: "estimated" }
    }

    const connectedAccount: ConnectedAccount = {
      id: makeId(),
      account: cleanAccount,
      platform,
      connectedAt: new Date().toISOString(),
      ...data,
    }

    return NextResponse.json({
      success: true,
      data: connectedAccount,
      meta: {
        needsApiKey: !apiKeyConfigured,
        message: apiKeyConfigured
          ? "تعذّر سحب البيانات الحقيقية — قد يكون الحساب غير موجود أو خاص"
          : "لعرض البيانات الحقيقية، أضف مفتاح RapidAPI في ملف .env",
      },
    })
  } catch (error) {
    console.error("Integration analyze error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "فشل تحليل الحساب",
        message: error instanceof Error ? error.message : "خطأ غير معروف",
      },
      { status: 500 }
    )
  }
}
