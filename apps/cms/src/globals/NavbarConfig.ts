import { GlobalConfig } from "payload/types";

export const NavbarConfig: GlobalConfig = {
  slug: "navbar-config",
  label: "شريط التنقل",
  admin: { group: "الإعدادات" },
  access: { read: () => true },
  fields: [
    {
      name: "links",
      label: "الروابط",
      labels: { singular: "رابط", plural: "الروابط" },
      type: "array",
      fields: [
        { name: "labelAr", label: "النص (عربي)", type: "text", required: true },
        { name: "labelEn", label: "Label (English)", type: "text" },
        { name: "href", label: "الرابط", type: "text", required: true },
        {
          name: "children",
          label: "روابط فرعية (Mega Menu)",
          labels: { singular: "رابط فرعي", plural: "روابط فرعية" },
          type: "array",
          fields: [
            { name: "labelAr", label: "النص (عربي)", type: "text", required: true },
            { name: "labelEn", label: "Label (English)", type: "text" },
            { name: "href", label: "الرابط", type: "text", required: true },
          ],
        },
      ],
    },
  ],
};
