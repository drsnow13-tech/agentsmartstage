# StageSmart.ai — Comprehensive Fix Deployment Guide

## Files to Replace (4 files, 1 deploy)

Replace these files in your `agentsmartstage` repo on a **dev branch first**:

| File | Location in repo | What changed |
|------|-----------------|--------------|
| `Editor.tsx` | `stagesmart.ai/src/pages/Editor.tsx` | All frontend bugs + 4-tile feature |
| `webhook.ts` | `stagesmart.ai/api/webhook.ts` | Raw body parsing + credit addition |
| `checkout.ts` | `stagesmart.ai/api/checkout.ts` | metadata.email + Orchard package IDs |
| `deduct-credit.ts` | `stagesmart.ai/api/deduct-credit.ts` | Atomic credit deduction (verify exists) |

---

## Bug Fixes Applied

### CRITICAL — Revenue Impact

1. **hasDownloaded flag added** — Previously every download deducted a credit.
   Now: first download costs 1 credit, subsequent downloads of any tile are free.
   - Added `hasDownloaded` state variable
   - `handleDownload()` checks `hasDownloaded` before calling `/api/deduct-credit`
   - After first successful deduction, sets `hasDownloaded = true`
   - UI shows "Download Version X (Free)" after first download

2. **localStorage session save** — `handleEmailSubmit()` now calls
   `localStorage.setItem('ssa_email', normalizedEmail)` so sessions survive
   page refreshes and Stripe payment redirects.

3. **Orchard package IDs fixed** — Purchase modal now sends `orchard20`/`orchard50`
   (matching checkout.ts) instead of `20pack`/`50pack` which caused "Invalid package" errors.

4. **Webhook raw body parsing** — `webhook.ts` now has:
   - `export const config = { api: { bodyParser: false } }`
   - Manual `getRawBody()` function for Stripe signature verification
   - Reads `session.metadata.email` with fallback to `session.customer_email`
   - Atomic upsert: INSERT ... ON CONFLICT DO UPDATE

5. **Checkout metadata** — `checkout.ts` now passes both:
   - `customer_email: normalizedEmail` (pre-fills Stripe form)
   - `metadata: { email, credits, packageId }` (webhook reads these)

6. **Post-payment credit refresh** — Now retries at 2s, 5s, and 10s after
   redirect to catch webhook processing delay.

### UI Fixes

7. **Credit bar text** — Changed from "Select multiple enhancements — 1 credit
   for all" to "Select an enhancement — 1 credit per photo"

8. **Greetings updated** — All room type greetings now reference single
   enhancement selection instead of "all selected"

9. **Result banner** — No longer says "1 credit used" before download happens.
   Shows "pick your favorite to download" until credit is actually spent.

10. **Generate button** — Shows "Generate 4 Versions — 1 Credit" instead of
    dynamic multi-count text.

### AI Prompt Fixes

11. **Ceiling fixture rule** — Extracted to `CEILING_RULE` constant, injected
    via template literals into EVERY indoor staging prompt.

12. **Archway clearance rule** — Extracted to `ARCHWAY_RULE` constant, injected
    into all indoor staging prompts. Includes "3 feet" buffer zone.

13. **Game room pendant light rule** — Extracted to `GAME_ROOM_LIGHT_RULE`,
    applied to game room prompts specifically.

---

## New Feature: 4-Tile Generation

- Selecting an enhancement now generates **4 parallel versions** via `Promise.all`
- Results displayed in a **2x2 thumbnail grid** with version numbers
- Click any tile to select it for the **before/after comparison slider**
- Download button downloads the selected tile
- **1 credit for all 4 versions** — charged at first download only
- Progress bar shows completion (0% → 25% → 50% → 75% → 100%)
- "Regenerate (free)" button re-runs all 4 versions at no cost
- Failed tiles are silently skipped (shows 1-4 valid results)

---

## Deployment Steps

1. **Create dev branch**: `git checkout -b dev`
2. **Replace the 4 files** listed above with the new versions
3. **Push to dev**: `git push origin dev`
4. **Check Vercel preview** — Vercel auto-deploys preview URL for dev branch
5. **Test the full flow**:
   - Upload a photo → verify room detection
   - Select enhancement → verify single-select behavior
   - Generate → verify 4 tiles appear
   - Try download without credits → verify credit warning modal
   - Buy credits (test mode, card 4242 4242 4242 4242) → verify redirect
   - After redirect → verify credits appear (may take 2-10 seconds)
   - Download → verify 1 credit deducted
   - Download another tile → verify FREE (no additional deduction)
6. **Merge to main**: `git checkout main && git merge dev && git push`
7. **One production deploy** ✓

---

## Vercel Checklist

Verify these environment variables are set in Vercel → Settings → Environment Variables:

- [ ] `GEMINI_API_KEY`
- [ ] `STRIPE_SECRET_KEY` (test mode for now)
- [ ] `STRIPE_WEBHOOK_SECRET` (must match Stripe dashboard → Webhooks → Signing secret)
- [ ] `DATABASE_URL` (Neon Postgres connection string)
- [ ] `RESEND_API_KEY`
- [ ] `APP_URL` = `https://www.smartstageagent.com`

**After changing any env var**, redeploy: Vercel dashboard → Deployments → Latest → ⋮ → Redeploy.

---

## Stripe Webhook Checklist

In Stripe Dashboard → Developers → Webhooks:

- [ ] Endpoint URL: `https://www.smartstageagent.com/api/webhook`
- [ ] Listening for: `checkout.session.completed`
- [ ] Signing secret matches `STRIPE_WEBHOOK_SECRET` in Vercel
- [ ] After deploying, do a test purchase and check Stripe webhook logs for 200 response
