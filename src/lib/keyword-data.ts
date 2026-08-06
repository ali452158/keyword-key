import type {
  Platform,
  KeywordTrend,
  Country,
  TrendPeriod,
  KeywordDetail,
} from "./types"
import { CATEGORIES } from "./platforms"

// Seeded random for stable results
function seededRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
}

function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash |= 0
  }
  return Math.abs(hash)
}

// Base keyword pool per platform (Arabic + English mix)
const KEYWORD_POOLS: Record<Platform, string[]> = {
  tiktok: [
    "تحدي الرقص",
    "ميلز",
    "دويت",
    "ترند",
    "فلتر",
    "مكياج",
    "وصفة سريعة",
    "حياة يومية",
    "كوميديا",
    "لعبة",
    "react",
    "storytime",
    "lifehack",
    "tutorial",
    "viral",
    "fyp",
    "foryou",
    "trending",
    "challenge",
    "dance",
    "موضة",
    "تسوق",
    "تخفيضات",
    "خصومات",
    "مكياج عيون",
    "روتين العناية",
    "تمارين منزلية",
    "وصفات رمضان",
    "أغاني",
    "رقص",
  ],
  youtube: [
    "شرح",
    "مراجعة",
    "تجربة",
    "فل المنتخب",
    "بودكاست",
    "مقابلة",
    "دورة تعليمية",
    "برمجة",
    "تصميم",
    "مونتاج",
    "ألعاب",
    "gameplay",
    "walkthrough",
    "review",
    "tutorial",
    "vlog",
    "تحدي",
    "reaction",
    "قصة",
    "وثائقي",
    "تقنية",
    "هواتف",
    "كمبيوتر",
    "تطبيقات",
    "استثمار",
    "تجارة",
    "كرة قدم",
    "رياضة",
    "سيارات",
    "سفر",
  ],
  instagram: [
    "تصوير",
    "مكياج",
    "أزياء",
    "ديكور",
    "طعام",
    "قهوة",
    "سفر",
    "لايف ستايل",
    "راوتين",
    "grwm",
    "ootd",
    "motivation",
    "quotes",
    "aesthetic",
    "minimal",
    "luxury",
    "travel",
    "foodie",
    "fitness",
    "wellness",
    "عناية بالبشرة",
    "شعر",
    "أظافر",
    "إكسسوارات",
    "تسوق أونلاين",
    "مطاعم",
    "كافيهات",
    "مناسبات",
    "أعراس",
    "هدايا",
  ],
  facebook: [
    "أخبار",
    "وظائف",
    "إعلانات",
    "تسويق",
    "أعمال",
    "محلية",
    "مجتمع",
    " فعاليات",
    "تخفيضات",
    "عروض",
    "marketplace",
    "groups",
    "events",
    "news",
    "business",
    "community",
    "recipes",
    "diy",
    "home",
    "family",
    "صحة",
    "تعليم",
    "مقالات",
    "نصائح",
    "إرشادات",
    "ورش عمل",
    "دورات",
    "تدريب",
    "استشارات",
    "خدمات",
  ],
}

const HASHTAG_MAP: Record<string, string> = {
  "تحدي الرقص": "#dancechallenge",
  ميلز: "#reels",
  دويت: "#duet",
  ترند: "#trending",
  فلتر: "#filter",
  مكياج: "#makeup",
  "وصفة سريعة": "#recipe",
  "حياة يومية": "#dailyvlog",
  كوميديا: "#comedy",
  لعبة: "#gaming",
  فل: "#pharaohs",
  شرح: "#tutorial",
  مراجعة: "#review",
  تجربة: "#experiment",
  بودكاست: "#podcast",
  مقابلة: "#interview",
  "دورة تعليمية": "#course",
  برمجة: "#coding",
  تصميم: "#design",
  مونتاج: "#editing",
  ألعاب: "#gaming",
  تصوير: "#photography",
  أزياء: "#fashion",
  ديكور: "#decor",
  طعام: "#food",
  قهوة: "#coffee",
  سفر: "#travel",
  أخبار: "#news",
  وظائف: "#jobs",
  إعلانات: "#ads",
  تسويق: "#marketing",
  أعمال: "#business",
}

