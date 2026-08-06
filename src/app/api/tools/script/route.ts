import { NextRequest, NextResponse } from "next/server"
import ZAI from "z-ai-web-dev-sdk"
import type { Platform } from "@/lib/types"

export const dynamic = "force-dynamic"
export const maxDuration = 60

type Duration = "short" | "medium" | "long"
type Tone = "educational" | "entertainment" | "inspirational" | "comedic"

interface ScriptScene {
  title: string
  narration: string
  visual: string
}

interface ScriptData {
  hook: string
  intro: string
  scenes: ScriptScene[]
  cta: string
  outro: string
  estimatedDuration: string
  tips: string[]
}

const VALID_PLATFORMS: Platform[] = ["tiktok", "youtube", "instagram", "facebook"]
const VALID_DURATIONS: Duration[] = ["short", "medium", "long"]
const VALID_TONES: Tone[] = ["educational", "entertainment", "inspirational", "comedic"]

const DURATION_INFO: Record<Duration, { label: string; seconds: string; sceneCount: number }> = {
  short: { label: "قصير (15-30 ثانية)", seconds: "15-30 ثانية", sceneCount: 3 },
  medium: { label: "متوسط (1-3 دقائق)", seconds: "1-3 دقائق", sceneCount: 4 },
  long: { label: "طويل (5-10 دقائق)", seconds: "5-10 دقائق", sceneCount: 6 },
}

const TONE_INFO: Record<Tone, string> = {
  educational: "تعليمي (شرح مبسط ومفيد)",
  entertainment: "ترفيهي (ممتع وجذاب)",
  inspirational: "ملهم (يحفّز ويثير المشاعر)",
  comedic: "كوميدي (مرح وخفيف)",
}

