import { NextRequest, NextResponse } from "next/server"
import ZAI from "z-ai-web-dev-sdk"
import type { Platform } from "@/lib/types"

export const dynamic = "force-dynamic"
export const maxDuration = 60

interface HashtagsResult {
  hashtags: string[]
  mix: string
  reach: string
  tips: string[]
}

function validatePlatform(p: string): p is Platform {
  return ["tiktok", "youtube", "instagram", "facebook"].includes(p)
}

const PLATFORM_STRATEGY: Record<
  Platform,
  { name: string; focus: string; signature: string }
> = {
  tiktok: {
    name: "TikTok",
    focus: "ترند / فيرال",
    signature:
      "يفضّل تيك توك هاشتاجات الترند الفيروسي القصيرة (1-3 كلمات) مثل #fyp و #viral، مع هاشتاج صوت/موسيقى وهاشتاج تحدي عند وجوده",
  },
  youtube: {
    name: "YouTube",
    focus: "SEO / long-tail",
    signature:
      "يفضّل يوتيوب هاشتاجات طويلة الذيل متوافقة مع البحث (3-5 كلمات) مثل #كيفية_صنع، مع هاشتاج قسم وهاشتاج علامة تجارية لتعزيز ظهور الفيديو في نتائج البحث",
  },
  instagram: {
    name: "Instagram",
    focus: "مجتمع / نيش",
    signature:
      "يفضّل انستجرام مزيج من هاشتاجات النيش المتوسطة (10k-500k منشور) وهاشتاجات المجتمع والتفاعل، مع تجنّب الهاشتاجات العامة المُزدحمة فقط",
  },
  facebook: {
    name: "Facebook",
    focus: "موضوع / عام",
    signature:
      "يفضّل فيسبوك هاشتاجات موضوعية واضحة (3-5 هاشتاجات كحد أقصى) مرتبطة بالمحتوى والمجتمع المحلي، مع هاشتاج علامة تجارية",
  },
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { keyword, platform, count = 20 } = body as {
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

    const tagCount = Math.min(Math.max(Number(count) || 20, 5), 30)
    const cleanKeyword = keyword.trim()

    const zai = await ZAI.create()
    const cfg = PLATFORM_STRATEGY[platform]

    const systemPrompt = `أنت خبير في هاشتاجات السوشيال ميديا. ولّد مجموعة هاشتاجات محسّنة للكلمة المفتاحية على المنصة المحددة. أرجع JSON فقط بالبنية: { hashtags: string[], mix: string (مجموعة جاهزة للنسخ مفصولة بمسافات), reach: string (تقدير الوصول), tips: string[] (3-5 نصائح) }`

    const userPrompt = `ولّد ${tagCount} هاشتاج محسّن لـ ${cfg.name} حول الموضوع: "${cleanKeyword}".

استراتيجية المنصة (${cfg.focus}): ${cfg.signature}

قسّم الهاشتاجات إلى:
- 30% هاشتاجات عالية الحجم (عامة / ترند)
- 50% هاشتاجات متوسطة الحجم (نيش / مجتمع)
- 20% هاشتاجات محددة / علامة تجارية (طويلة الذيل)

تنويع:
- بعض الهاشتاجات بالعربية وبعضها بالإنجليزية حسب ما يناسب الموضوع
- ابدأ كل هاشتاج برمز #
- لا تكرر الهاشتاجات
- اجعلها واقعية ومستخدمة فعلاً على المنصة

للحقل "reach" قدّر مدى الوصول المحتمل مثل: "50K - 250K مشاهدة محتملة" مع توضيح موجز.

للحقل "tips" اكتب 3 إلى 5 نصائح قصيرة بالعربية عن أفضل ممارسات استخدام الهاشتاجات على ${cfg.name}.

أرجع JSON صالح فقط بدون أي نص إضافي قبل أو بعد.`

    const completion = await zai.chat.completions.create({
      messages: [
        { role: "assistant", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      thinking: { type: "disabled" },
    })

    const content = completion.choices[0]?.message?.content || ""

    let result: HashtagsResult
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      const jsonStr = jsonMatch ? jsonMatch[0] : content
      const parsed = JSON.parse(jsonStr)

      const hashtags: string[] = Array.isArray(parsed.hashtags)
        ? parsed.hashtags
            .map((h: unknown) => String(h).trim())
            .filter((h: string) => h.length > 0)
            .map((h: string) => (h.startsWith("#") ? h : `#${h}`))
        : []

      const tips: string[] = Array.isArray(parsed.tips)
        ? parsed.tips.map((t: unknown) => String(t).trim()).filter(Boolean)
        : []

      result = {
        hashtags: hashtags.slice(0, tagCount),
        mix:
          typeof parsed.mix === "string" && parsed.mix.trim()
            ? parsed.mix.trim()
            : hashtags.slice(0, tagCount).join(" "),
        reach:
          typeof parsed.reach === "string" && parsed.reach.trim()
            ? parsed.reach.trim()
            : "",
        tips,
      }

      // Safety fallback if LLM returned empty hashtags
      if (result.hashtags.length === 0) {
        const fallback = generateFallbackHashtags(cleanKeyword, platform, tagCount)
        result = {
          hashtags: fallback,
          mix: fallback.join(" "),
          reach: result.reach || "10K - 80K تفاعل محتمل",
          tips:
            result.tips.length > 0
              ? result.tips
              : defaultTips(platform),
        }
      }
    } catch {
      const fallback = generateFallbackHashtags(cleanKeyword, platform, tagCount)
      result = {
        hashtags: fallback,
        mix: fallback.join(" "),
        reach: "10K - 80K تفاعل محتمل",
        tips: defaultTips(platform),
      }
    }

    return NextResponse.json({
      success: true,
      data: result,
      meta: {
        keyword: cleanKeyword,
        platform,
        count: result.hashtags.length,
      },
    })
  } catch (error) {
    console.error("Hashtag generation error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "فشل توليد الهاشتاجات",
        message: error instanceof Error ? error.message : "خطأ غير معروف",
      },
      { status: 500 }
    )
  }
}

