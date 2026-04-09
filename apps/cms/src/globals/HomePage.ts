import type { GlobalConfig } from 'payload'

export const HomePage: GlobalConfig = {
  slug: 'home-page',
  label: 'الصفحة الرئيسية',
  access: {
    read: () => true,
    update: ({ req: { user } }) => user?.role === 'super_admin' || user?.role === 'admin',
  },
  fields: [
    {
      name: 'sections',
      label: 'أقسام الصفحة',
      type: 'blocks',
      blocks: [
        {
          slug: 'heroBanner',
          labels: { singular: 'بانر رئيسي', plural: 'بنرات' },
          fields: [
            {
              name: 'enabled',
              label: 'مفعّل',
              type: 'checkbox',
              defaultValue: true,
            },
            {
              name: 'title',
              label: 'العنوان',
              type: 'text',
              required: true,
            },
            {
              name: 'subtitle',
              label: 'العنوان الفرعي',
              type: 'text',
            },
            {
              type: 'group',
              name: 'cta',
              label: 'زر الإجراء',
              fields: [
                { name: 'label', label: 'النص', type: 'text' },
                { name: 'url', label: 'الرابط', type: 'text' },
              ],
            },
            {
              name: 'backgroundImage',
              label: 'صورة الخلفية',
              type: 'upload',
              relationTo: 'media',
            },
          ],
        },
        {
          slug: 'categoryGrid',
          labels: { singular: 'شبكة التصنيفات', plural: 'شبكات التصنيفات' },
          fields: [
            {
              name: 'enabled',
              label: 'مفعّل',
              type: 'checkbox',
              defaultValue: true,
            },
            {
              name: 'title',
              label: 'العنوان',
              type: 'text',
            },
            {
              name: 'categories',
              label: 'التصنيفات',
              type: 'relationship',
              relationTo: 'categories',
              hasMany: true,
            },
          ],
        },
        {
          slug: 'featuredProducts',
          labels: { singular: 'منتجات مميزة', plural: 'منتجات مميزة' },
          fields: [
            {
              name: 'enabled',
              label: 'مفعّل',
              type: 'checkbox',
              defaultValue: true,
            },
            {
              name: 'title',
              label: 'العنوان',
              type: 'text',
            },
            {
              name: 'products',
              label: 'المنتجات',
              type: 'relationship',
              relationTo: 'products',
              hasMany: true,
            },
          ],
        },
        {
          slug: 'promoBar',
          labels: { singular: 'شريط الترويج', plural: 'أشرطة الترويج' },
          fields: [
            {
              name: 'enabled',
              label: 'مفعّل',
              type: 'checkbox',
              defaultValue: true,
            },
            {
              name: 'text',
              label: 'النص',
              type: 'text',
              required: true,
            },
            {
              name: 'couponCode',
              label: 'كود الخصم',
              type: 'text',
            },
          ],
        },
        {
          slug: 'testimonials',
          labels: { singular: 'آراء العملاء', plural: 'آراء العملاء' },
          fields: [
            {
              name: 'enabled',
              label: 'مفعّل',
              type: 'checkbox',
              defaultValue: true,
            },
            {
              name: 'items',
              label: 'الآراء',
              type: 'array',
              fields: [
                { name: 'name', label: 'الاسم', type: 'text', required: true },
                { name: 'text', label: 'الرأي', type: 'textarea', required: true },
                { name: 'rating', label: 'التقييم (1-5)', type: 'number', min: 1, max: 5 },
              ],
            },
          ],
        },
        {
          slug: 'faqSection',
          labels: { singular: 'الأسئلة الشائعة', plural: 'الأسئلة الشائعة' },
          fields: [
            {
              name: 'enabled',
              label: 'مفعّل',
              type: 'checkbox',
              defaultValue: true,
            },
            {
              name: 'items',
              label: 'الأسئلة',
              type: 'array',
              fields: [
                { name: 'question', label: 'السؤال', type: 'text', required: true },
                { name: 'answer', label: 'الإجابة', type: 'textarea', required: true },
              ],
            },
          ],
        },
        {
          slug: 'featureBlocks',
          labels: { singular: 'مميزات', plural: 'مميزات' },
          fields: [
            {
              name: 'enabled',
              label: 'مفعّل',
              type: 'checkbox',
              defaultValue: true,
            },
            {
              name: 'items',
              label: 'المميزات',
              type: 'array',
              fields: [
                { name: 'title', label: 'العنوان', type: 'text', required: true },
                { name: 'description', label: 'الوصف', type: 'textarea' },
                { name: 'icon', label: 'الأيقونة (Emoji أو اسم)', type: 'text' },
              ],
            },
          ],
        },
      ],
    },
  ],
}
