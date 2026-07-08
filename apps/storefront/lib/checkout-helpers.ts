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
 * Resolves the caller's identity from either a NextAuth session
 * or a guest OTP token in the request body. Returns null if neither
 * is present or the guest token is invalid/expired.
 */
export async function resolveIdentity(input: {
  guestToken?: string;
  guestName?:  string;
}): Promise<CheckoutIdentity | null> {
  const session = await auth();
  if (session?.user?.email) {
    return {
      customerEmail: session.user.email,
      customerName:  session.user.name || session.user.email,
    };
  }
  if (input.guestToken) {
    const email = await verifyGuestToken(input.guestToken);
    if (!email) return null;
    return {
      customerEmail: email,
      customerName:  input.guestName?.trim() || email,
    };
  }
  return null;
}

// ── Customers ─────────────────────────────────────────────────────

/** Find-or-create pattern for the `customers` table, keyed by email. */
export async function getOrCreateCustomer(email: string, name: string): Promise<number> {
  const rows = await prismaOrders.$queryRaw<{ id: number }[]>(
    Prisma.sql`SELECT id FROM customers WHERE email = ${email} LIMIT 1`
  );
  if (rows[0]?.id) return rows[0].id;
  const created = await prismaOrders.$queryRaw<{ id: number }[]>(
    Prisma.sql`
      INSERT INTO customers (email, name, updated_at, created_at)
      VALUES (${email}, ${name || email}, NOW(), NOW())
      RETURNING id
    `
  );
  return created[0].id;
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
 * Insert the order row + its line items + rels. Returns the new order id.
 *
 * `paymentReference` is optional so the test-pay endpoint (no gateway
 * reference) and the manual-payment endpoint (`manual:<method>:<phone>`)
 * both call the same helper.
 */
export async function writeOrder(input: {
  orderNumber:      string;
  totalAmount:      number;
  currency:         string;
  ip:               string;
  userAgent:        string;
  items:            CheckoutItem[];
  paymentReference?: string;
}): Promise<number> {
  const now = new Date().toISOString();
  const [order] = await prismaOrders.$queryRaw<{ id: number }[]>(
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
    await prismaOrders.$executeRaw(Prisma.sql`
      INSERT INTO orders_items (_order, _parent_id, id, quantity, unit_price, total_price)
      VALUES (${i + 1}, ${orderId}, ${itemId}, ${item.quantity}, ${item.unitPrice}, ${totalPrice})
    `);
    await prismaOrders.$executeRaw(Prisma.sql`
      INSERT INTO orders_rels (parent_id, path, products_id)
      VALUES (${orderId}, ${`items.${i}.product`}, ${item.productId})
    `);
  }

  return orderId;
}

/**
 * Wire the customer to the newly-created order (both directions —
 * orders_rels for admin filters, customers_rels for the customer's
 * order-history query) and close their abandoned cart if any.
 */
export async function linkOrderToCustomer(input: {
  orderId:      number;
  customerId:   number;
  customerEmail: string;
}): Promise<void> {
  const now = new Date().toISOString();
  await prismaOrders.$executeRaw(Prisma.sql`
    INSERT INTO orders_rels (parent_id, path, customers_id)
    VALUES (${input.orderId}, 'customer', ${input.customerId})
  `);
  await prismaOrders.$executeRaw(Prisma.sql`
    INSERT INTO customers_rels (parent_id, path, orders_id)
    VALUES (${input.customerId}, 'orders', ${input.orderId})
  `);
  await prismaOrders.$executeRaw(Prisma.sql`
    UPDATE abandoned_carts
    SET completed_at = ${now}::timestamptz, updated_at = ${now}::timestamptz
    WHERE user_email = ${input.customerEmail} AND completed_at IS NULL
  `);
}

// ── Request helpers (re-exported for endpoint convenience) ────────

export { extractIP, extractUserAgent } from "@/lib/evidence";
export type { NextRequest };
