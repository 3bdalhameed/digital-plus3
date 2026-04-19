import { CollectionConfig } from "payload/types";

export const Users: CollectionConfig = {
  slug: "users",
  auth: true,
  admin: {
    useAsTitle: "email",
    group: "Settings",
  },
  fields: [
    {
      name: "name",
      label: "الاسم",
      type: "text",
      required: true,
    },
    {
      name: "role",
      label: "الدور",
      type: "select",
      required: true,
      defaultValue: "viewer",
      options: [
        { label: "مدير عام", value: "super_admin" },
        { label: "مدير", value: "admin" },
        { label: "دعم", value: "support" },
        { label: "مشاهد", value: "viewer" },
      ],
      admin: { position: "sidebar" },
    },
  ],
  timestamps: true,
};
