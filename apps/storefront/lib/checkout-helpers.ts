/**
 * Shared helpers for the checkout endpoints.
 *
 * `/api/checkout/test-pay` and `/api/checkout/manual-payment` both need
 * the same building blocks:
 *
 *   - Resolve who's checking out (real session OR guest OTP token)
 *   - Find-or-create the customers row for that email
 *   - Mint an "Order-XXXXX" number from the shared Postgres sequence
 *   - Write the order + items + rels rows into the direct-Payload tables
 *
 * Keeping this in one place stops the two endpoints from drifting apart
 * (which they had started to — different logging, different fallback
 * order-number formats, subtle column-list differences).
 */

import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { verifyGuestToken } from "@/lib/otp";
import { normalizeEmail } from "@/lib/normalize-email";
import { Prisma } from "@prisma/client";
import { prisma as prismaOrders } from "@/lib/prisma";
import crypto from "crypto";

// ── Identity ─────────────────────────────────────────────────────

export type CheckoutIdentity = {
  customerEmail: string;
  customerName:  string;
};

/**
 * Discriminated result so callers can respond with the right 401 code
 * (and body) and the client can branch on it — invalid_guest reopens
 * the OTP block, anonymous shows a sign-in prompt.
 */
export type IdentityResult =
  | { kind: "ok"; identity: CheckoutIdentity }
  | { kind: "invalid_guest" }
  | { kind: "anonymous" };

/**
 * Resolves the caller's identity from either a NextAuth session or a
 * guest OTP token. Both paths funnel through normalizeEmail() so the
 * customers table is keyed by a single canonical form site-wide.
 * Empty/whitespace-only session emails (rare but observed with some
 * auth providers) are rejected as anonymous rather than getting
 * silently upserted into a shared anonymous row.
 */
export async function resolveIdentity(input: {
  guestToken?: string;
  guestName?:  string;
}): Promise<IdentityResult> {
  const session = await auth();
  const sessionEmail = normalizeEmail(session?.user?.email);
  if (sessionEmail) {
    return {
      kind: "ok",
      identity: {
        customerEmail: sessionEmail,
        customerName:  session?.user?.name?.trim() || sessionEmail,
      },
    };
  }
  if (input.guestToken) {
    const guestEmail = normalizeEmail(await verifyGuestToken(input.guestToken));
    if (!guestEmail) return { kind: "invalid_guest" };
    return {
      kind: "ok",
      identity: {
        customerEmail: guestEmail,
        customerName:  input.guestName?.trim() || guestEmail,
      },
    };
  }
  return { kind: "anonymous" };
}

// ── Customers ─────────────────────────────────────────────────────

/** Prisma transaction handle (or the top-level client). Accepting the
 *  union lets helpers run inside createOrderForCustomer's transaction
 *  OR standalone from another caller. */
type PrismaLike = typeof prismaOrders | Prisma.TransactionClient;

/**
 * Find-or-create pattern for the `customers` table, keyed by email.
 *
 * Uses INSERT ... ON CONFLICT DO NOTHING then a SELECT fallback (via
 * one CTE, one round-trip, race-safe) so a matched row doesn't touch
 * the write path — no dead tuples, no updated_at drift, no BEFORE
 * UPDATE trigger fire. Caller must pass an ALREADY-NORMALIZED email
 * (see normalizeEmail); this function is called by both the checkout
 * flow AND external endpoints (auth, evidence, reviews, usage-confirm)
 * so keeping normalization out of the DB helper avoids double-doing.
 *
 * Threads `now` from the caller for exact timestamp consistency with
 * the surrounding order-write, and accepts an optional tx handle so
 * concurrent guest checkouts can share atomicity with the order.
 */
export async function getOrCreateCustomer(
  email: string,
  name: string,
  now: string = new Date().toISOString(),
  tx: PrismaLike = prismaOrders,
): Promise<number> {
  const rows = await tx.$queryRaw<{ id: number }[]>(
    Prisma.sql`
      WITH ins AS (
        INSERT INTO customers (email, name, updated_at, created_at)
        VALUES (${email}, ${name || email}, ${now}::timestamptz, ${now}::timestamptz)
        ON CONFLICT (email) DO NOTHING
        RETURNING id
      )
      SELECT id FROM ins
      UNION ALL
      SELECT id FROM customers WHERE email = ${email}
      LIMIT 1
    `
  );
  return rows[0].id;
}

// ── Order numbers ─────────────────────────────────────────────────

/**
 * Order-XXXXX (5-digit zero-padded) from the shared Postgres sequence
 * `order_number_seq`.
 *
 * Only "sequence does not exist" (Postgres SQLSTATE 42P01 - undefined_table
 * covers relations of every kind including sequences) triggers the
 * timestamp fallback — that's the one recoverable case, and only on
 * a fresh DB where runMigrations hasn't run yet. Every other error
 * (connection loss, pool timeout, permission revoked, statement
 * timeout, ...) rethrows so the caller can 500 the request cleanly
 * and ops sees the real signal instead of a fake success followed by
 * a downstream failure.
 */
export async function mintOrderNumber(): Promise<string> {
  try {
    const rows = await prismaOrders.$queryRaw<{ n: number }[]>(
      Prisma.sql`SELECT nextval('order_number_seq') AS n`
    );
    return `Order-${String(rows[0].n).padStart(5, "0")}`;
  } catch (e: any) {
    if (e?.code === "42P01" || /does not exist/i.test(String(e?.message))) {
      console.warn("[mintOrderNumber] order_number_seq missing, falling back to timestamp form");
      return `Order-${String(Date.now()).slice(-8)}`;
    }
    throw e;
  }
}