export function generateTrends(
  platform?: Platform,
  country: Country = "global",
  period: TrendPeriod = "daily",
  limit = 12
): KeywordTrend[] {
  const platforms: Platform[] = platform
    ? [platform]
    : ["tiktok", "youtube", "instagram", "facebook"]

  const results: KeywordTrend[] = []
  const seed = hashString(`${platform}-${country}-${period}`)
  const random = seededRandom(seed)

  platforms.forEach((p) => {
    const pool = KEYWORD_POOLS[p]
    const shuffled = [...pool].sort(() => random() - 0.5)

    shuffled.slice(0, limit).forEach((keyword, idx) => {
      const volumeBase =
        period === "daily"
          ? Math.floor(random() * 900000) + 10000
          : Math.floor(random() * 5000000) + 500000

      const growth = Math.floor((random() - 0.3) * 200)
      const competitionRoll = random()
      const competition =
        competitionRoll > 0.7 ? "high" : competitionRoll > 0.4 ? "medium" : "low"

      const category = CATEGORIES[Math.floor(random() * CATEGORIES.length)]

      results.push({
        id: `${p}-${country}-${period}-${idx}`,
        keyword,
        platform: p,
        searchVolume: volumeBase,
        competition,
        growth,
        trendScore: Math.floor(random() * 40) + 60,
        category,
        country,
        period,
        hashtag: HASHTAG_MAP[keyword] || `#${keyword.replace(/\s/g, "")}`,
      })
    })
  })

  return results.sort((a, b) => b.trendScore - a.trendScore)
}

export function searchKeywords(
  query: string,
  platform?: Platform
): KeywordDetail[] {
  if (!query.trim()) return []

  const platforms: Platform[] = platform
    ? [platform]
    : ["tiktok", "youtube", "instagram", "facebook"]

  const results: KeywordDetail[] = []
  const seed = hashString(query.toLowerCase())
  const random = seededRandom(seed)

  platforms.forEach((p) => {
    const volume = Math.floor(random() * 4000000) + 50000
    const competitionScore = Math.floor(random() * 80) + 10
    const competition =
      competitionScore > 66
        ? "high"
        : competitionScore > 33
        ? "medium"
        : "low"
    const difficulty = Math.floor(random() * 70) + 20
    const growth = Math.floor((random() - 0.3) * 150)

    // related keywords
    const pool = KEYWORD_POOLS[p]
    const related = pool
      .filter(
        (k) =>
          k.includes(query) ||
          query.includes(k) ||
          k.toLowerCase().includes(query.toLowerCase()) ||
          Math.random() > 0.7
      )
      .slice(0, 6)
      .map((k) => ({
        keyword: k,
        volume: Math.floor(random() * 500000) + 5000,
      }))

    // trend history (last 12 points)
    const trendHistory = Array.from({ length: 12 }).map((_, i) => ({
      date: new Date(Date.now() - (11 - i) * 86400000).toISOString().slice(0, 10),
      value: Math.floor(
        volume * (0.6 + random() * 0.4) * (1 + (growth / 100) * (i / 11))
      ),
    }))

    // suggestions
    const suggestions = [
      `${query} 2025`,
      `${query} للمبتدئين`,
      `أفضل ${query}`,
      `${query} بالعربي`,
      `شرح ${query}`,
      `${query} tips`,
    ]

    results.push({
      keyword: query,
      platform: p,
      searchVolume: volume,
      competition,
      competitionScore,
      cpc: Math.round(random() * 50 + 5) / 10,
      difficulty,
      growth,
      relatedKeywords: related,
      trendHistory,
      suggestions,
    })
  })

  return results
}

export function getPlatformKeywordStats(platform: Platform) {
  const seed = hashString(`stats-${platform}`)
  const random = seededRandom(seed)
  return {
    totalKeywords: Math.floor(random() * 50000) + 10000,
    trendingToday: Math.floor(random() * 2000) + 200,
    avgGrowth: Math.floor(random() * 80) + 10,
    topCategory: CATEGORIES[Math.floor(random() * CATEGORIES.length)],
  }
}
