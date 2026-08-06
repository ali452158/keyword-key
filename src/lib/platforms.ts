import type { Platform, PlatformConfig, Country, CountryInfo } from "./types"

export const PLATFORMS: Record<Platform, PlatformConfig> = {
  tiktok: {
    id: "tiktok",
    name: "TikTok",
    arabicName: "تيك توك",
    color: "#000000",
    gradient: "from-[#25F4EE] via-[#000000] to-[#FE2C55]",
    icon: "tiktok",
  },
  youtube: {
    id: "youtube",
    name: "YouTube",
    arabicName: "يوتيوب",
    color: "#FF0000",
    gradient: "from-[#FF0000] to-[#CC0000]",
    icon: "youtube",
  },
  instagram: {
    id: "instagram",
    name: "Instagram",
    arabicName: "انستجرام",
    color: "#E4405F",
    gradient: "from-[#F58529] via-[#DD2A7B] to-[#8134AF]",
    icon: "instagram",
  },
  facebook: {
    id: "facebook",
    name: "Facebook",
    arabicName: "فيسبوك",
    color: "#1877F2",
    gradient: "from-[#1877F2] to-[#0A5BC4]",
    icon: "facebook",
  },
}

export const PLATFORM_LIST = Object.values(PLATFORMS)

export const COUNTRIES: CountryInfo[] = [
  { code: "global", name: "عالمي", flag: "🌍" },
  { code: "eg", name: "مصر", flag: "🇪🇬" },
  { code: "sa", name: "السعودية", flag: "🇸🇦" },
  { code: "ae", name: "الإمارات", flag: "🇦🇪" },
  { code: "kw", name: "الكويت", flag: "🇰🇼" },
  { code: "qa", name: "قطر", flag: "🇶🇦" },
  { code: "ma", name: "المغرب", flag: "🇲🇦" },
  { code: "dz", name: "الجزائر", flag: "🇩🇿" },
  { code: "us", name: "أمريكا", flag: "🇺🇸" },
]

export const COUNTRY_MAP: Record<Country, CountryInfo> = COUNTRIES.reduce(
  (acc, c) => {
    acc[c.code] = c
    return acc
  },
  {} as Record<Country, CountryInfo>
)

export const CATEGORIES = [
  "ترفيه",
  "تكنولوجيا",
  "طبخ",
  "رياضة",
  "جمال",
  "أزياء",
  "سفر",
  "تعليم",
  "ألعاب",
  "موسيقى",
  "أخبار",
  "صحة",
  "تسوق",
  "أعمال",
  "كوميديا",
  "أطفال",
]

export const COMPETITION_LABELS: Record<string, string> = {
  low: "منخفضة",
  medium: "متوسطة",
  high: "عالية",
}
