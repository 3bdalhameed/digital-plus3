import { GlobalConfig } from "payload/types";
import { Field } from "payload/types";

// Shared layout controls added to every block
const layoutFields: Field[] = [
  {
    type: "collapsible",
    label: "الأبعاد والمسافات",
    admin: { initCollapsed: true },
    fields: [
      {
        name: "width",
        label: "العرض",
        type: "select",
        defaultValue: "xl",
        options: [
          { label: "ضيق  — 672px",    value: "sm"   },
          { label: "متوسط — 896px",   value: "md"   },
          { label: "واسع  — 1152px",  value: "lg"   },
          { label: "كامل  — 1280px",  value: "xl"   },
          { label: "بلا حد (edge-to-edge)", value: "full" },
        ],
      },
      {
        name: "paddingY",
        label: "المسافة العمودية (الارتفاع)",
        type: "select",
        defaultValue: "md",
        options: [
          { label: "بلا مسافة",        value: "none" },
          { label: "صغيرة — 16px",     value: "sm"   },
          { label: "متوسطة — 32px",    value: "md"   },
          { label: "كبيرة — 56px",     value: "lg"   },
          { label: "كبيرة جداً — 96px", value: "xl"  },
        ],
      },
    ],
  },
  { name: "enabled", label: "مفعل", type: "checkbox", defaultValue: true },
];

