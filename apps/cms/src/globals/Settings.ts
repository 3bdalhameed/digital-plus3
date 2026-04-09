import type { GlobalConfig } from 'payload'

export const Settings: GlobalConfig = {
  slug: 'settings',
  label: 'إعدادات الموقع',
  access: {
    read: () => true,
    update: ({ req: { user } }) => user?.role === 'super_admin' || user?.role === 'admin',
  },
  fields: [
    {
      name: 'siteName',
      label: 'اسم الموقع',
      type: 'text',
      required: true,
      defaultValue: 'متجري',
    },
    {
      type: 'row',
      fields: [
        {
          name: 'logo',
          label: 'الشعار',
          type: 'upload',
          relationTo: 'media',
          admin: { width: '50%' },
        },
        {
          name: 'favicon',
          label: 'أيقونة المتصفح',
          type: 'upload',
          relationTo: 'media',
          admin: { width: '50%' },
        },
      ],
    },
    {
      name: 'contactEmail',
      label: 'بريد التواصل',
      type: 'email',
    },
    {
      name: 'whatsappNumber',
      label: 'رقم واتساب',
      type: 'text',
      admin: { description: 'مثال: +966501234567' },
    },
    {
      name: 'supportHours',
      label: 'ساعات الدعم',
      type: 'text',
      admin: { description: 'مثال: 9 ص - 9 م (بتوقيت الرياض)' },
    },
    {
      name: 'socialLinks',
      label: 'روابط التواصل الاجتماعي',
      type: 'array',
      fields: [
        {
          name: 'platform',
          label: 'المنصة',
          type: 'select',
          options: [
            { label: 'تويتر / X', value: 'twitter' },
            { label: 'إنستغرام', value: 'instagram' },
            { label: 'تيليغرام', value: 'telegram' },
            { label: 'يوتيوب', value: 'youtube' },
            { label: 'لينكدإن', value: 'linkedin' },
            { label: 'سناب شات', value: 'snapchat' },
            { label: 'تيك توك', value: 'tiktok' },
          ],
        },
        {
          name: 'url',
          label: 'الرابط',
          type: 'text',
        },
      ],
    },
  ],
}
