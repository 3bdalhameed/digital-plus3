// @ts-nocheck
import React, { useEffect, useState } from 'react'
import { useConfig } from 'payload/components/utilities'

const D = {
  bg:      '#f6f8fa',
  surface: '#ffffff',
  border:  '#d0d7de',
  text:    '#1f2328',
  sub:     '#656d76',
  green:   '#1a7f37',
}

type Stats = { orders: number; customers: number; products: number; revenue: number }
type RecentOrder = { id: string; orderNumber: string; status: string; totalAmount: number; currency: string; createdAt: string }

const statusColors: Record<string, { bg: string; color: string; label: string }> = {
  pending:   { bg: '#fff8c5', color: '#9a6700', label: 'قيد الانتظار' },
  paid:      { bg: '#dafbe1', color: '#1a7f37', label: 'مدفوع' },
  delivered: { bg: '#dafbe1', color: '#1a7f37', label: 'تم التسليم' },
  disputed:  { bg: '#ffebe9', color: '#cf222e', label: 'متنازع عليه' },
  refunded:  { bg: '#f6f8fa', color: '#656d76', label: 'مسترد' },
  cancelled: { bg: '#ffebe9', color: '#cf222e', label: 'ملغي' },
}

const StatCard = ({ label, value, icon, accent }: { label: string; value: string; icon: string; accent: string }) => (
  <div style={{
    background: D.surface,
    border: `1px solid ${D.border}`,
    borderRadius: 10,
    padding: '20px 24px',
    display: 'flex',
    alignItems: 'center',
    flexDirection: 'row-reverse',
    gap: 16,
    flex: '1 1 200px',
  }}>
    <div style={{
      width: 48, height: 48, borderRadius: 10,
      background: accent + '22',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 22,
    }}>
      {icon}
    </div>
    <div style={{ textAlign: 'right' }}>
      <div style={{ fontSize: 12, color: D.sub, fontWeight: 500, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 700, color: D.text }}>{value}</div>
    </div>
  </div>
)

