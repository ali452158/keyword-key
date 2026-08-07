/**
 * Real social media profile scraper.
 *
 * Fetches REAL public account data directly from the platform's public
 * profile pages. This replaces the previous behaviour where the API
 * would generate fake/estimated data using the LLM.
 *
 * Supported:
 *  - TikTok:   scrapes __UNIVERSAL_DATA_FOR_REHYDRATION__ from the
 *              public profile page — returns real follower/following/
 *              likes/video counts + recent video stats.
 *  - YouTube:  scrapes ytInitialData from the public channel page —
 *              returns real subscriber count + recent video stats.
 *  - Instagram: best-effort scrape of the public profile JSON. Instagram
 *              aggressively blocks server-side requests, so this often
 *              falls back to "unavailable".
 *  - Facebook: no reliable public scraping — always returns null.
 *
 * All fetches use browser-like headers to reduce the chance of being
 * blocked. On any failure the function returns `null` so the caller can
 * fall back to AI-based estimation (clearly labelled as estimated).
 */

import type { Platform } from "@/lib/types"

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export interface RealProfile {
  /** Real username (without @) */
  username: string
  /** Display name / nickname */
  displayName: string
  /** Profile bio / description */
  bio: string
  /** Avatar URL */
  avatarUrl: string
  /** Is the account verified? */
  verified: boolean
  /** Real follower count */
  followers: number
  /** Real following count */
  following: number
  /** Total posts / videos count */
  totalPosts: number
  /** Total likes (TikTok heartCount, YouTube viewCount) */
  totalLikes: number
  /** Recent top posts with real stats */
  recentPosts: RealPost[]
  /** Where the data came from */
  dataSource: "real"
}

export interface RealPost {
  title: string
  views: number
  likes: number
  comments: number
  shares: number
  url: string
}

/* ------------------------------------------------------------------ */
/* Shared HTTP helper                                                  */
/* ------------------------------------------------------------------ */

const BROWSER_HEADERS: Record<string, string> = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  // NOTE: Node's built-in fetch (undici) auto-decompresses gzip and deflate
  // but does NOT handle Brotli (br). If we advertise br, TikTok/YouTube
  // may respond with Brotli and we'd get garbled bytes. Only advertise
  // encodings we can actually decompress.
  "Accept-Encoding": "gzip, deflate",
  "Cache-Control": "no-cache",
  Pragma: "no-cache",
  "Sec-Ch-Ua":
    '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
  "Sec-Ch-Ua-Mobile": "?0",
  "Sec-Ch-Ua-Platform": '"Windows"',
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "none",
  "Sec-Fetch-User": "?1",
  "Upgrade-Insecure-Requests": "1",
}

async function fetchHtml(url: string): Promise<string | null> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)
    const res = await fetch(url, {
      headers: BROWSER_HEADERS,
      signal: controller.signal,
      redirect: "follow",
    })
    clearTimeout(timeout)
    if (!res.ok) {
      console.warn(`[social-profiles] ${url} returned HTTP ${res.status}`)
      return null
    }
    return await res.text()
  } catch (err) {
    console.warn(
      `[social-profiles] fetch failed for ${url}:`,
      err instanceof Error ? err.message : err
    )
    return null
  }
}

/* ------------------------------------------------------------------ */
/* TikTok                                                              */
/* ------------------------------------------------------------------ */

interface TikTokUserData {
  user?: {
    id?: string
    uniqueId?: string
    nickname?: string
    signature?: string
    avatarLarger?: string
    avatarMedium?: string
    verified?: boolean
  }
  stats?: {
    followerCount?: number
    followingCount?: number
    heartCount?: number
    videoCount?: number
  }
}

interface TikTokItemModule {
  video?: {
    id?: string
    desc?: string
    playCount?: number
    diggCount?: number
    commentCount?: number
    shareCount?: number
    cover?: string
  }
}

/**
 * Fetch a TikTok profile using the RapidAPI TikTok scraper service.
 *
 * TikTok's own public pages no longer embed user data in the initial
 * HTML (it's loaded client-side via signed API calls), so direct
 * scraping no longer works. The most reliable way to get real data
 * without running a headless browser is to use a third-party scraper
 * API. RapidAPI hosts several free-tier TikTok scrapers.
 *
 * The user must set RAPIDAPI_KEY in their .env (get a free key at
 * https://rapidapi.com — search for "TikTok Scraper").
 */
