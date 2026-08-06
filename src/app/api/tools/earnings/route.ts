import { NextRequest, NextResponse } from "next/server"
import type { Platform } from "@/lib/types"

export const dynamic = "force-dynamic"

type Niche =
  | "entertainment"
  | "tech"
  | "gaming"
  | "beauty"
  | "education"
  | "food"
  | "finance"
  | "lifestyle"

const VALID_PLATFORMS: Platform[] = ["tiktok", "youtube", "instagram", "facebook"]
const VALID_NICHES: Niche[] = [
  "entertainment",
  "tech",
  "gaming",
  "beauty",
  "education",
  "food",
  "finance",
  "lifestyle",
]

interface RpmRange {
  low: number
  mid: number
  high: number
}

// RPM = revenue per 1000 views (USD)
// Values per platform × niche: [low, mid, high]
const RPM_TABLE: Record<Platform, Record<Niche, RpmRange>> = {
  youtube: {
    entertainment: { low: 2, mid: 3.5, high: 5 },
    tech: { low: 5, mid: 10, high: 15 },
    gaming: { low: 3, mid: 5.5, high: 8 },
    beauty: { low: 4, mid: 7, high: 10 },
    education: { low: 4, mid: 8, high: 12 },
    food: { low: 3, mid: 5.5, high: 8 },
    finance: { low: 8, mid: 11.5, high: 15 },
    lifestyle: { low: 3, mid: 5.5, high: 8 },
  },
  tiktok: {
    entertainment: { low: 0.5, mid: 1, high: 1.5 },
    tech: { low: 1, mid: 1.75, high: 2.5 },
    gaming: { low: 0.7, mid: 1.35, high: 2 },
    beauty: { low: 1, mid: 1.75, high: 2.5 },
    education: { low: 0.8, mid: 1.4, high: 2 },
    food: { low: 0.8, mid: 1.4, high: 2 },
    finance: { low: 1.5, mid: 2.25, high: 3 },
    lifestyle: { low: 0.8, mid: 1.4, high: 2 },
  },
  instagram: {
    entertainment: { low: 1, mid: 1.5, high: 2 },
    tech: { low: 2, mid: 3, high: 4 },
    gaming: { low: 1, mid: 2, high: 3 },
    beauty: { low: 2, mid: 3.5, high: 5 },
    education: { low: 1.5, mid: 2.75, high: 4 },
    food: { low: 1.5, mid: 2.75, high: 4 },
    finance: { low: 3, mid: 4, high: 5 },
    lifestyle: { low: 2, mid: 3, high: 4 },
  },
  facebook: {
    entertainment: { low: 0.5, mid: 1, high: 1.5 },
    tech: { low: 1, mid: 1.75, high: 2.5 },
    gaming: { low: 0.7, mid: 1.35, high: 2 },
    beauty: { low: 1, mid: 1.75, high: 2.5 },
    education: { low: 1, mid: 1.75, high: 2.5 },
    food: { low: 1, mid: 1.5, high: 2 },
    finance: { low: 2, mid: 2.5, high: 3 },
    lifestyle: { low: 1, mid: 1.75, high: 2.5 },
  },
}

interface RevenueSplit {
  source: string
  share: number
}

const BREAKDOWN_SPLITS: Record<Platform, RevenueSplit[]> = {
  youtube: [
    { source: "إعلانات AdSense", share: 0.5 },
    { source: "رعايات/Brand Deals", share: 0.3 },
    { source: "اشتراكات/Memberships", share: 0.1 },
    { source: "تسويق بالعمولة", share: 0.1 },
  ],
  tiktok: [
    { source: "صندوق المبدعين", share: 0.1 },
    { source: "رعايات/Brand Deals", share: 0.6 },
    { source: "بث مباشر", share: 0.15 },
    { source: "تسويق بالعمولة", share: 0.15 },
  ],
  instagram: [
    { source: "رعايات/Brand Deals", share: 0.75 },
    { source: "تسويق بالعمولة", share: 0.15 },
    { source: "متجر/منتجات", share: 0.05 },
    { source: "إكراميات/بث مباشر", share: 0.05 },
  ],
  facebook: [
    { source: "إعلانات In-Stream", share: 0.6 },
    { source: "رعايات/Brand Deals", share: 0.25 },
    { source: "تسويق بالعمولة", share: 0.1 },
    { source: "نجوم/Stars", share: 0.05 },
  ],
}

