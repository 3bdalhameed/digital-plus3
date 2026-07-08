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
import { Prisma } from "@prisma/client";
import { prisma as prismaOrders } from "@/lib/prisma";
import crypto from "crypto";

// ── Identity ─────────────────────────────────────────────────────

export type CheckoutIdentity = {
  customerEmail: string;
  customerName:  string;
};

/**
 * Discriminated result so callers can preserve the two distinct 401
 * messages the pre-refactor code had:
 *   - "invalid_guest" ⇒ 401 "رمز الضيف غير صالح أو منتهي"
 *     (customer verified an OTP but their JWT has expired; UX should
 *     reopen the OTP block)
 *   - "anonymous"     ⇒ 401 "غير مصرح"
 *     (no session AND no guest token at all)
 * Collapsing both to null was a UX regression flagged in the code
 * review — expired-token guests need a re-verify prompt, not a
 * generic sign-in error.
 */
export type IdentityResult =
  | { kind: "ok"; identity: CheckoutIdentity }
  | { kind: "invalid_guest" }
  | { kind: "anonymous" };

/**
 * Resolves the caller's identity from either a NextAuth session or a
 * guest OTP token in the request body. Session email is lowercased +
 * trimmed to match the guest OTP normalization (verifyGuestToken and
 * abandoned_carts store lowercased addresses), so the same physical
 * customer keys to the same customers.id whether they check out via
 * session or guest, and so linkOrderToCustomer's abandoned_carts
 * UPDATE matches rows created by either flow.
 */
export async function resolveIdentity(input: {
  guestToken?: string;
  guestName?:  string;
}): Promise<IdentityResult> {
  const session = await auth();
  if (session?.user?.email) {
    const email = session.user.email.trim().toLowerCase();
    return {
      kind: "ok",
      identity: {
        customerEmail: email,
        customerName:  session.user.name || email,
      },
    };
  }
  if (input.guestToken) {
    const email = await verifyGuestToken(input.guestToken);
    if (!email) return { kind: "invalid_guest" };
    return {
      kind: "ok",
      identity: {
        customerEmail: email,
        customerName:  input.guestName?.trim() || email,
      },
    };
  }
  return { kind: "anonymous" };
}

// ── Customers ─────────────────────────────────────────────────────

/**
 * Find-or-create pattern for the `customers` table, keyed by email.
 *
 * Single-statement INSERT ... ON CONFLICT is used (not select-then-
 * insert) so two concurrent guest checkouts for the same email can't
 * race between the SELECT and the INSERT and violate the unique
 * constraint on `customers.email`.
 *
 * DO UPDATE SET email = EXCLUDED.email is a no-op that makes the
 * conflict path also RETURNING the existing row's id, so the caller
 * gets the id whether we inserted or matched.
 */
export async function getOrCreateCustomer(email: string, name: string): Promise<number> {
  const rows = await prismaOrders.$queryRaw<{ id: number }[]>(
    Prisma.sql`
      INSERT INTO customers (email, name, updated_at, created_at)
      VALUES (${email}, ${name || email}, NOW(), NOW())
      ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email
      RETURNING id
    `
  );
  return rows[0].id;
}

// ── Order numbers ─────────────────────────────────────────────────

/**
 * Order-XXXXX (5-digit zero-padded) from the shared Postgres sequence
 * `order_number_seq`. Falls back to a timestamp form so a checkout
 * never fails just because the sequence is unreachable — support can
 * still identify the row from the (much longer) fallback number.
 */
export async function mintOrderNumber(): Promise<string> {
  try {
    const rows = await prismaOrders.$queryRaw<{ n: number }[]>(
      Prisma.sql`SELECT nextval('order_number_seq') AS n`
    );
    return `Order-${String(rows[0].n).padStart(5, "0")}`;
  } catch {
    return `Order-${String(Date.now()).slice(-8)}`;
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
 * Wraps the full sequence — orders INSERT, orders_items INSERT, product
 * rels, customer rels (both directions), and abandoned_carts close — in
 * a single Prisma transaction so a mid-sequence failure rolls the whole
 * thing back. Pre-refactor these were separate $executeRaw calls with
 * no rollback path: a network blip between the orders INSERT and its
 * items INSERTs used to leave a headless order row + no rels, which
 * broke the customer's /orders page AND wasted a value from
 * order_number_seq. Now the transaction either commits everything or
 * nothing.
 *
 * A single `now` timestamp is threaded through every INSERT so all rows
 * created by one checkout share the same created_at / completed_at
 * value — makes audit joins and log correlation exact instead of
 * off-by-milliseconds.
 *
 * `paymentReference` is optional: test-pay omits it (stored as NULL);
 * manual-payment sets it to `manual:<method>:<phone>` for support to
 * search on.
 */
export async function createOrderForCustomer(input: {
  orderNumber:       string;
  totalAmount:       number;
  currency:          string;
  ip:                string;
  userAgent:         string;
  items:             CheckoutItem[];
  paymentReference?: string;
  customerId:        number;
  customerEmail:     string;
}): Promise<number> {
  const now = new Date().toISOString();
  return prismaOrders.$transaction(async (tx) => {
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

    for (let i = 0; i < input.items.length; i++) {
      const item = input.items[i];
      const itemId = crypto.randomBytes(12).toString("hex");
      const totalPrice = item.unitPrice * item.quantity;
      await tx.$executeRaw(Prisma.sql`
        INSERT INTO orders_items (_order, _parent_id, id, quantity, unit_price, total_price)
        VALUES (${i + 1}, ${orderId}, ${itemId}, ${item.quantity}, ${item.unitPrice}, ${totalPrice})
      `);
      await tx.$executeRaw(Prisma.sql`
        INSERT INTO orders_rels (parent_id, path, products_id)
        VALUES (${orderId}, ${`items.${i}.product`}, ${item.productId})
      `);
    }

    await tx.$executeRaw(Prisma.sql`
      INSERT INTO orders_rels (parent_id, path, customers_id)
      VALUES (${orderId}, 'customer', ${input.customerId})
    `);
    await tx.$executeRaw(Prisma.sql`
      INSERT INTO customers_rels (parent_id, path, orders_id)
      VALUES (${input.customerId}, 'orders', ${orderId})
    `);
    await tx.$executeRaw(Prisma.sql`
      UPDATE abandoned_carts
      SET completed_at = ${now}::timestamptz, updated_at = ${now}::timestamptz
      WHERE user_email = ${input.customerEmail} AND completed_at IS NULL
    `);

    return orderId;
  });
}

// ── Request helpers (re-exported for endpoint convenience) ────────

export { extractIP, extractUserAgent } from "@/lib/evidence";
export type { NextRequest };
