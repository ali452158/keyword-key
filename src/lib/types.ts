export type Platform = "tiktok" | "youtube" | "instagram" | "facebook"

export type TrendPeriod = "daily" | "weekly"

export type Country =
  | "global"
  | "eg"
  | "sa"
  | "ae"
  | "us"
  | "kw"
  | "qa"
  | "ma"
  | "dz"

export interface KeywordTrend {
  id: string
  keyword: string
  platform: Platform
  searchVolume: number
  competition: "low" | "medium" | "high"
  growth: number // percentage
  trendScore: number // 0-100
  category: string
  country: Country
  period: TrendPeriod
  hashtag?: string
}

export interface KeywordDetail {
  keyword: string
  platform: Platform
  searchVolume: number
  competition: "low" | "medium" | "high"
  competitionScore: number // 0-100
  cpc: number
  difficulty: number // 0-100
  growth: number
  relatedKeywords: { keyword: string; volume: number }[]
  trendHistory: { date: string; value: number }[]
  suggestions: string[]
}

export interface CompetitorAnalysis {
  account: string
  platform: Platform
  followers: number
  engagementRate: number
  keywords: {
    keyword: string
    frequency: number
    relevance: number
  }[]
  topHashtags: string[]
  contentThemes: string[]
  postingFrequency: string
  bestPostingTimes: string[]
  summary: string
}

export interface ContentIdea {
  platform: Platform
  type: string
  title: string
  hook: string
  description: string
  hashtags: string[]
  estimatedReach: string
  duration: string
}

export interface CountryInfo {
  code: Country
  name: string
  flag: string
}

export interface PlatformConfig {
  id: Platform
  name: string
  arabicName: string
  color: string
  gradient: string
  icon: string // svg path data or identifier
}
