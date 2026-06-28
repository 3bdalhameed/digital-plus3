// ========================
// PRODUCT TYPES
// ========================

export type ProductType =
  | "software_subscription"
  | "license_key"
  | "invitation"
  | "gaming_card"
  | "ai_subscription";

export type DeliveryMethod = "email" | "on_site" | "both";

export type ProductStatus = "draft" | "published" | "archived";

export type UsageProofType =
  | "license_redeemed"
  | "invitation_accepted"
  | "subscription_activated"
  | "first_login";

export interface LocalizedString {
  ar: string;
  en: string;
}

export interface DeliveryField {
  id: string;
  labelAr: string;
  labelEn?: string;
  fieldType: "text" | "email" | "tel" | "username" | "select";
  required: boolean;
  placeholder?: string;
  helpText?: string;
  selectOptions?: string;
}

export interface Product {
  id: string;
  name: LocalizedString;
  slug: string;
  description: any; // richtext
  images: { image: Media }[];
  category: Category;
  subcategory?: Subcategory;
  type: ProductType;
  deliveryMethod: DeliveryMethod;
  price: number;
  comparePrice?: number;
  currency: string;
  status: ProductStatus;
  refundable: boolean;
  refundPolicy?: string;
  usageProofType: UsageProofType;
  deliveryFields?: DeliveryField[];
  relatedProducts?: Product[];
  badge?: "none" | "new" | "offer" | "hot" | "limited";
  totalSales?: number;
  seoTitle?: string;
  seoDescription?: string;
  seoImage?: Media;
  createdAt: string;
  updatedAt: string;
}

// ========================
// CATEGORY TYPES
// ========================

export interface Category {
  id: string;
  nameAr: string;
  nameEn?: string;
  name: LocalizedString;
  slug: string;
  image?: Media;
  description?: string;
  icon?: Media;
  brandLogos?: Media[];
  position: number;
  isActive: boolean;
}

export interface Subcategory {
  id: string;
  nameAr: string;
  nameEn?: string;
  slug: string;
  category: Category | string;
  icon?: Media;
  position: number;
  isActive: boolean;
}

// ========================
// ORDER TYPES
// ========================

export type OrderStatus =
  | "pending"
  | "paid"
  | "delivered"
  | "disputed"
  | "refunded"
  | "cancelled";

export interface OrderItem {
  product: Product;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  customer: Customer;
  items: OrderItem[];
  status: OrderStatus;
  paymentReference?: string;
  airwallexPaymentIntentId?: string;
  totalAmount: number;
  currency: string;
  termsAcceptedAt?: string;
  termsAcceptedIP?: string;
  termsAcceptedUserAgent?: string;
  deliveryStatus?: string;
  deliveredAt?: string;
  digitalDeliveryLog?: any;
  createdAt: string;
  updatedAt: string;
}

// ========================
// CUSTOMER TYPES
// ========================

export interface Customer {
  id: string;
  email: string;
  name: string;
  phone?: string;
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  orders?: Order[];
  ipHistory?: string[];
  deviceHistory?: string[];
  createdAt: string;
}

// ========================
// EVIDENCE TYPES
// ========================

export type EvidenceType =
  | "terms_acceptance"
  | "payment"
  | "delivery"
  | "access"
  | "usage_confirmation"
  | "support_note"
  | "screenshot";

export interface EvidenceLog {
  id: string;
  order: Order;
  customer: Customer;
  type: EvidenceType;
  timestamp: string;
  ipAddress: string;
  userAgent: string;
  device?: string;
  browser?: string;
  sessionId?: string;
  data?: Record<string, any>;
  attachments?: Media[];
  internalNote?: string;
}

// ========================
// SUPPORT TYPES
// ========================

export type TicketStatus = "open" | "in_progress" | "resolved" | "closed";
export type TicketChannel = "platform" | "whatsapp" | "email";

export interface SupportMessage {
  sender: "customer" | "admin";
  text: string;
  attachments?: Media[];
  timestamp: string;
}

export interface SupportTicket {
  id: string;
  order: Order;
  customer: Customer;
  status: TicketStatus;
  channel: TicketChannel;
  messages: SupportMessage[];
  internalNotes?: string[];
  disputeEvidence?: EvidenceLog[];
}

// ========================
// MEDIA
// ========================

export interface Media {
  id: string;
  url: string;
  alt?: string;
  filename: string;
  mimeType: string;
  width?: number;
  height?: number;
}

// ========================
// ADMIN TYPES
// ========================

export type AdminRole = "super_admin" | "admin" | "support" | "viewer";

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
}

// ========================
// CMS GLOBALS
// ========================

export interface HeroBanner {
  blockType: "heroBanner";
  title: string;
  subtitle: string;
  cta: { label: string; link: string };
  backgroundImage?: Media;
  enabled: boolean;
}

export interface CategoryGrid {
  blockType: "categoryGrid";
  title: string;
  categories: Category[];
  enabled: boolean;
}

export interface FeaturedProducts {
  blockType: "featuredProducts";
  title: string;
  products: Product[];
  enabled: boolean;
}

export interface PromoBar {
  blockType: "promoBar";
  text: string;
  couponCode?: string;
  enabled: boolean;
}

