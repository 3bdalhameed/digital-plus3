"use client";

import { useEffect, useState } from "react";
import { useLocaleStore } from "@/lib/locale-store";

/**
 * Site-wide UI translations. Everything the customer sees in the shell
 * (buttons, empty states, form labels, page titles) lives here so the
 * whole app can switch languages from the header toggle without a
 * dozen inline ternaries per file.
 *
 * Adding a locale: add a third key alongside `ar` and `en` below and
 * broaden the return type of `useT`.
 *
 * NOTE — CMS-driven strings (product names, section titles, blog posts,
 * policies) are NOT here. Editors fill those in Payload; some
 * collections already have an `<field>En` variant (nameEn, titleEn,
 * descriptionHtmlEn) — use those directly from the doc.
 */
const dict = {
  ar: {
    // Common actions
    apply:               "تطبيق",
    save:                "حفظ",
    cancel:              "إلغاء",
    remove:              "إزالة",
    back:                "رجوع",
    continue:            "متابعة",
    retry:               "حاول مرة أخرى",
    loading:             "جارٍ التحميل...",
    processing:          "جارٍ المعالجة...",

    // Empty states
    cartEmpty:           "سلة التسوق فارغة",
    cartEmptyHint:       "ابدأ بإضافة منتجات إلى سلتك",
    browseProducts:      "تصفح المنتجات",
    wishlistEmpty:       "قائمة أمنياتك فارغة",
    wishlistEmptyHint:   "أضف منتجات إلى قائمة أمنياتك لعرضها هنا",
    ordersEmpty:         "لا يوجد لديك طلبات بعد",
    ordersEmptyHint:     "ستظهر طلباتك هنا بعد إتمام أول عملية شراء",

    // Cart / Checkout
    cartTitle:           "سلة التسوق",
    checkoutTitle:       "إتمام الشراء",
    subtotal:            "المجموع الفرعي",
    total:               "المجموع",
    discount:            "خصم",
    checkout:            "إتمام الشراء",
    emptyCart:           "إفراغ السلة",
    quantity:            "الكمية",
    addToCart:           "أضف إلى السلة",
    outOfStock:          "غير متوفر",

    // Auth
    login:               "تسجيل الدخول",
    register:            "إنشاء حساب",
    logout:              "تسجيل الخروج",
    email:               "البريد الإلكتروني",
    password:            "كلمة المرور",
    fullName:            "الاسم الكامل",
    phone:               "رقم الهاتف",
    forgotPassword:      "نسيت كلمة المرور؟",
    noAccount:           "ليس لديك حساب؟",
    haveAccount:         "لديك حساب؟",
    signInWithGoogle:    "الدخول بحساب جوجل",

    // Account
    myAccount:           "حسابي",
    myOrders:            "طلباتي",
    myOrdersHint:        "عرض جميع طلباتك",
    support:             "الدعم",
    supportHint:         "تواصل مع فريق الدعم",
    profileInfo:         "معلومات الحساب",

    // Orders
    ordersTitle:         "طلباتي",
    orderNumber:         "رقم الطلب",
    orderDate:           "التاريخ",
    orderStatus:         "الحالة",
    orderTotal:          "الإجمالي",
    viewOrder:           "عرض التفاصيل",
    statusPending:       "قيد المعالجة",
    statusPaid:          "مدفوع",
    statusDelivered:     "تم التسليم",
    statusCancelled:     "ملغى",

    // Products listing
    productsTitle:       "المنتجات",
    noProductsFound:     "لا توجد منتجات",
    filters:             "تصفية",
    sortBy:              "ترتيب حسب",
    priceLowHigh:        "السعر: منخفض إلى مرتفع",
    priceHighLow:        "السعر: مرتفع إلى منخفض",
    newest:              "الأحدث",
    bestSelling:         "الأكثر مبيعاً",

    // Checkout success
    orderSuccess:        "تم استلام طلبك بنجاح!",
    orderPending:        "طلبك قيد المراجعة",
    orderPendingHint:    "سيتواصل معك فريق الدعم قريباً عبر واتساب لإتمام الدفع",
    orderProcessing:     "جاري معالجة طلبك",
    orderNumberLabel:    "رقم الطلب",
    continueShopping:    "متابعة التسوق",
    viewOrders:          "عرض طلباتي",
  },
  en: {
    apply:               "Apply",
    save:                "Save",
    cancel:              "Cancel",
    remove:              "Remove",
    back:                "Back",
    continue:            "Continue",
    retry:               "Try again",
    loading:             "Loading...",
    processing:          "Processing...",

    cartEmpty:           "Your cart is empty",
    cartEmptyHint:       "Start adding products to your cart",
    browseProducts:      "Browse products",
    wishlistEmpty:       "Your wishlist is empty",
    wishlistEmptyHint:   "Add products to your wishlist to see them here",
    ordersEmpty:         "You don't have any orders yet",
    ordersEmptyHint:     "Your orders will appear here after your first purchase",

    cartTitle:           "Shopping Cart",
    checkoutTitle:       "Checkout",
    subtotal:            "Subtotal",
    total:               "Total",
    discount:            "Discount",
    checkout:            "Checkout",
    emptyCart:           "Empty cart",
    quantity:            "Qty",
    addToCart:           "Add to cart",
    outOfStock:          "Out of stock",

    login:               "Sign in",
    register:            "Create account",
    logout:              "Sign out",
    email:               "Email",
    password:            "Password",
    fullName:            "Full name",
    phone:               "Phone number",
    forgotPassword:      "Forgot password?",
    noAccount:           "Don't have an account?",
    haveAccount:         "Already have an account?",
    signInWithGoogle:    "Sign in with Google",

    myAccount:           "My account",
    myOrders:            "My orders",
    myOrdersHint:        "View all your orders",
    support:             "Support",
    supportHint:         "Contact the support team",
    profileInfo:         "Account information",

    ordersTitle:         "My orders",
    orderNumber:         "Order #",
    orderDate:           "Date",
    orderStatus:         "Status",
    orderTotal:          "Total",
    viewOrder:           "View details",
    statusPending:       "Pending",
    statusPaid:          "Paid",
    statusDelivered:     "Delivered",
    statusCancelled:     "Cancelled",

    productsTitle:       "Products",
    noProductsFound:     "No products found",
    filters:             "Filters",
    sortBy:              "Sort by",
    priceLowHigh:        "Price: low to high",
    priceHighLow:        "Price: high to low",
    newest:              "Newest",
    bestSelling:         "Best selling",

    orderSuccess:        "Your order has been placed successfully!",
    orderPending:        "Your order is under review",
    orderPendingHint:    "The support team will contact you on WhatsApp shortly to complete payment",
    orderProcessing:     "Processing your order",
    orderNumberLabel:    "Order #",
    continueShopping:    "Continue shopping",
    viewOrders:          "View my orders",
  },
} as const;

export type Lang = keyof typeof dict;
export type TranslationKey = keyof typeof dict.ar;

/**
 * Client-side translation hook. Reads `lang` from the persist store,
 * guards against hydration mismatch by returning Arabic strings on the
 * SSR + first client render (same pattern as `Header`), then swaps to
 * the picked language after mount.
 *
 * Returns `{ t, lang, dir }` — `t` is a lookup fn keyed by the string
 * key, `dir` is the corresponding `ltr`/`rtl` for the current lang.
 */
export function useT(): {
  t: (key: TranslationKey) => string;
  lang: Lang;
  dir: "ltr" | "rtl";
  isEn: boolean;
} {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const rawLang = useLocaleStore((s) => s.lang);
  const lang: Lang = mounted ? rawLang : "ar";
  const t = (key: TranslationKey) => dict[lang][key];
  return { t, lang, dir: lang === "en" ? "ltr" : "rtl", isEn: lang === "en" };
}
