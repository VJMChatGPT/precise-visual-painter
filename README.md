# PEAK OR JEET

A lightweight memecoin Higher or Lower game, home of **$PEAK**. The existing Lovable design and animations are preserved. No backend, authentication, wallets or global leaderboard.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://precise-visual-painter.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/48304169-bff4-4ae4-8d4f-bda2f63d7cfb).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? Use Node.js 22.12+ and npm, or Bun with the existing `bun.lock`.

```sh
npm install --no-package-lock
npm run dev
```

## Before public launch

Copy `.env.example` to `.env.local` for local configuration, or set the same variables in the hosting build environment. Rebuild after changing them.

- `VITE_PUMP_FUN_URL`: currently defaults to **https://pump.fun**, explicitly requested as a prelaunch placeholder. Replace it with the exact $PEAK token page once launched. No token address or ticker search is invented. An explicit empty value disables the visible Buy button; invalid/non-Pump.fun URLs also disable it.
- `VITE_SITE_URL`: public origin for canonical, Open Graph, Twitter Card and score-sharing links. Defaults to the existing Lovable URL. Set it to the production origin if using a custom domain.
- Deploy the checked-in `public/social-preview.png` (1200 × 630), favicon SVG/ICO and Apple touch icon with the app. Check the deployed HTML and image URL with a social preview tool after publishing; X may cache old previews.

## Deploy to Vercel and connect peakorjeet.com

1. Import `VJMChatGPT/precise-visual-painter` from https://vercel.com/new and use the `main` branch. The existing Lovable configuration already includes Nitro and Vercel framework detection. Keep the detected build settings and output directory; this is TanStack Start, not a static Vite `dist` deployment.
2. Add build environment variables `VITE_PUMP_FUN_URL=https://pump.fun` and `VITE_SITE_URL=https://peakorjeet.com`. Deploy and check the generated `vercel.app` URL.
3. In the project's **Settings > Domains**, add `peakorjeet.com` and `www.peakorjeet.com`. Use `peakorjeet.com` as the primary domain and redirect `www` to it.
4. In Piensa Solutions' DNS management, enter the exact records shown by this Vercel project. The root domain normally uses an A record and `www` uses a CNAME. Values are provided by Vercel; do not copy a generic IP or CNAME from an old guide. Preserve unrelated email MX/TXT records.
5. Wait for Vercel to verify the domain and issue HTTPS, then check gameplay and the social preview at https://peakorjeet.com. Environment variable changes require a new deployment.

Official references: [Lovable/TanStack Start deployment](https://vercel.com/docs/frameworks/full-stack/tanstack-start), [adding a custom domain](https://vercel.com/docs/domains/working-with-domains/add-a-domain).

## Gameplay and data

Classic ends at the first incorrect guess. Beat the Clock uses the same consecutive-correct scoring with a 60-second wall-clock limit. Correct guesses count immediately, even if the reveal animation is still playing when time expires. Clearing a pool also ends the run. Replay starts a new run, and quitting does not record an incomplete game.

Ranks: 0–3 Exit Liquidity, 4–9 Certified Jeet, 10–19 Trench Veteran, 20+ Legendary Degen. All Memecoins contains 30 coins (maximum 29 correct guesses); Trenches Only contains 12 (maximum 11). Each coin appears as a new challenger only once, then becomes the known coin for the next comparison. Equal-cap comparisons are excluded. Difficulty progressively prefers closer cap ratios.

Scores and preferences stay in localStorage, separated by mode and pool. Existing score arrays are migrated to small lifetime summaries, retaining their recorded best and average. If browser storage is unavailable, gameplay continues but statistics cannot persist.

`src/data/coins.json` remains unchanged. Reference market caps retain the verified > observed > estimate precedence and every provenance field. The current dataset has 1 record marked verified, 13 observed values and 16 estimates. These are historical reference values, not a live financial feed or independently reverified ATHs. Panels and story details distinguish their basis and link to the recorded market-cap source.

The launch audit confirmed all 27 supplied image URLs return images. Three records have no artwork and use deterministic symbol fallbacks. Failed image requests also fall back, including when the known coin changes. Decorative artwork loads lazily.

Two dead source paths are corrected **only for displayed links** in `src/game/coins.ts`, retaining the originals in the dataset: the same [Fortune article](https://fortune.com/2021/10/28/crypto-bulls-shiba-inu-rally-bitcoin-rebounds-stocks-btc/) and the matching Solana [Vine Coin listing](https://coinmarketcap.com/currencies/vine-coin/). Some third-party sources restrict automated access with 401/403 responses; those provenance links are retained.

## Checks

```sh
npm test
npx tsc --noEmit
npm run lint
npm run build
```

Regression coverage includes all rank boundaries, both modes and both pools, full runs, final-second timer scoring, expiry after a background delay, duplicate submissions, reveal cleanup, replay, per-pool statistics, legacy storage migration, image fallbacks, data provenance and safe Buy URLs. Browser QA covers desktop, mobile and landscape layouts, scroll access, sharing metadata and console errors. The shared UI components retain their existing Fast Refresh lint warnings.
