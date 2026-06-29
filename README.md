# CCKart Frontend

React + TypeScript frontend for the CCKart POS portal, integrating with Zoho Inventory (Zakya) via the [cckart-backend](https://github.com/satishcorejava/cckart-backend).

## Tech Stack

| Layer | Library |
|---|---|
| UI framework | React 18 + TypeScript |
| Component library | MUI v5 (Material UI) |
| Data grid | MUI X DataGrid v7 |
| Data fetching | TanStack React Query v5 |
| HTTP client | Axios |
| Routing | React Router v6 |
| Build tool | Vite 5 |
| PWA | vite-plugin-pwa (Workbox) |
| Deployment | Cloudflare Pages via Wrangler |

## Features

- **JWT authentication** — email + password login, token stored in `localStorage`, auto-redirect on 401
- **Invoices** — list with date/status filters, mobile card view, detail drawer with line items, record payment, pay online link
- **Sales Orders** — list with date/status filters, mobile card view, one-click POS fulfillment (SO → Invoice → Payment → closed)
- **Contacts** — customer/vendor list with delete
- **Items** — product catalogue
- **Dashboard** — KPI summary cards
- **Responsive layout** — permanent sidebar on desktop, hamburger drawer on mobile
- **PWA** — installable, service worker with NetworkFirst API caching and CacheFirst font caching

## Getting Started

### Prerequisites

- Node.js 18+
- The [cckart-backend](https://github.com/satishcorejava/cckart-backend) running locally on port `8090`

### Install & run

```bash
npm install
npm run dev
```

The Vite dev server starts on `http://localhost:5173` and proxies `/api` → `http://localhost:8090`.

### Build

```bash
npm run build       # type-check + Vite production build → dist/
npm run preview     # serve the dist/ folder locally
```

## Environment Variables

| Variable | Purpose | Default |
|---|---|---|
| `VITE_API_BASE_URL` | Full base URL for the backend API | `/api` (proxied in dev) |

Create a `.env.local` for local overrides (never committed):

```env
VITE_API_BASE_URL=http://localhost:8090/api
```

In production set `VITE_API_BASE_URL=https://<your-railway-backend>.railway.app/api` in the Cloudflare Pages environment variables dashboard.

## Deployment — Cloudflare Pages

### Option A: Git-connected (recommended)

1. Go to [Cloudflare Pages](https://pages.cloudflare.com/) → **Create a project** → connect `cckart-frontend` repo
2. Set **Build command**: `npm run build`
3. Set **Build output directory**: `dist`
4. Add environment variable `VITE_API_BASE_URL` pointing to your Railway backend
5. Save — Cloudflare will deploy on every push to `main`

### Option B: Manual deploy via CLI

```bash
npx wrangler login          # first time only
npm run deploy              # builds + deploys to Cloudflare Pages
```

The `_redirects` file in `public/` ensures all routes fall through to `index.html` so React Router works correctly on Cloudflare Pages.

## Project Structure

```
src/
├── api/          # Axios client + per-module API functions
├── components/   # Shared UI components (Layout, drawers, dialogs, toolbar)
├── context/      # AuthContext — JWT state + login/logout
├── hooks/        # React Query hooks per module
├── pages/        # Route-level page components
├── theme/        # MUI theme (light/dark)
└── types/        # Shared TypeScript types
public/
├── manifest.json # PWA manifest
└── _redirects    # Cloudflare Pages SPA routing
```

## Default Login

The seed user is created automatically by the backend on first startup.

| Field | Value |
|---|---|
| Email | `cornucopiasupermart@gmail.com` |
| Password | `copia@12345` |
