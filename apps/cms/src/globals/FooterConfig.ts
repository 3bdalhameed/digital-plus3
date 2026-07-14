import { GlobalConfig } from "payload/types";

/**
 * Footer global. The storefront's <Footer> component reads every text on
 * the page from these fields, with hardcoded fallbacks so any field the
 * editor leaves empty still renders the original Arabic copy.
 *
 * Schema is organized by visual region: Brand → Important Links → Policies
 * → Contact → Payment Row → Copyright. The legacy `columns` array stays
 * for backward compatibility but isn't rendered by the current footer.
 */
export const FooterConfig: GlobalConfig = {
  slug: "footer-config",
  label: "التذييل",
  admin: { group: "الإعدادات" },
  access: { read: () => true },
  fields: [
    // ── Brand column (right-most in RTL) ──────────────────────
    {
      name: "brandDescription",
      label: "وصف العلامة التجارية (عربي)",
      type: "textarea",
      admin: {
        description:
          "النص الطويل الذي يظهر بجانب شعار المتجر في التذييل. إذا تركته فارغاً يظهر النص الافتراضي.",
      },
    },
    {
      name: "brandDescriptionEn",
      label: "Brand description (English)",
      type: "textarea",
      admin: {
        description:
          "The English variant shown when a visitor picks EN in the header. Leave empty to use the hardcoded English fallback.",
      },
    },

    // ── Important Links column ────────────────────────────────
    {
      name: "importantLinksTitle",
      label: "عنوان عمود «روابط مهمة» (عربي)",
      type: "text",
      admin: { description: "افتراضي: «روابط مهمة»" },
    },
    {
      name: "importantLinksTitleEn",
      label: "Important Links title (English)",
      type: "text",
      admin: { description: "Default: “Important Links”" },
    },
    {
      name: "importantLinks",
      label: "روابط مهمة",
      labels: { singular: "رابط", plural: "روابط" },
      type: "array",
      fields: [
        { name: "label",   label: "النص (عربي)",    type: "text", required: true },
        { name: "labelEn", label: "Label (English)", type: "text" },
        { name: "href",    label: "الرابط",          type: "text", required: true },
      ],
    },

    // ── Policy column ─────────────────────────────────────────
    {
      name: "policyLinks",
      label: "روابط السياسات (بدون عنوان فوقها)",
      labels: { singular: "رابط", plural: "روابط" },
      type: "array",
      admin: {
        description:
          "العمود الثاني في التذييل. يظهر بدون عنوان فوقه ليطابق التصميم الأصلي.",
      },
      fields: [
        { name: "label",   label: "النص (عربي)",    type: "text", required: true },
        { name: "labelEn", label: "Label (English)", type: "text" },
        { name: "href",    label: "الرابط",          type: "text", required: true },
      ],
    },

    // ── Contact column (left-most in RTL) ────────────────────
    {
      name: "contactTitle",
      label: "عنوان عمود «تواصل معنا» (عربي)",
      type: "text",
      admin: { description: "افتراضي: «تواصل معنا»" },
    },
    {
      name: "contactTitleEn",
      label: "Contact column title (English)",
      type: "text",
      admin: { description: "Default: “Contact Us”" },
    },
    {
      name: "phone",
      label: "رقم الهاتف",
      type: "text",
      admin: { description: "افتراضي: +962795580312" },
    },
    {
      name: "email",
      label: "البريد الإلكتروني",
      type: "text",
      admin: { description: "افتراضي: info@digital-plus3.com" },
    },
    {
      name: "contactFormUrl",
      label: "رابط نموذج التواصل",
      type: "text",
      admin: { description: "افتراضي: /support" },
    },

    // ── Payment row ───────────────────────────────────────────
    {
      name: "paymentTitle",
      label: "عنوان صف طرق الدفع (عربي)",
      type: "text",
      admin: { description: "افتراضي: «طرق الدفع»" },
    },
    {
      name: "paymentTitleEn",
      label: "Payment row title (English)",
      type: "text",
      admin: { description: "Default: “Payment Methods”" },
    },
    {
      name: "paymentMethods",
      label: "طرق الدفع",
      labels: { singular: "طريقة دفع", plural: "طرق الدفع" },
      type: "array",
      admin: {
        description:
          "تظهر كبطاقات صغيرة بيضاء في تذييل الموقع. إذا تركتها فارغة يستخدم المتجر القائمة الافتراضية.",
      },
      fields: [
        {
          name: "name",
          label: "الاسم",
          type: "text",
          required: true,
          admin: { description: "يستخدم كنص بديل للصورة، ويظهر على البطاقة إذا لم ترفع صورة" },
        },
        {
          name: "image",
          label: "صورة الشعار",
          type: "upload",
          relationTo: "media",
          admin: {
            description:
              "SVG شفاف أو PNG بخلفية شفافة يعطي أفضل نتيجة. إذا لم ترفع صورة سيظهر اسم الطريقة كنص فقط.",
          },
        },
        {
          name: "color",
          label: "لون النص (في حال عدم وجود صورة)",
          type: "text",
          defaultValue: "#1A1F71",
          admin: {
            description:
              "لون نص الاسم داخل البطاقة (HEX). يهمل عند وجود صورة. أمثلة: VISA #1A1F71 ، MasterCard #EB001B ، Apple Pay #000000",
          },
        },
      ],
    },

    // ── Copyright line at the bottom ──────────────────────────
    {
      name: "copyrightText",
      label: "نص حقوق النشر (عربي)",
      type: "text",
      admin: {
        description:
          "نص السطر الأخير في التذييل. استخدم {year} ليتم استبداله بالسنة الحالية تلقائياً. " +
          "افتراضي: «© Digital Plus | جميع الحقوق محفوظة | Copyright {year}»",
      },
    },
    {
      name: "copyrightTextEn",
      label: "Copyright text (English)",
      type: "text",
      admin: {
        description:
          "Shown to visitors who picked EN. Use {year} to auto-substitute the current year. " +
          "Example: “© Digital Plus | All rights reserved | Copyright {year}”",
      },
    },

    // ── Legacy "columns" field — kept for back-compat, not rendered ──
    {
      name: "columns",
      label: "أعمدة (قديم — لا يستخدم حالياً)",
      labels: { singular: "عمود", plural: "الأعمدة" },
      type: "array",
      admin: { description: "هذا الحقل لم يعد مستخدماً. استعمل الحقول الجديدة في الأعلى." },
      fields: [
        { name: "titleAr", label: "العنوان (عربي)", type: "text", required: true },
        { name: "titleEn", label: "Title (English)", type: "text" },
        {
          name: "links",
          label: "الروابط",
          type: "array",
          fields: [
            { name: "labelAr", type: "text", required: true },
            { name: "labelEn", type: "text" },
            { name: "href",    type: "text", required: true },
          ],
        },
      ],
    },
    {
      name: "bottomText",
      label: "نص أسفل التذييل (قديم — استخدم «نص حقوق النشر» بدلاً منه)",
      type: "text",
    },
  ],
};
