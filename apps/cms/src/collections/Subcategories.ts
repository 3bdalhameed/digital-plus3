import { CollectionConfig } from "payload/types";

export const Subcategories: CollectionConfig = {
  slug: "subcategories",
  admin: {
    useAsTitle: "nameAr",
    defaultColumns: ["nameAr", "category", "position", "isActive"],
    group: "Catalog",
  },
  access: {
    read: () => true,
  },
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
          required: true,
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
      name: "category",
      label: "التصنيف الأب",
      type: "relationship",
      relationTo: "categories",
      required: true,
    },
    {
      name: "icon",
      label: "الأيقونة",
      type: "upload",
      relationTo: "media",
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