async function fetchTikTokViaRapidAPI(
  username: string
): Promise<RealProfile | null> {
  const apiKey = process.env.RAPIDAPI_KEY
  if (!apiKey) return null

  const clean = username.trim().replace(/^@/, "")
  if (!clean) return null

  /**
   * Verified working provider: tiktok-scraper7
   * - GET /user/info?unique_id={username} → user + stats
   * - GET /user/posts?unique_id={username}&count=3 → recent videos
   *
   * Response shape (user/info):
   *   { code: 0, msg: "success", data: { user: {...}, stats: {...} } }
   *   user fields: uniqueId, nickname, signature, avatarLarger, verified
   *   stats fields: followerCount, followingCount, heartCount, videoCount
   *
   * Response shape (user/posts):
   *   { code: 0, data: { videos: [{ aweme_id, title, play_count,
   *     digg_count, comment_count, share_count, cover }] } }
   */
  try {
    const profile = await fetchTikTokScraper7(clean, apiKey)
    if (profile) return profile
  } catch (err) {
    console.warn(
      "[social-profiles] tiktok-scraper7 failed:",
      err instanceof Error ? err.message : err
    )
  }

  // Fallback: tiktok-api15 (different response shape — tried only if
  // the user subscribed to that API instead)
  try {
    const profile = await fetchTikTokApi15(clean, apiKey)
    if (profile) return profile
  } catch (err) {
    console.warn(
      "[social-profiles] tiktok-api15 failed:",
      err instanceof Error ? err.message : err
    )
  }

  return null
}

type AnyJson = Record<string, unknown>

/** Helper: call a RapidAPI endpoint with auth headers. */
async function callRapidAPI(
  host: string,
  path: string,
  apiKey: string,
  timeoutMs = 15000
): Promise<AnyJson | null> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(`https://${host}${path}`, {
      headers: {
        "X-RapidAPI-Key": apiKey,
        "X-RapidAPI-Host": host,
        Accept: "application/json",
      },
      signal: controller.signal,
    })
    clearTimeout(timeout)

    if (!res.ok) {
      console.warn(
        `[social-profiles] RapidAPI ${host} returned HTTP ${res.status}`
      )
      return null
    }

    return (await res.json()) as AnyJson
  } catch (err) {
    clearTimeout(timeout)
    console.warn(
      `[social-profiles] RapidAPI ${host} fetch failed:`,
      err instanceof Error ? err.message : err
    )
    return null
  }
}

/** Provider: tiktok-scraper7.p.rapidapi.com */
async function fetchTikTokScraper7(
  username: string,
  apiKey: string
): Promise<RealProfile | null> {
  const host = "tiktok-scraper7.p.rapidapi.com"
  const encoded = encodeURIComponent(username)

  // 1. Fetch user info
  const infoJson = await callRapidAPI(
    host,
    `/user/info?unique_id=${encoded}`,
    apiKey
  )
  if (!infoJson || infoJson.code !== 0) {
    console.warn(
      "[social-profiles] tiktok-scraper7 user/info failed:",
      infoJson?.msg || "unknown"
    )
    return null
  }

  const data = (infoJson.data || {}) as AnyJson
  const user = data.user as AnyJson | undefined
  const stats = data.stats as AnyJson | undefined
  if (!user) return null

  // 2. Fetch recent posts (in parallel-safe manner, but we need user
  //    info first to know the account exists)
  let recentPosts: RealPost[] = []
  const postsJson = await callRapidAPI(
    host,
    `/user/posts?unique_id=${encoded}&count=3`,
    apiKey
  )
  if (postsJson && postsJson.code === 0) {
    const videos = ((postsJson.data as AnyJson)?.videos || []) as AnyJson[]
    recentPosts = videos.slice(0, 3).map((v) => ({
      title: String(v.title || v.desc || "بدون عنوان"),
      views: Number(v.play_count) || 0,
      likes: Number(v.digg_count) || 0,
      comments: Number(v.comment_count) || 0,
      shares: Number(v.share_count) || 0,
      url: v.video_id
        ? `https://www.tiktok.com/@${username}/video/${v.video_id}`
        : "",
    }))
  }

  return {
    username: String(user.uniqueId || username),
    displayName: String(user.nickname || username),
    bio: String(user.signature || ""),
    avatarUrl: String(
      user.avatarLarger || user.avatarMedium || user.avatarThumb || ""
    ),
    verified: Boolean(user.verified),
    followers: Number(stats?.followerCount) || 0,
    following: Number(stats?.followingCount) || 0,
    totalPosts: Number(stats?.videoCount) || 0,
    totalLikes: Number(stats?.heartCount) || 0,
    recentPosts,
    dataSource: "real",
  }
}

