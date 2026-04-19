# متجري — E-Commerce Platform for Digital Products

A custom Arabic-first (RTL) e-commerce platform for selling digital products: software subscriptions, license keys, gaming cards, AI tool subscriptions, and invitations.

## Architecture

```
my-store/
├── apps/
│   ├── storefront/    → Next.js 14 App Router (Vercel)
│   └── cms/           → Payload CMS 2 + PostgreSQL (Railway)
├── packages/
│   └── types/         → Shared TypeScript types
└── pnpm-workspace.yaml
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS, shadcn/ui |
| CMS | Payload CMS 2 with PostgreSQL adapter |
| Database | PostgreSQL via Supabase |
| Auth | NextAuth.js v5 (customers) + Payload built-in (admins) |
| Payments | Airwallex Payment Elements |
| Email | Resend + HTML templates |
| Media | Cloudflare R2 via S3-compatible adapter |
| State | Zustand (cart), TanStack Query (server data) |
| Validation | Zod |

## Quick Start

### Prerequisites
- Node.js 18+
- pnpm 8+
- PostgreSQL database (Supabase recommended)

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment variables

```bash
# Copy env examples
cp apps/storefront/.env.example apps/storefront/.env.local
cp apps/cms/.env.example apps/cms/.env

# Edit both files with your actual credentials
```

### 3. Set up the database

```bash
# Generate Prisma client (storefront auth)
cd apps/storefront
pnpm prisma:generate
pnpm prisma:push

# Payload CMS will auto-create its tables on first run
```

### 4. Start development

```bash
# From root — starts both apps
pnpm dev

# Or individually:
pnpm dev:cms         # http://localhost:3001/admin
pnpm dev:storefront  # http://localhost:3000
```

### 5. First-time CMS setup

1. Open `http://localhost:3001/admin`
2. Create your admin account
3. Add categories, products, and homepage content
4. The storefront will automatically pull content from the CMS

## Key Features

### Evidence Logging System
Every critical customer action is logged for dispute protection:
- **Terms acceptance** — IP, user agent, timestamp, session ID
- **Payment initiation & confirmation** — Airwallex intent IDs, amounts
- **Digital delivery** — email sent confirmation, delivery details
- **Usage confirmation** — customer-initiated "I received and used this"

### Checkout Flow
1. Customer reviews cart
2. T&C checkbox → logs `terms_acceptance` evidence
3. Airwallex payment intent created → logs `payment` evidence
4. Webhook confirms payment → order status updated, delivery triggered
5. Email sent via Resend → logs `delivery` evidence
6. Customer clicks "تأكيد الاستلام" → logs `usage_confirmation` evidence

### Evidence Bundle API
```
GET /api/orders/[id]/evidence
```
Returns grouped evidence: terms, payment, delivery, access, usage confirmation, support notes, screenshots.

## Project Structure — Storefront Pages

| Route | Description |
|-------|------------|
| `/` | Homepage (CMS-driven sections) |
| `/products` | Product listing with category filters |
| `/products/[slug]` | Product detail page |
| `/category/[slug]` | Category page |
| `/cart` | Shopping cart |
| `/checkout` | Checkout with T&C + payment |
| `/checkout/success` | Order confirmation |
| `/orders` | Customer order history |
| `/orders/[id]` | Order detail + usage confirmation |
| `/account` | Customer profile |
| `/support` | Support tickets (Phase 2) |
| `/policies/*` | Terms, refund, privacy policies |
| `/about` | About page |

## API Routes

| Endpoint | Method | Description |
|----------|--------|------------|
| `/api/auth/[...nextauth]` | GET/POST | NextAuth handlers |
| `/api/auth/register` | POST | Customer registration |
| `/api/orders` | POST | Create order |
| `/api/orders/[id]/evidence` | GET | Evidence bundle |
| `/api/airwallex/create-intent` | POST | Create payment intent |
| `/api/webhooks/airwallex` | POST | Payment webhook |
| `/api/evidence` | POST | Log evidence event |
| `/api/usage-confirm` | POST | Customer usage confirmation |

## Payload CMS Collections

- **Products** — Digital products with localized names, pricing, delivery methods
- **Categories** — Product categories with icons and brand logos
- **Subcategories** — Nested under categories
- **Orders** — Full order lifecycle with T&C tracking
- **Customers** — Customer profiles with IP/device history
- **EvidenceLogs** — Immutable audit trail for disputes
- **SupportTickets** — Customer support (Phase 2)
- **Media** — Cloudflare R2 media storage
- **Users** — Admin accounts with roles

## Deployment

### Storefront → Vercel
```bash
vercel --cwd apps/storefront
```

### CMS → Railway
```bash
# Deploy apps/cms to Railway with PostgreSQL
# Set all env vars in Railway dashboard
```

## Phase 2 (Planned)
- Support ticket system with messaging
- Customer 2FA (TOTP)
- PDF evidence bundle export
- Admin audit logs
- Discount/promo code system
- Full CMS section drag-and-drop
