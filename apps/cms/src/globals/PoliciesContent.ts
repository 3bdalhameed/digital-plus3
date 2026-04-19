import { GlobalConfig } from "payload/types";

export const PoliciesContent: GlobalConfig = {
  slug: "policies-content",
  label: "Policies",
  admin: { group: "Pages" },
  access: { read: () => true },
  fields: [
    {
      name: "termsAndConditions",
      label: "الشروط والأحكام",
      type: "richText",
      required: true,
    },
    {
      name: "refundPolicy",
      label: "سياسة الاسترداد",
      type: "richText",
      required: true,
    },
    {
      name: "privacyPolicy",
      label: "سياسة الخصوصية",
      type: "richText",
      required: true,
    },
  ],
};
