import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { s3Storage } from '@payloadcms/storage-s3'
import { fileURLToPath } from 'url'
import path from 'path'

// Collections
import { Media } from './collections/Media'
import { Users } from './collections/Users'
import { Categories } from './collections/Categories'
import { Subcategories } from './collections/Subcategories'
import { Products } from './collections/Products'
import { Customers } from './collections/Customers'
import { Orders } from './collections/Orders'
import { EvidenceLogs } from './collections/EvidenceLogs'
import { SupportTickets } from './collections/SupportTickets'

// Globals
import { HomePage } from './globals/HomePage'
import { Settings } from './globals/Settings'
import { NavbarConfig } from './globals/NavbarConfig'
import { FooterConfig } from './globals/FooterConfig'
import { PoliciesContent } from './globals/PoliciesContent'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  serverURL: process.env.PAYLOAD_PUBLIC_SERVER_URL || 'http://localhost:3001',
  admin: {
    user: Users.slug,
    meta: {
      titleSuffix: '- لوحة التحكم',
    },
  },
  editor: lexicalEditor(),
  collections: [
    Media,
    Users,
    Categories,
    Subcategories,
    Products,
    Customers,
    Orders,
    EvidenceLogs,
    SupportTickets,
  ],
  globals: [
    HomePage,
    Settings,
    NavbarConfig,
    FooterConfig,
    PoliciesContent,
  ],
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || '',
    },
  }),
  plugins: [
    s3Storage({
      collections: {
        media: true,
      },
      bucket: process.env.S3_BUCKET || '',
      config: {
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
        },
        region: process.env.S3_REGION || 'auto',
        endpoint: process.env.S3_ENDPOINT,
      },
    }),
  ],
  cors: [
    process.env.PAYLOAD_PUBLIC_SERVER_URL || 'http://localhost:3001',
    'http://localhost:3000',
    process.env.STOREFRONT_URL || '',
  ].filter(Boolean),
  csrf: [
    process.env.PAYLOAD_PUBLIC_SERVER_URL || 'http://localhost:3001',
    'http://localhost:3000',
    process.env.STOREFRONT_URL || '',
  ].filter(Boolean),
  secret: process.env.PAYLOAD_SECRET || 'fallback-secret-change-me-min-32-chars',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
