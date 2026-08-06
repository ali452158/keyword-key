import { NextRequest, NextResponse } from "next/server"
import ZAI from "z-ai-web-dev-sdk"
import type { Platform, ContentIdea } from "@/lib/types"

export const dynamic = "force-dynamic"
export const maxDuration = 60

function validatePlatform(p: string): p is Platform {
  return ["tiktok", "youtube", "instagram", "facebook"].includes(p)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { keyword, platform, count = 6 } = body as {
      keyword?: string
      platform?: Platform
      count?: number
    }

    if (!keyword || !keyword.trim()) {
      return NextResponse.json(
        { success: false, error: "الكلمة المفتاحية مطلوبة" },
        { status: 400 }
      )
    }

    if (!platform || !validatePlatform(platform)) {
      return NextResponse.json(
        { success: false, error: "المنصة غير صحيحة" },
        { status: 400 }
      )
    }

    const ideaCount = Math.min(Math.max(count, 3), 10)

    const zai = await ZAI.create()

    const platformConfig: Record<
      Platform,
      { name: string; type: string; duration: string }
    > = {
      tiktok: {
        name: "TikTok",
        type: "فيديو قصير 15-60 ثانية",
        duration: "15-60 ثانية",
      },
      youtube: {
        name: "YouTube",
        type: "فيديو طويل أو Shorts",
        duration: "8-15 دقيقة",
      },
      instagram: {
        name: "Instagram",
        type: "Reels أو منشور أو قصة",
        duration: "30-90 ثانية",
      },
      facebook: {
        name: "Facebook",
        type: "فيديو أو منشور",
        duration: "2-5 دقائق",
      },
    }

    const cfg = platformConfig[platform]

    const systemPrompt = `أنت خبير في صناعة المحتوى الرقمي وعرض الأفكار الإبداعية. مهمتك اقتراح أفكار محتوى مبتكرة وواقعية لمنصات السوشيال ميديا.

أرجع JSON فقط بالبنية التالية:
{
  "ideas": [
    {
      "platform": "${platform}",
      "type": "نوع المحتوى",
      "title": "عنوان جذاب بالعربية",
      "hook": "جملة افتتاحية تجذب المشاهد",
      "description": "وصف تفصيلي للمحتوى (سطرين)",
      "hashtags": ["هاشتاج1", "هاشتاج2", "هاشتاج3"],
      "estimatedReach": "تقدير الوصول مثل: 10K-50K",
      "duration": "مدة مقترحة"
    }
  ]
}

اجعل العناوين جذابة ومرتبطة بالكلمة المفتاحية. استخدم هاشتاقات مناسبة وواقعية. اجعل كل فكرة مختلفة ومبتكرة.`

    const userPrompt = `اقترح ${ideaCount} أفكار محتوى لـ ${cfg.name} حول الكلمة المفتاحية: "${keyword.trim()}"

نوع المحتوى المفضل: ${cfg.type}
المدة المناسبة: ${cfg.duration}

تنوع بين الأفكار: تعليمي، ترفيهي، تحدي، قصة، مراجعة، نصائح. اجعل كل فكرة فريدة.

أرجع JSON صالح فقط.`

    const completion = await zai.chat.completions.create({
      messages: [
        { role: "assistant", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      thinking: { type: "disabled" },
    })

    const content = completion.choices[0]?.message?.content || ""

    let ideas: ContentIdea[]
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      const jsonStr = jsonMatch ? jsonMatch[0] : content
      const parsed = JSON.parse(jsonStr)
      ideas = parsed.ideas || []
    } catch {
      // Fallback ideas
      ideas = generateFallbackIdeas(keyword.trim(), platform, ideaCount)
    }

    // Ensure platform and fill missing fields
    ideas = ideas.map((idea, idx) => ({
      platform,
      type: idea.type || cfg.type,
      title: idea.title || `فكرة ${idx + 1} حول ${keyword.trim()}`,
      hook: idea.hook || `هل تعلم؟`,
      description:
        idea.description || `محتوى مبتكر حول ${keyword.trim()} يجذب الجمهور.`,
      hashtags:
        idea.hashtags && idea.hashtags.length > 0
          ? idea.hashtags
          : [`#${keyword.trim().replace(/\s/g, "_")}`, "#content", "#trending"],
      estimatedReach: idea.estimatedReach || "5K-20K",
      duration: idea.duration || cfg.duration,
    }))

    return NextResponse.json({
      success: true,
      data: ideas.slice(0, ideaCount),
      meta: {
        keyword: keyword.trim(),
        platform,
        count: ideas.length,
      },
    })
  } catch (error) {
    console.error("Content generation error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "فشل توليد الأفكار",
        message: error instanceof Error ? error.message : "خطأ غير معروف",
      },
      { status: 500 }
    )
  }
}