export interface Testimonial {
  name: string;
  text: string;
  rating: number;
}

export interface TestimonialsSection {
  blockType: "testimonials";
  items: Testimonial[];
  enabled: boolean;
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface FAQSection {
  blockType: "faqSection";
  items: FAQItem[];
  enabled: boolean;
}

export interface FeatureBlock {
  title: string;
  description: string;
  icon?: Media;
}

export interface FeatureBlocks {
  blockType: "featureBlocks";
  title?: string;
  items: FeatureBlock[];
  enabled: boolean;
}

export interface MultiImageBanner {
  blockType: "multiImageBanner";
  slides: { image: Media; title?: string; subtitle?: string; ctaLabel?: string; ctaLink?: string }[];
  autoplay?: boolean;
  enabled: boolean;
}

export interface CategoryBanners {
  blockType: "categoryBanners";
  title?: string;
  banners: { image: Media; label: string; link: string; subtitle?: string }[];
  enabled: boolean;
}

export interface CategoryRow {
  blockType: "categoryRow";
  title?: string;
  items: { label: string; emoji?: string; image?: Media; link: string }[];
  enabled: boolean;
}

export interface ImageWithText {
  blockType: "imageWithText";
  image: Media;
  title: string;
  text?: string;
  ctaLabel?: string;
  ctaLink?: string;
  imagePosition?: "right" | "left";
  enabled: boolean;
}

export interface StatsSection {
  blockType: "statsSection";
  title?: string;
  stats: { value: string; label: string; emoji?: string }[];
  enabled: boolean;
}

export interface Newsletter {
  blockType: "newsletter";
  title?: string;
  subtitle?: string;
  placeholder?: string;
  buttonLabel?: string;
  enabled: boolean;
}

export interface TabSection {
  blockType: "tabSection";
  tabs: { label: string; content: any }[];
  enabled: boolean;
}

export interface Spacer {
  blockType: "spacer";
  size?: "sm" | "md" | "lg" | "xl";
  enabled: boolean;
}

export interface CustomHtml {
  blockType: "customHtml";
  html?: string;
  enabled: boolean;
}

export type HomePageSection =
  | HeroBanner
  | MultiImageBanner
  | CategoryGrid
  | CategoryBanners
  | CategoryRow
  | FeaturedProducts
  | ImageWithText
  | FeatureBlocks
  | StatsSection
  | TestimonialsSection
  | FAQSection
  | Newsletter
  | PromoBar
  | TabSection
  | Spacer
  | CustomHtml;

export interface HomePage {
  sections: HomePageSection[];
}

export interface SiteSettings {
  siteName: string;
  logo?: Media;
  favicon?: Media;
  contactEmail?: string;
  whatsappNumber?: string;
  supportHours?: string;
  orderNotificationEmails?: string;
  instagramUrl?: string;
  twitterUrl?: string;
  facebookUrl?: string;
  tiktokUrl?: string;
  youtubeUrl?: string;
  telegramUrl?: string;
  whatsappUrl?: string;
}

export interface NavLink {
  labelAr: string;
  labelEn?: string;
  href: string;
  children?: NavLink[];
}

export interface NavbarConfig {
  links: NavLink[];
}

export interface FooterColumn {
  title: LocalizedString;
  links: { label: LocalizedString; href: string }[];
}

export interface FooterPaymentMethod {
  name: string;
  color?: string;
  image?: { url?: string; alt?: string } | string;
}

export interface FooterLink {
  label: string;
  href: string;
}

export interface FooterConfig {
  // CMS-editable text + link arrays driving the current footer layout
  brandDescription?: string;
  importantLinksTitle?: string;
  importantLinks?: FooterLink[];
  policyLinks?: FooterLink[];
  contactTitle?: string;
  phone?: string;
  email?: string;
  contactFormUrl?: string;
  paymentTitle?: string;
  paymentMethods?: FooterPaymentMethod[];
  copyrightText?: string;
  // Legacy fields (kept for back-compat, not rendered)
  columns?: FooterColumn[];
  bottomText?: string;
}

export interface PoliciesContent {
  termsAndConditions: any; // richtext
  refundPolicy: any; // richtext
  privacyPolicy: any; // richtext
}

// ========================
// API PAYLOADS
// ========================

export interface CreateOrderPayload {
  customerId: string;
  items: { productId: string; quantity: number }[];
  currency: string;
}

export interface LogEvidencePayload {
  orderId?: string;
  customerId: string;
  type: EvidenceType;
  data?: Record<string, any>;
  sessionId?: string;
}

export interface UsageConfirmPayload {
  orderId: string;
  customerId: string;
  productId: string;
  sessionId: string;
}

// ========================
// CART
// ========================

export interface CartItem {
  product: Product;
  quantity: number;
  deliveryInfo?: Record<string, string>;
}

export interface CartState {
  items: CartItem[];
  addItem: (product: Product, deliveryInfo?: Record<string, string>) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  updateDeliveryInfo: (productId: string, deliveryInfo: Record<string, string>) => void;
  clearCart: () => void;
  totalItems: () => number;
  totalPrice: () => number;
}
