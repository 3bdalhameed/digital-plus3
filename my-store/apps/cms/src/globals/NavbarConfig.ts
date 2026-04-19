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
      type: "array",
      fields: [
        { name: "labelAr", label: "النص (عربي)", type: "text", required: true },
        { name: "labelEn", label: "Label (English)", type: "text", required: true },
        { name: "href", label: "الرابط", type: "text", required: true },
        {
          name: "children",
          label: "روابط فرعية (Mega Menu)",
          type: "array",
          fields: [
            { name: "labelAr", label: "النص (عربي)", type: "text", required: true },
            { name: "labelEn", label: "Label (English)", type: "text", required: true },
            { name: "href", label: "الرابط", type: "text", required: true },
          ],
        },
      ],
    },
  ],
};