function generateFallbackIdeas(
  keyword: string,
  platform: Platform,
  count: number
): ContentIdea[] {
  const templates = [
    {
      type: "تعليمي",
      title: `دليلك الشامل لـ ${keyword} في 60 ثانية`,
      hook: `توقف! هذه أهم نصيحة ستحتاجها عن ${keyword}`,
      description: `شرح مبسط وسريع لكل ما تحتاج معرفته عن ${keyword} بشكل عملي وممتع.`,
      hashtags: [`#${keyword.replace(/\s/g, "_")}`, "#تعليم", "#tips"],
      estimatedReach: "10K-50K",
    },
    {
      type: "تحدي",
      title: `تحدي ${keyword} - هل تجرؤ؟`,
      hook: `قبل أي حد يستطيع عملها... شاهد التحدي الكامل`,
      description: `تحدي ممتع وتفاعلي حول ${keyword} يدعو المتابعين للمشاركة.`,
      hashtags: [`#challenge`, `#${keyword.replace(/\s/g, "_")}`, "#viral"],
      estimatedReach: "50K-200K",
    },
    {
      type: "قصة",
      title: `قصتي مع ${keyword} - لم أتوقع هذا`,
      hook: `كل شيء تغير عندما اكتشفت ${keyword}...`,
      description: `قصة شخصية مؤثرة حول تجربتك مع ${keyword} تلهم الجمهور.`,
      hashtags: [`#story`, `#${keyword.replace(/\s/g, "_")}`, "#inspiration"],
      estimatedReach: "20K-80K",
    },
    {
      type: "مراجعة",
      title: `تجربتي الصادقة مع ${keyword}`,
      hook: `هل يستحق فعلاً؟ شاهد قبل أن تقرر`,
      description: `مراجعة صادقة ومفصلة حول ${keyword} مع إيجابيات وسلبيات.`,
      hashtags: [`#review`, `#${keyword.replace(/\s/g, "_")}`, "#honest"],
      estimatedReach: "15K-60K",
    },
    {
      type: "نصائح",
      title: `5 أسرار لا يعرفها أحد عن ${keyword}`,
      hook: `السر رقم 3 سيصدمك!`,
      description: `مجموعة نصائح احترافية ومفيدة حول ${keyword} من خبرة عملية.`,
      hashtags: [`#tips`, `#${keyword.replace(/\s/g, "_")}`, "#secrets"],
      estimatedReach: "30K-100K",
    },
    {
      type: "ترفيهي",
      title: `أطرف موقف حدث لي مع ${keyword}`,
      hook: `لم أستطع التوقف عن الضحك!`,
      description: `محتوى ترفيهي كوميدي حول ${keyword} يجلب الابتسامة.`,
      hashtags: [`#comedy`, `#${keyword.replace(/\s/g, "_")}`, "#funny"],
      estimatedReach: "40K-150K",
    },
  ]

  const durations: Record<Platform, string> = {
    tiktok: "15-60 ثانية",
    youtube: "8-15 دقيقة",
    instagram: "30-90 ثانية",
    facebook: "2-5 دقائق",
  }

  return templates.slice(0, count).map((t) => ({
    platform,
    type: t.type,
    title: t.title,
    hook: t.hook,
    description: t.description,
    hashtags: t.hashtags,
    estimatedReach: t.estimatedReach,
    duration: durations[platform],
  }))
}
