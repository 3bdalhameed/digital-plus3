import type { CollectionConfig } from 'payload'
import { lexicalEditor } from '@payloadcms/richtext-lexical'

export const Products: CollectionConfig = {
  slug: 'products',
  labels: { singular: 'منتج', plural: 'المنتجات' },
  admin: {
    useAsTitle: 'name_ar',
    defaultColumns: ['name_ar', 'type', 'price', 'status'],
  },
  access: {
    read: () => true,
  },
  hooks: {
    beforeChange: [
      ({ data }) => {
        // Auto-generate slug from Arabic name if not provided
        if (!data.slug && data.name_ar) {
          data.slug = data.name_ar
            .replace(/\s+/g, '-')
            .replace(/[^\w\u0600-\u06FF-]/g, '')
            .toLowerCase()
        }
        return data
      },
    ],
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'المعلومات الأساسية',
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'name_ar',
                  label: 'الاسم (عربي)',
                  type: 'text',
                  required: true,
                  admin: { width: '50%' },
                },
                {
                  name: 'name_en',
                  label: 'الاسم (إنجليزي)',
                  type: 'text',
                  admin: { width: '50%' },
                },
              ],
            },
            {
              name: 'slug',
              label: 'الرابط المختصر',
              type: 'text',
              required: true,
              unique: true,
            },
            {
              name: 'description',
              label: 'الوصف',
              type: 'richText',
              editor: lexicalEditor({}),
            },
            {
              name: 'images',
              label: 'الصور',
              type: 'array',
              fields: [
                {
                  name: 'image',
                  label: 'الصورة',
                  type: 'upload',
                  relationTo: 'media',
                  required: true,
                },
                {
                  name: 'alt',
                  label: 'النص البديل',
                  type: 'text',
                },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'category',
                  label: 'التصنيف',
                  type: 'relationship',
                  relationTo: 'categories',
                  admin: { width: '50%' },
                },
                {
                  name: 'subcategory',
                  label: 'التصنيف الفرعي',
                  type: 'relationship',
                  relationTo: 'subcategories',
                  admin: { width: '50%' },
                },
              ],
            },
          ],
        },
        {
          label: 'النوع والتسليم',
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'type',
                  label: 'نوع المنتج',
                  type: 'select',
                  required: true,
                  options: [
                    { label: 'اشتراك برمجي', value: 'software_subscription' },
                    { label: 'مفتاح ترخيص', value: 'license_key' },
                    { label: 'دعوة', value: 'invitation' },
                    { label: 'بطاقة ألعاب', value: 'gaming_card' },
                    { label: 'اشتراك AI', value: 'ai_subscription' },
                  ],
                  admin: { width: '50%' },
                },
                {
                  name: 'deliveryMethod',
                  label: 'طريقة التسليم',
                  type: 'select',
                  required: true,
                  options: [
                    { label: 'بريد إلكتروني', value: 'email' },
                    { label: 'داخل المنصة', value: 'on_site' },
                    { label: 'كلاهما', value: 'both' },
                  ],
                  admin: { width: '50%' },
                },
              ],
            },
            {
              name: 'usageProofType',
              label: 'نوع إثبات الاستخدام',
              type: 'select',
              options: [
                { label: 'استرداد الترخيص', value: 'license_redeemed' },
                { label: 'قبول الدعوة', value: 'invitation_accepted' },
                { label: 'تفعيل الاشتراك', value: 'subscription_activated' },
                { label: 'أول تسجيل دخول', value: 'first_login' },
              ],
            },
          ],
        },
        {
          label: 'السعر والحالة',
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'price',
                  label: 'السعر',
                  type: 'number',
                  required: true,
                  min: 0,
                  admin: { width: '33%' },
                },
                {
                  name: 'comparePrice',
                  label: 'السعر الأصلي (للشطب)',
                  type: 'number',
                  min: 0,
                  admin: { width: '33%' },
                },
                {
                  name: 'currency',
                  label: 'العملة',
                  type: 'select',
                  required: true,
                  defaultValue: 'USD',
                  options: [
                    { label: 'دولار أمريكي', value: 'USD' },
                    { label: 'يورو', value: 'EUR' },
                    { label: 'ريال سعودي', value: 'SAR' },
                    { label: 'درهم إماراتي', value: 'AED' },
                  ],
                  admin: { width: '33%' },
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
                  defaultValue: 'draft',
                  options: [
                    { label: 'مسودة', value: 'draft' },
                    { label: 'منشور', value: 'published' },
                    { label: 'مؤرشف', value: 'archived' },
                  ],
                  admin: { width: '50%' },
                },
                {
                  name: 'refundable',
                  label: 'قابل للاسترجاع',
                  type: 'checkbox',
                  defaultValue: false,
                  admin: { width: '50%' },
                },
              ],
            },
            {
              name: 'refundPolicy',
              label: 'سياسة الاسترجاع',
              type: 'textarea',
              admin: {
                condition: (data) => data.refundable,
              },
            },
          ],
        },
        {
          label: 'SEO',
          fields: [
            {
              name: 'seoTitle',
              label: 'عنوان SEO',
              type: 'text',
            },
            {
              name: 'seoDescription',
              label: 'وصف SEO',
              type: 'textarea',
            },
            {
              name: 'seoImage',
              label: 'صورة SEO',
              type: 'upload',
              relationTo: 'media',
            },
          ],
        },
      ],
    },
  ],
}
