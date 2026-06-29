# ShopFlow — Shop Management Dashboard

A production-ready, full-stack shop management dashboard for retail and small-business operations: inventory, orders, customers, employees, analytics, and shop configuration — all in one place.

Built with **Next.js 15 (App Router)**, **TypeScript**, **Tailwind CSS v4**, **shadcn/ui**, and **Supabase** (Auth + Postgres + Storage).

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Folder Structure](#folder-structure)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Supabase Setup](#supabase-setup)
- [Running Locally](#running-locally)
- [Build Commands](#build-commands)
- [Deployment](#deployment)
- [Documentation](#documentation)
- [Common Issues & Troubleshooting](#common-issues--troubleshooting)

---

## Features

- **Authentication** — email/password auth with PKCE-based password reset, role-aware route protection (admin / manager / staff)
- **Dashboard** — live stats, revenue/order trends, low-stock alerts, recent activity
- **Products** — full CRUD, multi-image upload, SKU/barcode, tags, bulk status updates
- **Categories & Brands** — CRUD with image/logo upload and active/inactive status
- **Inventory** — stock in/out/adjust with full audit history and low/out-of-stock views
- **Orders** — order creation with line items, status workflow, payments, invoice view
- **Customers** — customer records with order history
- **Employees** — staff records with role assignment and avatar upload (admin-only)
- **Reports & Analytics** — sales reports, best sellers, top customers, trend charts
- **Notifications** — in-app notifications for low stock, new orders, and system events
- **Settings** — shop configuration (currency, tax, timezone, locale), per-user preferences (theme, pagination), security (password change, active sessions, login history), activity audit log, and backup/restore architecture (admin-only)
- **Role-Based Access Control (RBAC)** — every route and server action checks role before reading or mutating data

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router, React 19, Server Components + Server Actions) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4, shadcn/ui, Lucide icons |
| Forms & Validation | React Hook Form + Zod |
| Data fetching (client) | TanStack Query, TanStack Table |
| State | Zustand (auth + UI state) |
| Backend | Supabase (Postgres, Auth, Storage, Row Level Security) |
| Animation | Framer Motion |
| Hosting | Vercel (recommended) |

## Folder Structure

```
shop-management-sys/
├── app/
│   ├── (auth)/                  # Public auth routes: login, register, forgot/reset password
│   ├── (dashboard)/              # Protected app shell — one folder per module
│   │   ├── dashboard/
│   │   ├── products/[id]/edit
│   │   ├── categories/  brands/  inventory/
│   │   ├── orders/[id]/edit  orders/[id]/invoice
│   │   ├── customers/[id]
│   │   ├── employees/
│   │   ├── reports/  analytics/  notifications/
│   │   └── settings/{shop,system,security,activity,backup}
│   ├── actions/                  # Server Actions — one file per domain (*.actions.ts)
│   ├── auth/callback/             # Supabase PKCE callback route handler
│   ├── error.tsx  not-found.tsx  loading.tsx  layout.tsx  globals.css
├── components/
│   ├── ui/                       # Reusable primitives (button, input, modal, table, etc.)
│   └── <domain>/                 # Feature components, mirrors app/(dashboard) modules
├── services/                      # Supabase data-access layer, one per domain
├── hooks/                         # TanStack Query hooks + utility hooks
├── lib/
│   ├── supabase/                 # client.ts (browser) / server.ts (SSR)
│   ├── validations/               # Zod schemas, one per domain
│   ├── auth-helpers.ts            # requireAuth() / requireRole() for server actions
│   ├── errors.ts                  # parseError() — shared action error normalizer
│   ├── logger.ts                  # logging facade (swap in a real provider later)
│   └── rbac.ts                    # role → resource permission map
├── store/                          # Zustand stores (auth, UI)
├── types/                          # Database types + domain types
├── supabase/migrations/            # Numbered SQL migrations (001 → 009)
├── middleware.ts                   # Route-level auth gate
└── docs/                           # DEPLOYMENT.md, TESTING.md, PERFORMANCE_REPORT.md
```

## Installation

```bash
git clone <your-repo-url>
cd shop-management-sys
npm install
```

## Environment Variables

Copy the example file and fill in your Supabase project values:

```bash
cp .env.example .env.local
```

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon/public API key |
| `SUPABASE_SERVICE_ROLE_KEY` | No* | Service role key — only needed for future server-side admin scripts; never expose to the client |
| `NEXT_PUBLIC_APP_URL` | No | Public app URL, used to build auth redirect links (defaults to `http://localhost:3000`) |
| `NEXT_PUBLIC_APP_NAME` | No | Display name shown in the UI (defaults to `ShopFlow`) |

Variables are validated at runtime via `lib/env.ts` — the app throws a clear error on boot if a required variable is missing.

## Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com).
2. In **SQL Editor**, run every file in `supabase/migrations/` **in order** (001 → 009). Each migration is idempotent (`CREATE TABLE IF NOT EXISTS`, `ON CONFLICT DO NOTHING`) so re-running is safe.
3. Confirm the following storage buckets were created (migrations create them automatically): `product-images`, `category-images`, `brand-logos`, `employee-avatars`, `profile-avatars`, `shop-assets`.
4. In **Authentication → URL Configuration**, set:
   - **Site URL**: your deployed app URL (or `http://localhost:3000` for local dev)
   - **Redirect URLs**: `<your-url>/auth/callback`
5. Copy your project URL and anon key from **Settings → API** into `.env.local`.

Full step-by-step walkthrough with screenshots-equivalent detail: see [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

## Running Locally

```bash
npm run dev
```

App runs at `http://localhost:3000`. The first user must be promoted to `admin` manually — run `supabase/migrations/002_seed_admin.sql` (edit the email first) or update the `role` column on your `profiles` row directly in the Supabase Table Editor.

## Build Commands

```bash
npm run build        # production build
npm run start         # serve the production build
npm run lint          # ESLint
npm run type-check    # tsc --noEmit
```

## Deployment

Deploy to **Vercel** (recommended) — connect the GitHub repo, set the environment variables above in the Vercel project settings, and deploy. Full step-by-step instructions: [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

## Documentation

- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) — Supabase + Vercel deployment walkthrough
- [`docs/TESTING.md`](docs/TESTING.md) — manual QA checklist covering every module
- [`docs/PERFORMANCE_REPORT.md`](docs/PERFORMANCE_REPORT.md) — performance, security, accessibility, and scalability notes

## Common Issues & Troubleshooting

| Symptom | Likely Cause | Fix |
|---|---|---|
| `Missing required environment variable` on boot | `.env.local` not created or incomplete | Copy `.env.example` → `.env.local` and fill in Supabase values |
| Login succeeds but redirects back to `/login` | Middleware can't read the session cookie | Confirm `NEXT_PUBLIC_SUPABASE_URL`/`ANON_KEY` match your project; clear cookies and retry |
| Password reset link shows "Missing authentication code" | Supabase **Redirect URLs** doesn't include `/auth/callback` | Add `<your-url>/auth/callback` in Supabase Auth → URL Configuration |
| Image upload fails with a permissions error | Storage bucket policies not applied | Re-run the relevant migration (004, 006, or 008) — each creates its bucket + RLS policies |
| New user can't see any data after logging in | Profile row defaults to `staff` role with limited RBAC access | Promote the user to `admin`/`manager` via the `profiles` table in Supabase |
| "Current password is incorrect" when it isn't | Re-authentication call rate-limited by Supabase | Wait ~60s; Supabase rate-limits `signInWithPassword` calls per IP |
| Build fails with type errors after pulling changes | Generated Supabase types (`types/database.ts`) are hand-maintained, not auto-generated | Cross-check any new migration columns are reflected in `types/database.ts` |

---

Built as a long-term, incrementally developed project — see `docs/PERFORMANCE_REPORT.md` for the full history of optimization and security hardening passes.
