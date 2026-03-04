# BRUTAL — Frontend

**A Next.js 16 storefront where every shadow is hard-offset and every hover lifts the element off the page.**

This is the customer-facing and admin UI for BRUTAL. Built on React 19 with the App Router, it enforces a strict Neo Brutalist design system — 4 colors, `4px` black borders, zero blur, and a "lift" hover microinteraction on every clickable surface. State management is split cleanly: Zustand for client state (cart, auth), React Query for server state (products, orders, collections). No global Redux store. The whole state layer is under 600 lines.

---

## What's Inside

- **Cart store in Zustand with `persist` + debounced optimistic updates** — clicking the quantity button updates the UI immediately, debounces the API call by 500ms, and reverts to server state on failure. No loading spinners for quantity changes. The entire cart store including guest merge logic is one 226-line file.

- **React Query hooks layer** (`lib/hooks.ts`) wraps every backend call — `useProducts`, `useCollections`, `useCategories`, `useProductReviews`, `useMyOrders`, `useWishlist`, etc. Each hook manages caching, refetching, and pagination params. Components never call `api.get()` directly.

- **Cold-start retry** built into the Axios instance — if the backend returns 502/503 or times out (hosting on Render's free tier), the client waits 3 seconds and retries up to 2 times. Users see a brief delay, not a broken page.

- **Admin dashboard fires 5 parallel API calls** via `Promise.all` — revenue stats, recent orders, customer count, product count, and analytics. One render, no waterfalls.

- **Design system is enforced, not suggested** — the `DESIGN_SYSTEM.md` is a 522-line spec with shadow tokens, color psychology rationale, do's and don'ts with code examples, and component patterns. Every card, button, badge, and input follows it.

- **Better Auth integration** with `<AuthProvider />` that refreshes sessions on page load, a Zustand auth store that tracks user/role state, and automatic cart merge when a guest user logs in.

---

## Tech Stack

| What | Choice | Notes |
|------|--------|-------|
| Framework | Next.js 16, App Router | Server Components where possible, `'use client'` only when needed |
| React | 19 | Latest stable |
| Styling | Tailwind CSS 4 | Design tokens enforced through consistent utility classes |
| Client state | Zustand 5 | Cart store + auth store. No Redux |
| Server state | TanStack React Query 5 | Custom hooks layer, dev tools included |
| Auth | Better Auth client | Session cookies, auto-refresh, role awareness |
| Forms | React Hook Form + Zod | Checkout, login, register, review submission, address forms |
| Icons | Lucide React | Tree-shakeable, consistent with design language |
| Toasts | Sonner | Non-blocking notifications |
| UI primitives | Radix (Dialog, Select, Label, Slot) | Accessible, unstyled — styled to match design system |
| Dev | Turbopack | `next dev --turbopack` for instant HMR |

---

## Project Structure

```
app/                          # Next.js App Router pages
├── page.tsx                  # Landing — hero, featured products, collections, newsletter
├── products/                 # Catalog (filter by category, price, search, sort)
│   └── [slug]/               # Product detail — images, variant selector, reviews
├── collections/              # Collection listing + detail
│   └── [slug]/
├── categories/               # Category pages
│   └── [slug]/
├── cart/                     # Full cart page (also accessible via drawer)
├── checkout/                 # Multi-step: shipping → payment → review
├── thank-you/                # Post-purchase confirmation with confetti
├── track/                    # Order tracking by order number
├── account/                  # Protected user area
│   ├── orders/               # Order history + detail view
│   ├── addresses/            # Address book CRUD
│   └── wishlist/             # Saved products
├── admin/                    # Role-gated admin panel
│   ├── products/             # Product CRUD + variant management
│   ├── orders/               # Order management + fulfillment
│   ├── collections/          # Collection management
│   ├── categories/           # Category management
│   ├── customers/            # Customer list
│   ├── discounts/            # Discount code management
│   └── reviews/              # Review moderation
├── auth/                     # Login + Register
├── about/                    # Brand story
├── contact/                  # Contact form
└── coming-soon/              # Placeholder route

components/
├── ui/                       # Design system primitives
│   ├── button.tsx            # 3 variants (primary/secondary/outline), all with lift hover
│   ├── card.tsx              # Configurable shadow + hover levels
│   ├── badge.tsx             # Status-aware (pending/shipped/delivered/cancelled)
│   ├── dialog.tsx            # Radix-based, styled to match
│   └── select.tsx, label.tsx, input.tsx, skeleton.tsx
├── hero-section.tsx          # Landing hero with rotated badges + floating geometry
├── products-section.tsx      # Featured product grid
├── collections-grid.tsx      # Collection cards
├── newsletter-cta.tsx        # Email capture with validation
├── site-header.tsx           # Nav, search, cart badge, auth state (663 lines)
├── site-footer.tsx           # Links, social, brand
├── cart/cart-drawer.tsx       # Slide-out cart with live quantity controls
└── providers/                # QueryClient, AuthProvider, Toaster

lib/
├── api.ts                    # Axios instance with cold-start retry + session header
├── cart.ts                   # Zustand cart store with persist + optimistic updates
├── auth.ts                   # Zustand auth store + session management
├── auth-client.ts            # Better Auth client config
├── hooks.ts                  # React Query hooks for every data type
├── types.ts                  # Shared TypeScript interfaces
└── utils.ts                  # formatPrice, cn (class merge), generateSessionId
```

---

## Design System

Four colors, enforced everywhere.

```
#FACC15 (Yellow)  →  badges, highlights, hover fills
#EF4444 (Red)     →  CTAs, sale tags, urgency
#000000 (Black)   →  4px borders, hard offset shadows, text
#FAFAFA (White)   →  backgrounds, card surfaces
```

**Shadow scale** (no blur, ever):
- `2px 2px 0px #000` — subtle depth (thumbnails)
- `4px 4px 0px #000` — standard cards and buttons
- `6px 6px 0px #000` — emphasized elements
- `8px 8px 0px #000` — hero elements, modals, hover state

**Lift hover** (on every interactive element):
```css
hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[8px_8px_0px_#000]
```
Elements shift up-left while the shadow expands. Press effect reverses it (`active:translate-x-0 active:translate-y-0`).

**Typography**: Space Grotesk (headings, font-weight 900), DM Sans (body), Space Mono (accents and tags).

**Badge rotation**: `-rotate-2` or `rotate-2` for a hand-stamped, anti-corporate feel.

Full spec with code examples: [`DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md)

---

## Getting Started

```bash
npm install

# Create .env.local
# NEXT_PUBLIC_API_URL=http://localhost:3001

npm run dev    # starts on :3000 with Turbopack
```

Backend must be running on `:3001`. See the [root README](../README.md) for full monorepo setup.

---

## What I'd Do Differently

- **Add image optimization via `next/image` with a proper loader**. Product images currently use raw URLs. Configuring a Cloudinary or S3 loader with `next/image` would get automatic format conversion, lazy loading, and responsive `srcset` for free.

- **Move the admin section to a separate layout with its own data pre-fetching**. Right now the admin pages share the store layout. A dedicated admin layout with `generateMetadata` and server-side session checks would be cleaner than the client-side role guard.

- **Extract the product filter state into URL search params**. Currently filters reset on navigation. Persisting them in the URL would make filter states shareable and bookmark-friendly.

- **Build a component playground**. The design system spec exists in a markdown file. A Storybook or dedicated `/design` route showing every component variant in context would make the system easier to audit and extend.

---

## Author

**Fazlul Karim** — [GitHub](https://github.com/FazlulKarimC)
