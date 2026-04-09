import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface HeroBannerProps {
  block: {
    title: string
    subtitle?: string
    cta?: { label: string; url: string }
    backgroundImage?: { url: string }
    enabled: boolean
  }
}

export function HeroBanner({ block }: HeroBannerProps) {
  if (!block.enabled) return null

  return (
    <section className="relative min-h-[480px] flex items-center overflow-hidden gradient-header">
      {block.backgroundImage?.url && (
        <Image
          src={block.backgroundImage.url}
          alt="Hero background"
          fill
          className="object-cover opacity-20"
          priority
        />
      )}

      {/* Decorative circles */}
      <div className="absolute top-10 left-10 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
      <div className="absolute bottom-10 right-10 w-48 h-48 bg-white/5 rounded-full blur-2xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center w-full">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white mb-6 leading-tight">
          {block.title}
        </h1>
        {block.subtitle && (
          <p className="text-xl text-purple-200 mb-8 max-w-2xl mx-auto">
            {block.subtitle}
          </p>
        )}
        {block.cta && (
          <Link href={block.cta.url}>
            <Button
              size="lg"
              className="bg-white text-primary hover:bg-purple-50 font-bold text-lg px-10 py-4 h-auto shadow-xl hover:shadow-2xl"
            >
              {block.cta.label}
            </Button>
          </Link>
        )}
      </div>
    </section>
  )
}
