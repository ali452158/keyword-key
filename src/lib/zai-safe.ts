/**
 * Safe ZAI wrapper with graceful fallback.
 *
 * The z-ai-web-dev-sdk requires a `.z-ai-config` file (searched in the
 * project dir, user home, and /etc) that contains `baseUrl` + `apiKey`.
 * This file exists in the development sandbox but will NOT exist when the
 * app is deployed to external hosting (Vercel, Netlify, etc.).
 *
 * This module memoises the availability check so we only attempt to create
 * the ZAI instance once per process lifetime. If creation fails, every
 * subsequent call returns `null` immediately and callers fall back to
 * their mock data generators.
 *
 * Usage in API routes:
 *   const zai = await getZaiSafe()
 *   if (!zai) {
 *     return NextResponse.json({ success: true, data: mockFallback() })
 *   }
 *   const completion = await zai.chat.completions.create({ ... })
 */

import ZAI from "z-ai-web-dev-sdk"

type ZaiInstance = Awaited<ReturnType<typeof ZAI.create>>

let cachedInstance: ZaiInstance | null = null
let availabilityChecked = false
let isAvailable = false

/**
 * Try to create a ZAI instance. Returns `null` if the SDK is not
 * configured (e.g. on external hosting without `.z-ai-config`).
 *
 * The check is memoised: after the first failure all subsequent calls
 * return `null` without retrying, avoiding repeated slow failures on
 * every request.
 */
export async function getZaiSafe(): Promise<ZaiInstance | null> {
  // Fast path: already determined availability
  if (availabilityChecked) {
    return isAvailable ? cachedInstance : null
  }

  try {
    cachedInstance = await ZAI.create()
    isAvailable = true
    availabilityChecked = true
    return cachedInstance
  } catch (err) {
    // SDK not configured — this is expected on external hosting.
    isAvailable = false
    availabilityChecked = true
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "[zai-safe] ZAI SDK unavailable — AI features will use mock fallback.",
        err instanceof Error ? err.message : err
      )
    }
    return null
  }
}

/**
 * Synchronous check for whether ZAI has been confirmed available.
 * Returns `null` (unknown) if `getZaiSafe` has not been called yet.
 */
export function isZaiReady(): boolean | null {
  if (!availabilityChecked) return null
  return isAvailable
}
