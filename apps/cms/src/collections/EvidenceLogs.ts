import type { CollectionConfig } from 'payload'

export const EvidenceLogs: CollectionConfig = {
  slug: 'evidence-logs',
  labels: { singular: 'سجل دليل', plural: 'سجلات الأدلة' },
  admin: {
    useAsTitle: 'type',
    defaultColumns: ['type', 'order', 'customer', 'timestamp', 'ipAddress'],
  },
  access: {
    read: ({ req: { user } }) => !!user,
    create: () => true, // API driven
    update: ({ req: { user } }) => user?.role === 'super_admin' || user?.role === 'admin',
    delete: ({ req: { user } }) => user?.role === 'super_admin',
  },
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'order',
          label: 'الطلب',
          type: 'relationship',
          relationTo: 'orders',
          admin: { width: '50%' },
        },
        {
          name: 'customer',
          label: 'العميل',
          type: 'relationship',
          relationTo: 'customers',
          admin: { width: '50%' },
        },
      ],
    },
    {
      name: 'type',
      label: 'نوع السجل',
      type: 'select',
      required: true,
      options: [
        { label: 'قبول الشروط', value: 'terms_acceptance' },
        { label: 'دفع', value: 'payment' },
        { label: 'تسليم', value: 'delivery' },
        { label: 'وصول', value: 'access' },
        { label: 'تأكيد الاستخدام', value: 'usage_confirmation' },
        { label: 'ملاحظة دعم', value: 'support_note' },
        { label: 'لقطة شاشة', value: 'screenshot' },
      ],
    },
    {
      name: 'timestamp',
      label: 'الوقت',
      type: 'date',
      required: true,
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'ipAddress',
          label: 'عنوان IP',
          type: 'text',
          admin: { width: '33%' },
        },
        {
          name: 'device',
          label: 'الجهاز',
          type: 'text',
          admin: { width: '33%' },
        },
        {
          name: 'browser',
          label: 'المتصفح',
          type: 'text',
          admin: { width: '33%' },
        },
      ],
    },
    {
      name: 'userAgent',
      label: 'معرف المتصفح (User Agent)',
      type: 'text',
    },
    {
      name: 'sessionId',
      label: 'معرف الجلسة',
      type: 'text',
    },
    {
      name: 'data',
      label: 'البيانات الإضافية',
      type: 'json',
      admin: {
        description: 'بيانات مرنة حسب نوع السجل',
      },
    },
    {
      name: 'attachments',
      label: 'المرفقات',
      type: 'array',
      fields: [
        {
          name: 'file',
          label: 'الملف',
          type: 'upload',
          relationTo: 'media',
          required: true,
        },
        {
          name: 'description',
          label: 'الوصف',
          type: 'text',
        },
      ],
    },
    {
      name: 'internalNote',
      label: 'ملاحظة داخلية',
      type: 'textarea',
      admin: {
        description: 'لا تظهر للعميل',
      },
    },
  ],
  timestamps: true,
}
