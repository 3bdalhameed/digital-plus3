import { GlobalConfig } from "payload/types";

export const HomePage: GlobalConfig = {
  slug: "home-page",
  label: "الصفحة الرئيسية",
  admin: {
    group: "الصفحات",
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: "sections",
      label: "الأقسام",
      type: "blocks",
      blocks: [
        {
          slug: "heroBanner",
          labels: { singular: "بانر رئيسي", plural: "بانرات رئيسية" },
          fields: [
            { name: "title", label: "العنوان", type: "text", required: true },
            { name: "subtitle", label: "العنوان الفرعي", type: "text" },
            {
              name: "cta",
              label: "زر الإجراء",
              type: "group",
              fields: [
                { name: "label", label: "النص", type: "text", required: true },
                { name: "link", label: "الرابط", type: "text", required: true },
              ],
            },
            {
              name: "backgroundImage",
              label: "صورة الخلفية",
              type: "upload",
              relationTo: "media",
            },
            {
              name: "enabled",
              label: "مفعل",
              type: "checkbox",
              defaultValue: true,
            },
          ],
        },
        {
          slug: "categoryGrid",
          labels: { singular: "شبكة التصنيفات", plural: "شبكات التصنيفات" },
          fields: [
            { name: "title", label: "العنوان", type: "text", required: true },
            {
              name: "categories",
              label: "التصنيفات",
              type: "relationship",
              relationTo: "categories",
              hasMany: true,
            },
            {
              name: "enabled",
              label: "مفعل",
              type: "checkbox",
              defaultValue: true,
            },
          ],
        },
        {
          slug: "featuredProducts",
          labels: { singular: "منتجات مميزة", plural: "منتجات مميزة" },
          fields: [
            { name: "title", label: "العنوان", type: "text", required: true },
            {
              name: "products",
              label: "المنتجات",
              type: "relationship",
              relationTo: "products",
              hasMany: true,
            },
            {
              name: "enabled",
              label: "مفعل",
              type: "checkbox",
              defaultValue: true,
            },
          ],
        },
        {
          slug: "promoBar",
          labels: { singular: "شريط عرض", plural: "أشرطة عروض" },
          fields: [
            { name: "text", label: "النص", type: "text", required: true },
            { name: "couponCode", label: "كود الخصم", type: "text" },
            {
              name: "enabled",
              label: "مفعل",
              type: "checkbox",
              defaultValue: true,
            },
          ],
        },
        {
          slug: "testimonials",
          labels: { singular: "آراء العملاء", plural: "آراء العملاء" },
          fields: [
            {
              name: "items",
              label: "الآراء",
              type: "array",
              fields: [
                { name: "name", label: "الاسم", type: "text", required: true },
                { name: "text", label: "الرأي", type: "textarea", required: true },
                {
                  name: "rating",
                  label: "التقييم",
                  type: "number",
                  min: 1,
                  max: 5,
                  required: true,
                },
              ],
            },
            {
              name: "enabled",
              label: "مفعل",
              type: "checkbox",
              defaultValue: true,
            },
          ],
        },
        {
          slug: "faqSection",
          labels: { singular: "الأسئلة الشائعة", plural: "الأسئلة الشائعة" },
          fields: [
            {
              name: "items",
              label: "الأسئلة",
              type: "array",
              fields: [
                { name: "question", label: "السؤال", type: "text", required: true },
                { name: "answer", label: "الجواب", type: "textarea", required: true },
              ],
            },
            {
              name: "enabled",
              label: "مفعل",
              type: "checkbox",
              defaultValue: true,
            },
          ],
        },
        {
          slug: "featureBlocks",
          labels: { singular: "مميزات", plural: "مميزات" },
          fields: [
            {
              name: "items",
              label: "العناصر",
              type: "array",
              fields: [
                { name: "title", label: "العنوان", type: "text", required: true },
                { name: "description", label: "الوصف", type: "textarea", required: true },
                { name: "icon", label: "الأيقونة", type: "upload", relationTo: "media" },
              ],
            },
            {
              name: "enabled",
              label: "مفعل",
              type: "checkbox",
              defaultValue: true,
            },
          ],
        },
      ],
    },
  ],
};
