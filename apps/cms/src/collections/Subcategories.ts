import { CollectionConfig } from "payload/types";
import { catalogAccess, hiddenUnless } from "../access";
import BilingualNameHeader from "../admin/components/BilingualNameHeader";
import SubcategoriesList from "../admin/views/SubcategoriesList";

export const Subcategories: CollectionConfig = {
  slug: "subcategories",
  labels: { singular: "تصنيف فرعي", plural: "التصنيفات الفرعية" },
  admin: {
    useAsTitle: "nameAr",
    defaultColumns: ["nameAr", "category", "position", "isActive"],
    listSearchableFields: ["nameAr", "nameEn", "slug"],
    group: "الكتالوج",
    hidden: hiddenUnless("super_admin", "admin", "catalog"),
    components: {
      views: {
        List: SubcategoriesList as any,
      },
    },
    preview: (doc) => {
      const cmsUrl = process.env.PAYLOAD_PUBLIC_SERVER_URL || "http://localhost:3001";
      return `${cmsUrl}/api/preview-redirect?slug=${doc.slug}&collection=collections`;
    },
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
