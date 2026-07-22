import { GlobalConfig } from "payload/types";

/**
 * Editable copy for the transactional emails the store sends.
 *
 * Right now this drives the "order status changed" notification
 * (customer + admin). Every field is optional -- the email module
 * (cms/src/lib/email.ts) falls back to a sensible hardcoded default
 * when a field is left blank, so a fresh install still sends
 * reasonable emails.
 *
 * Placeholders you can use inside any text field below:
 *   {name}         customer's name
 *   {orderNumber}  e.g. Order-00042
 *   {status}       new status label in Arabic (e.g. "تم التسليم")
 *   {oldStatus}    previous status label
 *   {icon}         emoji for the new status
 * They're substituted verbatim when the email is built.
 */
export const EmailTemplates: GlobalConfig = {
  slug: "email-templates",
  label: "قوالب البريد الإلكتروني",
  admin: {
    group: "الإعدادات",
    description:
      "تحكّم بمحتوى رسائل البريد. المتغيرات المتاحة: {name} {orderNumber} {status} {oldStatus} {icon}",
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      type: "collapsible",
      label: "بريد تغيير حالة الطلب (للعميل)",
      fields: [
        {
          name: "orderStatusSubject",
          label: "عنوان الرسالة (Subject)",
          type: "text",
          admin: { description: "مثال: {icon} تحديث طلبك {orderNumber} — {status}" },
        },
        {
          name: "orderStatusHeaderTitle",
          label: "عنوان الترويسة",
          type: "text",
          admin: { description: "يظهر أعلى الرسالة. الافتراضي: تحديث حالة طلبك" },
        },
        {
          name: "orderStatusFooter",
          label: "نص التذييل",
          type: "text",
          admin: { description: "الافتراضي: فريق الدعم جاهز لمساعدتك على مدار الساعة" },
        },
        {
          name: "orderStatusCtaLabel",
          label: "نص زر عرض الطلب",
          type: "text",
          admin: { description: "الافتراضي: عرض تفاصيل الطلب" },
        },
      ],
    },
    {
      type: "collapsible",
      label: "نص الرسالة حسب الحالة",
      admin: {
        description:
          "الجملة التي تظهر للعميل عند كل حالة. اتركها فارغة لاستخدام النص الافتراضي.",
      },
      fields: [
        { name: "msgPaid",       label: "مدفوع",        type: "textarea" },
        { name: "msgInProgress", label: "قيد التنفيذ",  type: "textarea" },
        { name: "msgDelivered",  label: "تم التسليم",   type: "textarea" },
        { name: "msgCancelled",  label: "ملغي",          type: "textarea" },
        {
          name: "msgDefault",
          label: "نص افتراضي (لأي حالة أخرى)",
          type: "textarea",
        },
      ],
    },
    {
      type: "collapsible",
      label: "بريد تذكير السلة المتروكة",
      admin: {
        description:
          "يُرسل للعميل الذي ترك منتجات في السلة: تذكير بعد 3 ساعات وآخر بعد 6 ساعات. المتغير المتاح: {name}. اترك الحقل فارغاً لاستخدام النص الافتراضي.",
      },
      fields: [
        {
          name: "cartReminderCtaLabel",
          label: "نص زر إكمال الطلب",
          type: "text",
          admin: { description: "الافتراضي: إكمال الطلب" },
        },
        {
          name: "cartReminderFooter",
          label: "نص التذييل",
          type: "text",
          admin: { description: "الافتراضي: فريق الدعم جاهز لمساعدتك على مدار الساعة" },
        },
        {
          type: "row",
          fields: [
            { name: "cartReminderFirstSubject",  label: "عنوان تذكير 3 ساعات",  type: "text" },
            { name: "cartReminderSecondSubject", label: "عنوان تذكير 6 ساعات",  type: "text" },
          ],
        },
        {
          type: "row",
          fields: [
            { name: "cartReminderFirstHeadline",  label: "ترويسة تذكير 3 ساعات", type: "text" },
            { name: "cartReminderSecondHeadline", label: "ترويسة تذكير 6 ساعات", type: "text" },
          ],
        },
        {
          type: "row",
          fields: [
            { name: "cartReminderFirstBody",  label: "نص تذكير 3 ساعات", type: "textarea" },
            { name: "cartReminderSecondBody", label: "نص تذكير 6 ساعات", type: "textarea" },
          ],
        },
      ],
    },
  ],
};
