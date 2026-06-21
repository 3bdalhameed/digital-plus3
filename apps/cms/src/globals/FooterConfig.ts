import { GlobalConfig } from "payload/types";

export const FooterConfig: GlobalConfig = {
  slug: "footer-config",
  label: "التذييل",
  admin: { group: "الإعدادات" },
  access: { read: () => true },
  fields: [
    {
      name: "columns",
      label: "الأعمدة",
      labels: { singular: "عمود", plural: "الأعمدة" },
      type: "array",
      fields: [
        { name: "titleAr", label: "العنوان (عربي)", type: "text", required: true },
        { name: "titleEn", label: "Title (English)", type: "text" },
        {
          name: "links",
          label: "الروابط",
          labels: { singular: "رابط", plural: "الروابط" },
          type: "array",
          fields: [
            { name: "labelAr", type: "text", required: true },
            { name: "labelEn", type: "text" },
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
    {
      name: "paymentMethods",
      label: "طرق الدفع",
      labels: { singular: "طريقة دفع", plural: "طرق الدفع" },
      type: "array",
      admin: {
        description:
          "تظهر كبطاقات صغيرة بيضاء في تذييل الموقع. إذا تركتها فارغة لن يظهر الصف.",
      },
      fields: [
        {
          name: "name",
          label: "الاسم",
          type: "text",
          required: true,
          admin: { description: "النص الظاهر على البطاقة (مثل VISA، Apple Pay)" },
        },
        {
          name: "color",
          label: "لون النص",
          type: "text",
          defaultValue: "#1A1F71",
          admin: {
            description:
              "لون النص داخل البطاقة (HEX). أمثلة: VISA #1A1F71 ، MasterCard #EB001B ، Apple Pay #000000",
          },
        },
      ],
    },
  ],
};
