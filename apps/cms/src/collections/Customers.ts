import type { CollectionConfig } from 'payload'

export const Customers: CollectionConfig = {
  slug: 'customers',
  labels: { singular: 'عميل', plural: 'العملاء' },
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['name', 'email', 'phone', 'createdAt'],
  },
  access: {
    read: ({ req: { user } }) => !!user,
    create: () => true, // API-driven signup
    update: ({ req: { user } }) => !!user,
    delete: ({ req: { user } }) => user?.role === 'super_admin',
  },
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'name',
          label: 'الاسم',
          type: 'text',
          required: true,
          admin: { width: '50%' },
        },
        {
          name: 'email',
          label: 'البريد الإلكتروني',
          type: 'email',
          required: true,
          unique: true,
          admin: { width: '50%' },
        },
      ],
    },
    {
      name: 'phone',
      label: 'رقم الهاتف',
      type: 'text',
    },
    {
      name: 'twoFactorEnabled',
      label: 'المصادقة الثنائية مفعّلة',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'twoFactorSecret',
      label: 'مفتاح المصادقة الثنائية',
      type: 'text',
      admin: { hidden: true },
    },
    {
      name: 'orders',
      label: 'الطلبات',
      type: 'relationship',
      relationTo: 'orders',
      hasMany: true,
      admin: { readOnly: true },
    },
    {
      name: 'ipHistory',
      label: 'سجل عناوين IP',
      type: 'array',
      admin: { readOnly: true },
      fields: [
        { name: 'ip', type: 'text', label: 'عنوان IP' },
        { name: 'timestamp', type: 'date', label: 'الوقت' },
      ],
    },
    {
      name: 'deviceHistory',
      label: 'سجل الأجهزة',
      type: 'array',
      admin: { readOnly: true },
      fields: [
        { name: 'userAgent', type: 'text', label: 'معرف الجهاز' },
        { name: 'timestamp', type: 'date', label: 'الوقت' },
      ],
    },
  ],
  timestamps: true,
}
