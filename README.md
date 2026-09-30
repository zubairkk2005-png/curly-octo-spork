# ProfitPilot — Know your real profit.

ProfitPilot is a SaaS dashboard for Amazon and eBay sellers. It turns order data into a clear picture of revenue, costs and **real net profit**, and lets you ask an AI assistant *why* your numbers changed.

**Import data → calculate real profit → see the dashboard → ask AI why.**

## Features

- **Dashboard** – Revenue, Orders, Net profit, Margin, Returns and Ad spend, each compared with the previous equivalent period; profit chart (Revenue / Net profit / Orders); "where your revenue goes" breakdown; sortable top-products table; AI insight card.
- **Orders** – search, marketplace and date filters, sortable columns, pagination, and a per-order profit breakdown drawer.
- **Products** – add / edit / delete, search, per-product detail with a 30-day chart. Product costs fill blanks during import.
- **CSV import** – drag & drop, column auto-mapping + manual mapping, Zod validation, first-10-rows preview, row-level error report, import summary, downloadable template.
- **Analytics** – revenue, profit, margin, orders, ad spend and return-rate trends, marketplace comparison, product profitability. All respond to the date range.
- **Ask AI** – chat drawer (top bar) and AI insight card. The server aggregates *your* data and sends only aggregates to OpenAI; without an API key it answers from the same aggregates locally.
- **Settings** – business/profile, default currency (GBP, USD, EUR, PKR), export CSV, delete demo data, delete all data, light/dark/system theme, logout.
- **Demo Mode** – works with zero configuration (see below).
- Responsive: full sidebar on desktop, collapsible icon rail on tablet, bottom navigation on mobile.

## Tech stack

Next.js 16 (App Router) · TypeScript (strict) · Tailwind CSS v4 · shadcn/ui-style components (Radix primitives + CVA) · Supabase (Auth + PostgreSQL + RLS) · Recharts · Lucide · Zod · PapaParse · OpenAI API · Vitest.

## Installation

```bash
npm install
cp .env.example .env.local   # optional – see below
npm run dev                  # http://localhost:3000
```

Requires Node.js 20+ (developed on 22).

## Environment variables

| Variable | Required | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | for auth/persistence | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | for auth/persistence | Public anon key (safe in the browser; RLS protects data) |
| `OPENAI_API_KEY` | for real AI | **Server-only.** Never exposed to the browser |
| `OPENAI_MODEL` | no | Defaults to `gpt-4o-mini` |

No service-role key is used anywhere. All database access runs as the signed-in user, so Row Level Security is always enforced. Secrets live in `.env.local`, which is git-ignored.

## Supabase setup