function generateFallbackHashtags(
  keyword: string,
  platform: Platform,
  count: number
): string[] {
  const base = keyword.replace(/\s+/g, "_")
  const baseEn = keyword.replace(/\s+/g, "")
  const platformTags: Record<Platform, string[]> = {
    tiktok: ["#fyp", "#foryou", "#viral", "#trending", "#tiktok"],
    youtube: ["#youtube", "#shorts", "#tutorial", "#howto", "#viral"],
    instagram: ["#instagood", "#reels", "#explore", "#instadaily", "#trending"],
    facebook: ["#facebook", "#viral", "#trending", "#community", "#explore"],
  }
  const nicheTags = [
    `#${base}`,
    `#${baseEn}`,
    `#${base}_ar`,
    "#content",
    "#creator",
    "#trend",
    "#viral",
    "#explore",
    "#daily",
    "#love",
    "#follow",
    "#share",
    "#2024",
    "#2025",
    "#community",
    "#niche",
    "#tips",
    "#ideas",
    "#inspiration",
    "#guide",
    "#tutorial",
    "#review",
    "#best",
    "#top",
  ]
  const platformSpecific = platformTags[platform]
  const combined = [...new Set([...platformSpecific, ...nicheTags])]
  return combined.slice(0, count)
}

function defaultTips(platform: Platform): string[] {
  const map: Record<Platform, string[]> = {
    tiktok: [
      "استخدم 3-5 هاشتاجات فقط في تيك توك لأفضل أداء",
      "أضف #fyp و #foryou دائماً لزيادة الوصول",
      "تابع الترندات اليومية وادمجها مع محتواك",
      "تجنّب الهاشتاجات المُحظورة أو المكررة",
    ],
    youtube: [
      "استخدم 3 هاشتاجات فقط في العنوان ليظهر بوضوح",
      "اجعل الهاشتاجات طويلة الذيل ومتعلقة بموضوع الفيديو",
      "أضف هاشتاج القسم (Category) لتنظيم المحتوى",
      "أضف هاشتاج علامتك التجارية لبناء هوية",
    ],
    instagram: [
      "استخدم 8-15 هاشتاج متوسط الحجم (نيش) لتجنب الازدحام",
      "ضع الهاشتاجات في التعليق الأول لتظهر البوست أنظف",
      "اخلط بين أحجام الهاشتاجات: عام + نيش + علامة تجارية",
      "أنشئ هاشتاج خاص بعلامتك التجارية لتشجيع المحتوى المُنشأ من المستخدمين",
    ],
    facebook: [
      "استخدم 2-3 هاشتاج فقط في فيسبوك لأفضل تفاعل",
      "اجعلها موضوعية وواضحة ومرتبطة بالمحتوى",
      "استخدم هاشتاجات محلية لاستهداف جمهورك",
      "لا تفرط في الهاشتاجات فهي تقلل التفاعل على فيسبوك",
    ],
  }
  return map[platform]
}
