// @ts-nocheck
import React, { useEffect, useState } from 'react'
import { useConfig } from 'payload/components/utilities'

const D = {
  bg:      '#0d1117',
  surface: '#161b22',
  border:  '#30363d',
  text:    '#e6edf3',
  sub:     '#8b949e',
  green:   '#238636',
  greenHover: '#2ea043',
}

type Stats = { orders: number; customers: number; products: number; revenue: number }
type RecentOrder = { id: string; orderNumber: string; status: string; totalAmount: number; currency: string; createdAt: string }

const statusColors: Record<string, { bg: string; color: string; label: string }> = {
  pending:   { bg: '#3d2b00', color: '#f0a83a', label: 'Pending' },
  paid:      { bg: '#0d2e1a', color: '#3fb950', label: 'Paid' },
  delivered: { bg: '#0d2e1a', color: '#3fb950', label: 'Delivered' },
  disputed:  { bg: '#3d0d0d', color: '#f85149', label: 'Disputed' },
  refunded:  { bg: '#21262d', color: '#8b949e', label: 'Refunded' },
  cancelled: { bg: '#3d0d0d', color: '#f85149', label: 'Cancelled' },
}

const StatCard = ({ label, value, icon, accent }: { label: string; value: string; icon: string; accent: string }) => (
  <div style={{
    background: D.surface,
    border: `1px solid ${D.border}`,
    borderRadius: 10,
    padding: '20px 24px',
    display: 'flex',
    alignItems: 'center',
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
    <div>
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

  const fmt = (n: number) => new Intl.NumberFormat('en-US').format(n)
  const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  return (
    <div style={{ padding: '36px', maxWidth: 1200, margin: '0 auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: D.text }}>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: D.text, margin: 0 }}>Overview</h1>
        <p style={{ fontSize: 14, color: D.sub, marginTop: 6 }}>Welcome back! Here's what's happening in your store.</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 28 }}>
        <StatCard label="Total Orders"      value={loading ? '—' : fmt(stats.orders)}                  icon="📦" accent="#3fb950" />
        <StatCard label="Customers"         value={loading ? '—' : fmt(stats.customers)}               icon="👤" accent="#58a6ff" />
        <StatCard label="Products"          value={loading ? '—' : fmt(stats.products)}                icon="🏷️" accent="#f0a83a" />
        <StatCard label="Revenue (recent 5)" value={loading ? '—' : `$${fmt(stats.revenue)}`}         icon="💰" accent="#bc8cff" />
      </div>

      {/* Quick actions */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 32 }}>
        {[
          { label: '+ Add Product',  href: '/admin/collections/products/create',  primary: true },
          { label: '+ Add Category', href: '/admin/collections/categories/create', primary: true, accent: '#1f6feb' },
          { label: 'View Orders',    href: '/admin/collections/orders',            primary: false },
          { label: 'View Customers', href: '/admin/collections/customers',         primary: false },
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
            transition: 'opacity .15s',
          }}>
            {label}
          </a>
        ))}
      </div>

      {/* Recent orders */}
      <div style={{ background: D.surface, border: `1px solid ${D.border}`, borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ padding: '16px 24px', borderBottom: `1px solid ${D.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: D.text, margin: 0 }}>Recent Orders</h2>
          <a href="/admin/collections/orders" style={{ fontSize: 13, color: '#58a6ff', textDecoration: 'none', fontWeight: 600 }}>View all →</a>
        </div>

        {loading ? (
          <div style={{ padding: 32, textAlign: 'center', color: D.sub }}>Loading...</div>
        ) : recentOrders.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: D.sub }}>No orders yet. When customers place orders they'll appear here.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Order', 'Date', 'Status', 'Amount'].map(h => (
                  <th key={h} style={{ padding: '10px 24px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: D.sub, textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: `1px solid ${D.border}`, background: D.bg }}>
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
                    <td style={{ padding: '14px 24px' }}>
                      <a href={`/admin/collections/orders/${order.id}`} style={{ color: '#58a6ff', textDecoration: 'none', fontWeight: 600, fontSize: 14 }}>
                        {order.orderNumber}
                      </a>
                    </td>
                    <td style={{ padding: '14px 24px', fontSize: 14, color: D.sub }}>{fmtDate(order.createdAt)}</td>
                    <td style={{ padding: '14px 24px' }}>
                      <span style={{ background: badge.bg, color: badge.color, padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                        {badge.label}
                      </span>
                    </td>
                    <td style={{ padding: '14px 24px', fontSize: 14, fontWeight: 600, color: D.text }}>
                      {order.totalAmount} {order.currency}
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
