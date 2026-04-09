import type { CollectionConfig } from 'payload'

export const Categories: CollectionConfig = {
  slug: 'categories',
  labels: { singular: 'تصنيف', plural: 'التصنيفات' },
  admin: {
    useAsTitle: 'name_ar',
    defaultColumns: ['name_ar', 'slug', 'isActive', 'position'],
  },
  access: { read: () => true },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'المحتوى',
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
                  required: true,
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
              admin: {
                description: 'يستخدم في الرابط مثل: /category/software',
              },
            },
            {
              name: 'description',
              label: 'الوصف',
              type: 'textarea',
            },
            {
              name: 'image',
              label: 'الصورة الرئيسية',
              type: 'upload',
              relationTo: 'media',
            },
            {
              name: 'icon',
              label: 'الأيقونة (صورة 3D)',
              type: 'upload',
              relationTo: 'media',
            },
            {
              name: 'brandLogos',
              label: 'شعارات الماركات',
              type: 'array',
              fields: [
                {
                  name: 'logo',
                  label: 'الشعار',
                  type: 'upload',
                  relationTo: 'media',
                  required: true,
                },
                {
                  name: 'brandName',
                  label: 'اسم الماركة',
                  type: 'text',
                },
              ],
            },
          ],
        },
        {
          label: 'الإعدادات',
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'position',
                  label: 'الترتيب',
                  type: 'number',
                  defaultValue: 0,
                  admin: { width: '50%' },
                },
                {
                  name: 'isActive',
                  label: 'نشط',
                  type: 'checkbox',
                  defaultValue: true,
                  admin: { width: '50%' },
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}
