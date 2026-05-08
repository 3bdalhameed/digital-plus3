import { CollectionConfig } from "payload/types";
import { catalogAccess, hiddenUnless } from "../access";

export const Categories: CollectionConfig = {
  slug: "categories",
  admin: {
    useAsTitle: "nameAr",
    defaultColumns: ["nameAr", "nameEn", "position", "isActive"],
    group: "Catalog",
    hidden: hiddenUnless("super_admin", "admin", "catalog"),
  },
  access: catalogAccess,
  fields: [
    {
      type: "row",
      fields: [
        {
          name: "nameAr",
          label: "الاسم (عربي)",
          type: "text",
          required: true,
        },
        {
          name: "nameEn",
          label: "Name (English)",
          type: "text",
        },
      ],
    },
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
    },
    {
      name: "description",
      label: "الوصف",
      type: "textarea",
    },
    {
      name: "image",
      label: "الصورة",
      type: "upload",
      relationTo: "media",
    },
    {
      name: "icon",
      label: "الأيقونة",
      type: "upload",
      relationTo: "media",
    },
    {
      name: "brandLogos",
      label: "شعارات العلامات التجارية",
      type: "array",
      fields: [
        {
          name: "logo",
          type: "upload",
          relationTo: "media",
          required: true,
        },
      ],
    },
    {
      name: "position",
      label: "الترتيب",
      type: "number",
      defaultValue: 0,
      admin: { position: "sidebar" },
    },
    {
      name: "isActive",
      label: "نشط",
      type: "checkbox",
      defaultValue: true,
      admin: { position: "sidebar" },
    },
  ],
  timestamps: true,
};