// ── Products existence guard ──────────────────────────────────────

/**
 * Verifies every product id in the cart still exists in the DB.
 * Prevents FK-violation crashes on the item INSERT if the cart
 * references a since-deleted product. Returns the ids that are
 * missing, or an empty array when all are present.
 */
export async function findMissingProductIds(productIds: number[]): Promise<number[]> {
  if (productIds.length === 0) return [];
  const found = await prismaOrders.$queryRaw<{ id: number }[]>(
    Prisma.sql`SELECT id FROM products WHERE id IN (${Prisma.join(productIds)})`
  );
  const seen = new Set(found.map((p) => p.id));
  return productIds.filter((id) => !seen.has(id));
}

// ── Order + line items write ──────────────────────────────────────

export type CheckoutItem = {
  productId: number;
  quantity:  number;
  unitPrice: number;
};

/**
 * Atomic write of a new order for a customer.
 *
 * The full sequence — customers upsert, orders INSERT, orders_items
 * multi-row INSERT, product rels multi-row INSERT, customer rels
 * (both directions), and abandoned_carts close — runs inside a single
 * Prisma transaction. A mid-sequence failure rolls the whole thing
 * back including the customer row (so a failed first-time-guest
 * checkout doesn't leak a customers row).
 *
 * A single `now` is threaded through every INSERT so every row
 * created by one checkout shares the same created_at (customers +
 * orders + rels) and completed_at (abandoned_carts) — audit joins
 * become exact rather than off by tens of ms.
 *
 * Items + product rels are inserted with ONE multi-row VALUES each
 * instead of N per-item round-trips: a 10-item cart drops from
 * ~24 sequential round-trips to 5 (customer upsert, order, items,
 * item-rels, customer rels + cart-close), so lock hold time inside
 * the tx shrinks by ~5x.
 *
 * Note on order_number_seq: sequence values do NOT roll back in
 * Postgres. If a tx here fails after mintOrderNumber, that number is
 * permanently skipped in the customer-visible numbering. That's an
 * unavoidable Postgres property (safer than reusing) — not a bug.
 */
export async function createOrderForCustomer(input: {
  orderNumber:       string;
  totalAmount:       number;
  currency:          string;
  ip:                string;
  userAgent:         string;
  items:             CheckoutItem[];
  paymentReference?: string;
  customerEmail:     string;
  customerName:      string;
}): Promise<{ orderId: number; customerId: number }> {
  const now = new Date().toISOString();
  return prismaOrders.$transaction(async (tx) => {
    // Customer upsert inside the tx so a failed order write rolls
    // back a first-time-guest customer row too.
    const customerId = await getOrCreateCustomer(
      input.customerEmail,
      input.customerName,
      now,
      tx,
    );

    const [order] = await tx.$queryRaw<{ id: number }[]>(
      Prisma.sql`
        INSERT INTO orders (
          order_number, status, total_amount, currency,
          payment_reference,
          terms_accepted_at, terms_accepted_i_p, terms_accepted_user_agent,
          updated_at, created_at
        )
        VALUES (
          ${input.orderNumber},
          'pending'::"enum_orders_status",
          ${input.totalAmount},
          ${input.currency}::"enum_orders_currency",
          ${input.paymentReference ?? null},
          ${now}::timestamptz,
          ${input.ip},
          ${input.userAgent},
          ${now}::timestamptz,
          ${now}::timestamptz
        )
        RETURNING id
      `
    );
    const orderId = order.id;

    // Batch orders_items into ONE multi-row INSERT.
    if (input.items.length > 0) {
      const itemRows = input.items.map((item, i) => {
        const itemId = crypto.randomBytes(12).toString("hex");
        return Prisma.sql`(${i + 1}, ${orderId}, ${itemId}, ${item.quantity}, ${item.unitPrice}, ${item.unitPrice * item.quantity})`;
      });
      await tx.$executeRaw(Prisma.sql`
        INSERT INTO orders_items (_order, _parent_id, id, quantity, unit_price, total_price)
        VALUES ${Prisma.join(itemRows)}
      `);

      // Batch orders_rels for products into ONE multi-row INSERT.
      const productRelRows = input.items.map((item, i) =>
        Prisma.sql`(${orderId}, ${`items.${i}.product`}, ${item.productId})`
      );
      await tx.$executeRaw(Prisma.sql`
        INSERT INTO orders_rels (parent_id, path, products_id)
        VALUES ${Prisma.join(productRelRows)}
      `);
    }

    // Customer <-> order links (still two rows because they target
    // different tables — orders_rels and customers_rels).
    await tx.$executeRaw(Prisma.sql`
      INSERT INTO orders_rels (parent_id, path, customers_id)
      VALUES (${orderId}, 'customer', ${customerId})
    `);
    await tx.$executeRaw(Prisma.sql`
      INSERT INTO customers_rels (parent_id, path, orders_id)
      VALUES (${customerId}, 'orders', ${orderId})
    `);

    // Close any abandoned cart. `customerEmail` is already normalized
    // — cart/sync + all other writers now write the same canonical
    // form, so this UPDATE matches reliably.
    await tx.$executeRaw(Prisma.sql`
      UPDATE abandoned_carts
      SET completed_at = ${now}::timestamptz, updated_at = ${now}::timestamptz
      WHERE user_email = ${input.customerEmail} AND completed_at IS NULL
    `);

    return { orderId, customerId };
  });
}

// ── Request helpers (re-exported for endpoint convenience) ────────

export { extractIP, extractUserAgent } from "@/lib/evidence";
export type { NextRequest };
