import { CollectionConfig } from "payload/types";
import { ordersAccess, hiddenUnless } from "../access";

export const Orders: CollectionConfig = {
  slug: "orders",
  labels: { singular: "طلب", plural: "الطلبات" },
  admin: {
    useAsTitle: "orderNumber",
    defaultColumns: ["orderNumber", "customer", "status", "totalAmount", "createdAt"],
    group: "الطلبات",
    hidden: hiddenUnless("super_admin", "admin", "orders", "support"),
  },
  access: ordersAccess,
  hooks: {
    beforeChange: [
      ({ data, operation }) => {
        if (operation === "create" && !data.orderNumber) {
          data.orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
        }
        return data;
      },
    ],
    afterChange: [
      async ({ doc, previousDoc, req }) => {
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
    ],
  },
  fields: [
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
      type: "array",
      required: true,
      fields: [
        {
          name: "product",
          type: "relationship",
          relationTo: "products",
          required: true,
        },
        {
          name: "quantity",
          type: "number",
          required: true,
          min: 1,
          defaultValue: 1,
        },
        {
          name: "unitPrice",
          type: "number",
          required: true,
        },
        {
          name: "totalPrice",
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
