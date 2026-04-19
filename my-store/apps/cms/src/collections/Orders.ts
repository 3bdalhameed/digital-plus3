import { CollectionConfig } from "payload/types";

export const Orders: CollectionConfig = {
  slug: "orders",
  admin: {
    useAsTitle: "orderNumber",
    defaultColumns: ["orderNumber", "customer", "status", "totalAmount", "createdAt"],
    group: "الطلبات",
  },
  access: {
    read: ({ req: { user } }) => {
      if (user) return true;
      return false;
    },
  },
  hooks: {
    beforeChange: [
      ({ data, operation }) => {
        if (operation === "create" && !data.orderNumber) {
          data.orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
        }
        return data;
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
