import { CollectionConfig } from "payload/types";

// Server-side normalization: uppercase + trim whitespace so editors can't
// accidentally save "  save10 " and have customers hit "SAVE10" fail to
// match. Applied via a beforeChange hook rather than admin-only client
// code so API writes normalize too.
const upperTrim = (v: unknown): unknown =>
  typeof v === "string" ? v.trim().toUpperCase() : v;

export const DiscountCodes: CollectionConfig = {
  slug: "discount-codes",
  labels: {
    singular: "كود خصم",
    plural: "أكواد الخصم",
  },
  admin: {
    useAsTitle: "code",
    defaultColumns: ["code", "discountType", "discountValue", "active", "currentUses", "expiresAt"],
    group: "المتجر",
  },
  // Public read so the storefront's /api/discount/validate can look up a
  // code by exact match without needing an admin session. Only the rules
  // travel back to the client -- no PII or secrets in this collection.
  // Writes still require an authenticated admin.
  access: {
    read: () => true,
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  fields: [
    {
      name: "code",
      label: "الكود",
      type: "text",
      required: true,
      unique: true,
      hooks: { beforeChange: [({ value }) => upperTrim(value)] },
      admin: { description: "يُحفظ بالأحرف الكبيرة تلقائياً. مثال: SAVE10" },
    },
    {
      name: "description",
      label: "وصف داخلي (لا يظهر للزبون)",
      type: "text",
    },
    {
      type: "row",
      fields: [
        {
          name: "discountType",
          label: "نوع الخصم",
          type: "select",
          required: true,
          defaultValue: "percentage",
          options: [
            { label: "نسبة مئوية %", value: "percentage" },
            { label: "مبلغ ثابت", value: "fixed_amount" },
          ],
        },
        {
          name: "discountValue",
          label: "القيمة",
          type: "number",
          required: true,
          min: 0,
          admin: { description: "للنسبة أدخل 10 = 10%، للمبلغ الثابت أدخل القيمة بعملة السلة" },
        },
      ],
    },
    {
      name: "active",
      label: "مفعّل",
      type: "checkbox",
      defaultValue: true,
      admin: { position: "sidebar" },
    },
    {
      type: "row",
      fields: [
        { name: "startsAt",  label: "يبدأ في",  type: "date" },
        { name: "expiresAt", label: "ينتهي في", type: "date" },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "minOrderAmount",
          label: "أقل مبلغ للسلة",
          type: "number",
          min: 0,
          admin: { description: "اختياري. لن يُقبل الكود إذا كان مجموع السلة أقل من هذه القيمة." },
        },
        {
          name: "maxUses",
          label: "أقصى استخدامات إجمالية",
          type: "number",
          min: 0,
          admin: { description: "اختياري. عدد المرات الكلي عبر جميع الزبائن. اتركه فارغاً لعدم التحديد." },
        },
        {
          name: "maxUsesPerCustomer",
          label: "أقصى استخدامات لكل زبون",
          type: "number",
          min: 0,
          admin: { description: "اختياري. مثلاً 1 = مرة واحدة لكل بريد إلكتروني." },
        },
      ],
    },
    {
      name: "currentUses",
      label: "الاستخدامات الحالية",
      type: "number",
      defaultValue: 0,
      admin: { position: "sidebar", readOnly: true },
    },
    {
      name: "appliesTo",
      label: "يطبق على",
      type: "select",
      defaultValue: "all",
      required: true,
      options: [
        { label: "كل المنتجات",         value: "all"        },
        { label: "تصنيفات محددة",       value: "categories" },
        { label: "منتجات محددة",        value: "products"   },
      ],
    },
    {
      name: "allowedCategories",
      label: "التصنيفات المسموحة",
      type: "relationship",
      relationTo: "categories",
      hasMany: true,
      admin: {
        condition: (data) => data?.appliesTo === "categories",
        description: "الخصم يُحسب فقط على المنتجات في هذه التصنيفات.",
      },
    },
    {
      name: "allowedProducts",
      label: "المنتجات المسموحة",
      type: "relationship",
      relationTo: "products",
      hasMany: true,
      admin: {
        condition: (data) => data?.appliesTo === "products",
        description: "الخصم يُحسب فقط على هذه المنتجات المحددة.",
      },
    },
  ],
};
