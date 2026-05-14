import { CollectionConfig } from "payload/types";
import { catalogAccess, hiddenUnless } from "../access";
import BilingualNameHeader from "../admin/components/BilingualNameHeader";

export const Subcategories: CollectionConfig = {
  slug: "subcategories",
  admin: {
    useAsTitle: "nameAr",
    defaultColumns: ["nameAr", "category", "position", "isActive"],
    group: "Catalog",
    hidden: hiddenUnless("super_admin", "admin", "catalog"),
  },
  access: catalogAccess,
  fields: [
    {
      type: "ui",
      name: "bilingualNameHeader",
      admin: {
        components: { Field: BilingualNameHeader as any },
      },
    },
    {
      type: "row",
      fields: [
        {
          name: "nameAr",
          label: "🇸🇦 الاسم بالعربية *",
          type: "text",
          required: true,
          admin: {
            description: "الاسم الذي يظهر في المتجر — مطلوب",
          },
        },
        {
          name: "nameEn",
          label: "🇬🇧 Name in English",
          type: "text",
          admin: {
            description: "Shown to English-speaking users — optional",
          },
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
