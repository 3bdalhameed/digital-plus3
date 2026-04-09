import type { CollectionConfig } from 'payload'

export const SupportTickets: CollectionConfig = {
  slug: 'support-tickets',
  labels: { singular: 'تذكرة دعم', plural: 'تذاكر الدعم' },
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['order', 'customer', 'status', 'channel', 'createdAt'],
  },
  access: {
    read: ({ req: { user } }) => !!user,
    create: () => true,
    update: ({ req: { user } }) => !!user,
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
          required: true,
          admin: { width: '50%' },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'status',
          label: 'الحالة',
          type: 'select',
          required: true,
          defaultValue: 'open',
          options: [
            { label: 'مفتوح', value: 'open' },
            { label: 'قيد المعالجة', value: 'in_progress' },
            { label: 'محلول', value: 'resolved' },
            { label: 'مغلق', value: 'closed' },
          ],
          admin: { width: '50%' },
        },
        {
          name: 'channel',
          label: 'قناة التواصل',
          type: 'select',
          required: true,
          defaultValue: 'platform',
          options: [
            { label: 'المنصة', value: 'platform' },
            { label: 'واتساب', value: 'whatsapp' },
            { label: 'بريد إلكتروني', value: 'email' },
          ],
          admin: { width: '50%' },
        },
      ],
    },
    {
      name: 'messages',
      label: 'الرسائل',
      type: 'array',
      fields: [
        {
          name: 'sender',
          label: 'المرسل',
          type: 'select',
          required: true,
          options: [
            { label: 'عميل', value: 'customer' },
            { label: 'دعم', value: 'support' },
          ],
        },
        {
          name: 'text',
          label: 'النص',
          type: 'textarea',
          required: true,
        },
        {
          name: 'attachments',
          label: 'المرفقات',
          type: 'array',
          fields: [
            {
              name: 'file',
              type: 'upload',
              relationTo: 'media',
            },
          ],
        },
        {
          name: 'timestamp',
          label: 'الوقت',
          type: 'date',
          required: true,
        },
      ],
    },
    {
      name: 'internalNotes',
      label: 'ملاحظات داخلية (للمسؤولين فقط)',
      type: 'array',
      fields: [
        {
          name: 'note',
          label: 'الملاحظة',
          type: 'textarea',
          required: true,
        },
        {
          name: 'author',
          label: 'الكاتب',
          type: 'relationship',
          relationTo: 'users',
        },
        {
          name: 'timestamp',
          label: 'الوقت',
          type: 'date',
          required: true,
        },
      ],
    },
    {
      name: 'disputeEvidence',
      label: 'أدلة النزاع',
      type: 'relationship',
      relationTo: 'evidence-logs',
      hasMany: true,
    },
  ],
  timestamps: true,
}