const Dashboard: React.FC = () => {
  const { serverURL, routes: { api } } = useConfig()
  const [stats, setStats] = useState<Stats>({ orders: 0, customers: 0, products: 0, revenue: 0 })
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [ordersRes, customersRes, productsRes] = await Promise.all([
          fetch(`${serverURL}${api}/orders?limit=5&sort=-createdAt`, { credentials: 'include' }),
          fetch(`${serverURL}${api}/customers?limit=0`, { credentials: 'include' }),
          fetch(`${serverURL}${api}/products?limit=0`, { credentials: 'include' }),
        ])
        const [orders, customers, products] = await Promise.all([ordersRes.json(), customersRes.json(), productsRes.json()])
        const revenue = (orders.docs ?? []).reduce((sum: number, o: any) => sum + (o.totalAmount ?? 0), 0)
        setStats({ orders: orders.totalDocs ?? 0, customers: customers.totalDocs ?? 0, products: products.totalDocs ?? 0, revenue })
        setRecentOrders((orders.docs ?? []).map((o: any) => ({
          id: o.id,
          orderNumber: o.orderNumber ?? `#${o.id.slice(0, 6)}`,
          status: o.status ?? 'pending',
          totalAmount: o.totalAmount ?? 0,
          currency: o.currency ?? 'USD',
          createdAt: o.createdAt,
        })))
      } catch { } finally { setLoading(false) }
    }
    load()
  }, [serverURL, api])

  const fmt = (n: number) => new Intl.NumberFormat('ar-SA').format(n)
  const fmtDate = (d: string) => new Date(d).toLocaleDateString('ar-SA', { month: 'short', day: 'numeric', year: 'numeric' })

  return (
    <div dir="rtl" style={{ padding: '36px', maxWidth: 1200, margin: '0 auto', fontFamily: "'Cairo', 'Tajawal', 'Segoe UI', Tahoma, sans-serif", color: D.text, direction: 'rtl' }}>

      {/* Header */}
      <div style={{ marginBottom: 32, textAlign: 'right' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: D.text, margin: 0 }}>نظرة عامة</h1>
        <p style={{ fontSize: 14, color: D.sub, marginTop: 6 }}>مرحباً بك! إليك ما يحدث في متجرك.</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 28 }}>
        <StatCard label="إجمالي الطلبات"    value={loading ? '—' : fmt(stats.orders)}              icon="📦" accent="#3fb950" />
        <StatCard label="العملاء"            value={loading ? '—' : fmt(stats.customers)}            icon="👤" accent="#58a6ff" />
        <StatCard label="المنتجات"           value={loading ? '—' : fmt(stats.products)}             icon="🏷️" accent="#f0a83a" />
        <StatCard label="الإيرادات (آخر 5)"  value={loading ? '—' : `$${fmt(stats.revenue)}`}       icon="💰" accent="#bc8cff" />
      </div>

      {/* Quick actions */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 32, justifyContent: 'flex-start' }}>
        {[
          { label: 'إضافة منتج +',    href: '/admin/collections/products/create',   primary: true },
          { label: 'إضافة تصنيف +',  href: '/admin/collections/categories/create',  primary: true, accent: '#1f6feb' },
          { label: 'عرض الطلبات',     href: '/admin/collections/orders',             primary: false },
          { label: 'عرض العملاء',     href: '/admin/collections/customers',          primary: false },
        ].map(({ label, href, primary, accent }) => (
          <a key={href} href={href} style={{
            padding: '8px 18px',
            background: primary ? (accent ?? D.green) : D.surface,
            color: primary ? '#fff' : D.text,
            border: `1px solid ${primary ? (accent ?? D.green) : D.border}`,
            borderRadius: 6,
            fontSize: 13,
            fontWeight: 600,
            textDecoration: 'none',
          }}>
            {label}
          </a>
        ))}
      </div>

      {/* Recent orders */}
      <div style={{ background: D.surface, border: `1px solid ${D.border}`, borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ padding: '16px 24px', borderBottom: `1px solid ${D.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <a href="/admin/collections/orders" style={{ fontSize: 13, color: '#58a6ff', textDecoration: 'none', fontWeight: 600 }}>← عرض الكل</a>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: D.text, margin: 0 }}>الطلبات الأخيرة</h2>
        </div>

        {loading ? (
          <div style={{ padding: 32, textAlign: 'center', color: D.sub }}>جاري التحميل...</div>
        ) : recentOrders.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: D.sub }}>لا توجد طلبات بعد. ستظهر هنا عند وصول أول طلب.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['المبلغ', 'الحالة', 'التاريخ', 'رقم الطلب'].map(h => (
                  <th key={h} style={{ padding: '10px 24px', textAlign: 'right', fontSize: 11, fontWeight: 600, color: D.sub, textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: `1px solid ${D.border}`, background: D.bg }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order, i) => {
                const badge = statusColors[order.status] ?? { bg: '#21262d', color: '#8b949e', label: order.status }
                return (
                  <tr key={order.id} style={{ borderBottom: i < recentOrders.length - 1 ? `1px solid ${D.border}` : 'none' }}>
                    <td style={{ padding: '14px 24px', fontSize: 14, fontWeight: 600, color: D.text, textAlign: 'right' }}>
                      {order.totalAmount} {order.currency}
                    </td>
                    <td style={{ padding: '14px 24px', textAlign: 'right' }}>
                      <span style={{ background: badge.bg, color: badge.color, padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                        {badge.label}
                      </span>
                    </td>
                    <td style={{ padding: '14px 24px', fontSize: 14, color: D.sub, textAlign: 'right' }}>{fmtDate(order.createdAt)}</td>
                    <td style={{ padding: '14px 24px', textAlign: 'right' }}>
                      <a href={`/admin/collections/orders/${order.id}`} style={{ color: '#58a6ff', textDecoration: 'none', fontWeight: 600, fontSize: 14 }}>
                        {order.orderNumber}
                      </a>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

export default Dashboard
