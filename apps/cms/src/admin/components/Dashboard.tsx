// @ts-nocheck
import React, { useEffect, useState } from 'react'
import { useConfig } from 'payload/components/utilities'

/* ─── Design tokens ─── */
const C = {
  purple:   '#7C3AED', purpleMid: '#9333EA', purpleDeep: '#5B21B6',
  purplePale:'#EDE9FE', purpleGhost:'#F5F3FF',
  navy:     '#1E1B4B', text: '#1E1B4B', muted: '#6B7280', sub: '#5B21B6',
  surface:  '#FFFFFF', border: '#EDE9FE', borderMid: '#DDD6FE',
  green: '#059669', greenPale: '#DCFCE7', greenDark: '#166534',
  amber: '#D97706', amberPale: '#FEF9C3', amberDark: '#854D0E',
  red:   '#DC2626', redPale:   '#FEE2E2', redDark:   '#991B1B',
  blue:  '#2563EB',
}

/* ─── Status badge config ─── */
const STATUS: Record<string, { bg: string; color: string; label: string; icon: string }> = {
  pending:   { bg: C.amberPale, color: C.amberDark, label: 'قيد الانتظار', icon: '🕐' },
  paid:      { bg: C.greenPale, color: C.greenDark,  label: 'مدفوع',        icon: '✅' },
  delivered: { bg: C.purplePale,color: C.purpleDeep, label: 'تم التسليم',  icon: '📦' },
  disputed:  { bg: C.redPale,   color: C.redDark,    label: 'متنازع عليه', icon: '⚠️' },
  refunded:  { bg: '#F3F4F6',   color: '#374151',    label: 'مسترد',        icon: '🔄' },
  cancelled: { bg: C.redPale,   color: C.redDark,    label: 'ملغي',         icon: '❌' },
}

/* ─── Tiny helpers ─── */
const Skel = ({ w = 80, h = 16 }: { w?: number; h?: number }) => (
  <span style={{ display:'inline-block', width:w, height:h, borderRadius:6, background:C.purplePale, animation:'skel 1.4s ease-in-out infinite' }} />
)

const Card = ({ children, style = {} }: any) => (
  <div style={{
    background:C.surface, border:`1px solid ${C.border}`, borderRadius:16,
    boxShadow:'0 2px 12px rgba(124,58,237,0.07)', overflow:'hidden', ...style,
  }}>{children}</div>
)

const SectionHeader = ({ title, link, linkLabel }: any) => (
  <div style={{
    padding:'16px 24px', borderBottom:`1px solid ${C.border}`,
    display:'flex', justifyContent:'space-between', alignItems:'center',
    background:'linear-gradient(90deg,#F5F3FF,#FFFFFF)',
  }}>
    <a href={link} style={{ fontSize:12, color:C.purple, fontWeight:700, textDecoration:'none', background:C.purplePale, padding:'5px 12px', borderRadius:7 }}>
      {linkLabel} &larr;
    </a>
    <h2 style={{ fontSize:15, fontWeight:800, color:C.text, margin:0 }}>{title}</h2>
  </div>
)

/* ─── Stat card ─── */
const StatCard = ({ label, value, icon, gradient, sublabel, loading, animDelay = 0 }: any) => (
  <div style={{
    background:C.surface, border:`1px solid ${C.border}`, borderRadius:16,
    padding:'20px 22px', flex:'1 1 160px', minWidth:150,
    display:'flex', alignItems:'center', gap:14, flexDirection:'row-reverse',
    boxShadow:'0 2px 10px rgba(124,58,237,0.07)',
    position:'relative', overflow:'hidden',
    animation:`fadeUp 0.4s ease ${animDelay}s both`,
  }}>
    <div style={{ position:'absolute', top:-28, left:-28, width:90, height:90, borderRadius:'50%', background:gradient, opacity:0.07, pointerEvents:'none' }} />
    <div style={{ width:50, height:50, borderRadius:13, background:gradient, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, boxShadow:'0 4px 12px rgba(0,0,0,0.15)' }}>
      {icon}
    </div>
    <div style={{ textAlign:'right', flex:1 }}>
      <div style={{ fontSize:10, color:C.muted, fontWeight:700, marginBottom:4, letterSpacing:'0.07em', textTransform:'uppercase' }}>{label}</div>
      <div style={{ fontSize:28, fontWeight:800, color:C.text, lineHeight:1 }}>
        {loading ? <Skel w={64} h={28} /> : value}
      </div>
      {sublabel && !loading && (
        <div style={{ fontSize:11, color:C.muted, marginTop:3 }}>{sublabel}</div>
      )}
    </div>
  </div>
)