const NICHE_LABELS: Record<Niche, string> = {
  entertainment: "الترفيه",
  tech: "التقنية",
  gaming: "الألعاب",
  beauty: "الجمال",
  education: "التعليم",
  food: "الطعام",
  finance: "المال والأعمال",
  lifestyle: "لايف ستايل",
}

// Platform-level tips (2 each)
const PLATFORM_TIPS: Record<Platform, string[]> = {
  youtube: [
    "فعّل تحقيق الدخل من AdSense واضمن تجاوز شروط شراكة يوتيوب (1000 مشترك + 4000 ساعة مشاهدة).",
    "أنشئ قناة MemberHub ووفّر مزايا حصرية للمشتركين كمصدر دخل ثابت إعلاناتك.",
  ],
  tiktok: [
    "بصرف النظر عن صندوق المبدعين، ركّز على الرعايات فهي المصدر الأكبر للأرباح على تيك توك.",
    "فعّل ميزة البث المباشر واستقبل الهدايا (Gifts) من متابعيك لتعزيز دخل القناة.",
  ],
  instagram: [
    "اعرض باقات إعلانية مدفوعة على منصات مثل Collabstr أو Aspire لجذب المعلنين بشكل احترافي.",
    "فعّل متجر Instagram Shopping لبيع منتجاتك الخاصة أو المنتجات بالعمولة مباشرة من المنشورات.",
  ],
  facebook: [
    "فعّل إعلانات In-Stream على فيديوهاتك التي تزيد عن 3 دقائق للحصول على دخل إعلاني مستمر.",
    "أنشئ مجموعة Facebook Stars لتمكين المتابعين من إرسال نجوم ودعم مالي أثناء البث المباشر.",
  ],
}

// Niche-level tips (2 each)
const NICHE_TIPS: Record<Niche, string[]> = {
  entertainment: [
    "حافظ على وتيرة نشر عالية (3–5 مرات أسبوعياً) فمحتوى الترفيه يعتمد على الحجم لا القيمة الفردية للفيديو.",
    "طوّر شخصية مميزة (Persona) تجعل المعلنين يرتبطون بهويتك بدلاً من المنافسين.",
  ],
  tech: [
    "اكتب روابط تسويق بالعمولة لكل منتج تشاركه (Amazon Associates, Noon) فجمهور التقنية يشتري بسرعة.",
    "اعقد صفقات رعاية طويلة المدى مع شركات الهواتف والإكسسوارات لأن معدل التحويل في هذا المجال مرتفع.",
  ],
  gaming: [
    "فعّل بث مباشر على Twitch/YouTube Live، فالهدايا والاشتراكات مصدر دخل كبير لصناع محتوى الألعاب.",
    "شارك رموز Affiliate للعبة أو المتجر (Epic Games, Steam) واربح عمولة من كل عملية شراء.",
  ],
  beauty: [
    "تعاون مع علامات تجميل صغيرة ومتوسطة أولاً لبناء معرض أعمال (Portfolio) يجذب الرعايات الكبرى لاحقاً.",
    "استخدم affiliate links لأدوات التجميل والمنتجات في وصف كل فيديو لمضاعفة الأرباح.",
  ],
  education: [
    "أنشئ دورات مدفوعة على Udemy أو منصتك الخاصة، فجمهور التعليم مستعد للدفع مقابل المحتوى المتعمق.",
    "قدّم استشارات أو كوتشينج مدفوع للطلاب الراغبين بمتابعة شخصية في تخصصك.",
  ],
  food: [
    "تعرّف على علامات الأطعمة والمطاعم المحلية للرعايات، فهي تبحث باستمرار عن صنّاع محتوى طعام.",
    "أطلق كتاب وصفات إلكتروني (E-book) أو كيت أدوات مطبخ برابط Affiliate كمصدر دخل إضافي.",
  ],
  finance: [
    "ارفع أسعار الرعايات لأن جمهور المال أعلى قيمة وأكثر استعداداً للدفع (CPC مرتفع).",
    "سجّل في برامج Affiliate للوسطاء الماليين والبنوك (تحذير: أوضح المخاطر دائماً لجمهورك).",
  ],
  lifestyle: [
    "اجمع بين عدة مصادر دخل: رعايات + Affiliate + منتجاتك الخاصة، فمجال لايف ستايل مرن جداً.",
    "وثّق رحلاتك وتجاربك مع العلامات التجارية بصيغة Story لتجذب صفقات رعاية طويلة الأمد.",
  ],
}