/** Provider: tiktok-api15.p.rapidapi.com (fallback if user subscribed to it) */
async function fetchTikTokApi15(
  username: string,
  apiKey: string
): Promise<RealProfile | null> {
  const host = "tiktok-api15.p.rapidapi.com"
  const encoded = encodeURIComponent(username)

  const json = await callRapidAPI(
    host,
    `/api/user/info?username=${encoded}`,
    apiKey
  )
  if (!json) return null

  const user = (json.userInfo?.user || json.user) as AnyJson | undefined
  const stats = (json.userInfo?.stats || json.stats) as AnyJson | undefined
  if (!user) return null

  return {
    username: String(user.uniqueId || username),
    displayName: String(user.nickname || username),
    bio: String(user.signature || ""),
    avatarUrl: String(user.avatarLarger || user.avatarMedium || ""),
    verified: Boolean(user.verified),
    followers: Number(stats?.followerCount) || 0,
    following: Number(stats?.followingCount) || 0,
    totalPosts: Number(stats?.videoCount) || 0,
    totalLikes: Number(stats?.heartCount) || 0,
    recentPosts: [],
    dataSource: "real",
  }
}

/**
 * Scrape a TikTok public profile page and extract real account data.
 *
 * TikTok used to embed all user data in a `<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__">`
 * tag as JSON. Recent versions of TikTok now load user data client-side
 * via signed API calls, so this method often returns null. We keep it
 * as a fallback in case the data is present for some accounts/regions.
 */
export async function fetchTikTokProfile(
  username: string
): Promise<RealProfile | null> {
  const clean = username.trim().replace(/^@/, "")
  if (!clean) return null

  // PRIMARY: try RapidAPI if a key is configured
  const rapidProfile = await fetchTikTokViaRapidAPI(clean)
  if (rapidProfile) return rapidProfile

  // FALLBACK: try direct HTML scraping (may fail on modern TikTok)
  const url = `https://www.tiktok.com/@${clean}`
  const html = await fetchHtml(url)
  if (!html) return null

  // Extract the universal data JSON blob
  const marker =
    '"__UNIVERSAL_DATA_FOR_REHYDRATION__":'
  let jsonStr: string | null = null

  // Method 1: pull from the script tag content
  const scriptMatch = html.match(
    /<script[^>]*id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>([\s\S]*?)<\/script>/i
  )
  if (scriptMatch && scriptMatch[1]) {
    jsonStr = scriptMatch[1].trim()
  }

  // Method 2: pull from inline JSON assignment
  if (!jsonStr) {
    const idx = html.indexOf(marker)
    if (idx !== -1) {
      const start = idx + marker.length
      // find the matching closing brace
      let depth = 0
      let inStr = false
      let escape = false
      let end = -1
      for (let i = start; i < html.length; i++) {
        const ch = html[i]
        if (escape) {
          escape = false
          continue
        }
        if (ch === "\\") {
          escape = true
          continue
        }
        if (ch === '"') {
          inStr = !inStr
          continue
        }
        if (inStr) continue
        if (ch === "{") depth++
        else if (ch === "}") {
          depth--
          if (depth === 0) {
            end = i + 1
            break
          }
        }
      }
      if (end > start) {
        jsonStr = html.slice(start, end)
      }
    }
  }

  if (!jsonStr) {
    console.warn("[social-profiles] TikTok: universal data blob not found")
    return null
  }

  let universal: Record<string, unknown>
  try {
    universal = JSON.parse(jsonStr)
  } catch {
    console.warn("[social-profiles] TikTok: failed to parse universal JSON")
    return null
  }

  // Navigate to userInfo — the path varies slightly between TikTok versions
  const scope = (universal as { __default?: { scope?: Record<string, unknown> } })
    ?.__default?.scope
  if (!scope || typeof scope !== "object") return null

  const userDetail =
    (scope as Record<string, { userInfo?: TikTokUserData }>)["webapp.user-detail"] ||
    (scope as Record<string, { userInfo?: TikTokUserData }>)["user-detail"]

  const userInfo: TikTokUserData | undefined = userDetail?.userInfo
  if (!userInfo || !userInfo.user || !userInfo.stats) {
    console.warn("[social-profiles] TikTok: userInfo not found in scope")
    return null
  }

  // Extract recent videos from itemModuleList if present
  const recentPosts: RealPost[] = []
  const postListScope = (scope as Record<string, unknown>)["webapp.post-list"] as
    | { itemList?: unknown[] }
    | undefined
  const itemModule =
    (universal as {
      __default?: { scope?: Record<string, { itemModuleList?: TikTokItemModule[] }> }
    })?.__default?.scope?.["webapp.video-list"]?.itemModuleList

  const items = itemModule || postListScope?.itemList || []
  for (const item of items) {
    const video = (item as TikTokItemModule)?.video
    if (!video || !video.id) continue
    recentPosts.push({
      title: video.desc || "بدون عنوان",
      views: Number(video.playCount) || 0,
      likes: Number(video.diggCount) || 0,
      comments: Number(video.commentCount) || 0,
      shares: Number(video.shareCount) || 0,
      url: `https://www.tiktok.com/@${clean}/video/${video.id}`,
    })
    if (recentPosts.length >= 3) break
  }

  return {
    username: userInfo.user.uniqueId || clean,
    displayName: userInfo.user.nickname || clean,
    bio: userInfo.user.signature || "",
    avatarUrl:
      userInfo.user.avatarLarger ||
      userInfo.user.avatarMedium ||
      "",
    verified: Boolean(userInfo.user.verified),
    followers: Number(userInfo.stats.followerCount) || 0,
    following: Number(userInfo.stats.followingCount) || 0,
    totalPosts: Number(userInfo.stats.videoCount) || 0,
    totalLikes: Number(userInfo.stats.heartCount) || 0,
    recentPosts,
    dataSource: "real",
  }
}

