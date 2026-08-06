---
Task ID: 21
Agent: full-stack-developer
Task: Build monetization calculator tool

Work Log:
- Read worklog.md, src/components/platform-icon.tsx, src/lib/platforms.ts, src/lib/types.ts, src/lib/format.ts, src/hooks/use-toast.ts, src/components/ui/{select,progress,card,input,button,skeleton}.tsx, and /api/trending/route.ts to align with established design system
- Created `/home/z/my-project/src/app/api/tools/earnings/route.ts` — POST handler, `export const dynamic = "force-dynamic"`, pure computation (NO LLM)
  * RPM table per platform × niche (low/mid/high): YouTube $2-15, TikTok $0.5-3, Instagram $1-5, Facebook $0.5-3 — finance/tech highest, entertainment lowest
  * Revenue breakdown splits per platform (YouTube: 50/30/10/10 AdSense/Sponsorships/Memberships/Affiliate; TikTok: 10/60/15/15 Creator Fund/Sponsorships/Live/Affiliate; Instagram: 75/15/5/5; Facebook: 60/25/10/5)
  * Computes monthlyEstimate = RPM × (views/1000), yearlyEstimate = monthly × 12, breakdown amounts sorted desc, rpm = mid RPM
  * Tips = 2 platform tips + 2 niche tips = 4 Arabic tips total (matrix of 4×8)
  * Validation: platform ∈ {youtube,tiktok,instagram,facebook}, niche ∈ {entertainment,tech,gaming,beauty,education,food,finance,lifestyle}, followers > 0, viewsPerMonth > 0 — returns 400 with Arabic error message on failure
- Created `/home/z/my-project/src/components/growth-tools/earnings-calculator.tsx` — "use client" component, no props
  * Tool header: gradient-brand icon box (DollarSign) + "حاسبة الأرباح" + subtitle
  * Input card with bg-gradient-brand-soft: 4-platform chips using PlatformBadge (selected = bg-gradient-brand + shadow-brand + white text), followers Input (number, Users icon, live formatted preview), views Input (Eye icon, live preview), niche Select with 8 lucide-icon options, gradient-brand submit button "احسب الأرباح" with Calculator icon
  * Auto-recalculate on platform change via useEffect
  * Loading state: brief 350ms skeleton
  * Results view: hero earnings card (lg:col-span-2, bg-gradient-brand, white text, bg-grid-pattern overlay) + yearly card + RPM/views/followers badges + revenue breakdown with Progress bars (`[&>div]:bg-gradient-brand`) + tips card (Lightbulb icon, 4 numbered tips)
  * Empty state, error state, disclaimer all implemented
  * Validation: empty/zero inputs -> toast destructive
  * Responsive: mobile-first grid layouts
- Tested API via curl: valid request returns proper calculation, invalid inputs return 400 with Arabic error
- Ran `bun run lint` — passed clean
- Verified dev server compiled successfully

Stage Summary:
- Delivered two files:
  * API route: `/home/z/my-project/src/app/api/tools/earnings/route.ts` (POST handler, force-dynamic, pure computation)
  * Component: `/home/z/my-project/src/components/growth-tools/earnings-calculator.tsx` — exported as named `EarningsCalculator` AND default export
- Component export name: `EarningsCalculator` (named) / `default` (default export)
- API contract: POST `/api/tools/earnings` body `{platform, followers, viewsPerMonth, niche}` -> `{success, data: {platform, niche, nicheLabel, followers, viewsPerMonth, rpm, monthlyEstimate:{low,mid,high}, yearlyEstimate:{low,mid,high}, breakdown:[{source,amount}], tips:string[]}}`
- Lint clean, dev server compiles successfully, API tested with valid + invalid inputs