const PLATFORM_INFO: Record<Platform, { name: string; orientation: string; style: string }> = {
  tiktok: {
    name: "TikTok",
    orientation: "عمودي (9:16)",
    style: "لقطات سريعة، إيقاع حماسي، نصوص على الشاشة، صراحة وعفوية",
  },
  youtube: {
    name: "YouTube",
    orientation: "أفقي (16:9)",
    style: "هيكل واضح مع فصول، مقدمة منمّقة، شرح مفصّل، عناصر بصرية متعددة",
  },
  instagram: {
    name: "Instagram",
    orientation: "عمودي (9:16)",
    style: "جمالي بصري عالٍ، لقطات قصيرة منمّقة، تعليق صوتي هادئ",
  },
  facebook: {
    name: "Facebook",
    orientation: "أفقي (16:9) أو مربع (1:1)",
    style: "محتوى اجتماعي تفاعلي، قصة إنسانية، دعوة للمشاركة",
  },
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { topic, platform, duration, tone } = body as {
      topic?: string
      platform?: Platform
      duration?: Duration
      tone?: Tone
    }

    if (!topic || !topic.trim()) {
      return NextResponse.json(
        { success: false, error: "موضوع الفيديو مطلوب" },
        { status: 400 }
      )
    }
    if (!platform || !VALID_PLATFORMS.includes(platform)) {
      return NextResponse.json(
        { success: false, error: "المنصة غير صحيحة" },
        { status: 400 }
      )
    }
    if (!duration || !VALID_DURATIONS.includes(duration)) {
      return NextResponse.json(
        { success: false, error: "المدة غير صحيحة" },
        { status: 400 }
      )
    }
    if (!tone || !VALID_TONES.includes(tone)) {
      return NextResponse.json(
        { success: false, error: "النبرة غير صحيحة" },
        { status: 400 }
      )
    }

    const durInfo = DURATION_INFO[duration]
    const toneInfo = TONE_INFO[tone]
    const platInfo = PLATFORM_INFO[platform]

    const zai = await ZAI.create()

    const systemPrompt = `أنت كاتب سكربتات محترف لفيديوهات السوشيال ميديا. اكتب سكربت كامل بالعربية للموضوع والمنصة والمدة والنبرة المحددة. أرجع JSON فقط بالبنية: { hook: string (جملة جذب أول 3 ثوانٍ), intro: string (المقدمة), scenes: [{title: string, narration: string, visual: string}] (3-6 مشاهد حسب المدة), cta: string (دعوة لإجراء), outro: string (الخاتمة), estimatedDuration: string, tips: string[] (نصائح للتصوير/المونتاج) }`

    const userPrompt = `اكتب سكربت فيديو احترافي بالعربية بالمواصفات التالية:

الموضوع: ${topic.trim()}
المنصة: ${platInfo.name} — ${platInfo.orientation}
المدة: ${durInfo.label}
النبرة: ${toneInfo}
عدد المشاهد المطلوب: ${durInfo.sceneCount}

خصائص المنصة:
- الأسلوب: ${platInfo.style}

المتطلبات:
1. جملة الافتتاح (Hook) يجب أن تكون قوية وتجذب المشاهد في أول 3 ثوانٍ
2. المقدمة قصيرة ومحفّزة لإكمال المشاهدة
3. كل مشهد له عنوان واضح، تعليق صوتي مفصّل، ووصف بصري دقيق
4. الدعوة لإجراء (CTA) واضحة ومناسبة للمنصة (اشتراك/متابعة/تعليق/مشاركة)
5. الخاتمة قصيرة وذات أثر
6. estimatedDuration يجب أن تكون ضمن النطاق الزمني المحدد
7. نصائح عملية للتصوير والمونتاج (3-6 نصائح)

أرجع JSON صالح فقط بدون أي شرح إضافي.`

    const completion = await zai.chat.completions.create({
      messages: [
        { role: "assistant", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      thinking: { type: "disabled" },
    })

    const content = completion.choices[0]?.message?.content || ""

    let script: ScriptData
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      const jsonStr = jsonMatch ? jsonMatch[0] : content
      const parsed = JSON.parse(jsonStr)

      const rawScenes = Array.isArray(parsed.scenes) ? parsed.scenes : []
      const scenes: ScriptScene[] = rawScenes
        .filter(
          (s: unknown): s is ScriptScene =>
            typeof s === "object" && s !== null
        )
        .map((s) => ({
          title: typeof s.title === "string" ? s.title : "مشهد",
          narration:
            typeof s.narration === "string" ? s.narration : "",
          visual: typeof s.visual === "string" ? s.visual : "",
        }))

      const rawTips = Array.isArray(parsed.tips) ? parsed.tips : []
      const tips = rawTips
        .filter((t: unknown): t is string => typeof t === "string")
        .map((t) => t)

      script = {
        hook:
          typeof parsed.hook === "string" && parsed.hook.trim()
            ? parsed.hook.trim()
            : "",
        intro:
          typeof parsed.intro === "string" && parsed.intro.trim()
            ? parsed.intro.trim()
            : "",
        scenes: scenes.length > 0 ? scenes : [],
        cta:
          typeof parsed.cta === "string" && parsed.cta.trim()
            ? parsed.cta.trim()
            : "",
        outro:
          typeof parsed.outro === "string" && parsed.outro.trim()
            ? parsed.outro.trim()
            : "",
        estimatedDuration:
          typeof parsed.estimatedDuration === "string" && parsed.estimatedDuration.trim()
            ? parsed.estimatedDuration.trim()
            : durInfo.seconds,
        tips: tips.length > 0 ? tips : [],
      }

      // If critical fields missing, fall back
      if (!script.hook || !script.intro || script.scenes.length === 0 || !script.cta) {
        script = generateFallbackScript(topic.trim(), platform, duration, tone)
      }
    } catch {
      script = generateFallbackScript(topic.trim(), platform, duration, tone)
    }

    return NextResponse.json({
      success: true,
      data: script,
      meta: {
        topic: topic.trim(),
        platform,
        duration,
        tone,
      },
    })
  } catch (error) {
    console.error("Script generation error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "فشل توليد السكربت",
        message: error instanceof Error ? error.message : "خطأ غير معروف",
      },
      { status: 500 }
    )
  }
}

