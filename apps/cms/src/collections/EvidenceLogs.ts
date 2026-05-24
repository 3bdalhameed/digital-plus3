import { CollectionConfig } from "payload/types";
import { ordersAccess, hiddenUnless } from "../access";

export const EvidenceLogs: CollectionConfig = {
  slug: "evidence-logs",
  labels: { singular: "سجل دليل", plural: "سجلات الأدلة" },
  admin: {
    useAsTitle: "type",
    defaultColumns: ["type", "order", "customer", "timestamp"],
    group: "الطلبات",
    hidden: hiddenUnless("super_admin", "admin", "orders"),
  },
  access: {
    ...ordersAccess,
    create: () => true, // storefront API can create evidence logs without auth
  },
  fields: [
    {
      name: "order",
      label: "الطلب",
      type: "relationship",
      relationTo: "orders",
    },
    {
      name: "customer",
      label: "العميل",
      type: "relationship",
      relationTo: "customers",
      required: true,
    },
    {
      name: "type",
      label: "النوع",
      type: "select",
      required: true,
      options: [
        { label: "قبول الشروط", value: "terms_acceptance" },
        { label: "دفع", value: "payment" },
        { label: "تسليم", value: "delivery" },
        { label: "وصول", value: "access" },
        { label: "تأكيد الاستخدام", value: "usage_confirmation" },
        { label: "ملاحظة دعم", value: "support_note" },
        { label: "لقطة شاشة", value: "screenshot" },
      ],
    },
    {
      name: "timestamp",
      label: "الوقت",
      type: "date",
      required: true,
      admin: {
        date: {
          pickerAppearance: "dayAndTime",
        },
      },
    },
    {
      type: "row",
      fields: [
        { name: "ipAddress", label: "عنوان IP", type: "text", required: true },
        { name: "userAgent", label: "User Agent", type: "textarea" },
      ],
    },
    {
      type: "row",
      fields: [
        { name: "device", label: "الجهاز", type: "text" },
        { name: "browser", label: "المتصفح", type: "text" },
      ],
    },
    {
      name: "sessionId",
      label: "معرف الجلسة",
      type: "text",
    },
    {
      name: "data",
      label: "بيانات إضافية",
      type: "json",
    },
    {
      name: "attachments",
      label: "المرفقات",
      type: "array",
      fields: [
        {
          name: "file",
          type: "upload",
          relationTo: "media",
          required: true,
        },
      ],
    },
    {
      name: "internalNote",
      label: "ملاحظة داخلية",
      type: "textarea",
      admin: {
        description: "ملاحظة للمشرفين فقط - لا تظهر للعميل",
      },
    },
  ],
  timestamps: true,
};
