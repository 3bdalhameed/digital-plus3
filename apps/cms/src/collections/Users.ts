import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: 'مسؤول', plural: 'المسؤولون' },
  auth: true,
  admin: { useAsTitle: 'email' },
  access: {
    read: ({ req: { user } }) => !!user,
    create: ({ req: { user } }) => user?.role === 'super_admin',
    update: ({ req: { user } }) => !!user,
    delete: ({ req: { user } }) => user?.role === 'super_admin',
  },
  fields: [
    {
      name: 'name',
      label: 'الاسم',
      type: 'text',
      required: true,
    },
    {
      name: 'role',
      label: 'الدور',
      type: 'select',
      required: true,
      defaultValue: 'support',
      options: [
        { label: 'مدير عام', value: 'super_admin' },
        { label: 'مسؤول', value: 'admin' },
        { label: 'دعم فني', value: 'support' },
        { label: 'مشاهد', value: 'viewer' },
      ],
    },
  ],
}
