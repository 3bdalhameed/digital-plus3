import { GlobalConfig } from "payload/types";

export const FooterConfig: GlobalConfig = {
  slug: "footer-config",
  label: "Footer",
  admin: { group: "Settings" },
  access: { read: () => true },
  fields: [
    {
      name: "columns",
      label: "الأعمدة",
      type: "array",
      fields: [
        { name: "titleAr", label: "العنوان (عربي)", type: "text", required: true },
        { name: "titleEn", label: "Title (English)", type: "text", required: true },
        {
          name: "links",
          label: "الروابط",
          type: "array",
          fields: [
            { name: "labelAr", type: "text", required: true },
            { name: "labelEn", type: "text", required: true },
            { name: "href", type: "text", required: true },
          ],
        },
      ],
    },
    {
      name: "bottomText",
      label: "نص أسفل التذييل",
      type: "text",
    },
  ],
};