/* ─── Attention row ─── */
const AttentionRow = ({ order, fmtDate }: any) => {
  const badge = STATUS[order.status] ?? STATUS.pending
  return (
    <div style={{
      display:'flex', justifyContent:'space-between', alignItems:'center',
      padding:'12px 24px', borderBottom:`1px solid ${C.border}`,
      transition:'background 0.1s',
    }}
      onMouseOver={e => (e.currentTarget.style.background = C.purpleGhost)}
      onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
    >
      <span style={{ fontSize:13, fontWeight:700, color:C.text }}>
        {order.totalAmount.toLocaleString()} {order.currency}
      </span>
      <span style={{ background:badge.bg, color:badge.color, padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700 }}>
        {badge.icon} {badge.label}
      </span>
      <span style={{ fontSize:12, color:C.muted }}>{fmtDate(order.createdAt)}</span>
      <a href={`/admin/collections/orders/${order.id}`} style={{ color:C.purple, fontSize:12, fontWeight:700, textDecoration:'none', background:C.purplePale, padding:'4px 10px', borderRadius:6 }}>
        {order.orderNumber}
      </a>
    </div>
  )
}

/* ══════════════════════════════ Dashboard ══════════════════════════════ */
type Stats = { orders: number; customers: number; products: number; tickets: number; revenue: number; pendingCount: number; disputedCount: number }
type Order  = { id: string; orderNumber: string; status: string; totalAmount: number; currency: string; createdAt: string }

const CACHE_KEY = 'dp-dashboard-v1'
const CACHE_TTL_MS = 60_000