export const HomePage: GlobalConfig = {
  slug: "home-page",
  label: "Home Page",
  admin: {
    group: "Pages",
    preview: () => {
      const base = process.env.STOREFRONT_URL || "http://localhost:3000";
      const secret = process.env.PREVIEW_SECRET || "";
      return `${base}/api/preview?secret=${secret}&collection=home-page`;
    },
  },
  access: { read: () => true },
  fields: [
    {
      name: "sections",
      label: "الأقسام",
      type: "blocks",
      blocks: [

        // ── 1. Hero Banner ─────────────────────────────────────
        {
          slug: "heroBanner",
          labels: { singular: "بانر رئيسي", plural: "بانرات رئيسية" },
          fields: [
            { name: "title",    label: "العنوان",        type: "text", required: true },
            { name: "subtitle", label: "العنوان الفرعي", type: "text" },
            {
              name: "cta", label: "زر الإجراء", type: "group",
              fields: [
                { name: "label", label: "النص",   type: "text", required: true },
                { name: "link",  label: "الرابط", type: "text", required: true },
              ],
            },
            { name: "backgroundImage", label: "صورة الخلفية", type: "upload", relationTo: "media" },
            ...layoutFields,
          ],
        },

        // ── 2. Multi-image Banner / Slideshow ──────────────────
        {
          slug: "multiImageBanner",
          labels: { singular: "بانر متعدد الصور", plural: "بانرات متعددة الصور" },
          fields: [
            {
              name: "slides", label: "الشرائح", type: "array",
              fields: [
                { name: "image",    label: "الصورة",    type: "upload", relationTo: "media", required: true },
                { name: "title",    label: "العنوان",   type: "text" },
                { name: "subtitle", label: "الوصف",     type: "text" },
                { name: "ctaLabel", label: "نص الزر",  type: "text" },
                { name: "ctaLink",  label: "رابط الزر", type: "text" },
              ],
            },
            {
              name: "aspectRatio",
              label: "نسبة الصورة",
              type: "select",
              defaultValue: "16/6",
              options: [
                { label: "بانر ضيق  (16:4)",  value: "16/4" },
                { label: "بانر متوسط (16:6)", value: "16/6" },
                { label: "بانر كبير  (16:8)", value: "16/8" },
                { label: "مربع (1:1)",         value: "1/1"  },
              ],
            },
            { name: "autoplay", label: "تشغيل تلقائي", type: "checkbox", defaultValue: true },
            ...layoutFields,
          ],
        },

        // ── 3. Featured Products ───────────────────────────────
        {
          slug: "featuredProducts",
          labels: { singular: "منتجات مميزة", plural: "منتجات مميزة" },
          fields: [
            { name: "title",    label: "العنوان", type: "text", required: true },
            { name: "subtitle", label: "وصف",     type: "text" },
            {
              name: "columns", label: "عدد الأعمدة", type: "select", defaultValue: "4",
              options: [
                { label: "2 أعمدة", value: "2" },
                { label: "3 أعمدة", value: "3" },
                { label: "4 أعمدة", value: "4" },
                { label: "5 أعمدة", value: "5" },
              ],
            },
            {
              name: "products", label: "المنتجات", type: "relationship",
              relationTo: "products", hasMany: true,
            },
            ...layoutFields,
          ],
        },

        // ── 4. Category Grid ───────────────────────────────────
        {
          slug: "categoryGrid",
          labels: { singular: "شبكة التصنيفات", plural: "شبكات التصنيفات" },
          fields: [
            { name: "title", label: "العنوان", type: "text", required: true },
            {
              name: "columns", label: "عدد الأعمدة", type: "select", defaultValue: "4",
              options: [
                { label: "2 أعمدة", value: "2" },
                { label: "3 أعمدة", value: "3" },
                { label: "4 أعمدة", value: "4" },
                { label: "6 أعمدة", value: "6" },
              ],
            },
            {
              name: "categories", label: "التصنيفات", type: "relationship",
              relationTo: "categories", hasMany: true,
            },
            ...layoutFields,
          ],
        },

        // ── 5. Category Banners ────────────────────────────────
        {
          slug: "categoryBanners",
          labels: { singular: "بنرات الفئات", plural: "بنرات الفئات" },
          fields: [
            { name: "title", label: "العنوان", type: "text" },
            {
              name: "cardWidth", label: "عرض البطاقة", type: "select", defaultValue: "md",
              options: [
                { label: "ضيق  — 160px",  value: "sm" },
                { label: "متوسط — 220px", value: "md" },
                { label: "واسع  — 300px", value: "lg" },
              ],
            },
            {
              name: "speed",
              label: "سرعة التمرير (ثانية) — أقل = أسرع",
              type: "number",
              defaultValue: 25,
              min: 3,
              admin: { description: "مثال: 8 سريع جداً — 25 متوسط — 60 بطيء جداً" },
            },
            { name: "pauseOnHover", label: "توقف عند التمرير فوقه", type: "checkbox", defaultValue: true },
            {
              name: "banners", label: "البنرات", type: "array",
              fields: [
                { name: "image", label: "الصورة", type: "upload", relationTo: "media", required: true },
                {
                  name: "category",
                  label: "الفئة (الرابط)",
                  type: "relationship",
                  relationTo: "categories",
                  required: true,
                },
              ],
            },
            ...layoutFields,
          ],
        },

        // ── 6. Category Scrollable Row ─────────────────────────
        {
          slug: "categoryRow",
          labels: { singular: "سطر فئات سحب", plural: "أسطر فئات" },
          fields: [
            { name: "title", label: "العنوان", type: "text" },
            {
              name: "iconSize", label: "حجم الأيقونة", type: "select", defaultValue: "md",
              options: [
                { label: "صغير  — 48px",   value: "sm" },
                { label: "متوسط — 64px",   value: "md" },
                { label: "كبير  — 88px",   value: "lg" },
              ],
            },
            {
              name: "speed",
              label: "سرعة التمرير (ثانية) — أقل = أسرع",
              type: "number",
              defaultValue: 25,
              min: 3,
              admin: { description: "مثال: 8 سريع جداً — 25 متوسط — 60 بطيء جداً" },
            },
            { name: "pauseOnHover", label: "توقف عند التمرير فوقه", type: "checkbox", defaultValue: true },
            {
              name: "items", label: "العناصر", type: "array",
              fields: [
                { name: "image", label: "الصورة", type: "upload", relationTo: "media", required: true },
                {
                  name: "subcategory",
                  label: "الفئة الفرعية (الرابط)",
                  type: "relationship",
                  relationTo: "subcategories",
                  required: true,
                },
              ],
            },
            ...layoutFields,
          ],
        },

        // ── 7. Image with Text ─────────────────────────────────
        {
          slug: "imageWithText",
          labels: { singular: "صورة مع نص", plural: "صور مع نص" },
          fields: [
            { name: "image",    label: "الصورة",    type: "upload", relationTo: "media", required: true },
            { name: "title",    label: "العنوان",   type: "text",   required: true },
            { name: "text",     label: "النص",      type: "textarea" },
            { name: "ctaLabel", label: "نص الزر",   type: "text" },
            { name: "ctaLink",  label: "رابط الزر", type: "text" },
            {
              name: "imagePosition", label: "موضع الصورة", type: "select", defaultValue: "right",
              options: [
                { label: "يمين", value: "right" },
                { label: "يسار", value: "left" },
              ],
            },
            {
              name: "imageSplit", label: "نسبة الصورة/النص", type: "select", defaultValue: "50/50",
              options: [
                { label: "50% / 50%", value: "50/50" },
                { label: "40% / 60%", value: "40/60" },
                { label: "60% / 40%", value: "60/40" },
              ],
            },
            ...layoutFields,
          ],
        },

        // ── 8. Store Features / Icons with Text ────────────────
        {
          slug: "featureBlocks",
          labels: { singular: "مميزات المتجر", plural: "مميزات" },
          fields: [
            { name: "title", label: "العنوان", type: "text" },
            {
              name: "columns", label: "عدد الأعمدة", type: "select", defaultValue: "4",
              options: [
                { label: "2 أعمدة", value: "2" },
                { label: "3 أعمدة", value: "3" },
                { label: "4 أعمدة", value: "4" },
              ],
            },
            {
              name: "items", label: "العناصر", type: "array",
              fields: [
                { name: "title",       label: "العنوان",       type: "text",     required: true },
                { name: "description", label: "الوصف",         type: "textarea", required: true },
                { name: "emoji",       label: "إيموجي",        type: "text" },
                { name: "icon",        label: "صورة الأيقونة", type: "upload",   relationTo: "media" },
              ],
            },
            ...layoutFields,
          ],
        },

        // ── 9. Stats Section ───────────────────────────────────
        {
          slug: "statsSection",
          labels: { singular: "قسم الإحصائيات", plural: "إحصائيات" },
          fields: [
            { name: "title", label: "العنوان", type: "text" },
            {
              name: "stats", label: "الإحصائيات", type: "array",
              fields: [
                { name: "value", label: "القيمة (مثال: +10,000)", type: "text", required: true },
                { name: "label", label: "التسمية",                type: "text", required: true },
                { name: "emoji", label: "إيموجي",                 type: "text" },
              ],
            },
            ...layoutFields,
          ],
        },

        // ── 10. Testimonials ───────────────────────────────────
        {
          slug: "testimonials",
          labels: { singular: "آراء العملاء", plural: "آراء العملاء" },
          fields: [
            { name: "title", label: "العنوان", type: "text" },
            {
              name: "columns", label: "عدد الأعمدة", type: "select", defaultValue: "3",
              options: [
                { label: "2 أعمدة", value: "2" },
                { label: "3 أعمدة", value: "3" },
                { label: "4 أعمدة", value: "4" },
              ],
            },
            {
              name: "items", label: "الآراء", type: "array",
              fields: [
                { name: "name",   label: "الاسم",   type: "text",     required: true },
                { name: "text",   label: "الرأي",   type: "textarea", required: true },
                { name: "rating", label: "التقييم", type: "number",   min: 1, max: 5, required: true },
                { name: "avatar", label: "الصورة",  type: "upload",   relationTo: "media" },
              ],
            },
            ...layoutFields,
          ],
        },

        // ── 11. FAQ ────────────────────────────────────────────
        {
          slug: "faqSection",
          labels: { singular: "أسئلة وأجوبة", plural: "أسئلة وأجوبة" },
          fields: [
            { name: "title", label: "العنوان", type: "text" },
            {
              name: "items", label: "الأسئلة", type: "array",
              fields: [
                { name: "question", label: "السؤال", type: "text",     required: true },
                { name: "answer",   label: "الجواب", type: "textarea", required: true },
              ],
            },
            ...layoutFields,
          ],
        },

        // ── 12. Newsletter ─────────────────────────────────────
        {
          slug: "newsletter",
          labels: { singular: "النشرة الإخبارية", plural: "نشرات إخبارية" },
          fields: [
            { name: "title",       label: "العنوان",             type: "text" },
            { name: "subtitle",    label: "الوصف",               type: "text" },
            { name: "placeholder", label: "placeholder الحقل",   type: "text", defaultValue: "أدخل بريدك الإلكتروني" },
            { name: "buttonLabel", label: "نص الزر",             type: "text", defaultValue: "اشترك الآن" },
            ...layoutFields,
          ],
        },

        // ── 13. Promo Bar ──────────────────────────────────────
        {
          slug: "promoBar",
          labels: { singular: "شريط عرض", plural: "أشرطة عروض" },
          fields: [
            { name: "text",       label: "النص",       type: "text", required: true },
            { name: "couponCode", label: "كود الخصم", type: "text" },
            ...layoutFields,
          ],
        },

        // ── 14. Tab Section ────────────────────────────────────
        {
          slug: "tabSection",
          labels: { singular: "وصف وتقييمات تبويب", plural: "تبويبات" },
          fields: [
            {
              name: "tabs", label: "التبويبات", type: "array",
              fields: [
                { name: "label",   label: "اسم التبويب", type: "text",     required: true },
                { name: "content", label: "المحتوى",     type: "richText", required: true },
              ],
            },
            ...layoutFields,
          ],
        },

        // ── 15. Spacer ─────────────────────────────────────────
        {
          slug: "spacer",
          labels: { singular: "فراغ بسيط", plural: "فراغات" },
          fields: [
            {
              name: "size", label: "الارتفاع", type: "select", defaultValue: "md",
              options: [
                { label: "صغير — 24px",       value: "sm" },
                { label: "متوسط — 48px",      value: "md" },
                { label: "كبير — 80px",       value: "lg" },
                { label: "كبير جداً — 120px", value: "xl" },
              ],
            },
            { name: "enabled", label: "مفعل", type: "checkbox", defaultValue: true },
          ],
        },

        // ── 16. Custom HTML ────────────────────────────────────
        {
          slug: "customHtml",
          labels: { singular: "Custom Liquid / HTML", plural: "HTML مخصص" },
          fields: [
            { name: "html", label: "كود HTML", type: "code", admin: { language: "html" } },
            ...layoutFields,
          ],
        },

      ],
    },
  ],
};
