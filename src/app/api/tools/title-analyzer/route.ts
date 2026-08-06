import { NextRequest, NextResponse } from "next/server"
import ZAI from "z-ai-web-dev-sdk"
import type { Platform } from "@/lib/types"

export const dynamic = "force-dynamic"
export const maxDuration = 60

interface TitleGrade {
  criteria: string
  score: number
  note: string
}

interface TitleAnalysis {
  score: number
  grades: TitleGrade[]
  suggestions: string[]
  improvedTitles: string[]
}

function validatePlatform(p: string): p is Platform {
  return ["tiktok", "youtube", "instagram", "facebook"].includes(p)
}

const PLATFORM_OPTIMAL_LENGTH: Record<Platform, { min: number; max: number; name: string }> = {
  tiktok: { min: 20, max: 60, name: "TikTok" },
  youtube: { min: 40, max: 70, name: "YouTube" },
  instagram: { min: 25, max: 65, name: "Instagram" },
  facebook: { min: 30, max: 80, name: "Facebook" },
}

/**
 * Heuristic fallback when LLM/JSON parse fails.
 * Scores the title based on length, word count, presence of digits,
 * presence of question marks, and keyword inclusion.
 */
function fallbackAnalysis(
  title: string,
  platform: Platform,
  keyword?: string
): TitleAnalysis {
  const trimmed = title.trim()
  const len = trimmed.length
  const words = trimmed.split(/\s+/).filter(Boolean)
  const wordCount = words.length
  const cfg = PLATFORM_OPTIMAL_LENGTH[platform]

  // Length score (0-100)
  let lengthScore: number
  if (len < cfg.min) {
    lengthScore = Math.round((len / cfg.min) * 60) // too short -> lower score
  } else if (len <= cfg.max) {
    lengthScore = 100 // ideal
  } else if (len <= cfg.max * 1.5) {
    lengthScore = Math.round(100 - ((len - cfg.max) / (cfg.max * 0.5)) * 30)
  } else {
    lengthScore = Math.max(20, 70 - Math.round((len - cfg.max) / 4))
  }

  // Power words score — check for common Arabic/English power words
  const powerWords = [
    "أسرار", "سر", "حصري", "مجاني", "الأفضل", "أفضل", "جديد", "صدمة",
    "مذهل", "لا يصدق", "تحذير", "فوراً", "الآن", "خطر", "نادر", "مبهر",
    "best", "free", "new", "secret", "shocking", "amazing", "viral", "exclusive",
    "؟", "!", "How", "Why", "Top", "أول", "أخير", "وحيد",
  ]
  const lower = trimmed.toLowerCase()
  const powerHits = powerWords.filter((w) => lower.includes(w.toLowerCase())).length
  const powerScore = Math.min(100, 40 + powerHits * 20)

  // Curiosity — question marks, ellipsis, "؟", suspenseful cues
  const curiosityCues = ["؟", "?", "...", "!", "ماذا", "لماذا", "كيف", "متى", "أين", "هل"]
  const curiosityHits = curiosityCues.filter((c) => trimmed.includes(c)).length
  const curiosityScore = Math.min(100, 35 + curiosityHits * 25)

  // Clarity — penalize excessive emojis / ALL CAPS / too many special chars
  const emojiCount = (trimmed.match(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}]/gu) || []).length
  const capsWords = words.filter((w) => w.length >= 3 && w === w.toUpperCase() && /[A-Z\u0600-\u06FF]/.test(w)).length
  const clarityScore = Math.max(
    30,
    Math.min(100, 95 - emojiCount * 8 - Math.max(0, capsWords - 1) * 12)
  )

  // Keyword inclusion
  let keywordScore = 70 // neutral when no keyword provided
  if (keyword && keyword.trim()) {
    keywordScore = lower.includes(keyword.trim().toLowerCase()) ? 100 : 35
  }

  // Platform fit — title length relative to platform optimum
  const inRange = len >= cfg.min && len <= cfg.max
  const platformScore = inRange ? 100 : Math.max(40, 100 - Math.min(60, Math.abs(len - (cfg.min + cfg.max) / 2)))

  const grades: TitleGrade[] = [
    {
      criteria: "الطول",
      score: lengthScore,
      note:
        len < cfg.min
          ? `العنوان قصير جداً. الطول المثالي لـ ${cfg.name} بين ${cfg.min} و ${cfg.max} حرف.`
          : len > cfg.max
            ? `العنوان طويل. الطول المثالي لـ ${cfg.name} بين ${cfg.min} و ${cfg.max} حرف.`
            : `الطول مثالي لـ ${cfg.name} (${len} حرف).`,
    },
    {
      criteria: "الكلمات القوية",
      score: powerScore,
      note:
        powerHits === 0
          ? "أضف كلمات قوية مثل: أسرار، حصري، صدمة، الأفضل، لجذب الانتباه."
          : `يحتوي على ${powerHits} كلمة قوية — ممتاز لزيادة النقر.`,
    },
    {
      criteria: "الفضول",
      score: curiosityScore,
      note:
        curiosityHits === 0
          ? "أضف عنصر تشويق مثل سؤال أو نقاط متتالية (...) لإثارة الفضول."
          : "يستخدم أسلوب تشويق جيد يدفع المشاهد للنقر.",
    },
    {
      criteria: "الوضوح",
      score: clarityScore,
      note:
        emojiCount > 3
          ? `يحتوي على ${emojiCount} رمز تعبيري — قللها للحفاظ على الوضوح.`
          : capsWords > 2
            ? "كلمات كثيرة بأحرف كبيرة — استخدمها بحذر."
            : "العنوان واضح وسهل القراءة.",
    },
    {
      criteria: "الكلمة المفتاحية",
      score: keywordScore,
      note:
        keyword && keyword.trim()
          ? keywordScore === 100
            ? `الكلمة المفتاحية "${keyword.trim()}" موجودة في العنوان.`
            : `الكلمة المفتاحية "${keyword.trim()}" غير موجودة في العنوان — أضفها.`
          : "لم يتم تحديد كلمة مفتاحية. حدد كلمة مفتاحية لتقييم دقيق.",
    },
    {
      criteria: "التطابق مع المنصة",
      score: platformScore,
      note:
        inRange
          ? `الطول مناسب لمنصة ${cfg.name}.`
          : `الطول غير مثالي لـ ${cfg.name} — يفضل بين ${cfg.min} و ${cfg.max} حرف.`,
    },
  ]

  const overall = Math.round(
    grades.reduce((acc, g) => acc + g.score, 0) / grades.length
  )

  const suggestions: string[] = []
  if (len < cfg.min) suggestions.push(`أطِل العنوان ليصل إلى ${cfg.min}-${cfg.max} حرفاً ليتناسب مع ${cfg.name}.`)
  if (len > cfg.max) suggestions.push(`اختصِر العنوان إلى أقل من ${cfg.max} حرفاً ليتناسب مع ${cfg.name}.`)
  if (powerHits === 0) suggestions.push("أضف كلمة قوية مثل: أسرار، حصري، صدمة، الأفضل.")
  if (curiosityHits === 0) suggestions.push("أضف سؤالاً أو علامة تعجب لإثارة فضول المشاهد.")
  if (emojiCount > 3) suggestions.push("قلل عدد الرموز التعبيرية للحفاظ على احترافية العنوان.")
  if (keyword && keyword.trim() && keywordScore < 100) {
    suggestions.push(`أدرج الكلمة المفتاحية "${keyword.trim()}" بشكل طبيعي في العنوان.`)
  }
  if (suggestions.length === 0) {
    suggestions.push("العنوان جيد! جرّب إضافة رقم محدد (مثل: 5 طرق...) لزيادة النقر.")
    suggestions.push("اختبر نسخة أخرى بنفس العناصر لمعرفة أيهما يحقق أداءً أفضل.")
  }

  // Build 3-5 improved title variants deterministically
  const improvedTitles: string[] = []
  const base = trimmed.replace(/[.!?؟]+$/g, "").trim()
  const kw = keyword && keyword.trim() ? keyword.trim() : words[0] || ""

  if (!lower.includes("؟") && !lower.includes("?")) {
    improvedTitles.push(`هل تعلم؟ ${base} 🔥`)
  }
  improvedTitles.push(`${base} — 5 أسرار لا يعرفها أحد`)
  if (kw && !lower.includes(kw.toLowerCase())) {
    improvedTitles.push(`${kw}: ${base} (دليل شامل)`)
  } else {
    improvedTitles.push(`الأفضل في ${kw}: ${base}`)
  }
  if (wordCount > 4) {
    improvedTitles.push(`${base} | لن تندم على المشاهدة`)
  }
  improvedTitles.push(`صدمة! ${base} 😱`)

  return {
    score: Math.max(0, Math.min(100, overall)),
    grades,
    suggestions: suggestions.slice(0, 5),
    improvedTitles: improvedTitles.slice(0, 5),
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { title, platform, keyword } = body as {
      title?: string
      platform?: Platform
      keyword?: string
    }

    if (!title || !title.trim()) {
      return NextResponse.json(
        { success: false, error: "العنوان مطلوب" },
        { status: 400 }
      )
    }

    if (!platform || !validatePlatform(platform)) {
      return NextResponse.json(
        { success: false, error: "المنصة غير صحيحة" },
        { status: 400 }
      )
    }

    const cfg = PLATFORM_OPTIMAL_LENGTH[platform]
    const trimmedTitle = title.trim()
    const kw = keyword && keyword.trim() ? keyword.trim() : undefined

    const zai = await ZAI.create()

    const systemPrompt = `أنت خبير في تحسين عناوين فيديوهات السوشيال ميديا وتحليل نسبة النقر إلى الظهور (CTR). حلل العنوان وأعطِ درجة من 100 بناءً على: الطول المثالي، وجود كلمات قوية، الوضوح، الفضول، الكلمة المفتاحية، التطابق مع المنصة. أرجع JSON فقط بالبنية: { score: number (0-100), grades: [{criteria: string, score: number (0-100), note: string}], suggestions: string[] (ملاحظات تحسين), improvedTitles: string[] (3-5 عناوين محسّنة بديلة) }`

    const userPrompt = `حلّل عنوان الفيديو التالي واقترح تحسينات:
العنوان: "${trimmedTitle}"
المنصة: ${cfg.name} (الطول المثالي: ${cfg.min}-${cfg.max} حرف)
${kw ? `الكلمة المفتاحية المستهدفة: "${kw}"` : "لم يتم تحديد كلمة مفتاحية"}

معايير التقييم المطلوبة في grades (يجب تضمينها جميعاً):
1. "الطول" - مدى ملاءمة طول العنوان للمنصة
2. "الكلمات القوية" - وجود كلمات تجذب الانتباه (مثل: أسرار، حصري، صدمة، الأفضل)
3. "الفضول" - قدرة العنوان على إثارة فضول المشاهد
4. "الوضوح" - وضوح المعنى وقابلية القراءة
5. "الكلمة المفتاحية" - مدى تضمين الكلمة المفتاحية المستهدفة
6. "التطابق مع المنصة" - ملاءمة الأسلوب والطول لمنصة ${cfg.name}

كل note يجب أن تكون ملاحظة قصيرة بالعربية تشرح الدرجة.
suggestions: قائمة نصائح تحسين قابلة للتنفيذ (3-5 نصائح).
improvedTitles: 3-5 عناوين بديلة محسّنة بالعربية تناسب منصة ${cfg.name} وتتضمن الكلمة المفتاحية ${kw ? `"${kw}"` : "إن وُجدت"}.

أرجع JSON صالح فقط دون أي نص إضافي.`

    let analysis: TitleAnalysis
    try {
      const completion = await zai.chat.completions.create({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        thinking: { type: "disabled" },
      })

      const content = completion.choices[0]?.message?.content || ""

      // Extract JSON object from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      const jsonStr = jsonMatch ? jsonMatch[0] : content
      const parsed = JSON.parse(jsonStr)

      // Validate and normalize fields
      const rawScore = Number(parsed.score)
      const score =
        Number.isFinite(rawScore) && rawScore >= 0 && rawScore <= 100
          ? Math.round(rawScore)
          : 0

      const rawGrades = Array.isArray(parsed.grades) ? parsed.grades : []
      const grades: TitleGrade[] = rawGrades
        .filter((g: unknown): g is Record<string, unknown> => !!g && typeof g === "object")
        .map((g) => {
          const gs = Number(g.score)
          return {
            criteria:
              typeof g.criteria === "string" && g.criteria.trim()
                ? g.criteria.trim()
                : "معيار",
            score: Number.isFinite(gs) && gs >= 0 && gs <= 100 ? Math.round(gs) : 50,
            note:
              typeof g.note === "string" && g.note.trim()
                ? g.note.trim()
                : "لا توجد ملاحظة",
          }
        })
        .slice(0, 8)

      const suggestions: string[] = Array.isArray(parsed.suggestions)
        ? parsed.suggestions
            .filter((s: unknown): s is string => typeof s === "string" && s.trim().length > 0)
            .map((s: string) => s.trim())
            .slice(0, 8)
        : []

      const improvedTitles: string[] = Array.isArray(parsed.improvedTitles)
        ? parsed.improvedTitles
            .filter((s: unknown): s is string => typeof s === "string" && s.trim().length > 0)
            .map((s: string) => s.trim())
            .slice(0, 6)
        : []

      // If the model returned too little useful data, fall back to heuristics
      if (
        grades.length < 3 ||
        improvedTitles.length < 2 ||
        suggestions.length === 0
      ) {
        analysis = fallbackAnalysis(trimmedTitle, platform, kw)
      } else {
        analysis = { score, grades, suggestions, improvedTitles }
      }
    } catch {
      // JSON parse or LLM failure → use heuristic fallback
      analysis = fallbackAnalysis(trimmedTitle, platform, kw)
    }

    return NextResponse.json({
      success: true,
      data: analysis,
      meta: {
        title: trimmedTitle,
        platform,
        keyword: kw || null,
        length: trimmedTitle.length,
      },
    })
  } catch (error) {
    console.error("Title analyzer error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "فشل تحليل العنوان",
        message: error instanceof Error ? error.message : "خطأ غير معروف",
      },
      { status: 500 }
    )
  }
}
