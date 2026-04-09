import type { GlobalConfig } from 'payload'

export const NavbarConfig: GlobalConfig = {
  slug: 'navbar-config',
  label: 'إعدادات القائمة العلوية',
  access: {
    read: () => true,
    update: ({ req: { user } }) => user?.role === 'super_admin' || user?.role === 'admin',
  },
  fields: [
    {
      name: 'links',
      label: 'روابط القائمة',
      type: 'array',
      fields: [
        {
          name: 'label',
          label: 'النص',
          type: 'text',
          required: true,
        },
        {
          name: 'url',
          label: 'الرابط',
          type: 'text',
          required: true,
        },
        {
          name: 'isMegaMenu',
          label: 'قائمة موسعة',
          type: 'checkbox',
          defaultValue: false,
        },
        {
          name: 'megaMenuCategories',
          label: 'تصنيفات القائمة الموسعة',
          type: 'relationship',
          relationTo: 'categories',
          hasMany: true,
          admin: {
            condition: (data, siblingData) => siblingData.isMegaMenu,
          },
        },
        {
          name: 'openInNewTab',
          label: 'فتح في تبويب جديد',
          type: 'checkbox',
          defaultValue: false,
        },
      ],
    },
  ],
}
