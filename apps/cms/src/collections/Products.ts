import { CollectionConfig } from "payload/types";
import { catalogAccess, hiddenUnless } from "../access";

export const Products: CollectionConfig = {
  slug: "products",
  admin: {
    useAsTitle: "nameAr",
    defaultColumns: ["nameAr", "descriptionHtml", "type", "price", "status", "updatedAt"],
    group: "Catalog",
    hidden: hiddenUnless("super_admin", "admin", "catalog"),
    preview: (doc) => {
      const cmsUrl = process.env.PAYLOAD_PUBLIC_SERVER_URL || "http://localhost:3001";
      return `${cmsUrl}/api/preview-redirect?slug=${doc.slug}&collection=products`;
    },
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
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "description",
      label: "الوصف",
      type: "richText",
    },
    {
      name: "descriptionHtml",
      label: "وصف HTML مخصص (كود)",
      type: "code",
      admin: {
        language: "html",
        description: "اكتب HTML/CSS مخصص هنا — سيُعرض مباشرة في صفحة المنتج تحت الوصف",
      },
    },
    {
      name: "images",
      label: "الصور",
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
      label: "التصنيف",
      type: "relationship",
      relationTo: "categories",
      required: true,
    },
    {
      name: "subcategory",
      label: "التصنيف الفرعي",
      type: "relationship",
      relationTo: "subcategories",
    },
    {
      name: "type",
      label: "نوع المنتج",
      type: "select",
      required: true,
      options: [
        { label: "اشتراك برمجيات", value: "software_subscription" },
        { label: "مفتاح ترخيص", value: "license_key" },
        { label: "دعوة", value: "invitation" },
        { label: "بطاقة ألعاب", value: "gaming_card" },
        { label: "اشتراك أدوات ذكاء اصطناعي", value: "ai_subscription" },
      ],
    },
    {
      name: "deliveryMethod",
      label: "طريقة التسليم",
      type: "select",
      required: true,
      defaultValue: "email",
      options: [
        { label: "بريد إلكتروني", value: "email" },
        { label: "على الموقع", value: "on_site" },
        { label: "كلاهما", value: "both" },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "price",
          label: "السعر",
          type: "number",
          required: true,
          min: 0,
        },
        {
          name: "comparePrice",
          label: "السعر قبل الخصم",
          type: "number",
          min: 0,
        },
        {
          name: "currency",
          label: "العملة",
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
      name: "status",
      label: "الحالة",
      type: "select",
      required: true,
      defaultValue: "draft",
      options: [
        { label: "مسودة", value: "draft" },
        { label: "منشور", value: "published" },
        { label: "مؤرشف", value: "archived" },
      ],
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "refundable",
      label: "قابل للاسترداد",
      type: "checkbox",
      defaultValue: false,
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "refundPolicy",
      label: "سياسة الاسترداد",
      type: "textarea",
      admin: {
        condition: (data) => data?.refundable,
      },
    },
    {
      name: "usageProofType",
      label: "نوع إثبات الاستخدام",
      type: "select",
      required: true,
      options: [
        { label: "تفعيل الترخيص", value: "license_redeemed" },
        { label: "قبول الدعوة", value: "invitation_accepted" },
        { label: "تفعيل الاشتراك", value: "subscription_activated" },
        { label: "أول تسجيل دخول", value: "first_login" },
      ],
    },
    {
      name: "deliveryFields",
      label: "حقول التسليم (JSON)",
      type: "json",
      admin: {
        description: 'مصفوفة JSON للحقول التي يملؤها العميل. مثال: [{"labelAr":"رقم واتساب","fieldType":"tel","required":true,"placeholder":"+966..."},{"labelAr":"اسم المستخدم","fieldType":"text","required":true}] — fieldType: text | email | tel | username | select',
      },
    },
    {
      name: "relatedProducts",
      label: "منتجات مشابهة",
      type: "relationship",
      relationTo: "products",
      hasMany: true,
    },
    {
      name: "totalSales",
      label: "عدد المبيعات",
      type: "number",
      defaultValue: 0,
      admin: {
        readOnly: true,
        position: "sidebar",
        description: "يزداد تلقائياً عند كل عملية شراء",
      },
    },
    {
      type: "collapsible",
      label: "SEO",
      admin: {
        initCollapsed: true,
      },
      fields: [
        { name: "seoTitle", label: "عنوان SEO", type: "text" },
        { name: "seoDescription", label: "وصف SEO", type: "textarea" },
        {
          name: "seoImage",
          label: "صورة SEO",
          type: "upload",
          relationTo: "media",
        },
      ],
    },
  ],
  timestamps: true,
};
