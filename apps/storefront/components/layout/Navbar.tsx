import Link from 'next/link'
import Image from 'next/image'
import { ShoppingCart, User, Menu } from 'lucide-react'
import { getSettings, getNavbarConfig } from '@/lib/payload'
import { CartButton } from '@/components/checkout/CartButton'
import { Button } from '@/components/ui/button'

export async function Navbar() {
  const [settings, navbar] = await Promise.all([
    getSettings().catch(() => null),
    getNavbarConfig().catch(() => null),
  ]) as [any, any]

  return (
    <header className="gradient-header text-white sticky top-0 z-50 shadow-lg">
      {/* Promo bar placeholder — rendered by CMS PromoBar block */}
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 shrink-0">
            {settings?.logo?.url ? (
              <Image
                src={settings.logo.url}
                alt={settings.siteName || 'متجري'}
                width={40}
                height={40}
                className="rounded-lg"
              />
            ) : (
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center font-bold text-lg">
                م
              </div>
            )}
            <span className="font-bold text-xl hidden sm:block">
              {settings?.siteName || 'متجري'}
            </span>
          </Link>

          {/* Navigation links */}
          <div className="hidden md:flex items-center gap-1">
            {navbar?.links?.map((link: any, i: number) => (
              <Link
                key={i}
                href={link.url}
                target={link.openInNewTab ? '_blank' : undefined}
                className="px-4 py-2 rounded-lg hover:bg-white/15 transition-colors text-sm font-medium"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/products"
              className="px-4 py-2 rounded-lg hover:bg-white/15 transition-colors text-sm font-medium"
            >
              المنتجات
            </Link>
            <Link
              href="/about"
              className="px-4 py-2 rounded-lg hover:bg-white/15 transition-colors text-sm font-medium"
            >
              عن المتجر
            </Link>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <CartButton />
            <Link href="/account">
              <Button
                size="icon"
                variant="ghost"
                className="text-white hover:bg-white/15"
              >
                <User className="h-5 w-5" />
              </Button>
            </Link>
            <Button
              size="icon"
              variant="ghost"
              className="text-white hover:bg-white/15 md:hidden"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </nav>
    </header>
  )
}