1. Create a project at [supabase.com](https://supabase.com).
2. **Project Settings → API**: copy the project URL and `anon` key into `.env.local`.
3. Run the migration (next section).
4. **Authentication → Providers**: keep Email enabled. For quick local testing you can turn off "Confirm email"; otherwise new users must confirm via email before logging in.
5. **Authentication → URL Configuration**: set the Site URL to your app URL (e.g. `http://localhost:3000`).

## Database migration

Open the Supabase **SQL editor**, paste the contents of [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql), and run it. It creates `profiles`, `products` and `orders` with primary/foreign keys, check constraints, indexes, an `updated_at` trigger, a trigger that creates a profile on signup, and RLS policies so users can only read/write their own rows. It is safe to re-run.

## OpenAI setup

Create a key at [platform.openai.com](https://platform.openai.com/api-keys) and set `OPENAI_API_KEY`. `POST /api/ai`:

1. authenticates the user,
2. loads their orders server-side,
3. aggregates them (period totals, previous-period comparison, top products, marketplaces, weekly trend),
4. sends **only that aggregate** to the model with a system prompt that forbids inventing numbers, and requests structured JSON output.

If the key is missing or the call fails, the endpoint returns a rule-based answer computed from the same aggregates and the UI labels it "Demo response".

## Demo Mode

- **No Supabase configured** → the app skips login and runs entirely in the browser on a generated **Demo Store** (5 products, ~100 orders in the last 30 days plus earlier history so period comparisons work). Imports, product edits and settings are saved in `localStorage`. A "Demo Mode" badge is shown.
- **Supabase configured but you have no data yet** → the dashboard shows the Demo Store until you import your own orders ("Demo Store" badge). Hide it in Settings → Data.
- **No OpenAI key** → demo AI answers (see above).

## Test access

**One-click test (no local setup):**

- [Open in GitHub Codespaces](https://codespaces.new/zubairkk2005-png/curly-octo-spork/tree/claude/profitpilot-mvp-042cr8) — installs and starts the app in demo mode; the browser opens automatically.
- [Deploy to Vercel](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fzubairkk2005-png%2Fcurly-octo-spork%2Ftree%2Fclaude%2Fprofitpilot-mvp-042cr8&env=NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY,OPENAI_API_KEY&envDescription=All%20optional%3A%20leave%20blank%20for%20Demo%20Mode) — you get a public URL; leave the variables blank for demo mode.

**Local (no accounts, no keys):**
```bash
npm install && npm run dev
```
Open http://localhost:3000 → **Start for free** → **Continue to demo**. You land on the Demo Store dashboard. Try: change the date range/currency, open an order, add a product, import the CSV template from the Import page, and click **Ask AI**.

**Live test with real login:** create a free Supabase project, run the migration, put the URL and anon key in `.env.local`, restart, then sign up at `/signup` (disable "Confirm email" in Supabase for instant access). Add `OPENAI_API_KEY` for real AI answers.

## CSV format

| Column | Required | Notes |
| --- | --- | --- |
| `order_id` | yes | |
| `order_date` | yes | `YYYY-MM-DD`, ISO timestamp, or `DD/MM/YYYY` |
| `marketplace` | no | Amazon, eBay, or anything else → Other |
| `sku` | yes | |
| `product_name` | no | Defaults to the SKU / product record |
| `quantity` | yes | whole number ≥ 1 |
| `sale_price` | yes | **per unit** |
| `product_cost` | yes* | **per unit** (*blank cells use the product's saved cost if the SKU is known) |
| `marketplace_fee`, `shipping_cost`, `ad_cost` | no | totals for the order line; default 0 (or product defaults) |
| `refund_amount` | no | total; negative values are stored as a positive magnitude |
| `currency` | no | GBP, USD, EUR, PKR; defaults to your display currency |

Currency symbols and thousands separators (`£1,234.50`, `1.234,50`) are accepted. Different column names (e.g. `Order ID`, `Item Price`) are auto-mapped where recognisable and can be mapped by hand. A template is available on the Import page. Re-importing the same marketplace + order ID + SKU updates the existing row. Limits: 5 MB, 5,000 rows per file.

## Profit calculation

Implemented once in `src/lib/profit.ts` (`calculateOrderProfit`) and reused everywhere:

```
revenue     = sale_price × quantity
productCost = product_cost × quantity
totalCost   = productCost + marketplace_fee + shipping_cost + ad_cost + refund_amount
profit      = revenue − totalCost
margin      = revenue > 0 ? profit / revenue × 100 : 0
```

Money is rounded to 2 dp per component; missing/non-finite values become 0, so the UI never shows `NaN`. Dates are bucketed in **UTC**. Different currencies are converted to the display currency with **static indicative rates** in `src/lib/currency.ts` — replace with a live FX source for production.

## Scripts

```bash
npm run dev        # dev server
npm run build      # production build
npm start          # serve the build
npm run lint
npm run typecheck
npm test           # calculation engine + CSV validation tests
```

## Deployment

**Vercel** (recommended): push the repo, import it in Vercel, add the four environment variables above, deploy. Set the Supabase Site URL to the production domain and add `<domain>/auth/callback` to Redirect URLs (needed for email confirmation and password reset). Any Node host that supports Next.js 16 (`npm run build && npm start`) works too.

## Security notes

- Row Level Security on every table; server routes use the caller's session (no service-role key).
- OpenAI is only called from `/api/ai`; the key never reaches the client; the model receives aggregates only.
- Imports are validated client-side for feedback **and again on the server** with Zod; text is stripped of control characters and angle brackets and length-capped; exports escape spreadsheet formulas.
- Errors shown to users are generic; details are logged server-side.

## Project layout

```
src/app            routes: (marketing) /, (auth) /login /signup, (app) dashboard… settings, api/*
src/components     ui/ layout/ dashboard/ orders/ products/ import/ ai/ common/ marketing/
src/lib            profit.ts, analytics.ts, currency.ts, dates.ts, demo-data.ts, csv/, ai/, supabase/, data/
supabase/migrations/0001_init.sql
```

## Known limitations / before production

- Static FX rates; UTC-only day bucketing.
- Product costs are interpreted in your profile currency.
- No email-change UI. `/api/ai` rate limiting is in-memory (per instance).
- Orders are loaded in full (up to 20,000) and aggregated in the browser; move aggregation into SQL views/RPCs for very large stores.
- No direct Amazon/eBay API sync — CSV import only.
