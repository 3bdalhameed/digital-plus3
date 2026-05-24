// @ts-nocheck
import React, { useEffect, useState } from 'react'
import { useConfig } from 'payload/components/utilities'

const B = {
  purple:      '#7C3AED',
  purpleMid:   '#9333EA',
  purpleLight: '#EDE9FE',
  purpleDeep:  '#5B21B6',
  navy:        '#1E1B4B',
  bg:          '#F5F3FF',
  surface:     '#FFFFFF',
  border:      '#EDE9FE',
  borderMid:   '#DDD6FE',
  text:        '#1E1B4B',
  sub:         '#5B21B6',
  muted:       '#6B7280',
  green:       '#059669',
  blue:        '#2563EB',
  amber:       '#D97706',
}

const statusBadge: Record<string, { bg: string; color: string; label: string; icon: string }> = {
  pending:   { bg: '#FEF9C3', color: '#854D0E', label: 'قيد الانتظار', icon: '🕐' },
  paid:      { bg: '#DCFCE7', color: '#166534', label: 'مدفوع',         icon: '✅' },
  delivered: { bg: '#EDE9FE', color: '#5B21B6', label: 'تم التسليم',   icon: '📦' },
  disputed:  { bg: '#FEE2E2', color: '#991B1B', label: 'متنازع عليه',  icon: '⚠️' },
  refunded:  { bg: '#F3F4F6', color: '#374151', label: 'مسترد',         icon: '🔄' },
  cancelled: { bg: '#FEE2E2', color: '#991B1B', label: 'ملغي',          icon: '❌' },
}

type Stats = { orders: number; customers: number; products: number; revenue: number }
type RecentOrder = { id: string; orderNumber: string; status: string; totalAmount: number; currency: string; createdAt: string }

/* ─── Skeleton bar ─── */
const Skel = ({ w = 80, h = 16 }: { w?: number; h?: number }) => (
  <span style={{ display: 'inline-block', width: w, height: h, borderRadius: 6, background: '#EDE9FE', animation: 'skel 1.4s ease-in-out infinite' }} />
)

/* ─── Stat card ─── */
const StatCard = ({ label, value, icon, gradient, loading }: any) => (
  <div style={{
    background: B.surface, border: `1px solid ${B.border}`, borderRadius: 16,
    padding: '20px 22px', flex: '1 1 180px', minWidth: 160,
    display: 'flex', alignItems: 'center', gap: 16, flexDirection: 'row-reverse',
    boxShadow: '0 2px 10px rgba(124,58,237,0.07)', position: 'relative', overflow: 'hidden',
    animation: 'fadeUp 0.4s ease both',
  }}>
    {/* Ghost blob */}
    <div style={{ position: 'absolute', top: -30, left: -30, width: 100, height: 100, borderRadius: '50%', background: gradient, opacity: 0.07, pointerEvents: 'none' }} />
    {/* Icon badge */}
    <div style={{
      width: 52, height: 52, borderRadius: 13, background: gradient, flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
      boxShadow: '0 4px 14px rgba(0,0,0,0.18)',
    }}>{icon}</div>
    {/* Text */}
    <div style={{ textAlign: 'right', flex: 1 }}>
      <div style={{ fontSize: 11, color: B.muted, fontWeight: 600, marginBottom: 5, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: 30, fontWeight: 800, color: B.text, lineHeight: 1 }}>
        {loading ? <Skel w={70} h={30} /> : value}
      </div>
    </div>
  </div>
)

/* ─── Quick action button ─── */
const Action = ({ label, href, gradient, outlined }: any) => (
  <a href={href} style={{
    padding: '10px 20px',
    background: outlined ? B.surface : gradient,
    color: outlined ? B.purple : '#fff',
    border: `1.5px solid ${outlined ? B.borderMid : 'transparent'}`,
    borderRadius: 10, fontSize: 13, fontWeight: 700, textDecoration: 'none',
    boxShadow: outlined ? 'none' : '0 3px 10px rgba(124,58,237,0.25)',
    transition: 'all 0.15s', display: 'inline-block',
  }}
    onMouseOver={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = outlined ? '0 2px 8px rgba(124,58,237,0.12)' : '0 6px 18px rgba(124,58,237,0.35)'; }}
    onMouseOut={e => { (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.boxShadow = outlined ? 'none' : '0 3px 10px rgba(124,58,237,0.25)'; }}
  >{label}</a>
)

