---
Task ID: 8
Agent: full-stack-developer
Task: Build competitor analysis section

Work Log:
- Read worklog.md to understand the established design system (blue+purple gradient brand, RTL Arabic, shadcn/ui, PlatformBadge, formatNumber)
- Reviewed existing components: dashboard.tsx (section pattern reference), platform-icon.tsx (PlatformBadge API), keyword-card.tsx (card styling reference), ui/progress.tsx (understood [&>div] override pattern)
- Reviewed /api/competitor/analyze/route.ts to confirm request/response contract (POST {account, platform} -> {success, data: CompetitorAnalysis})
- Created /home/z/my-project/src/components/sections/competitor-analysis.tsx as a "use client" component
- Implemented:
  * Input form card with @-prefixed account input (User icon label), 4 platform chips using PlatformBadge (selected = bg-gradient-brand + shadow-brand), and a gradient-brand submit button with Loader2 spinner + "جاري التحليل..." loading text
  * Validation: empty account / missing platform -> toast.error via useToast
  * Loading state: gradient-brand AI banner with animated Loader2 spinner, cycling Arabic messages (5 different messages, 3s each), shimmer progress strip, plus 6 shimmer skeleton cards in a 1/2/3-col responsive grid
  * Empty state: dashed card with floating gradient icon (Spy), Arabic prompt, and 4 outline badges
  * Results display:
    - Profile hero card (gradient-brand + grid pattern + pulse-glow blobs): @account + PlatformBadge + followers (formatNumber) + engagement rate %
    - Summary card with AI badge and Lightbulb icon, gradient-brand-soft background
    - Keywords grid (scrollable, max-h-96, scroll-area-brand): each keyword is a clickable button with Target icon, frequency, relevance %, label (عالية/متوسطة/منخفضة), and Progress bar colored with [&>div]:bg-gradient-brand. Sorted by relevance desc. Clicking calls onNavigate("research", keyword.keyword)
    - Two-column section: top hashtags (outline badges with Hash icon) | content themes (solid gradient-brand badges)
    - Two cards: posting frequency (Calendar icon, gradient text) | best posting times (Clock icon chips)
    - CTA card (gradient-brand): "ولّد أفكار محتوى" button calls onNavigate("generator", <top keyword>)
  * Error state: rose-tinted card with AlertCircle, friendly Arabic message, retry button
  * Accessibility: label htmlFor, aria-describedby, aria-pressed on chips, sr-only friendly markup, keyboard accessible buttons, focus-visible rings
  * Responsive: grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 for keywords, grid-cols-2 sm:grid-cols-4 for platform selector, mobile-first layout
- Ran `bun run lint` -> passed with no errors
- Verified dev server compiled successfully (GET / 200)

Stage Summary:
- Delivered /home/z/my-project/src/components/sections/competitor-analysis.tsx (single React section component)
- Matches established design system: bg-gradient-brand, text-gradient-brand, shadow-brand, shadow-brand-lg, scroll-area-brand, PlatformBadge, formatNumber, useToast, shadcn Card/Button/Input/Badge/Skeleton/Progress/Separator/ScrollArea
- API integration: POST /api/competitor/analyze with {account, platform} -> CompetitorAnalysis data rendered fully
- AI loading UX handled (10-20s wait) with animated messages + shimmer skeletons + disabled form
- Three states: empty, loading, results, plus error state with retry
- All keyword chips clickable -> onNavigate("research", keyword); top-keyword CTA -> onNavigate("generator", topKeyword)
- Fully RTL Arabic, mobile responsive, accessible
- Lint clean, dev server compiles successfully
