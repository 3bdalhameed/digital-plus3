import { CollectionConfig } from "payload/types";
import { catalogAccess, hiddenUnless } from "../access";
import PostsList from "../admin/views/PostsList";

export const Posts: CollectionConfig = {
  slug: "posts",
  labels: { singular: "مقالة", plural: "المدونة" },
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "slug", "publishedAt", "status"],
    listSearchableFields: ["title", "slug", "excerpt", "author"],
    group: "المحتوى",
    hidden: hiddenUnless("super_admin", "admin", "catalog"),
    components: {
      views: {
        List: PostsList as any,
      },
    },
    preview: (doc) => {
      const cmsUrl = process.env.PAYLOAD_PUBLIC_SERVER_URL || "http://localhost:3001";
      return `${cmsUrl}/api/preview-redirect?slug=${doc.slug}&collection=posts`;
    },
  },
  access: catalogAccess,
  fields: [
    {
      name: "title",
      label: "العنوان *",
      type: "text",
      required: true,
    },
    {
      name: "slug",
      label: "الرابط (slug)",
      type: "text",
      required: true,
      unique: true,
      admin: { description: "يظهر في الرابط: /blog/<slug>" },
    },
    {
      name: "excerpt",
      label: "المقدمة",
      type: "textarea",
      admin: { description: "تظهر في قوائم المقالات + بطاقات المشاركة الاجتماعية" },
    },
    {
      name: "featuredImageUrl",
      label: "رابط الصورة الرئيسية",
      type: "text",
      admin: {
        description:
          "رابط مباشر لصورة المقالة. عند استيراد المقالات من شوبفاي تبقى الصور على شبكة شوبفاي CDN حتى يتم نقلها إلى R2.",
      },
    },
    {
      name: "bodyHtml",
      label: "المحتوى (HTML)",
      type: "code",
      required: true,
      admin: {
        language: "html",
        description: "محتوى HTML المستورد من شوبفاي — يمكن تحريره مباشرة هنا",
      },
    },
    {
      name: "publishedAt",
      label: "تاريخ النشر",
      type: "date",
      admin: { position: "sidebar", date: { pickerAppearance: "dayOnly" } },
    },
    {
      name: "author",
      label: "الكاتب",
      type: "text",
      admin: { position: "sidebar" },
    },
    {
      name: "tags",
      label: "الوسوم",
      type: "array",
      admin: { position: "sidebar" },
      fields: [{ name: "tag", type: "text", required: true }],
    },
    {
      name: "status",
      label: "الحالة",
      type: "select",
      defaultValue: "published",
      admin: { position: "sidebar" },
      options: [
        { label: "منشور", value: "published" },
        { label: "مسودة", value: "draft" },
      ],
    },
    // The Shopify URL the post was imported from. Useful for traceability
    // and for the post-import audit (broken-link detection).
    {
      name: "sourceUrl",
      label: "المصدر الأصلي (Shopify)",
      type: "text",
      admin: { position: "sidebar", readOnly: true },
    },
  ],
  timestamps: true,
};
