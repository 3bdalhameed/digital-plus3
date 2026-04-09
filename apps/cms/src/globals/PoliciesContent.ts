import type { GlobalConfig } from 'payload'
import { lexicalEditor } from '@payloadcms/richtext-lexical'

export const PoliciesContent: GlobalConfig = {
  slug: 'policies-content',
  label: 'محتوى السياسات',
  access: {
    read: () => true,
    update: ({ req: { user } }) => user?.role === 'super_admin' || user?.role === 'admin',
  },
  fields: [
    {
      name: 'termsAndConditions',
      label: 'الشروط والأحكام',
      type: 'richText',
      editor: lexicalEditor({}),
    },
    {
      name: 'refundPolicy',
      label: 'سياسة الاسترجاع',
      type: 'richText',
      editor: lexicalEditor({}),
    },
    {
      name: 'privacyPolicy',
      label: 'سياسة الخصوصية',
      type: 'richText',
      editor: lexicalEditor({}),
    },
  ],
}