function generateFallbackScript(
  topic: string,
  platform: Platform,
  duration: Duration,
  tone: Tone
): ScriptData {
  const durInfo = DURATION_INFO[duration]
  const platInfo = PLATFORM_INFO[platform]

  const hooksByTone: Record<Tone, string> = {
    educational: `هل تعلم أن ${topic} يمكن أن يغيّر طريقة تفكيرك في 30 ثانية فقط؟`,
    entertainment: `توقف عن التمرير! ما ستشاهده عن ${topic} سيجعلك تعيد المشاهدة مرتين!`,
    inspirational: `كل ما تحتاجه للبدء مع ${topic} هو خطوة واحدة... وهذه قصتي.`,
    comedic: `لم أتوقع يوماً أن ${topic} سيدخلني في هذا الموقف المضحك!`,
  }

  const introsByTone: Record<Tone, string> = {
    educational: `في هذا الفيديو سنتعلّم معاً أساسيات ${topic} بطريقة مبسّطة وعملية تقدر تطبّقها فوراً.`,
    entertainment: `جهّز كوب قهوتك واسترخِ لأننا اليوم نقدّم لك محتوى ممتعاً عن ${topic} لن تنساه!`,
    inspirational: `اليوم أشاركك رحلتي الحقيقية مع ${topic}، بكل تحدياتها وانتصاراتها، لتستلهم منها قوتك.`,
    comedic: `إذا كنت تظن أن ${topic} أمر جاد... فانتظر لترى ما حدث معي!`,
  }

  const sceneCount = durInfo.sceneCount
  const scenes: ScriptScene[] = []
  const sceneTemplates = [
    {
      title: `البداية المثالية`,
      narration: `نبدأ بتعريف بسيط لـ ${topic}: ما هو ولماذا يهمّك أنت تحديداً؟ نقدّم الفكرة الأساسية بأسلوب يجعلك تهتم بالمتابعة.`,
      visual: `لقطة قريبة للمقدمة مع ظهور اسم القناة وعنوان الفيديو على الشاشة، خلفية نظيفة وإضاءة جيدة.`,
    },
    {
      title: `التعمّق في التفاصيل`,
      narration: `نشرح النقطة الأولى بالتفصيل مع مثال عملي يوضّح الفكرة ويجعلها سهلة الفهم والتطبيق على ${topic}.`,
      visual: `لقطات بصرية توضيحية مع نصوص مفتاحية تظهر على الشاشة، انتقالات سلسة بين اللقطات.`,
    },
    {
      title: `مثال من الواقع`,
      narration: `نستعرض قصة أو حالة واقعية مرتبطة بـ ${topic} تثبت الفكرة وتضيف مصداقية للمحتوى.`,
      visual: `صور أو لقطات داعمة للمثال مع تأثيرات بصرية خفيفة، وموسيقى خلفية هادئة.`,
    },
    {
      title: `النصيحة الذهبية`,
      narration: `نقدّم لك نصيحة احترافية حول ${topic} لا تجدها في أي مكان آخر، مستخلصة من خبرة عملية.`,
      visual: `لقطة قريبة للمتحدث مع إبراز النصيحة في نص بارز على الشاشة، تغيير بسيط في الزاوية.`,
    },
    {
      title: `تجنّب الأخطاء الشائعة`,
      narration: `نحذّرك من أكثر الأخطاء شيوعاً عند التعامل مع ${topic} وكيف تتجنّبها بسهولة.`,
      visual: `مقارنة بصرية بين الخطأ والصواب مع أيقونات توضيحية وعلامات صح وخطأ.`,
    },
    {
      title: `الخطوة التالية`,
      narration: `نختم بملخص سريع ونوضّح الخطوات العملية التي يجب اتخاذها بعد مشاهدة الفيديو.`,
      visual: `لقطة نهائية شاملة مع ملخّص مكتوب على الشاشة وموسيقى تصاعدية.`,
    },
  ]

  for (let i = 0; i < sceneCount; i++) {
    const t = sceneTemplates[i] || sceneTemplates[sceneTemplates.length - 1]
    scenes.push({ ...t })
  }

  const ctasByPlatform: Record<Platform, string> = {
    tiktok: `إذا عجبك الفيديو، اضغط زر الإعجاب واترك لنا تعليقاً بأي سؤال عن ${topic}، ومتابعتك تعني لي الكثير!`,
    youtube: `لا تنسَ الاشتراك في القناة وتفعيل الجرس ليصلك كل جديد عن ${topic}، وشاركنا رأيك في التعليقات!`,
    instagram: `احفظ المنشور لمتابعة المزيد عن ${topic}، وشاركه مع صديق يحتاجه، ومتابعتك تدعمنا للاستمرار!`,
    facebook: `أعجبك المحتوى؟ اضغط لايك وشاركه مع أصدقائك المهتمين بـ ${topic}، وتابع الصفحة للمزيد!`,
  }

  const outrosByTone: Record<Tone, string> = {
    educational: `أتمنى أنك تعلّمت شيئاً جديداً عن ${topic} اليوم. طبّق ما تعلّمته وشاركنا تجربتك في التعليقات!`,
    entertainment: `كانت هذه رحلتنا الممتعة مع ${topic}! إذا ضحكت أو استمتعت، لا تبخل علينا بمتابعة وتفاعل!`,
    inspirational: `تذكّر: كل خطوة صغيرة في ${topic} تقربك من حلمك. ابدأ اليوم ولا تنتظر اللحظة المثالية!`,
    comedic: `وهكذا انتهت مغامرتي مع ${topic}! إذا كان عندك قصة أطرف شاركها في التعليقات!`,
  }

  const tipsByPlatform: Record<Platform, string[]> = {
    tiktok: [
      `صوّر بشكل عمودي (9:16) بدقة 1080×1920`,
      `استخدم نصوصاً كبيرة وواضحة على الشاشة في أول ثانيتين`,
      `أضف موسيقى ترند مناسبة لإيقاع ${topic}`,
      `اجعل الانتقالات سريعة كل 2-3 ثوانٍ للحفاظ على الانتباه`,
      `أضف هاشتاقات مناسبة في الوصف لزيادة الوصول`,
    ],
    youtube: [
      `صوّر بشكل أفقي (16:9) بدقة 1920×1080 على الأقل`,
      `استخدم كروت نهاية (End Screens) لربط الفيديوهات`,
      `أضف فصول (Timestamps) في الوصف لتنظيم المحتوى`,
      `اهتم بمقدمة مصغّرة (Thumbnail) جذابة وعالية الجودة`,
      `أضف ترجمة عربية لزيادة الوصول وتجربة المشاهد`,
    ],
    instagram: [
      `صوّر بشكل عمودي (9:16) بدقة 1080×1920`,
      `اهتم بالجماليات البصرية والإضاءة الناعمة`,
      `استخدم فلتر موحّد لخلق هوية بصرية للقناة`,
      `أضف نصوصاً متحرّكة جذّابة على الفيديو`,
      `اكتب وصفاً قصيراً مع هاشتاقات استراتيجية`,
    ],
    facebook: [
      `أضف ترجمة نصية لأن نسبة كبيرة تشاهد بدون صوت`,
      `اجعل أول 3 ثوانٍ قوية لجذب الانتباه في الـ Feed`,
      `استخدم فيديو مربّع (1:1) أو أفقي (16:9)`,
      `أضف عنواناً واضحاً فوق الفيديو`,
      `تفاعل مع التعليقات مبكراً لزيادة الوصول`,
    ],
  }

  return {
    hook: hooksByTone[tone],
    intro: introsByTone[tone],
    scenes,
    cta: ctasByPlatform[platform],
    outro: outrosByTone[tone],
    estimatedDuration: durInfo.seconds,
    tips: tipsByPlatform[platform],
  }
}