/* ════════════════════ Dashboard ════════════════════ */
const Dashboard: React.FC = () => {
  const { serverURL, routes: { api } } = useConfig()
  const [stats, setStats]             = useState<Stats>({ orders: 0, customers: 0, products: 0, revenue: 0 })
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([])
  const [loading, setLoading]         = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [ordersRes, customersRes, productsRes] = await Promise.all([
          fetch(`${serverURL}${api}/orders?limit=5&sort=-createdAt`, { credentials: 'include' }),
          fetch(`${serverURL}${api}/customers?limit=0`, { credentials: 'include' }),
          fetch(`${serverURL}${api}/products?limit=0`, { credentials: 'include' }),
        ])
        const [orders, customers, products] = await Promise.all([
          ordersRes.json(), customersRes.json(), productsRes.json()
        ])
        const revenue = (orders.docs ?? [])
          .filter((o: any) => o.status === 'paid' || o.status === 'delivered')
          .reduce((s: number, o: any) => s + (o.totalAmount ?? 0), 0)

        setStats({ orders: orders.totalDocs ?? 0, customers: customers.totalDocs ?? 0, products: products.totalDocs ?? 0, revenue })
        setRecentOrders((orders.docs ?? []).map((o: any) => ({
          id: o.id,
          orderNumber: o.orderNumber ?? `#${String(o.id).slice(0, 8)}`,
          status: o.status ?? 'pending',
          totalAmount: o.totalAmount ?? 0,
          currency: o.currency ?? 'USD',
          createdAt: o.createdAt,
        })))
      } catch { }
      finally { setLoading(false) }
    }
    load()
  }, [serverURL, api])

  const fmt     = (n: number) => new Intl.NumberFormat('ar-SA').format(n)
  const fmtDate = (d: string) => new Date(d).toLocaleDateString('ar-SA', { day: 'numeric', month: 'short', year: 'numeric' })
  const now     = new Date().toLocaleDateString('ar-SA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div dir="rtl" style={{
      padding: '32px 40px', maxWidth: 1300, margin: '0 auto',
      fontFamily: "'Cairo','Tajawal','Segoe UI',Tahoma,sans-serif",
      color: B.text, direction: 'rtl', background: B.bg, minHeight: '100vh',
    }}>

      {/* ── Keyframes ── */}
      <style>{`
        @keyframes skel    { 0%,100%{opacity:1} 50%{opacity:0.45} }
        @keyframes fadeUp  { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:none} }
        @keyframes shimmer { from{background-position:200% center} to{background-position:-200% center} }
        .dash-tr:hover td  { background:#F9F7FF !important; }
        .dash-tr           { transition: background 0.1s; }
      `}</style>

      {/* ══ Welcome Banner ══ */}
      <div style={{
        background: 'linear-gradient(135deg, #1E1B4B 0%, #3B0764 45%, #7C3AED 100%)',
        borderRadius: 20, padding: '30px 36px', marginBottom: 28,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        overflow: 'hidden', position: 'relative',
        boxShadow: '0 8px 32px rgba(124,58,237,0.3)',
        animation: 'fadeUp 0.35s ease',
      }}>
        {/* Decorative circles */}
        {[['-50px','-50px',200,0.05],['-20px','auto',120,0.04,'auto','30px']].map(([t,l,s,o,b,r],i) => (
          <div key={i} style={{ position:'absolute', top:t as any, left:l as any, bottom:b as any, right:r as any, width:s as any, height:s as any, borderRadius:'50%', background:'rgba(255,255,255,0.06)', pointerEvents:'none' }} />
        ))}
        <div style={{ position:'relative', zIndex:1 }}>
          <p style={{ color:'#C4B5FD', fontSize:13, margin:'0 0 6px', fontWeight:500 }}>{now}</p>
          <h1 style={{ color:'#FFFFFF', fontSize:26, fontWeight:800, margin:'0 0 6px', lineHeight:1.2 }}>
            مرحباً بك في لوحة التحكم
          </h1>
          <p style={{ color:'#A78BFA', fontSize:14, margin:0 }}>
            إليك نظرة سريعة على أداء متجرك
          </p>
        </div>
        <div style={{ fontSize:64, opacity:0.9, position:'relative', zIndex:1, filter:'drop-shadow(0 4px 8px rgba(0,0,0,0.3))' }}>
          📊
        </div>
      </div>

      {/* ══ Stats Row ══ */}
      <div style={{ display:'flex', gap:14, flexWrap:'wrap', marginBottom:24 }}>
        <StatCard label="إجمالي الطلبات"    value={fmt(stats.orders)}          icon="📦" gradient="linear-gradient(135deg,#7C3AED,#A855F7)" loading={loading} />
        <StatCard label="العملاء"            value={fmt(stats.customers)}        icon="👤" gradient="linear-gradient(135deg,#2563EB,#60A5FA)" loading={loading} />
        <StatCard label="المنتجات"           value={fmt(stats.products)}         icon="🏷️" gradient="linear-gradient(135deg,#D97706,#FBBF24)" loading={loading} />
        <StatCard label="الإيرادات المؤكدة"  value={`$${fmt(stats.revenue)}`}   icon="💰" gradient="linear-gradient(135deg,#059669,#34D399)" loading={loading} />
      </div>

      {/* ══ Quick Actions ══ */}
      <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginBottom:28, alignItems:'center' }}>
        <Action label="＋ منتج جديد"   href="/admin/collections/products/create"   gradient="linear-gradient(135deg,#7C3AED,#9333EA)" />
        <Action label="＋ تصنيف جديد" href="/admin/collections/categories/create"  gradient="linear-gradient(135deg,#2563EB,#3B82F6)" />
        <Action label="📋 الطلبات"     href="/admin/collections/orders"             outlined />
        <Action label="👥 العملاء"     href="/admin/collections/customers"          outlined />
        <Action label="🏷️ المنتجات"   href="/admin/collections/products"           outlined />
        <Action label="⚙️ الإعدادات"  href="/admin/globals/settings"               outlined />
      </div>

      {/* ══ Recent Orders Table ══ */}
      <div style={{
        background: B.surface, border: `1px solid ${B.border}`, borderRadius: 18,
        overflow: 'hidden', boxShadow: '0 4px 20px rgba(124,58,237,0.09)',
        animation: 'fadeUp 0.5s ease 0.15s both',
      }}>

        {/* Table header bar */}
        <div style={{
          padding: '18px 28px', borderBottom: `1px solid ${B.border}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'linear-gradient(90deg, #F5F3FF 0%, #FFFFFF 100%)',
        }}>
          <h2 style={{ fontSize:16, fontWeight:800, color:B.text, margin:0 }}>
            📋 الطلبات الأخيرة
          </h2>
          <a href="/admin/collections/orders" style={{
            fontSize:13, color:B.purple, textDecoration:'none', fontWeight:700,
            background:B.purpleLight, padding:'6px 14px', borderRadius:8,
            transition:'background 0.15s',
          }}>
            عرض الكل &larr;
          </a>
        </div>

        {/* Loading state — skeleton rows */}
        {loading ? (
          <div>
            {[1,2,3].map(i => (
              <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'16px 28px', borderBottom:`1px solid ${B.border}`, gap:16 }}>
                <Skel w={90} /><Skel w={80} /><Skel w={100} /><Skel w={60} />
              </div>
            ))}
          </div>
        ) : recentOrders.length === 0 ? (
          /* Empty state */
          <div style={{ padding:'64px 32px', textAlign:'center' }}>
            <div style={{ fontSize:52, marginBottom:14 }}>📭</div>
            <p style={{ color:B.muted, fontSize:15, fontWeight:500, margin:0 }}>
              لا توجد طلبات بعد — ستظهر هنا فور وصول أول طلب
            </p>
          </div>
        ) : (
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr>
                {['رقم الطلب','التاريخ','الحالة','المبلغ'].map(h => (
                  <th key={h} style={{
                    padding:'11px 28px', textAlign:'right',
                    fontSize:11, fontWeight:700, color:B.sub,
                    letterSpacing:'0.07em', textTransform:'uppercase',
                    borderBottom:`2px solid ${B.border}`, background:'#F9F7FF',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order, i) => {
                const badge = statusBadge[order.status] ?? { bg:'#F3F4F6', color:'#374151', label:order.status, icon:'📋' }
                return (
                  <tr key={order.id} className="dash-tr" style={{
                    borderBottom: i < recentOrders.length - 1 ? `1px solid ${B.border}` : 'none',
                  }}>
                    <td style={{ padding:'15px 28px' }}>
                      <a href={`/admin/collections/orders/${order.id}`} style={{
                        color:B.purple, fontWeight:700, textDecoration:'none', fontSize:14,
                        fontFamily:'monospace', letterSpacing:'0.02em',
                      }}>
                        {order.orderNumber}
                      </a>
                    </td>
                    <td style={{ padding:'15px 28px', fontSize:13, color:B.muted }}>
                      {fmtDate(order.createdAt)}
                    </td>
                    <td style={{ padding:'15px 28px' }}>
                      <span style={{
                        background:badge.bg, color:badge.color,
                        padding:'4px 12px', borderRadius:20,
                        fontSize:12, fontWeight:700,
                        display:'inline-flex', alignItems:'center', gap:5,
                        whiteSpace:'nowrap',
                      }}>
                        {badge.icon} {badge.label}
                      </span>
                    </td>
                    <td style={{ padding:'15px 28px', fontWeight:700, color:B.text, fontSize:14 }}>
                      {order.totalAmount.toLocaleString('ar-SA')} {order.currency}
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
