import type { CollectionConfig } from 'payload'

export const Subcategories: CollectionConfig = {
  slug: 'subcategories',
  labels: { singular: 'تصنيف فرعي', plural: 'التصنيفات الفرعية' },
  admin: {
    useAsTitle: 'name_ar',
    defaultColumns: ['name_ar', 'category', 'isActive', 'position'],
  },
  access: { read: () => true },
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
    },
    {
      name: 'category',
      label: 'التصنيف الرئيسي',
      type: 'relationship',
      relationTo: 'categories',
      required: true,
    },
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
}
