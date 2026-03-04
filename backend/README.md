# BRUTAL — Backend

**Express 5 API with a checkout pipeline that actually handles inventory races.**

This is the REST API powering BRUTAL. It runs the full order lifecycle — cart management (including guest sessions), a 3-phase transactional checkout with rollback, discount code validation with per-customer limits, role-based access control, and transactional emails via Resend. TypeScript end-to-end, every input validated with Zod at the middleware layer.

---

## What's Inside

- **3-phase checkout in `order.service.ts`**: Transaction 1 reserves inventory with optimistic concurrency guards (`inventoryQty >= requested`) and creates the order. Phase 2 processes payment outside the transaction (simulating an external API call). Phase 3 either finalizes or rolls back inventory + discount usage counts. Failed payments don't leave phantom orders or oversold stock.

- **Guest cart → authenticated cart merge**: Carts are keyed by either `customerId` or `sessionId`. On login, `cart.service.ts` runs a batch merge — validates inventory for each guest item, upserts quantities for duplicates, and deletes the guest cart. All inside one Prisma transaction.

- **Discount codes handle the real edge cases**: global usage caps, per-customer limits (checked against non-cancelled orders), date-range validity, minimum order amounts, three discount types (percentage, fixed, free shipping). Validation runs twice — once during preview, again atomically inside the checkout transaction.

- **Better Auth with cross-domain cookies**: Sessions use HTTP-only cookies with `sameSite: "none"` in production (for Vercel frontend ↔ Render backend), `"lax"` in development. 7-day expiry, 24-hour refresh cycle, 5-minute cookie cache.

- **Rate limiting is tiered**: 300 req/15min on general API, 15 req/15min on auth endpoints, 9 req/hour on contact form.

---

## Tech Stack

| Component | Version / Library |
|-----------|-------------------|
| Framework | Express 5 (native async error handling, named splat params) |
| Language | TypeScript 5.8 |
| Database | PostgreSQL via Prisma 6 |
| Auth | Better Auth 1.4 with Prisma adapter |
| Validation | Zod 3 (middleware-level, per-route schemas) |
| Email | Resend (order confirmations, shipping updates, contact/newsletter) |
| Security | express-rate-limit, HTTP-only cookies, CORS whitelist |
| Dev server | tsx watch (hot reload, no build step during dev) |

---

## Project Structure

```
src/
├── config/
│   ├── auth.ts              # Better Auth — Prisma adapter, session cookies,
│   │                        #   cross-domain config, custom password hashing
│   ├── database.ts          # Prisma client singleton
│   └── env.ts               # Validated environment variables
│
├── routes/                  # 14 route files
│   ├── products.ts          # Catalog queries with filter/sort/pagination
│   ├── cart.ts              # CRUD + guest session + merge endpoint
│   ├── checkout.ts          # Discount preview, checkout, order preview
│   ├── orders.ts            # List/detail/status update/fulfillment/analytics
│   ├── collections.ts       # CRUD with product associations
│   ├── categories.ts        # Hierarchical categories (self-referencing)
│   ├── reviews.ts           # Product reviews with approval workflow
│   ├── wishlist.ts          # Add/remove/list
│   ├── discounts.ts         # Admin discount code management
│   ├── addresses.ts         # Customer address book
│   ├── customers.ts         # Customer profiles (admin view)
│   ├── contact.ts           # Contact form → email
│   └── newsletter.ts        # Subscription endpoint
│
├── services/                # Business logic layer
│   ├── order.service.ts     # 571 lines — checkout pipeline, discount logic,
│   │                        #   revenue aggregation, fulfillment tracking
│   ├── cart.service.ts      # Cart CRUD, guest merge, format/transform
│   ├── product.service.ts   # Query builder for filters, featured, related products
│   ├── email.service.ts     # HTML email templates via Resend
│   └── auth.service.ts      # Session helpers
│
├── middleware/
│   ├── auth.ts              # Token extraction, optional auth for guest endpoints
│   ├── requireRole.ts       # RBAC — ADMIN, STAFF, CUSTOMER
│   ├── validate.ts          # Generic Zod body/query/params validation
│   ├── rateLimit.ts         # Tiered rate limiters
│   └── errorHandler.ts      # Centralized error formatting with ApiError class
│
└── validators/              # Zod schemas per domain (checkout, products, etc.)

prisma/
├── schema.prisma            # 615 lines, 20+ models
└── seed.ts                  # Realistic catalog: products, variants, collections, users
```

---

## Getting Started

```bash
npm install

# Set up backend/.env (copy from .env.example)
# Required: DATABASE_URL, BETTER_AUTH_SECRET, FRONTEND_URL
# Optional: RESEND_API_KEY, FROM_EMAIL, CONTACT_EMAIL

npm run db:push       # push schema to Postgres
npm run seed          # seed catalog + demo users

npm run dev           # starts on :3001 with hot reload
```

**Production**: `npm run build` → `npm run start` (runs compiled JS from `dist/`).

---

## Database Schema

20+ models. The interesting parts:

- **Products** have variants (each with SKU, price, compare-at price, inventory quantity, weight), options (Size, Color), and images (with soft-delete support)
- **Cart** is dual-keyed: `customerId` for authenticated users, `sessionId` for guests — with a unique constraint on each
- **Orders** track 8 statuses (PENDING → DELIVERED/CANCELLED/REFUNDED), plus separate `financialStatus` and `fulfillmentStatus` fields
- **Payments** store `cardLast4`, `cardBrand` (auto-detected from number), and `transactionId`
- **DiscountCodes** support `PERCENTAGE`, `FIXED_AMOUNT`, and `FREE_SHIPPING` types with `usesPerCustomer` and `maxUses` limits
- **Categories** are self-referencing for hierarchical browsing
- **Metafields** on products for extensible key-value metadata

Full schema: [`prisma/schema.prisma`](prisma/schema.prisma)

---

## API Overview

**Public**: `GET /api/products` (filters, pagination, sort), `GET /api/products/:slug`, `GET /api/collections`, `GET /api/categories`, `POST /api/contact`, `POST /api/newsletter/subscribe`

**Authenticated** (session cookie): `GET/POST/PATCH/DELETE /api/cart/*`, `POST /api/checkout`, `GET /api/orders/my-orders`, `GET/POST/DELETE /api/wishlist`, `GET/PUT /api/addresses`

**Admin/Staff** (role-gated): `GET /api/orders` (all), `PATCH /api/orders/:id/status`, `POST /api/orders/:id/fulfillment`, `GET /api/orders/stats`, `GET /api/customers`, `POST/PUT/DELETE /api/products`, `POST/PUT/DELETE /api/collections`, `POST/PUT/DELETE /api/discounts`

---

## What I'd Do Differently

- **Swap the mock payment for Stripe**. The 3-phase architecture was designed for this — `processPayment()` is already isolated in Phase 2, running outside the main database transaction.

- **Add cursor-based pagination** for the orders list. Offset pagination works fine at low volume but degrades with thousands of orders.

- **Build a proper query-builder** for `product.service.ts`. The filter construction handles category + collection + price range + tag + search + sort, but the conditional nesting gets complex — a builder pattern would clean it up.

---

## Author

**Fazlul Karim** — [GitHub](https://github.com/FazlulKarimC)