const Dashboard: React.FC = () => {
  const { serverURL, routes: { api } } = useConfig()
  // Read any sessionStorage cache on the FIRST render so revisiting the
  // dashboard during the same session shows numbers instantly while a
  // background refetch runs.
  const initial = (() => {
    try {
      const raw = sessionStorage.getItem(CACHE_KEY)
      if (!raw) return null
      const parsed = JSON.parse(raw)
      if (Date.now() - parsed.t > CACHE_TTL_MS) return null
      return parsed
    } catch { return null }
  })()
  const [stats, setStats]         = useState<Stats>(initial?.stats ?? { orders:0, customers:0, products:0, tickets:0, revenue:0, pendingCount:0, disputedCount:0 })
  const [recent, setRecent]       = useState<Order[]>(initial?.recent ?? [])
  const [attention, setAttention] = useState<Order[]>(initial?.attention ?? [])
  // No spinner if we already have a cached snapshot; just refresh quietly.
  const [loading, setLoading]     = useState(!initial)

  useEffect(() => {
    let cancelled = false
    const j = (url: string) => fetch(url, { credentials:'include' }).then(r => r.json()).catch(() => ({}))
    const base = `${serverURL}${api}`

    const load = async () => {
      // Single Promise.all: fetch + parse in one round-trip per endpoint.
      // allSettled-style resilience inline via .catch above; one slow
      // endpoint can't block the others past their own latency.
      const [recentOrders, customers, products, tickets, dispOrders] = await Promise.all([
        j(`${base}/orders?limit=5&sort=-createdAt&depth=0`),
        j(`${base}/customers?limit=0&depth=0`),
        j(`${base}/products?limit=0&depth=0`),
        j(`${base}/support-tickets?limit=0&depth=0&where[status][not_equals]=resolved`),
        j(`${base}/orders?limit=10&depth=0&where[status][in][]=disputed&where[status][in][]=pending&sort=-createdAt`),
      ])
      if (cancelled) return

      const pendingList = (dispOrders.docs ?? []).filter((o: any) => o.status === 'pending' || o.status === 'disputed')
      const nextStats: Stats = {
        orders:       recentOrders.totalDocs ?? 0,
        customers:    customers.totalDocs ?? 0,
        products:     products.totalDocs ?? 0,
        tickets:      tickets.totalDocs ?? 0,
        // Revenue dropped from initial fetch -- summing N orders client-side
        // doesn't scale and the previous query returned 0 rows anyway
        // (limit=0 means count-only on Payload v2). Keep the slot in the
        // Stats shape but always 0; we'll wire a server-side sum later.
        revenue: 0,
        pendingCount: (dispOrders.docs ?? []).filter((o: any) => o.status === 'pending').length,
        disputedCount:(dispOrders.docs ?? []).filter((o: any) => o.status === 'disputed').length,
      }
      const mapOrder = (o: any): Order => ({
        id: o.id, orderNumber: o.orderNumber ?? `#${String(o.id).slice(0,8)}`,
        status: o.status ?? 'pending', totalAmount: o.totalAmount ?? 0,
        currency: o.currency ?? 'USD', createdAt: o.createdAt,
      })
      const nextRecent    = (recentOrders.docs ?? []).map(mapOrder)
      const nextAttention = pendingList.map(mapOrder)

      setStats(nextStats); setRecent(nextRecent); setAttention(nextAttention)
      setLoading(false)
      try {
        sessionStorage.setItem(CACHE_KEY, JSON.stringify({ t: Date.now(), stats: nextStats, recent: nextRecent, attention: nextAttention }))
      } catch {}
    }
    load().catch(e => { console.error('[Dashboard]', e); setLoading(false) })
    return () => { cancelled = true }
  }, [serverURL, api])

  const fmt     = (n: number) => new Intl.NumberFormat('en-US').format(n)
  const fmtDate = (d: string) => new Date(d).toLocaleDateString('ar-u-nu-latn', { day:'numeric', month:'short', year:'numeric' })
  const today   = new Date().toLocaleDateString('ar-u-nu-latn', { weekday:'long', day:'numeric', month:'long', year:'numeric' })

  return (
    <div dir="rtl" style={{
      padding:'28px 36px', maxWidth:1320, margin:'0 auto', minHeight:'100vh',
      fontFamily:"'Cairo','Tajawal','Segoe UI',Tahoma,sans-serif",
      color:C.text, direction:'rtl', background:'#F5F3FF',
    }}>

      <style>{`
        @keyframes skel   { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:none} }
      `}</style>

      {/* ══ Welcome banner ══ */}
      <div style={{
        background:'linear-gradient(135deg,#1E1B4B 0%,#3B0764 45%,#7C3AED 100%)',
        borderRadius:20, padding:'28px 36px', marginBottom:24,
        display:'flex', justifyContent:'space-between', alignItems:'center',
        boxShadow:'0 8px 32px rgba(124,58,237,0.28)', position:'relative', overflow:'hidden',
        animation:'fadeUp 0.35s ease',
      }}>
        <div style={{ position:'absolute', top:-50, left:-50, width:200, height:200, borderRadius:'50%', background:'rgba(255,255,255,0.04)', pointerEvents:'none' }} />
        <div style={{ position:'relative', zIndex:1 }}>
          <p style={{ color:'#A78BFA', fontSize:13, margin:'0 0 6px', fontWeight:500 }}>{today}</p>
          <h1 style={{ color:'#FFFFFF', fontSize:24, fontWeight:800, margin:'0 0 6px', lineHeight:1.25 }}>لوحة التحكم</h1>
          <p style={{ color:'#C4B5FD', fontSize:14, margin:0 }}>مرحباً بك — إليك نظرة سريعة على أداء متجرك</p>
        </div>
        <div style={{ fontSize:60, opacity:0.88, position:'relative', zIndex:1, filter:'drop-shadow(0 4px 8px rgba(0,0,0,0.25))' }}>📊</div>
      </div>

      {/* ══ Alerts (pending / disputed) ══ */}
      {!loading && (stats.pendingCount > 0 || stats.disputedCount > 0) && (
        <div style={{
          background:'#FFFBEB', border:'1.5px solid #FDE68A', borderRadius:12,
          padding:'12px 20px', marginBottom:20, display:'flex', alignItems:'center', gap:12,
          animation:'fadeUp 0.4s ease 0.05s both',
        }}>
          <span style={{ fontSize:22 }}>⚠️</span>
          <div style={{ textAlign:'right' }}>
            <span style={{ fontWeight:700, color:'#92400E', fontSize:14 }}>
              تنبيه: لديك{stats.pendingCount > 0 ? ` ${stats.pendingCount} طلب قيد الانتظار` : ''}{stats.pendingCount > 0 && stats.disputedCount > 0 ? ' و' : ''}{stats.disputedCount > 0 ? ` ${stats.disputedCount} طلب متنازع عليه` : ''}
            </span>
          </div>
          <a href="/admin/collections/orders" style={{ marginInlineStart:'auto', background:'#FDE68A', color:'#92400E', padding:'5px 14px', borderRadius:7, fontSize:12, fontWeight:700, textDecoration:'none' }}>
            عرض الطلبات
          </a>
        </div>
      )}

      {/* ══ Stats Row ══ */}
      <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:20 }}>
        <StatCard label="إجمالي الطلبات"   value={fmt(stats.orders)}        icon="📦" gradient="linear-gradient(135deg,#7C3AED,#A855F7)" loading={loading} animDelay={0}    sublabel="كل الطلبات" />
        <StatCard label="العملاء"           value={fmt(stats.customers)}      icon="👤" gradient="linear-gradient(135deg,#2563EB,#60A5FA)" loading={loading} animDelay={0.07} sublabel="مسجّل" />
        <StatCard label="المنتجات"          value={fmt(stats.products)}       icon="🏷️" gradient="linear-gradient(135deg,#D97706,#FBBF24)" loading={loading} animDelay={0.14} sublabel="في الكتالوج" />
        <StatCard label="الإيرادات المؤكدة" value={`$${fmt(stats.revenue)}`} icon="💰" gradient="linear-gradient(135deg,#059669,#34D399)" loading={loading} animDelay={0.21} sublabel="مدفوع + تم التسليم" />
        {stats.tickets > 0 && (
          <StatCard label="تذاكر الدعم"    value={fmt(stats.tickets)}        icon="🎫" gradient="linear-gradient(135deg,#DC2626,#F87171)" loading={loading} animDelay={0.28} sublabel="غير محلولة" />
        )}
      </div>

      {/* ══ Quick Actions ══ */}
      <div style={{ display:'flex', gap:9, flexWrap:'wrap', marginBottom:24, animation:'fadeUp 0.4s ease 0.25s both' }}>
        {[
          { label:'＋ منتج',      href:'/admin/collections/products/create',   fill:true,  g:'linear-gradient(135deg,#7C3AED,#9333EA)' },
          { label:'＋ تصنيف',    href:'/admin/collections/categories/create',  fill:true,  g:'linear-gradient(135deg,#2563EB,#3B82F6)' },
          { label:'📋 الطلبات',   href:'/admin/collections/orders',             fill:false },
          { label:'👥 العملاء',   href:'/admin/collections/customers',          fill:false },
          { label:'🏷️ المنتجات', href:'/admin/collections/products',           fill:false },
          { label:'🌐 الصفحة الرئيسية', href:'/admin/globals/home-page',       fill:false },
          { label:'⚙️ الإعدادات', href:'/admin/globals/settings',              fill:false },
        ].map(({ label, href, fill, g }) => (
          <a key={href} href={href} style={{
            padding:'9px 18px', borderRadius:10, fontSize:13, fontWeight:700,
            textDecoration:'none', transition:'all 0.15s',
            background: fill ? g : C.surface,
            color: fill ? '#fff' : C.purple,
            border:`1.5px solid ${fill ? 'transparent' : C.borderMid}`,
            boxShadow: fill ? '0 3px 10px rgba(124,58,237,0.22)' : 'none',
          }}
            onMouseOver={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow=fill?'0 6px 18px rgba(124,58,237,0.35)':'0 2px 8px rgba(124,58,237,0.12)'; }}
            onMouseOut={e  => { e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow=fill?'0 3px 10px rgba(124,58,237,0.22)':'none'; }}
          >{label}</a>
        ))}
      </div>

      {/* ══ Two-column layout ══ */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, animation:'fadeUp 0.4s ease 0.3s both' }}>

        {/* ── Recent Orders ── */}
        <Card>
          <SectionHeader title="📋 الطلبات الأخيرة" link="/admin/collections/orders" linkLabel="عرض الكل" />
          {loading ? (
            [1,2,3,4].map(i => (
              <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'13px 24px', borderBottom:`1px solid ${C.border}`, gap:12 }}>
                <Skel w={80} /><Skel w={70} /><Skel w={90} />
              </div>
            ))
          ) : recent.length === 0 ? (
            <div style={{ padding:'52px 24px', textAlign:'center' }}>
              <div style={{ fontSize:44, marginBottom:10 }}>📭</div>
              <p style={{ color:C.muted, fontSize:14, margin:0, fontWeight:500 }}>لا توجد طلبات بعد</p>
            </div>
          ) : (
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ background:'#F9F7FF' }}>
                  {['رقم الطلب','الحالة','المبلغ'].map(h => (
                    <th key={h} style={{ padding:'10px 24px', textAlign:'right', fontSize:10, fontWeight:700, color:C.sub, letterSpacing:'0.07em', textTransform:'uppercase', borderBottom:`1px solid ${C.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recent.map((o, i) => {
                  const b = STATUS[o.status] ?? STATUS.pending
                  return (
                    <tr key={o.id} style={{ borderBottom:i<recent.length-1?`1px solid ${C.border}`:'none', transition:'background 0.1s' }}
                      onMouseOver={e => (e.currentTarget.style.background=C.purpleGhost)}
                      onMouseOut={e  => (e.currentTarget.style.background='transparent')}
                    >
                      <td style={{ padding:'13px 24px' }}>
                        <a href={`/admin/collections/orders/${o.id}`} style={{ color:C.purple, fontWeight:700, fontSize:13, textDecoration:'none', fontFamily:'monospace' }}>{o.orderNumber}</a>
                      </td>
                      <td style={{ padding:'13px 24px' }}>
                        <span style={{ background:b.bg, color:b.color, padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700 }}>{b.icon} {b.label}</span>
                      </td>
                      <td style={{ padding:'13px 24px', fontWeight:700, fontSize:13, color:C.text }}>{o.totalAmount.toLocaleString()} {o.currency}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </Card>

        {/* ── Needs Attention ── */}
        <Card>
          <SectionHeader title="⚠️ تحتاج إجراء" link="/admin/collections/orders?where[status][in][]=pending&where[status][in][]=disputed" linkLabel="عرض الكل" />
          {loading ? (
            [1,2,3].map(i => (
              <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'13px 24px', borderBottom:`1px solid ${C.border}`, gap:12 }}>
                <Skel w={80} /><Skel w={70} /><Skel w={90} /><Skel w={60} />
              </div>
            ))
          ) : attention.length === 0 ? (
            <div style={{ padding:'52px 24px', textAlign:'center' }}>
              <div style={{ fontSize:44, marginBottom:10 }}>✅</div>
              <p style={{ color:C.green, fontSize:14, margin:0, fontWeight:700 }}>كل شيء على ما يرام!</p>
              <p style={{ color:C.muted, fontSize:12, margin:'4px 0 0' }}>لا توجد طلبات تحتاج متابعة</p>
            </div>
          ) : (
            attention.map(o => <AttentionRow key={o.id} order={o} fmtDate={fmtDate} />)
          )}
        </Card>

      </div>

      {/* ══ Bottom row: Collections grid ══ */}
      <div style={{ marginTop:20, animation:'fadeUp 0.4s ease 0.4s both' }}>
        <Card>
          <SectionHeader title="🗂️ الوصول السريع" link="/admin" linkLabel="الكل" />
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:12, padding:20 }}>
            {[
              { label:'المنتجات',         href:'/admin/collections/products',     icon:'🏷️', count:stats.products },
              { label:'الطلبات',           href:'/admin/collections/orders',       icon:'📦', count:stats.orders },
              { label:'العملاء',           href:'/admin/collections/customers',    icon:'👥', count:stats.customers },
              { label:'التصنيفات',         href:'/admin/collections/categories',   icon:'📂', count:null },
              { label:'تذاكر الدعم',      href:'/admin/collections/support-tickets', icon:'🎫', count:stats.tickets },
              { label:'الوسائط',           href:'/admin/collections/media',        icon:'🖼️', count:null },
              { label:'الصفحة الرئيسية',  href:'/admin/globals/home-page',        icon:'🏠', count:null },
              { label:'الإعدادات',         href:'/admin/globals/settings',         icon:'⚙️', count:null },
            ].map(({ label, href, icon, count }) => (
              <a key={href} href={href} style={{
                display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
                padding:'18px 12px', background:C.purpleGhost, border:`1px solid ${C.border}`,
                borderRadius:12, textDecoration:'none', transition:'all 0.15s', gap:8,
              }}
                onMouseOver={e => { e.currentTarget.style.background=C.purplePale; e.currentTarget.style.borderColor=C.borderMid; e.currentTarget.style.transform='translateY(-2px)'; }}
                onMouseOut={e  => { e.currentTarget.style.background=C.purpleGhost; e.currentTarget.style.borderColor=C.border; e.currentTarget.style.transform='none'; }}
              >
                <span style={{ fontSize:28 }}>{icon}</span>
                <span style={{ fontSize:12, fontWeight:700, color:C.text, textAlign:'center' }}>{label}</span>
                {count !== null && count > 0 && (
                  <span style={{ fontSize:11, fontWeight:700, color:C.purple, background:C.purplePale, padding:'2px 8px', borderRadius:20 }}>{fmt(count)}</span>
                )}
              </a>
            ))}
          </div>
        </Card>
      </div>

    </div>
  )
}

export default Dashboard