/* ------------------------------------------------------------------ */
/* YouTube                                                            */
/* ------------------------------------------------------------------ */

interface YouTubeChannelData {
  subscriberCount?: number
  videoCount?: number
  viewCount?: number
  title?: string
  description?: string
  avatarUrl?: string
  recentVideos: RealPost[]
}

/**
 * Scrape a YouTube channel page and extract real subscriber/video counts.
 *
 * Uses the public oEmbed endpoint for basic info + scrapes the channel
 * page for the full stats (subscriber count, view count, recent videos).
 */
export async function fetchYouTubeProfile(
  username: string
): Promise<RealProfile | null> {
  const clean = username.trim().replace(/^@/, "").replace(
    /^(?:c\/|channel\/|user\/)/,
    ""
  )
  if (!clean) return null

  // Try @handle first, then c/handle, then user/handle
  const candidates = [
    `https://www.youtube.com/@${clean}`,
    `https://www.youtube.com/c/${clean}`,
    `https://www.youtube.com/user/${clean}`,
  ]

  let channelData: YouTubeChannelData | null = null
  for (const url of candidates) {
    channelData = await scrapeYouTubeChannel(url)
    if (channelData) break
  }

  if (!channelData) return null

  return {
    username: clean,
    displayName: channelData.title || clean,
    bio: channelData.description || "",
    avatarUrl: channelData.avatarUrl || "",
    verified: false,
    followers: channelData.subscriberCount || 0,
    following: 0,
    totalPosts: channelData.videoCount || 0,
    totalLikes: channelData.viewCount || 0,
    recentPosts: channelData.recentVideos.slice(0, 3),
    dataSource: "real",
  }
}

