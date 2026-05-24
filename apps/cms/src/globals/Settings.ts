import { GlobalConfig } from "payload/types";

export const Settings: GlobalConfig = {
  slug: "settings",
  label: "إعدادات الموقع",
  admin: {
    group: "الإعدادات",
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: "siteName",
      label: "اسم الموقع",
      type: "text",
      required: true,
      defaultValue: "ديجيتال بلس",
    },
    {
      name: "logo",
      label: "الشعار",
      type: "upload",
      relationTo: "media",
    },
    {
      name: "favicon",
      label: "أيقونة المتصفح",
      type: "upload",
      relationTo: "media",
    },
    {
      name: "contactEmail",
      label: "البريد الإلكتروني",
      type: "email",
      required: true,
    },
    {
      name: "whatsappNumber",
      label: "رقم الواتساب",
      type: "text",
    },
    {
      name: "supportHours",
      label: "ساعات الدعم",
      type: "text",
    },
    {
      name: "orderNotificationEmails",
      label: "إشعارات الطلبات — مستلمون إضافيون",
      type: "array",
      admin: {
        description: "بريد إلكتروني يُضاف إلى إشعارات تغيير حالة الطلب (بجانب المدراء تلقائياً)",
      },
      fields: [
        {
          name: "email",
          label: "البريد الإلكتروني",
          type: "email",
          required: true,
        },
        {
          name: "label",
          label: "الاسم / الوصف",
          type: "text",
        },
      ],
    },
    {
      name: "socialLinks",
      label: "روابط التواصل",
      type: "array",
      fields: [
        {
          name: "platform",
          label: "المنصة",
          type: "select",
          options: [
            { label: "Instagram", value: "instagram" },
            { label: "Twitter / X", value: "twitter" },
            { label: "Facebook", value: "facebook" },
            { label: "TikTok", value: "tiktok" },
            { label: "YouTube", value: "youtube" },
            { label: "Telegram", value: "telegram" },
          ],
        },
        { name: "url", label: "الرابط", type: "text", required: true },
      ],
    },
  ],
};
