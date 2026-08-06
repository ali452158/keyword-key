# Task 20 — Title Optimizer Tool

## Files created
- `/home/z/my-project/src/app/api/tools/title-analyzer/route.ts`
- `/home/z/my-project/src/components/growth-tools/title-optimizer.tsx`

## Component export
- Named export: `TitleOptimizer` (also default export)

## API contract
POST `/api/tools/title-analyzer` body `{ title: string, platform: Platform, keyword?: string }`
→ `{ success: true, data: { score, grades:[{criteria,score,note}], suggestions:[], improvedTitles:[] }, meta: {title, platform, keyword, length} }`

## Key implementation details
- `export const dynamic = "force-dynamic"`, `export const maxDuration = 60`
- `import ZAI from "z-ai-web-dev-sdk"` (backend only)
- Heuristic fallback `fallbackAnalysis()` for JSON parse / LLM failures (6 criteria, 5 suggestions, 5 improved titles)
- ScoreGauge: SVG circle, radius 80, gradient stroke, animated dashoffset (1s), center score + label pill
- Color thresholds: emerald >=70, amber >=40, rose <40
- Per-platform optimal length: tiktok 20-60, youtube 40-70, instagram 25-65, facebook 30-80
- Copy/Use buttons wired with toast feedback; Use replaces input + scrolls to top + clears analysis

## Lint status
- Both new files: 0 errors, 0 warnings
- Pre-existing warning in `earnings-calculator.tsx` (another agent's file, not in scope)