async function scrapeYouTubeChannel(
  url: string
): Promise<YouTubeChannelData | null> {
  const html = await fetchHtml(url)
  if (!html) return null

  // Extract ytInitialData JSON
  const marker = "var ytInitialData ="
  let jsonStr: string | null = null

  const idx = html.indexOf(marker)
  if (idx !== -1) {
    const start = idx + marker.length
    let depth = 0
    let inStr = false
    let escape = false
    let end = -1
    for (let i = start; i < html.length; i++) {
      const ch = html[i]
      if (escape) {
        escape = false
        continue
      }
      if (ch === "\\") {
        escape = true
        continue
      }
      if (ch === '"') {
        inStr = !inStr
        continue
      }
      if (inStr) continue
      if (ch === "{") depth++
      else if (ch === "}") {
        depth--
        if (depth === 0) {
          end = i + 1
          break
        }
      }
    }
    if (end > start) {
      jsonStr = html.slice(start, end)
    }
  }

  // Fallback: try ytInitialData =
  if (!jsonStr) {
    const m2 = html.match(/ytInitialData\s*=\s*(\{[\s\S]*?\});/)
    if (m2 && m2[1]) jsonStr = m2[1]
  }

  if (!jsonStr) return null

  let initialData: Record<string, unknown>
  try {
    initialData = JSON.parse(jsonStr)
  } catch {
    return null
  }

  // Walk the structure to find subscriberCount + videoCount
  const result: YouTubeChannelData = { recentVideos: [] }

  // Header contains subscriber count
  const header = findKey(initialData, "c4TabbedHeaderRenderer")
  if (header) {
    const subsText = getNested(header, "subscriberCountText", "simpleText") as
      | string
      | undefined
    if (subsText) {
      result.subscriberCount = parseHumanNumber(subsText)
    }
    result.title = getNested(header, "title") as string | undefined
    result.avatarUrl = getNested(
      header,
      "avatar",
      "thumbnails",
      0,
      "url"
    ) as string | undefined
  }

  // PageHeaderView also has subscriber info (newer layout)
  if (!result.subscriberCount) {
    const phv = findKey(initialData, "pageHeaderViewModel")
    if (phv) {
      const meta = getNested(phv, "metadata", "contentMetadataViewModel") as
        | Record<string, unknown>
        | undefined
      if (meta) {
        const items = getNested(meta, "metadataRows") as unknown[] | undefined
        if (Array.isArray(items)) {
          for (const row of items) {
            const parts = getNested(row, "metadataParts") as unknown[] | undefined
            if (!Array.isArray(parts)) continue
            for (const part of parts) {
              const text = getNested(part, "text", "content") as string | undefined
              if (text && /subscribers/i.test(text)) {
                const m = text.match(/([\d.,]+)\s*(subscribers)/i)
                if (m) result.subscriberCount = parseHumanNumber(m[0])
              }
            }
          }
        }
      }
    }
  }

  // Try to extract recent videos from tab content
  const tabs = findKey(initialData, "tabs") as unknown[] | undefined
  if (Array.isArray(tabs)) {
    for (const tab of tabs) {
      const items = getNested(tab, "tabRenderer", "content", "richGridRenderer", "contents") as
        | unknown[]
        | undefined
      if (!Array.isArray(items)) continue
      for (const item of items) {
        const v = getNested(item, "richItemRenderer", "content", "videoRenderer")
        if (v) {
          const title = getNested(v, "title", "runs", 0, "text") as
            | string
            | undefined
          const viewsText = getNested(v, "viewCountText", "simpleText") as
            | string
            | undefined
          const videoId = getNested(v, "videoId") as string | undefined
          result.recentVideos.push({
            title: title || "بدون عنوان",
            views: viewsText ? parseHumanNumber(viewsText) : 0,
            likes: 0,
            comments: 0,
            shares: 0,
            url: videoId
              ? `https://www.youtube.com/watch?v=${videoId}`
              : "",
          })
          if (result.recentVideos.length >= 5) break
        }
      }
      if (result.recentVideos.length >= 5) break
    }
  }

  // Description from meta
  if (!result.description) {
    const descMatch = html.match(
      /<meta\s+name="description"\s+content="([^"]+)"/i
    )
    if (descMatch && descMatch[1]) {
      result.description = decodeHtmlEntities(descMatch[1])
    }
  }

  if (
    !result.subscriberCount &&
    !result.title &&
    result.recentVideos.length === 0
  ) {
    return null
  }

  return result
}

/* ------------------------------------------------------------------ */
/* Instagram                                                          */
/* ------------------------------------------------------------------ */

/**
 * Best-effort Instagram profile scrape.
 *
 * Instagram aggressively blocks server-side scraping and usually returns
 * a login wall. We try anyway — if it succeeds, great; if not, the
 * caller falls back to AI estimation.
 */
