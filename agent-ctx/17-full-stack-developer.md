---
Task ID: 17
Agent: full-stack-developer
Task: Build hashtag generator tool (API route + component)

Work Log:
- Read worklog.md to inherit established design system (blue+purple brand gradient, RTL Arabic, shadcn/ui, PlatformBadge, useToast, brand gradient utilities)
- Inspected shared modules: src/components/platform-icon.tsx (PlatformBadge API), src/lib/platforms.ts (PLATFORMS map), src/lib/types.ts (Platform type), src/hooks/use-toast.ts, src/app/api/content/generate/route.ts (z-ai-web-dev-sdk pattern reference), src/components/ui/{card,button,input,badge,skeleton,separator}.tsx
- Verified brand gradient utilities exist in src/app/globals.css (bg-gradient-brand, bg-gradient-brand-soft, text-gradient-brand, shadow-brand, shadow-brand-lg, scroll-area-brand)
- Created directories: src/app/api/tools/hashtags/ and src/components/growth-tools/
- Built API route /home/z/my-project/src/app/api/tools/hashtags/route.ts:
  * `export const dynamic = "force-dynamic"` + `export const maxDuration = 60`
  * POST body `{ keyword, platform, count? }` with validation (non-empty keyword, platform in [tiktok|youtube|instagram|facebook], count default 20 clamped to [5,30])
  * System prompt exactly as specified instructing JSON-only response with { hashtags, mix, reach, tips }
  * User prompt adds per-platform strategy (TikTok viral/trend, YouTube SEO long-tail, Instagram niche/community, Facebook topical/local) and instructs 30% high-volume + 50% medium-niche + 20% branded/specific mix
  * Uses `import ZAI from "z-ai-web-dev-sdk"` then `ZAI.create()` + `zai.chat.completions.create({ messages, thinking: { type: "disabled" } })`
  * Robust parser: regex-extracts JSON, normalizes hashtags (prefix # if missing), filters empty, builds mix string from hashtags if LLM omitted it, falls back to `generateFallbackHashtags` if parse fails or hashtags empty
  * `generateFallbackHashtags(keyword, platform, count)` returns platform-specific signature tags (#fyp/#foryou/#viral for tiktok, #shorts/#tutorial for youtube, #instagood/#reels for instagram, #facebook/#community for facebook) plus keyword-derived and generic niche tags, deduped
  * `defaultTips(platform)` returns 4 platform-specific Arabic best-practice tips
  * Returns `{ success, data: { hashtags, mix, reach, tips }, meta: { keyword, platform, count } }` and proper 400/500 errors
- Built component /home/z/my-project/src/components/growth-tools/hashtag-generator.tsx:
  * `"use client"` self-contained component, no props
  * Tool header: bg-gradient-brand Hash icon box + font-display title "مولّد الهاشتاجات" + subtitle
  * Input card (bg-gradient-brand-soft, border-primary/20, shadow-brand): keyword Input with Hash icon prefix (dir=ltr via absolute position), 4 PlatformBadge platform chips (default tiktok, selected = bg-gradient-brand text-white shadow-brand), segmented count toggle (10/20/30 default 20), full-width gradient-brand generate button with Hash icon (or Loader2 spinner + "جاري التوليد..." while loading)
  * Validation: empty keyword -> destructive toast "أدخل كلمة أو موضوع لتوليد الهاشتاجات"
  * Loading state: gradient-brand-soft banner with Hash icon + rotating Arabic messages (4 messages, 2.8s each) + animate-pulse progress bar + Loader2 spinner; plus 12 shimmer skeleton tags (variable widths) and 2 skeleton cards
  * Results: copy bar at top (bg-gradient-brand-soft) showing count + "نسخ الكل" button that copies `mix` to clipboard with toast "تم نسخ الهاشتاجات" and check-icon feedback; reach badge (TrendingUp icon + reach string in text-gradient-brand) + platform badge; hashtag grid as clickable chips (bg-secondary hover:bg-accent, dir=ltr for hashtag text, copy icon, copy-single with toast "تم النسخ" + brief emerald feedback); tips card (bg-gradient-brand icon box + numbered list of tips with gradient badges)
  * Empty state: dashed card with gradient blur + Hash icon + "ابدأ بتوليد الهاشتاجات" + 3 outline badges
  * Error state: destructive-tinted card with AlertCircle + retry button that re-triggers generate()
  * Accessibility: labeled input (htmlFor), role=radiogroup/radio with aria-checked on platform + count selectors, aria-label on copy buttons, focus-visible rings throughout, sr-only-friendly markup
  * Responsive: platform chips flex-wrap, hashtag grid flex-wrap, count toggle inline-flex
  * Uses useToast from @/hooks/use-toast, cn from @/lib/utils, PlatformBadge from @/components/platform-icon, PLATFORMS from @/lib/platforms, shadcn Card/Button/Input/Badge/Skeleton/Separator
- Ran `bun run lint`: 0 errors, 0 warnings on both new files (only 1 unrelated warning in a parallel agent's earnings-calculator.tsx)
- Verified dev server compiled successfully (✓ Compiled in 180ms)

Stage Summary:
- Delivered `/home/z/my-project/src/app/api/tools/hashtags/route.ts` (force-dynamic, maxDuration 60, LLM-powered with robust fallback)
- Delivered `/home/z/my-project/src/components/growth-tools/hashtag-generator.tsx` (self-contained "use client" component, exported as named function `HashtagGenerator` with no props)
- API contract: POST /api/tools/hashtags { keyword: string, platform: Platform, count?: number } -> { success, data: { hashtags: string[], mix: string, reach: string, tips: string[] }, meta }
- 4 component states handled: empty, loading (animated + shimmer skeletons), results (copy bar + reach badge + hashtag grid + tips), error (retry)
- Copy-all (mix string) and copy-single (per-tag) both work with clipboard + toast confirmation + brief visual feedback
- Platform-specific hashtag strategy in prompt (TikTok viral / YouTube SEO long-tail / Instagram niche+community / Facebook topical)
- Matches established design system: bg-gradient-brand, bg-gradient-brand-soft, text-gradient-brand, shadow-brand, PlatformBadge, useToast, shadcn Card/Button/Input/Badge/Skeleton/Separator
- Fully RTL Arabic, mobile-first responsive, accessible, lint clean
