import type { CollectionConfig } from 'payload'
import { lexicalEditor } from '@payloadcms/richtext-lexical'

export const Orders: CollectionConfig = {
  slug: 'orders',
  labels: { singular: 'طلب', plural: 'الطلبات' },
  admin: {
    useAsTitle: 'orderNumber',
    defaultColumns: ['orderNumber', 'customer', 'status', 'totalAmount', 'createdAt'],
  },
  access: {
    read: ({ req: { user } }) => !!user,
    create: () => true, // webhook + API driven
    update: ({ req: { user } }) => !!user,
    delete: ({ req: { user } }) => user?.role === 'super_admin',
  },
  hooks: {
    beforeChange: [
      async ({ data, operation, req }) => {
        if (operation === 'create' && !data.orderNumber) {
          // Generate order number: ORD-YYYYMMDD-XXXX
          const date = new Date()
          const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
          const rand = Math.floor(1000 + Math.random() * 9000)
          data.orderNumber = `ORD-${dateStr}-${rand}`
        }
        return data
      },
    ],
  },
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'orderNumber',
          label: 'رقم الطلب',
          type: 'text',
          unique: true,
          admin: { readOnly: true, width: '50%' },
        },
        {
          name: 'status',
          label: 'الحالة',
          type: 'select',
          required: true,
          defaultValue: 'pending',
          options: [
            { label: 'في الانتظار', value: 'pending' },
            { label: 'مدفوع', value: 'paid' },
            { label: 'تم التسليم', value: 'delivered' },
            { label: 'متنازع عليه', value: 'disputed' },
            { label: 'مسترجع', value: 'refunded' },
            { label: 'ملغي', value: 'cancelled' },
          ],
          admin: { width: '50%' },
        },
      ],
    },
    {
      name: 'customer',
      label: 'العميل',
      type: 'relationship',
      relationTo: 'customers',
      required: true,
    },
    {
      name: 'items',
      label: 'المنتجات',
      type: 'array',
      required: true,
      fields: [
        {
          name: 'product',
          label: 'المنتج',
          type: 'relationship',
          relationTo: 'products',
          required: true,
        },
        {
          name: 'quantity',
          label: 'الكمية',
          type: 'number',
          required: true,
          min: 1,
          defaultValue: 1,
        },
        {
          name: 'price',
          label: 'السعر وقت الشراء',
          type: 'number',
          required: true,
        },
        {
          name: 'currency',
          label: 'العملة',
          type: 'text',
          required: true,
        },
        {
          name: 'deliveryData',
          label: 'بيانات التسليم',
          type: 'json',
          admin: {
            description: 'مفاتيح الترخيص أو بيانات التسليم المشفرة',
          },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'totalAmount',
          label: 'المبلغ الإجمالي',
          type: 'number',
          required: true,
          admin: { width: '33%' },
        },
        {
          name: 'currency',
          label: 'العملة',
          type: 'text',
          required: true,
          defaultValue: 'USD',
          admin: { width: '33%' },
        },
        {
          name: 'deliveryStatus',
          label: 'حالة التسليم',
          type: 'select',
          options: [
            { label: 'في الانتظار', value: 'pending' },
            { label: 'تم التسليم', value: 'delivered' },
            { label: 'فشل التسليم', value: 'failed' },
          ],
          admin: { width: '33%' },
        },
      ],
    },
    {
      name: 'paymentReference',
      label: 'مرجع الدفع',
      type: 'text',
      admin: { readOnly: true },
    },
    {
      name: 'airwallexPaymentIntentId',
      label: 'معرف نية الدفع (Airwallex)',
      type: 'text',
      admin: { readOnly: true },
    },
    {
      name: 'termsAcceptedAt',
      label: 'وقت قبول الشروط',
      type: 'date',
      admin: { readOnly: true },
    },
    {
      name: 'termsAcceptedIP',
      label: 'عنوان IP عند قبول الشروط',
      type: 'text',
      admin: { readOnly: true },
    },
    {
      name: 'termsAcceptedUserAgent',
      label: 'معرف المتصفح عند القبول',
      type: 'text',
      admin: { readOnly: true },
    },
    {
      name: 'deliveredAt',
      label: 'وقت التسليم',
      type: 'date',
      admin: { readOnly: true },
    },
    {
      name: 'digitalDeliveryLog',
      label: 'سجل التسليم الرقمي',
      type: 'richText',
      editor: lexicalEditor({}),
      admin: { readOnly: true },
    },
  ],
  timestamps: true,
}