export async function fetchInstagramProfile(
  username: string
): Promise<RealProfile | null> {
  const clean = username.trim().replace(/^@/, "")
  if (!clean) return null

  const url = `https://www.instagram.com/${clean}/`
  const html = await fetchHtml(url)
  if (!html) return null

  // Look for the ld+json blob which contains basic profile info
  const ldMatch = html.match(
    /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/i
  )
  if (!ldMatch || !ldMatch[1]) {
    console.warn("[social-profiles] Instagram: ld+json not found (login wall)")
    return null
  }

  try {
    const ld = JSON.parse(ldMatch[1]) as {
      interactionStatistic?: Array<{
        userInteractionCount?: number
        name?: string
      }>
      name?: string
      description?: string
      image?: string
    }

    const stats = ld.interactionStatistic || []
    let followers = 0
    let totalPosts = 0
    for (const s of stats) {
      if (s.name === "UserFollows" || /follow/i.test(s.name || "")) {
        followers = Number(s.userInteractionCount) || 0
      } else if (
        s.name === "UserComments" ||
        /post/i.test(s.name || "")
      ) {
        totalPosts = Number(s.userInteractionCount) || 0
      }
    }

    if (!followers && !ld.name) {
      return null
    }

    return {
      username: clean,
      displayName: ld.name || clean,
      bio: ld.description || "",
      avatarUrl: ld.image || "",
      verified: false,
      followers,
      following: 0,
      totalPosts,
      totalLikes: 0,
      recentPosts: [],
      dataSource: "real",
    }
  } catch {
    return null
  }
}

/* ------------------------------------------------------------------ */
/* Facebook                                                           */
/* ------------------------------------------------------------------ */

/**
 * Facebook does not expose public profile data without authentication.
 * Always returns null so the caller can fall back to AI estimation.
 */
export async function fetchFacebookProfile(
  _username: string
): Promise<RealProfile | null> {
  return null
}

/* ------------------------------------------------------------------ */
/* Public dispatcher                                                  */
/* ------------------------------------------------------------------ */

export async function fetchRealProfile(
  platform: Platform,
  username: string
): Promise<RealProfile | null> {
  switch (platform) {
    case "tiktok":
      return fetchTikTokProfile(username)
    case "youtube":
      return fetchYouTubeProfile(username)
    case "instagram":
      return fetchInstagramProfile(username)
    case "facebook":
      return fetchFacebookProfile(username)
    default:
      return null
  }
}

/**
 * Check whether the RapidAPI key is configured. Used by the API route
 * to tell the frontend whether real data requires API key setup.
 */
export function hasRapidApiKey(): boolean {
  return Boolean(process.env.RAPIDAPI_KEY)
}

/* ------------------------------------------------------------------ */
/* Internal utilities                                                 */
/* ------------------------------------------------------------------ */

/** Recursively search an object for the first key matching `key`. */
function findKey(obj: unknown, key: string): unknown {
  if (!obj || typeof obj !== "object") return null
  const o = obj as Record<string, unknown>
  if (key in o) return o[key]
  for (const k of Object.keys(o)) {
    const v = o[k]
    if (v && typeof v === "object") {
      const found = findKey(v, key)
      if (found) return found
    }
  }
  return null
}

/** Safely walk a nested object path. */
function getNested(obj: unknown, ...path: (string | number)[]): unknown {
  let cur: unknown = obj
  for (const p of path) {
    if (cur == null) return undefined
    cur = (cur as Record<string | number, unknown>)[p]
  }
  return cur
}

/** Parse human-readable numbers like "1.2M subscribers" or "15,432 views". */
function parseHumanNumber(text: string): number {
  if (!text) return 0
  const m = text.match(/([\d.,]+)\s*([KMB]?) /i)
  if (!m) {
    const digits = text.replace(/[^\d]/g, "")
    return digits ? parseInt(digits, 10) : 0
  }
  let num = parseFloat(m[1].replace(/,/g, ""))
  const unit = (m[2] || "").toUpperCase()
  if (unit === "K") num *= 1_000
  else if (unit === "M") num *= 1_000_000
  else if (unit === "B") num *= 1_000_000_000
  return Math.floor(num)
}

function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
}
