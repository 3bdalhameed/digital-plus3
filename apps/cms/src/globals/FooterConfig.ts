import type { GlobalConfig } from 'payload'

export const FooterConfig: GlobalConfig = {
  slug: 'footer-config',
  label: 'إعدادات التذييل',
  access: {
    read: () => true,
    update: ({ req: { user } }) => user?.role === 'super_admin' || user?.role === 'admin',
  },
  fields: [
    {
      name: 'columns',
      label: 'أعمدة التذييل',
      type: 'array',
      fields: [
        {
          name: 'title',
          label: 'عنوان العمود',
          type: 'text',
          required: true,
        },
        {
          name: 'links',
          label: 'الروابط',
          type: 'array',
          fields: [
            { name: 'label', label: 'النص', type: 'text', required: true },
            { name: 'url', label: 'الرابط', type: 'text', required: true },
          ],
        },
      ],
    },
    {
      name: 'bottomText',
      label: 'نص الأسفل (حقوق النشر)',
      type: 'text',
    },
    {
      name: 'policyLinks',
      label: 'روابط السياسات',
      type: 'array',
      fields: [
        { name: 'label', label: 'النص', type: 'text', required: true },
        { name: 'url', label: 'الرابط', type: 'text', required: true },
      ],
    },
  ],
}
