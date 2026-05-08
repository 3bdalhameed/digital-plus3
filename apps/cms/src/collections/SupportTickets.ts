import { CollectionConfig } from "payload/types";
import { supportAccess, hiddenUnless } from "../access";

export const SupportTickets: CollectionConfig = {
  slug: "support-tickets",
  admin: {
    useAsTitle: "id",
    defaultColumns: ["order", "customer", "status", "channel", "createdAt"],
    group: "Support",
    hidden: hiddenUnless("super_admin", "admin", "orders", "support"),
  },
  access: supportAccess,
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
      name: "status",
      label: "الحالة",
      type: "select",
      required: true,
      defaultValue: "open",
      options: [
        { label: "مفتوح", value: "open" },
        { label: "قيد المعالجة", value: "in_progress" },
        { label: "محلول", value: "resolved" },
        { label: "مغلق", value: "closed" },
      ],
      admin: { position: "sidebar" },
    },
    {
      name: "channel",
      label: "القناة",
      type: "select",
      required: true,
      defaultValue: "platform",
      options: [
        { label: "المنصة", value: "platform" },
        { label: "واتساب", value: "whatsapp" },
        { label: "بريد إلكتروني", value: "email" },
      ],
    },
    {
      name: "messages",
      label: "الرسائل",
      type: "array",
      fields: [
        {
          name: "sender",
          type: "select",
          required: true,
          options: [
            { label: "العميل", value: "customer" },
            { label: "المشرف", value: "admin" },
          ],
        },
        { name: "text", label: "النص", type: "textarea", required: true },
        {
          name: "attachments",
          type: "array",
          fields: [
            { name: "file", type: "upload", relationTo: "media" },
          ],
        },
        {
          name: "timestamp",
          type: "date",
          required: true,
          admin: { date: { pickerAppearance: "dayAndTime" } },
        },
      ],
    },
    {
      name: "internalNotes",
      label: "ملاحظات داخلية",
      type: "array",
      admin: { description: "ملاحظات للمشرفين فقط" },
      fields: [
        { name: "note", type: "textarea", required: true },
        { name: "timestamp", type: "date" },
      ],
    },
    {
      name: "disputeEvidence",
      label: "أدلة النزاع",
      type: "relationship",
      relationTo: "evidence-logs",
      hasMany: true,
    },
  ],
  timestamps: true,
};
