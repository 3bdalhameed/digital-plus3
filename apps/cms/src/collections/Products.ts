import { CollectionConfig } from "payload/types";
import { catalogAccess, hiddenUnless } from "../access";
import BilingualNameHeader from "../admin/components/BilingualNameHeader";
import BilingualHtmlHeader from "../admin/components/BilingualHtmlHeader";
import ProductsList from "../admin/views/ProductsList";

export const Products: CollectionConfig = {
  slug: "products",
  labels: { singular: "منتج", plural: "المنتجات" },
  hooks: {
    beforeChange: [
      async ({ data, req }) => {
        if (data.category !== undefined) {
          try {
            const catId = typeof data.category === "object" && data.category !== null
              ? data.category.id : data.category;
            if (catId) {
              const cat = await req.payload.findByID({ collection: "categories", id: catId });
              data.categorySlug = (cat as any)?.slug || null;
            } else {
              data.categorySlug = null;
            }
          } catch {}
        }
        if (data.subcategory !== undefined) {
          try {
            const subId = typeof data.subcategory === "object" && data.subcategory !== null
              ? data.subcategory.id : data.subcategory;
            if (subId) {
              const sub = await req.payload.findByID({ collection: "subcategories", id: subId });
              data.subcategorySlug = (sub as any)?.slug || null;
            } else {
              data.subcategorySlug = null;
            }
          } catch {}
        }
        return data;
      },
    ],
  },
  admin: {
    useAsTitle: "nameAr",
    defaultColumns: ["nameAr", "nameEn", "type", "price", "status", "totalSales", "updatedAt"],
    listSearchableFields: ["nameAr", "nameEn", "slug"],
    group: "الكتالوج",
    hidden: hiddenUnless("super_admin", "admin", "catalog"),
    components: {
      views: {
        List: ProductsList as any,
      },
    },
    preview: (doc) => {
      const cmsUrl = process.env.PAYLOAD_PUBLIC_SERVER_URL || "http://localhost:3001";
      return `${cmsUrl}/api/preview-redirect?slug=${doc.slug}&collection=products`;
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
      label: "الرابط المختصر | Slug",
      type: "text",
      required: true,
      unique: true,
      admin: {
        position: "sidebar",
      },
    },
    {
      type: "ui",
      name: "bilingualHtmlHeader",
      admin: {
        components: { Field: BilingualHtmlHeader as any },
      },
    },
    {
      name: "descriptionHtml",
      label: "🇸🇦 الوصف بالعربية (HTML)",
      type: "code",
      admin: {
        language: "html",
        description: "اكتب HTML/CSS هنا — سيُعرض مباشرة في صفحة المنتج",
      },
    },
    {
      name: "descriptionHtmlEn",
      label: "🇬🇧 Description in English (HTML)",
      type: "code",
      admin: {
        language: "html",
        description: "Write HTML/CSS here — rendered directly on the product page",
      },
    },
    {
      name: "images",
      label: "الصور | Images",
      labels: { singular: "صورة", plural: "الصور" },
      type: "array",
      fields: [
        {
          name: "image",
          type: "upload",
          relationTo: "media",
          required: true,
        },
      ],
    },
    {
      name: "category",
      label: "التصنيف | Category",
      type: "relationship",
      relationTo: "categories",
      required: true,
    },
    {
      name: "subcategory",
      label: "التصنيف الفرعي | Subcategory",
      type: "relationship",
      relationTo: "subcategories",
    },
    {
      name: "type",
      label: "نوع المنتج | Product Type",
      type: "select",
      required: true,
      options: [
        { label: "اشتراك برمجيات | Software Subscription", value: "software_subscription" },
        { label: "مفتاح ترخيص | License Key", value: "license_key" },
        { label: "دعوة | Invitation", value: "invitation" },
        { label: "بطاقة ألعاب | Gaming Card", value: "gaming_card" },
        { label: "اشتراك ذكاء اصطناعي | AI Subscription", value: "ai_subscription" },
      ],
    },
    {
      name: "deliveryMethod",
      label: "طريقة التسليم | Delivery Method",
      type: "select",
      required: true,
      defaultValue: "email",
      options: [
        { label: "بريد إلكتروني | Email", value: "email" },
        { label: "على الموقع | On Site", value: "on_site" },
        { label: "كلاهما | Both", value: "both" },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "price",
          label: "السعر | Price",
          type: "number",
          required: true,
          min: 0,
        },
        {
          name: "comparePrice",
          label: "السعر قبل الخصم | Compare Price",
          type: "number",
          min: 0,
        },
        {
          name: "currency",
          label: "العملة | Currency",
          type: "select",
          defaultValue: "USD",
          options: [
            { label: "USD", value: "USD" },
            { label: "JOD", value: "JOD" },
            { label: "SAR", value: "SAR" },
            { label: "AED", value: "AED" },
          ],
        },
      ],
    },
    {
      name: "badge",
      label: "الشارة | Badge",
      type: "select",
      defaultValue: "none",
      options: [
        { label: "بدون | None",        value: "none" },
        { label: "🟢 جديد | New",      value: "new" },
        { label: "🔴 عرض | Offer",     value: "offer" },
        { label: "🔥 رائج | Hot",      value: "hot" },
        { label: "⚠️ محدود | Limited", value: "limited" },
      ],
      admin: {
        position: "sidebar",
        description: "شارة ملونة على الزاوية العلوية اليسرى من بطاقة المنتج",
      },
    },
    {
      name: "status",
      label: "الحالة | Status",
      type: "select",
      required: true,
      defaultValue: "draft",
      options: [
        { label: "مسودة | Draft", value: "draft" },
        { label: "منشور | Published", value: "published" },
        { label: "مؤرشف | Archived", value: "archived" },
      ],
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "totalSales",
      label: "عدد المبيعات | Total Sales",
      type: "number",
      defaultValue: 0,
      admin: {
        position: "sidebar",
        description: "يزداد تلقائياً عند كل عملية شراء، ويمكن تعديله يدوياً | Auto-increments on each purchase, can be edited manually",
      },
    },
    {
      name: "refundable",
      label: "قابل للاسترداد | Refundable",
      type: "checkbox",
      defaultValue: false,
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "refundPolicy",
      label: "سياسة الاسترداد | Refund Policy",
      type: "textarea",
      admin: {
        condition: (data) => data?.refundable,
      },
    },
    {
      name: "usageProofType",
      label: "نوع إثبات الاستخدام | Usage Proof Type",
      type: "select",
      required: true,
      options: [
        { label: "تفعيل الترخيص | License Redeemed", value: "license_redeemed" },
        { label: "قبول الدعوة | Invitation Accepted", value: "invitation_accepted" },
        { label: "تفعيل الاشتراك | Subscription Activated", value: "subscription_activated" },
        { label: "أول تسجيل دخول | First Login", value: "first_login" },
      ],
    },
    {
      name: "deliveryFields",
      label: "حقول التسليم | Delivery Fields (JSON)",
      type: "json",
      admin: {
        description: 'مصفوفة JSON للحقول | JSON array of fields. Example: [{"labelAr":"رقم واتساب","labelEn":"WhatsApp Number","fieldType":"tel","required":true,"placeholder":"+966..."}] — fieldType: text | email | tel | username | select',
      },
    },
    { name: "categorySlug", type: "text", admin: { hidden: true } },
    { name: "subcategorySlug", type: "text", admin: { hidden: true } },
    {
      name: "relatedProducts",
      label: "منتجات مشابهة | Related Products",
      type: "relationship",
      relationTo: "products",
      hasMany: true,
    },
    {
      type: "collapsible",
      label: "SEO",
      admin: {
        initCollapsed: true,
      },
      fields: [
        { name: "seoTitle", label: "عنوان SEO | SEO Title", type: "text" },
        { name: "seoDescription", label: "وصف SEO | SEO Description", type: "textarea" },
        {
          name: "seoImage",
          label: "صورة SEO | SEO Image",
          type: "upload",
          relationTo: "media",
        },
      ],
    },
  ],
  timestamps: true,
};
