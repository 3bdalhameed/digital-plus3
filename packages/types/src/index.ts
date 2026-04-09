// ─── Product Types ────────────────────────────────────────────────────────────

export type ProductType =
  | 'software_subscription'
  | 'license_key'
  | 'invitation'
  | 'gaming_card'
  | 'ai_subscription'

export type DeliveryMethod = 'email' | 'on_site' | 'both'

export type ProductStatus = 'draft' | 'published' | 'archived'

export type UsageProofType =
  | 'license_redeemed'
  | 'invitation_accepted'
  | 'subscription_activated'
  | 'first_login'

// ─── Order Types ──────────────────────────────────────────────────────────────

export type OrderStatus =
  | 'pending'
  | 'paid'
  | 'delivered'
  | 'disputed'
  | 'refunded'
  | 'cancelled'

// ─── Evidence Types ───────────────────────────────────────────────────────────

export type EvidenceType =
  | 'terms_acceptance'
  | 'payment'
  | 'delivery'
  | 'access'
  | 'usage_confirmation'
  | 'support_note'
  | 'screenshot'

// ─── Support Types ────────────────────────────────────────────────────────────

export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed'
export type TicketChannel = 'platform' | 'whatsapp' | 'email'

// ─── Admin Role ───────────────────────────────────────────────────────────────

export type AdminRole = 'super_admin' | 'admin' | 'support' | 'viewer'

// ─── Cart Types ───────────────────────────────────────────────────────────────

export interface CartItem {
  id: string
  productId: string
  slug: string
  name: string
  price: number
  currency: string
  quantity: number
  image?: string
}

export interface Cart {
  items: CartItem[]
  total: number
  currency: string
}

// ─── Payload API Response ─────────────────────────────────────────────────────

export interface PayloadProduct {
  id: string
  name: { ar: string; en: string }
  slug: string
  description?: any
  images?: { url: string; alt?: string }[]
  category?: PayloadCategory
  subcategory?: PayloadSubcategory
  type: ProductType
  deliveryMethod: DeliveryMethod
  price: number
  comparePrice?: number
  currency: string
  status: ProductStatus
  refundable: boolean
  refundPolicy?: string
  usageProofType?: UsageProofType
  seoTitle?: string
  seoDescription?: string
  seoImage?: string
}

export interface PayloadCategory {
  id: string
  name: { ar: string; en: string }
  slug: string
  image?: { url: string }
  description?: string
  icon?: { url: string }
  brandLogos?: { url: string }[]
  position?: number
  isActive: boolean
}

export interface PayloadSubcategory {
  id: string
  name: { ar: string; en: string }
  slug: string
  category: string | PayloadCategory
  position?: number
  isActive: boolean
}

export interface PayloadOrder {
  id: string
  orderNumber: string
  customer: string | PayloadCustomer
  items: OrderItem[]
  status: OrderStatus
  paymentReference?: string
  airwallexPaymentIntentId?: string
  totalAmount: number
  currency: string
  termsAcceptedAt?: string
  deliveredAt?: string
  createdAt: string
  updatedAt: string
}

export interface OrderItem {
  product: string | PayloadProduct
  quantity: number
  price: number
  currency: string
  deliveryData?: Record<string, any>
}

export interface PayloadCustomer {
  id: string
  email: string
  name: string
  phone?: string
  twoFactorEnabled?: boolean
}

// ─── Evidence Log Request ─────────────────────────────────────────────────────

export interface EvidenceLogRequest {
  orderId?: string
  customerId?: string
  productId?: string
  type: EvidenceType
  ipAddress?: string
  userAgent?: string
  sessionId?: string
  data?: Record<string, any>
}

// ─── Airwallex ────────────────────────────────────────────────────────────────

export interface AirwallexPaymentIntent {
  id: string
  client_secret: string
  amount: number
  currency: string
  status: string
}

// ─── CMS Homepage Blocks ──────────────────────────────────────────────────────

export interface HeroBannerBlock {
  blockType: 'heroBanner'
  title: string
  subtitle?: string
  cta?: { label: string; url: string }
  backgroundImage?: { url: string }
  enabled: boolean
}

export interface CategoryGridBlock {
  blockType: 'categoryGrid'
  title?: string
  categories: PayloadCategory[]
  enabled: boolean
}

export interface FeaturedProductsBlock {
  blockType: 'featuredProducts'
  title?: string
  products: PayloadProduct[]
  enabled: boolean
}

export interface PromoBarBlock {
  blockType: 'promoBar'
  text: string
  couponCode?: string
  enabled: boolean
}

export interface TestimonialsBlock {
  blockType: 'testimonials'
  items: { name: string; text: string; rating?: number }[]
  enabled: boolean
}

export interface FAQSectionBlock {
  blockType: 'faqSection'
  items: { question: string; answer: string }[]
  enabled: boolean
}

export interface FeatureBlocksBlock {
  blockType: 'featureBlocks'
  items: { title: string; description: string; icon?: string }[]
  enabled: boolean
}

export type HomePageSection =
  | HeroBannerBlock
  | CategoryGridBlock
  | FeaturedProductsBlock
  | PromoBarBlock
  | TestimonialsBlock
  | FAQSectionBlock
  | FeatureBlocksBlock

export interface HomePageGlobal {
  sections: HomePageSection[]
}

export interface SiteSettings {
  siteName: string
  logo?: { url: string }
  favicon?: { url: string }
  socialLinks?: { platform: string; url: string }[]
  contactEmail?: string
  whatsappNumber?: string
  supportHours?: string
}
