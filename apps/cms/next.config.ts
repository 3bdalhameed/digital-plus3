import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // CMS admin only — no public pages needed
}

export default withPayload(nextConfig, {
  configPath: './src/payload.config.ts',
})
