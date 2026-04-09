import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'ميديا', plural: 'الميديا' },
  admin: { useAsTitle: 'filename' },
  access: {
    read: () => true,
  },
  upload: {
    staticURL: '/media',
    staticDir: 'media',
    mimeTypes: ['image/*', 'application/pdf'],
    imageSizes: [
      { name: 'thumbnail', width: 300, height: 300, crop: 'center' },
      { name: 'card', width: 600, height: 400, crop: 'center' },
      { name: 'hero', width: 1920, height: 1080, crop: 'center' },
    ],
  },
  fields: [
    {
      name: 'alt',
      label: 'النص البديل',
      type: 'text',
    },
  ],
}
