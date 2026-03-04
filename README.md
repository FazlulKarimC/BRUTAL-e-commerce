# BRUTAL

**An e-commerce app where the checkout has a 3-phase transactional pipeline and the buttons look like they were cut from construction paper.**

Full-stack online store with a Neo Brutalist UI — 4px black borders, hard offset shadows, zero blur, four colors total. Not a theme slapped on a template. The design system is enforced from the hero section to the admin dashboard, and the backend handles inventory races, guest-to-user cart merging, and discount edge cases that most portfolio projects pretend don't exist.

---

## What's Inside

- **Cart state lives in Zustand with `persist` middleware and debounced optimistic updates** — quantity changes hit the UI instantly, API calls are batched at 500ms, and failed syncs revert to server truth. No Redux. The entire store fits in one file.

- **Guest → authenticated cart merge** happens server-side in a single Prisma transaction. Shop as a guest, log in, and your cart items carry over with proper inventory validation. Session IDs are tracked via `localStorage` and cleaned up after merge.

- **Checkout is a 3-phase process**: Phase 1 reserves inventory + creates the order inside a transaction with optimistic concurrency guards. Phase 2 processes payment outside the transaction (simulated external API). Phase 3 either finalizes the order or rolls back inventory, discount usage counts, and marks the order as failed. Most e-commerce tutorials skip all of this.

- **Discount codes handle the annoying cases**: per-customer usage limits, min order amounts, date-range validity, global usage caps, and free shipping as a discount type. All validated atomically inside the checkout transaction.

- **Admin dashboard parallelizes 5 API calls** (`Promise.all`) to render stats, recent orders, customer counts, product counts, and analytics in one shot.

- **Neo Brutalism design system has its own 522-line spec** (`frontend/DESIGN_SYSTEM.md`) with documented shadow tokens (`2px 2px 0px #000` through `8px 8px 0px #000`), a signature "lift" hover effect on every interactive element, rotated badge aesthetics, and strict rules against blurred shadows, gradients, or colors outside the 4-color palette.

---

## Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| **Frontend** | Next.js 16, React 19, App Router | Server Components, Turbopack HMR |
| **Styling** | Tailwind CSS 4 | Utility-first, pairs well with the strict design tokens |
| **Client state** | Zustand 5 | Cart + auth stores in ~250 lines total. Zustand over Redux — no boilerplate tax |
| **Server state** | TanStack React Query 5 | Hooks layer (`lib/hooks.ts`) wraps every API call with caching + refetch |
| **Backend** | Express 5, TypeScript 5 | Named splat params, native async error handling |
| **Database** | PostgreSQL + Prisma 6 | 615-line schema, 20+ models, typed queries |
| **Auth** | Better Auth | Session cookies (HTTP-only, `sameSite: none` for cross-domain), 7-day expiry, role-based access |
| **Validation** | Zod (both ends) | Runtime type safety on API inputs and form submissions |
| **Email** | Resend | Order confirmations, shipping notifications, contact forms |
| **Forms** | React Hook Form + Zod resolvers | Client-side validation with the same Zod schemas |
| **Dev** | Concurrently, tsx watch | One `npm run dev` starts both servers |

---

## Getting Started

**Prerequisites**: Node.js 18+, a PostgreSQL database.

```bash
git clone https://github.com/FazlulKarimC/eCommerce_app.git
cd eCommerce_app

npm run install:all       # installs root + backend + frontend deps

# Configure backend/.env (see backend/.env.example)
# Configure frontend/.env.local → NEXT_PUBLIC_API_URL=http://localhost:3001

npm run db:push           # push Prisma schema to your database
npm run db:seed           # seed products, collections, users, discount codes

npm run dev               # starts backend (:3001) + frontend (:3000)
```

**Seed accounts**: `admin@brutal.com` / `Admin123!` (admin), `customer@brutal.com` / `Customer123!` (customer).

---

## Project Structure

```
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma         # 615 lines — products, variants, carts, orders,
│   │   │                         #   payments, fulfillments, discounts, reviews, wishlist
│   │   └── seed.ts               # Generates realistic sample catalog
│   └── src/
│       ├── routes/               # 14 route files (products, cart, checkout, orders,
│       │                         #   collections, categories, reviews, wishlist, etc.)
│       ├── services/             # Business logic (cart merge, 3-phase checkout,
│       │                         #   product queries, email dispatch)
│       ├── middleware/           # Auth, RBAC, Zod validation, rate limiting, error handler
│       ├── validators/           # Zod schemas for every endpoint
│       └── config/               # Prisma client, Better Auth setup, env validation
│
├── frontend/
│   ├── app/                      # Next.js App Router
│   │   ├── products/             # Catalog with filters, product detail with reviews
│   │   ├── cart/ & checkout/     # Full purchase flow with discount codes
│   │   ├── account/              # Orders, addresses, wishlist
│   │   ├── admin/                # Dashboard, product/order/customer/discount management
│   │   ├── collections/          # Curated product groups
│   │   ├── categories/           # Category browsing
│   │   └── track/                # Order tracking by number
│   ├── components/               # UI kit (Button, Card, Badge, CartDrawer, etc.)
│   └── lib/                      # API client, Zustand stores, React Query hooks, types
│
└── package.json                  # Monorepo root — `npm run dev` starts everything
```

---

## Design System

Four colors. No exceptions.

| Color | Hex | Role |
|-------|-----|------|
| Electric Yellow | `#FACC15` | Highlights, badges, hover states |
| Signal Red | `#EF4444` | CTAs, sale indicators, urgency |
| Pure Black | `#000000` | 4px borders, offset shadows, text |
| Off-White | `#FAFAFA` | Backgrounds, breathing room |

**Key rules**:
- All shadows are hard offsets (`4px 4px 0px #000`) — blur is banned
- Every interactive element uses the "lift" hover: `-translate-x-1 -translate-y-1` with shadow expansion to `8px 8px 0px #000`
- Badges get a slight rotation (`-rotate-2` / `rotate-2`) for a hand-stamped look
- Typography: Space Grotesk for headings (font-weight 900), DM Sans for body, Space Mono for accents
- Green is the only exception color, used strictly for success/delivery status indicators

Full spec: [`frontend/DESIGN_SYSTEM.md`](frontend/DESIGN_SYSTEM.md)

---

## Screenshots

> Screenshots to add: landing page hero, product detail with variant selector, cart drawer, checkout flow, admin dashboard, mobile responsive view.

---

## What I'd Do Differently

- **Replace the mock payment processor** with Stripe. The 3-phase checkout architecture was designed with this in mind — Phase 2 already runs outside the main transaction, so swapping in a real payment API is a matter of replacing `processPayment()` in `order.service.ts`.

- **Add server-side pagination to the admin orders table**. Right now the React Query hook fetches paginated data, but the initial load pulls recent orders without cursor-based pagination. Under high order volume, this would need proper keyset pagination.

- **Extract the product filtering logic** into a query-builder utility. The current filter construction in `product.service.ts` works but gets nested fast when combining category, collection, price range, tag, and search filters simultaneously.

- **Add image uploads**. Product images are currently URLs in the seed data. A real deploy needs an upload pipeline (S3/Cloudinary) with the `ProductImage` model already supporting `mimeType`, `size`, `width`, and `height` fields — those columns are there, just waiting.

---

## Author

**Fazlul Karim** — [GitHub](https://github.com/FazlulKarimC)