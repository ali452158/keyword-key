import { NextRequest, NextResponse } from "next/server"
import { getZaiSafe } from "@/lib/zai-safe"
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
}

function validatePlatform(p: string): p is Platform {
  return ["tiktok", "youtube", "instagram", "facebook"].includes(p)
}

function makeId(): string {
  return (
    Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
  )
}

function fallbackAccount(
  account: string,
  platform: Platform
): ConnectedAccount {
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

  const summaryBank: Record<Platform, string> = {
    tiktok:
      "حساب نشط على TikTok يتميز بمحتوى ترفيهي عالي التفاعل واعتماد على الترندات الحالية. جمهور أساسي من فئة الشباب.",
    youtube:
      "قناة YouTube متخصصة في المحتوى التعليمي والشرح، بمعدل مشاهدة مرتفع وولاء جمهور قوي.",
    instagram:
      "حساب Instagram بصري جذاب يركز على نمط الحياة والجمال، مع تفاعل قوي عبر الـ Reels والقصص.",
    facebook:
      "صفحة Facebook متنوعة المحتوى تجمع بين المنشورات التفاعلية والفيديوهات، بجمهور متنوع الأعمار.",
  }

  return {
    id: makeId(),
    account,
    platform,
    connectedAt: new Date().toISOString(),
    followers,
    following,
    totalPosts,
    avgEngagement,
    avgViews,
    topKeywords,
    topPosts,
    recentGrowth,
    bestContent: bestContentBank[platform],
    summary: summaryBank[platform],
  }
}

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

    const zai = await getZaiSafe()
    if (!zai) {
      const fb = fallbackAccount(cleanAccount, platform)
      return NextResponse.json({ success: true, data: fb })
    }

    const platformNames: Record<Platform, string> = {
      tiktok: "TikTok",
      youtube: "YouTube",
      instagram: "Instagram",
      facebook: "Facebook",
    }

    const systemPrompt = `أنت خبير تحليل بيانات في منصات السوشيال ميديا. مهمتك توليد بيانات تحليلية واقعية لحساب معين وإرجاعها بصيغة JSON صالحة فقط بدون أي نص إضافي أو شرح.

يجب أن تكون الاستجابة JSON بالبنية التالية بالضبط:
{
  "followers": رقم_المتابعين,
  "following": رقم_الحسابات_المتابعة,
  "totalPosts": رقم_المنشورات,
  "avgEngagement": نسبة_التفاعل_بالمئة,
  "avgViews": متوسط_المشاهدات,
  "topKeywords": [
    {"keyword": "كلمة مفتاحية", "volume": رقم_البحث}
  ],
  "topPosts": [
    {"title": "عنوان المنشور", "views": رقم, "likes": رقم, "engagement": نسبة}
  ],
  "recentGrowth": نسبة_نمو_آخر_30_يوم,
  "bestContent": "وصف أفضل نوع محتوى",
  "summary": "ملخص تحليلي قصير بالعربية"
}

القواعد:
- استخدم كلمات مفتاحية عربية وإنجليزية واقعية ومتناسبة مع طبيعة الحساب والمنصة
- 4-6 كلمات مفتاحية في topKeywords
- 2-3 منشورات في topPosts بعناوين عربية واقعية
- avgEngagement بين 1% و 12%
- recentGrowth بين -10% و +35%
- followers متناسب مع طبيعة المنصة (آلاف إلى ملايين)
- summary يجب أن يكون بالعربية ووصف استراتيجية الحساب
- لا تكتب أي شيء خارج كائن JSON`

    const userPrompt = `حلل حساب ${platformNames[platform]} التالي: @${cleanAccount}

قدم بيانات تحليلية واقعية ومفصلة تشمل المؤشرات الأساسية، الكلمات المفتاحية الأكثر استخداماً، أفضل المنشورات أداءً، والملخص الاستراتيجي.

أرجع JSON فقط.`

    const completion = await zai.chat.completions.create({
      messages: [
        { role: "assistant", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      thinking: { type: "disabled" },
    })

    const content = completion.choices[0]?.message?.content || ""

    let data: Omit<ConnectedAccount, "id" | "account" | "platform" | "connectedAt">
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      const jsonStr = jsonMatch ? jsonMatch[0] : content
      const parsed = JSON.parse(jsonStr)

      // Validate & sanitize required fields with sensible fallbacks
      const followers =
        typeof parsed.followers === "number" && parsed.followers > 0
          ? Math.floor(parsed.followers)
          : Math.floor(Math.random() * 950_000) + 5_000
      const following =
        typeof parsed.following === "number" && parsed.following >= 0
          ? Math.floor(parsed.following)
          : Math.floor(Math.random() * 900) + 50
      const totalPosts =
        typeof parsed.totalPosts === "number" && parsed.totalPosts >= 0
          ? Math.floor(parsed.totalPosts)
          : Math.floor(Math.random() * 800) + 30
      const avgEngagement =
        typeof parsed.avgEngagement === "number"
          ? Math.round(parsed.avgEngagement * 10) / 10
          : Math.round(Math.random() * 9 * 10) / 10
      const avgViews =
        typeof parsed.avgViews === "number" && parsed.avgViews >= 0
          ? Math.floor(parsed.avgViews)
          : Math.floor(followers * 0.3)
      const recentGrowth =
        typeof parsed.recentGrowth === "number"
          ? Math.round(parsed.recentGrowth * 10) / 10
          : Math.round((Math.random() * 30 - 5) * 10) / 10

      const topKeywords = Array.isArray(parsed.topKeywords)
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
        : []

      const topPosts = Array.isArray(parsed.topPosts)
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
        : []

      const bestContent =
        typeof parsed.bestContent === "string" && parsed.bestContent.trim()
          ? parsed.bestContent.trim()
          : "محتوى متناسق عالي الجودة يستهدف جمهوراً مهتماً"

      const summary =
        typeof parsed.summary === "string" && parsed.summary.trim()
          ? parsed.summary.trim()
          : `حساب ${platformNames[platform]} نشط يتميز بمحتوى متناسق وتفاعل جيد مع الجمهور.`

      data = {
        followers,
        following,
        totalPosts,
        avgEngagement,
        avgViews,
        topKeywords,
        topPosts,
        recentGrowth,
        bestContent,
        summary,
      }
    } catch {
      const fb = fallbackAccount(cleanAccount, platform)
      data = {
        followers: fb.followers,
        following: fb.following,
        totalPosts: fb.totalPosts,
        avgEngagement: fb.avgEngagement,
        avgViews: fb.avgViews,
        topKeywords: fb.topKeywords,
        topPosts: fb.topPosts,
        recentGrowth: fb.recentGrowth,
        bestContent: fb.bestContent,
        summary: fb.summary,
      }
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
