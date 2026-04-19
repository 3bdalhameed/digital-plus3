import { CollectionConfig } from "payload/types";

export const Customers: CollectionConfig = {
  slug: "customers",
  admin: {
    useAsTitle: "email",
    defaultColumns: ["email", "name", "createdAt"],
    group: "العملاء",
  },
  auth: false,
  access: {
    read: ({ req: { user } }) => Boolean(user),
  },
  fields: [
    {
      name: "email",
      label: "البريد الإلكتروني",
      type: "email",
      required: true,
      unique: true,
    },
    {
      name: "name",
      label: "الاسم",
      type: "text",
      required: true,
    },
    {
      name: "phone",
      label: "رقم الهاتف",
      type: "text",
    },
    {
      name: "twoFactorEnabled",
      label: "المصادقة الثنائية",
      type: "checkbox",
      defaultValue: false,
      admin: { position: "sidebar" },
    },
    {
      name: "twoFactorSecret",
      label: "سر المصادقة الثنائية",
      type: "text",
      admin: { hidden: true },
    },
    {
      name: "orders",
      label: "الطلبات",
      type: "relationship",
      relationTo: "orders",
      hasMany: true,
    },
    {
      name: "ipHistory",
      label: "سجل IP",
      type: "array",
      admin: { initCollapsed: true },
      fields: [
        { name: "ip", type: "text" },
        { name: "timestamp", type: "date" },
      ],
    },
    {
      name: "deviceHistory",
      label: "سجل الأجهزة",
      type: "array",
      admin: { initCollapsed: true },
      fields: [
        { name: "device", type: "text" },
        { name: "browser", type: "text" },
        { name: "timestamp", type: "date" },
      ],
    },
  ],
  timestamps: true,
};