interface EarningsEstimate {
  low: number
  mid: number
  high: number
}

interface RevenueBreakdownItem {
  source: string
  amount: number
}

interface EarningsResult {
  platform: Platform
  niche: Niche
  nicheLabel: string
  followers: number
  viewsPerMonth: number
  rpm: number
  monthlyEstimate: EarningsEstimate
  yearlyEstimate: EarningsEstimate
  breakdown: RevenueBreakdownItem[]
  tips: string[]
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { success: false, error: "صيغة الطلب غير صحيحة" },
        { status: 400 }
      )
    }

    const platform = body.platform as Platform
    const followers = Number(body.followers)
    const viewsPerMonth = Number(body.viewsPerMonth)
    const niche = body.niche as Niche

    // Validation
    if (!VALID_PLATFORMS.includes(platform)) {
      return NextResponse.json(
        { success: false, error: "المنصة غير صحيحة" },
        { status: 400 }
      )
    }
    if (!VALID_NICHES.includes(niche)) {
      return NextResponse.json(
        { success: false, error: "المجال غير صحيح" },
        { status: 400 }
      )
    }
    if (!Number.isFinite(followers) || followers <= 0) {
      return NextResponse.json(
        { success: false, error: "عدد المتابعين يجب أن يكون أكبر من صفر" },
        { status: 400 }
      )
    }
    if (!Number.isFinite(viewsPerMonth) || viewsPerMonth <= 0) {
      return NextResponse.json(
        { success: false, error: "المشاهدات الشهرية يجب أن تكون أكبر من صفر" },
        { status: 400 }
      )
    }

    const rpmRange = RPM_TABLE[platform][niche]
    const viewsInThousands = viewsPerMonth / 1000

    const monthlyEstimate: EarningsEstimate = {
      low: round2(rpmRange.low * viewsInThousands),
      mid: round2(rpmRange.mid * viewsInThousands),
      high: round2(rpmRange.high * viewsInThousands),
    }

    const yearlyEstimate: EarningsEstimate = {
      low: round2(monthlyEstimate.low * 12),
      mid: round2(monthlyEstimate.mid * 12),
      high: round2(monthlyEstimate.high * 12),
    }

    // Breakdown based on mid estimate
    const splits = BREAKDOWN_SPLITS[platform]
    const breakdown: RevenueBreakdownItem[] = splits
      .map((s) => ({
        source: s.source,
        amount: round2(monthlyEstimate.mid * s.share),
      }))
      .sort((a, b) => b.amount - a.amount)

    // Tips: 2 platform + 2 niche = 4
    const tips: string[] = [
      ...PLATFORM_TIPS[platform],
      ...NICHE_TIPS[niche],
    ]

    const result: EarningsResult = {
      platform,
      niche,
      nicheLabel: NICHE_LABELS[niche],
      followers,
      viewsPerMonth,
      rpm: rpmRange.mid,
      monthlyEstimate,
      yearlyEstimate,
      breakdown,
      tips,
    }

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "فشل حساب الأرباح",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
