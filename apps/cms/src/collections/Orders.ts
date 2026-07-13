import { CollectionConfig } from "payload/types";
import { ordersAccess, hiddenUnless } from "../access";
import { sendOrderStatusChangeEmail } from "../lib/email";
import OrdersList from "../admin/views/OrdersList";
import OrderSummaryCards from "../admin/components/OrderSummaryCards";

export const Orders: CollectionConfig = {
  slug: "orders",
  labels: { singular: "طلب", plural: "الطلبات" },
  admin: {
    useAsTitle: "orderNumber",
    defaultColumns: ["orderNumber", "customer", "status", "totalAmount", "createdAt"],
    listSearchableFields: ["orderNumber"],
    group: "الطلبات",
    hidden: hiddenUnless("super_admin", "admin", "orders", "support"),
    components: {
      views: {
        List: OrdersList as any,
      },
    },
  },
  access: ordersAccess,
  hooks: {
    beforeChange: [
      async ({ data, operation, req }) => {
        // New format: Order-XXXXX (5-digit zero-padded, sequential via a
        // Postgres sequence created in runMigrations). Falls back to a
        // timestamp-based number if the sequence isn't reachable so we
        // never block an order from saving.
        if (operation === "create" && !data.orderNumber) {
          try {
            const pool =
              (req as any)?.payload?.db?.pool ??
              (req as any)?.payload?.db?.drizzle?.session?.client;
            const r = await pool.query("SELECT nextval('order_number_seq') AS n");
            const n = String(r.rows[0].n).padStart(5, "0");
            data.orderNumber = `Order-${n}`;
          } catch (err) {
            console.warn("[orders] order_number_seq unavailable, falling back:", (err as Error)?.message);
            data.orderNumber = `Order-${String(Date.now()).slice(-8)}`;
          }
        }
        return data;
      },
    ],
    afterChange: [
      async ({ doc, previousDoc, req, operation }) => {
        const isPaid = doc.status === "paid";
        const wasPaid = previousDoc?.status === "paid";
        if (!isPaid || wasPaid) return;

        for (const item of doc.items || []) {
          const productId =
            typeof item.product === "string" ? item.product : item.product?.id;
          if (!productId) continue;
          try {
            const product = await req.payload.findByID({
              collection: "products",
              id: productId,
            });
            await req.payload.update({
              collection: "products",
              id: productId,
              data: { totalSales: (product.totalSales || 0) + (item.quantity || 1) },
            });
          } catch (e) {
            console.error("Failed to increment totalSales for product", productId, e);
          }
        }
      },

      // Status-change email notifications
      async ({ doc, previousDoc, req, operation }) => {
        if (operation !== "update") return;
        if (!previousDoc || doc.status === previousDoc.status) return;

        try {
          const customerId = typeof doc.customer === "object" ? doc.customer?.id : doc.customer;
          if (!customerId) return;

          // Fetch customer to get email (relationship depth=0 in hooks)
          const customer = await req.payload.findByID({
            collection: "customers",
            id: customerId,
          }) as any;

          const customerEmail: string = customer?.email ?? "";
          const customerName: string  = customer?.name ?? customer?.email ?? "عزيزي العميل";

          if (!customerEmail) return;

          await sendOrderStatusChangeEmail({
            customerEmail,
            customerName,
            orderNumber: doc.orderNumber ?? String(doc.id),
            oldStatus: previousDoc.status,
            newStatus: doc.status,
            orderId: doc.id,
            payload: req.payload,
          });
        } catch (e) {
          console.error("[order status email] failed:", e);
        }
      },
    ],
  },
  fields: [
    // Shopify-style visual summary rendered above the default edit form.
    // Pure read-only UI; the form fields below remain the source of truth.
    // Only renders when an order document already exists (data.id present) —
    // skips the "create new order" page where there's nothing to summarise.
    {
      name: "summaryCards",
      type: "ui",
      admin: {
        components: { Field: OrderSummaryCards as any },
        condition: (data) => Boolean(data?.id),
      },
    },
    {
      name: "orderNumber",
      label: "رقم الطلب",
      type: "text",
      unique: true,
      admin: { readOnly: true },
    },
    {
      name: "customer",
      label: "العميل",
      type: "relationship",
      relationTo: "customers",
      required: true,
    },
    {
      name: "items",
      label: "المنتجات",
      labels: { singular: "منتج", plural: "المنتجات" },
      type: "array",
      required: true,
      fields: [
        {
          name: "product",
          label: "المنتج",
          type: "relationship",
          relationTo: "products",
          required: true,
        },
        {
          name: "quantity",
          label: "الكمية",
          type: "number",
          required: true,
          min: 1,
          defaultValue: 1,
        },
        {
          name: "unitPrice",
          label: "سعر الوحدة",
          type: "number",
          required: true,
        },
        {
          name: "totalPrice",
          label: "السعر الإجمالي",
          type: "number",
          required: true,
        },
        {
          name: "deliveryInfo",
          label: "معلومات التسليم",
          type: "json",
          admin: {
            description: "البيانات التي أدخلها العميل (واتساب، إيميل، اسم مستخدم...)",
          },
        },
      ],
    },
    {
      name: "status",
      label: "حالة الطلب",
      type: "select",
      required: true,
      defaultValue: "pending",
      options: [
        { label: "قيد الانتظار", value: "pending" },
        { label: "مدفوع", value: "paid" },
        { label: "تم التسليم", value: "delivered" },
        { label: "متنازع عليه", value: "disputed" },
        { label: "مسترد", value: "refunded" },
        { label: "ملغي", value: "cancelled" },
      ],
      admin: { position: "sidebar" },
    },
    {
      // Who flipped status = paid → delivered. Null while status is
      // pending or paid; set by the storefront's manual confirm
      // endpoint ('customer'), the 7-day auto-sweep ('auto'), or an
      // admin editing the row in place ('admin'). Purely informational
      // -- surfaced in the OrdersList view so support can tell at a
      // glance whether the customer confirmed themselves or the sweep
      // did.
      //
      // NOTE: intentionally `text` instead of `select` even though we
      // only expect three values. Payload's Drizzle adapter builds a
      // Postgres enum schema for select fields and our migration adds
      // a plain VARCHAR column; the resulting type mismatch 500's the
      // whole GET /orders endpoint. Text sidesteps this. Values are
      // still validated at the code level in every write path.
      name: "confirmedBy",
      label: "أكّده (customer | auto | admin)",
      type: "text",
      admin: { position: "sidebar", readOnly: true },
    },
    {
      type: "row",
      fields: [
        {
          name: "totalAmount",
          label: "المبلغ الإجمالي",
          type: "number",
          required: true,
        },
        {
          name: "currency",
          label: "العملة",
          type: "select",
          defaultValue: "USD",
          options: [
            { label: "USD", value: "USD" },
            { label: "JOD", value: "JOD" },
            { label: "SAR", value: "SAR" },
            { label: "AED", value: "AED" },
          ],
        },
      ],
    },
    // Discount snapshot — text + numeric (not a relationship) so the
    // order stays intact if the code is later deleted or its rules
    // change. `discountAmount` is already subtracted from `totalAmount`;
    // it's stored for admin visibility and reporting.
    {
      type: "row",
      fields: [
        { name: "discountCode",   label: "كود الخصم",     type: "text",   admin: { readOnly: true } },
        { name: "discountAmount", label: "قيمة الخصم",   type: "number", admin: { readOnly: true } },
      ],
    },
    {
      type: "collapsible",
      label: "بيانات الدفع",
      fields: [
        { name: "paymentReference", label: "مرجع الدفع", type: "text" },
        { name: "airwallexPaymentIntentId", label: "Airwallex Intent ID", type: "text" },
      ],
    },
    {
      type: "collapsible",
      label: "قبول الشروط",
      fields: [
        { name: "termsAcceptedAt", label: "وقت القبول", type: "date" },
        { name: "termsAcceptedIP", label: "عنوان IP", type: "text" },
        { name: "termsAcceptedUserAgent", label: "User Agent", type: "textarea" },
      ],
    },
    {
      type: "collapsible",
      label: "التسليم الرقمي",
      fields: [
        {
          name: "deliveryStatus",
          label: "حالة التسليم",
          type: "select",
          options: [
            { label: "قيد الانتظار", value: "pending" },
            { label: "تم الإرسال", value: "sent" },
            { label: "تم التأكيد", value: "confirmed" },
          ],
        },
        { name: "deliveredAt", label: "تاريخ التسليم", type: "date" },
        { name: "digitalDeliveryLog", label: "سجل التسليم", type: "json" },
      ],
    },
  ],
  timestamps: true,
};
