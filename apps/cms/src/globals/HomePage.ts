import { GlobalConfig } from "payload/types";
import { Field } from "payload/types";
import ArrayRowLabel from "../admin/components/ArrayRowLabel";

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
        defaultValue: "sm",
        options: [
          { label: "بلا مسافة — 0px",   value: "none" },
          { label: "ضيقة — 16px",       value: "sm"   },
          { label: "متوسطة — 24px",     value: "md"   },
          { label: "كبيرة — 40px",      value: "lg"   },
          { label: "كبيرة جداً — 64px", value: "xl"   },
          { label: "ضيقة جداً — 8px",   value: "xs"   },
        ],
      },
    ],
  },
  { name: "enabled", label: "مفعل", type: "checkbox", defaultValue: true },
];

// Optional English title for any section header. Storefront prefers this
// when the visitor picks "EN" in the language switcher; falls back to the
// Arabic `title` when this is empty. Kept optional so existing blocks
// keep working without editor changes.
const titleEnField: Field = {
  name: "titleEn",
  label: "العنوان (إنجليزي)",
  type: "text",
  admin: {
    description:
      "يظهر عند اختيار الزائر EN. إذا تُرك فارغاً يظهر العنوان العربي.",
  },
};

export const HomePage: GlobalConfig = {
  slug: "home-page",
  label: "الصفحة الرئيسية",
  admin: {
    group: "الصفحات",
    preview: () => {
      const cmsUrl = process.env.PAYLOAD_PUBLIC_SERVER_URL || "http://localhost:3001";
      return `${cmsUrl}/api/preview-redirect?collection=home-page`;
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
            { name: "title",    label: "العنوان (عربي)",        type: "text", required: true },
            titleEnField,
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
              labels: { singular: "شريحة", plural: "الشرائح" },
              admin: { components: { RowLabel: ArrayRowLabel as any } },
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
                { label: "بانر ضيق — 16:4",   value: "16/4" },
                { label: "بانر متوسط — 16:6", value: "16/6" },
                { label: "بانر كبير — 16:8",  value: "16/8" },
                { label: "مربع — 1:1",         value: "1/1"  },
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
            { name: "title",    label: "العنوان (عربي)", type: "text", required: true },
            titleEnField,
            { name: "subtitle", label: "وصف",     type: "text" },
            {
              name: "titleIcon",
              label: "أيقونة العنوان (تظهر يمين ويسار العنوان)",
              type: "upload",
              relationTo: "media",
              admin: {
                description:
                  "صورة صغيرة (PNG شفاف يعطي أفضل نتيجة) تظهر داخل المربعين على جانبي العنوان. إذا تركتها فارغة سيظهر رمز ✨ الافتراضي.",
              },
            },
            {
              name: "columns", label: "عدد الأعمدة", type: "select", defaultValue: "4",
              options: [
                { label: "2 أعمدة", value: "2" },
                { label: "3 أعمدة", value: "3" },
                { label: "4 أعمدة", value: "4" },
                { label: "5 أعمدة", value: "5" },
                { label: "6 أعمدة", value: "6" },
                { label: "7 أعمدة", value: "7" },
                { label: "8 أعمدة", value: "8" },
              ],
            },
            {
              name: "products", label: "المنتجات", type: "relationship",
              relationTo: "products", hasMany: true,
            },
            {
              name: "showMoreSubcategory",
              label: "وجهة زر «عرض المزيد»",
              type: "relationship",
              relationTo: "subcategories",
              admin: {
                description:
                  "اختياري. عند تحديده، يوجه زر «عرض المزيد» إلى صفحة هذا القسم الفرعي. إذا تركته فارغاً، سيتم اشتقاق الوجهة تلقائياً من تصنيف المنتجات.",
              },
            },
            ...layoutFields,
          ],
        },

        // ── 4. Category Grid ───────────────────────────────────
        {
          slug: "categoryGrid",
          labels: { singular: "شبكة التصنيفات", plural: "شبكات التصنيفات" },
          fields: [
            { name: "title", label: "العنوان (عربي)", type: "text", required: true },
            titleEnField,
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
            { name: "title", label: "العنوان (عربي)", type: "text" },
            titleEnField,
            // Only three sizes. Enum values (sm/md/lg) are kept the same so
            // no DB migration is needed -- only the labels + storefront
            // width mapping change.
            {
              name: "cardWidth", label: "الحجم", type: "select", defaultValue: "md",
              options: [
                { label: "صغير",      value: "sm" },
                { label: "كبير",      value: "md" },
                { label: "كبير جداً", value: "lg" },
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
              labels: { singular: "بنر", plural: "البنرات" },
              admin: { components: { RowLabel: ArrayRowLabel as any } },
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
            // `enabled` is normally provided by layoutFields, but we removed
            // that spread from this block to declutter the editor. Without
            // this field, the storefront's SectionRenderer treats the block
            // as disabled (returns null) and nothing renders.
            { name: "enabled", label: "مفعل", type: "checkbox", defaultValue: true },
          ],
        },

        // ── 6. Category Scrollable Row ─────────────────────────
        {
          slug: "categoryRow",
          labels: { singular: "سطر فئات سحب", plural: "أسطر فئات" },
          fields: [
            { name: "title", label: "العنوان (عربي)", type: "text" },
            titleEnField,
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
              labels: { singular: "عنصر", plural: "العناصر" },
              admin: { components: { RowLabel: ArrayRowLabel as any } },
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
            { name: "title",    label: "العنوان (عربي)",   type: "text",   required: true },
            titleEnField,
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
            { name: "title", label: "العنوان (عربي)", type: "text" },
            titleEnField,
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
              labels: { singular: "ميزة", plural: "المميزات" },
              admin: { components: { RowLabel: ArrayRowLabel as any } },
              fields: [
                { name: "title",       label: "العنوان",       type: "text",     required: true },
                { name: "description", label: "الوصف",         type: "textarea", required: true },
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
            { name: "title", label: "العنوان (عربي)", type: "text" },
            titleEnField,
            {
              name: "stats", label: "الإحصائيات", type: "array",
              labels: { singular: "إحصائية", plural: "الإحصائيات" },
              admin: { components: { RowLabel: ArrayRowLabel as any } },
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
            { name: "title", label: "العنوان (عربي)", type: "text" },
            titleEnField,
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
              labels: { singular: "رأي", plural: "الآراء" },
              admin: { components: { RowLabel: ArrayRowLabel as any } },
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
            { name: "title", label: "العنوان (عربي)", type: "text" },
            titleEnField,
            {
              name: "items", label: "الأسئلة", type: "array",
              labels: { singular: "سؤال", plural: "الأسئلة" },
              admin: { components: { RowLabel: ArrayRowLabel as any } },
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
            { name: "title",       label: "العنوان (عربي)",             type: "text" },
            titleEnField,
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
              labels: { singular: "تبويب", plural: "التبويبات" },
              admin: { components: { RowLabel: ArrayRowLabel as any } },
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

        // NOTE: `bannerTitle` and `trustSection` blocks were removed
        // because Drizzle push mode is disabled (push: false in
        // payload.config.ts) so new array-field tables aren't created
        // automatically. Adding them broke /api/globals/home-page with
        // a SELECT failure on the missing tables.
        //
        // To re-add them safely:
        //   1. Re-add the block definitions below
        //   2. Add the CREATE TABLE statements for the new array tables
        //      to the /migrate endpoint in payload.config.ts
        //   3. Deploy, then GET /api/migrate once to apply the schema
        //   4. The storefront renderers (BannerTitleSection,
        //      TrustSection in SectionRenderer.tsx) are already in
        //      place and ready

      ],
    },
  ],
};
