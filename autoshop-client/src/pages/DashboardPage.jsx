import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import api from '../api'
import Layout from '../components/Layout'
import { useLocation } from '../context/LocationContext'

export default function DashboardPage() {
  const [stats, setStats]           = useState(null)
  const [workOrders, setWorkOrders] = useState([])
  const [stock, setStock]           = useState([])
  const [invoices, setInvoices]     = useState([])
  const [loading, setLoading]       = useState(true)
  const { currentLocation }         = useLocation()

  useEffect(() => {
    if (currentLocation) fetchAll()
  }, [currentLocation])

  async function fetchAll() {
    setLoading(true)
    try {
      const [woRes, stockRes, invoicesRes, customersRes] = await Promise.all([
        api.get(`/workorders?location_id=${currentLocation.location_id}`),
        api.get(`/inventory?location_id=${currentLocation.location_id}`),
        api.get(`/invoices?location_id=${currentLocation.location_id}`),
        api.get('/customers'),
      ])

      const wo       = woRes.data
      const inv      = invoicesRes.data
      const customers = customersRes.data

      const totalRevenue = inv
        .filter(i => i.status === 'paid')
        .reduce((sum, i) => sum + parseFloat(i.total), 0)

      const outstanding = inv
        .filter(i => ['issued', 'partially_paid'].includes(i.status))
        .reduce((sum, i) => sum + parseFloat(i.total), 0)

      setStats({
        totalCustomers: customers.length,
        openWO:         wo.filter(w => w.status === 'open').length,
        inProgressWO:   wo.filter(w => w.status === 'in_progress').length,
        completedWO:    wo.filter(w => w.status === 'completed').length,
        totalRevenue,
        outstanding,
        lowStock:       stockRes.data.filter(s => s.is_low_stock).length,
        totalInvoices:  inv.length,
      })

      setWorkOrders(wo.slice(0, 6))
      setStock(stockRes.data.slice(0, 5))
      setInvoices(inv.slice(0, 5))
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <Layout><p style={styles.loading}>Loading dashboard...</p></Layout>

  const woChartData = [
    { name: 'Open',        value: stats.openWO,       color: '#3b82f6' },
    { name: 'In Progress', value: stats.inProgressWO, color: '#f59e0b' },
    { name: 'Completed',   value: stats.completedWO,  color: '#10b981' },
  ]

  const STATUS_COLORS = {
    open:          { bg: '#dbeafe', color: '#1d4ed8' },
    in_progress:   { bg: '#fef9c3', color: '#854d0e' },
    waiting_parts: { bg: '#ffedd5', color: '#9a3412' },
    completed:     { bg: '#dcfce7', color: '#15803d' },
    cancelled:     { bg: '#fee2e2', color: '#b91c1c' },
  }

  const INVOICE_COLORS = {
    draft:          { bg: '#f3f4f6', color: 'var(--text-secondary)' },
    issued:         { bg: '#dbeafe', color: '#1d4ed8' },
    partially_paid: { bg: '#fef9c3', color: '#854d0e' },
    paid:           { bg: '#dcfce7', color: '#15803d' },
    cancelled:      { bg: '#fee2e2', color: '#b91c1c' },
  }

  return (
    <Layout>
      <div style={styles.titleRow}>
        <h2 style={styles.title}>Dashboard</h2>
        {currentLocation && (
          <span style={styles.locationBadge}>📍 {currentLocation.name}</span>
        )}
      </div>

      {/* Stat Cards */}
      <div style={styles.statsGrid}>
        <StatCard label="Total Customers"  value={stats.totalCustomers}                color="#2563eb" icon="👥" />
        <StatCard label="Open Work Orders" value={stats.openWO}                        color="#f59e0b" icon="🔧" />
        <StatCard label="In Progress"      value={stats.inProgressWO}                  color="#8b5cf6" icon="⚙️" />
        <StatCard label="Total Revenue"    value={`$${stats.totalRevenue.toFixed(2)}`} color="#10b981" icon="💰" />
        <StatCard label="Outstanding"      value={`$${stats.outstanding.toFixed(2)}`}  color="#ef4444" icon="📋" />
        <StatCard label="Low Stock Items"  value={stats.lowStock}                       color="#f97316" icon="⚠️" />
      </div>

      {/* Charts row */}
      <div style={styles.row}>
        {/* Work Order Status Chart */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Work Orders by Status</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={woChartData} barSize={48}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {woChartData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Inventory Status */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>
            Inventory Status
            {stats.lowStock > 0 && (
              <span style={styles.alertBadge}>⚠️ {stats.lowStock} low</span>
            )}
          </h3>
          {stock.length === 0 ? (
            <p style={styles.empty}>No inventory data</p>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Part</th>
                  <th style={styles.th}>Stock</th>
                  <th style={styles.th}>Min</th>
                  <th style={styles.th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {stock.map(s => (
                  <tr key={s.part_id} style={styles.tr}>
                    <td style={styles.td}>{s.part_name}</td>
                    <td style={{ ...styles.td, fontWeight: '700' }}>{s.stock}</td>
                    <td style={styles.td}>{s.min_stock}</td>
                    <td style={styles.td}>
                      <span style={s.is_low_stock ? styles.badgeLow : styles.badgeOk}>
                        {s.is_low_stock ? 'Low' : 'OK'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Bottom row */}
      <div style={styles.row}>
        {/* Recent Work Orders */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Recent Work Orders</h3>
          {workOrders.length === 0 ? (
            <p style={styles.empty}>No work orders yet</p>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>#</th>
                  <th style={styles.th}>Customer</th>
                  <th style={styles.th}>Vehicle</th>
                  <th style={styles.th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {workOrders.map(wo => (
                  <tr key={wo.work_order_id} style={styles.tr}>
                    <td style={styles.td}>#{wo.work_order_id}</td>
                    <td style={styles.td}>{wo.customer_name}</td>
                    <td style={styles.td}>{wo.make} {wo.model}</td>
                    <td style={styles.td}>
                      <span style={{ ...styles.badge, ...STATUS_COLORS[wo.status] }}>
                        {wo.status.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Recent Invoices */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Recent Invoices</h3>
          {invoices.length === 0 ? (
            <p style={styles.empty}>No invoices yet</p>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Folio</th>
                  <th style={styles.th}>Customer</th>
                  <th style={styles.th}>Total</th>
                  <th style={styles.th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map(inv => (
                  <tr key={inv.invoice_id} style={styles.tr}>
                    <td style={styles.td}>{inv.folio}</td>
                    <td style={styles.td}>{inv.customer_name}</td>
                    <td style={{ ...styles.td, fontWeight: '700' }}>
                      ${parseFloat(inv.total).toFixed(2)}
                    </td>
                    <td style={styles.td}>
                      <span style={{ ...styles.badge, ...INVOICE_COLORS[inv.status] }}>
                        {inv.status.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </Layout>
  )
}

function StatCard({ label, value, color, icon }) {
  return (
    <div style={styles.statCard}>
      <div style={{ ...styles.statIcon, backgroundColor: color + '18' }}>
        <span style={{ fontSize: '1.5rem' }}>{icon}</span>
      </div>
      <div>
        <p style={styles.statLabel}>{label}</p>
        <p style={{ ...styles.statValue, color }}>{value}</p>
      </div>
    </div>
  )
}

const styles = {
  titleRow:    { display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' },
  title:       { fontSize: '1.5rem', fontWeight: '700' },
  locationBadge: { fontSize: '0.8rem', fontWeight: '600', backgroundColor: 'var(--bg-badge-blue)', color: 'var(--text-badge-blue)', padding: '0.25rem 0.75rem', borderRadius: '999px' },
  loading:     { color: 'var(--text-muted)', padding: '2rem', textAlign: 'center' },
  statsGrid:   { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' },
  statCard:    { backgroundColor: 'var(--bg-card)', padding: '1.25rem', borderRadius: '12px', boxShadow: 'var(--shadow-sm)', display: 'flex', alignItems: 'center', gap: '1rem' },
  statIcon:    { width: '52px', height: '52px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  statLabel:   { fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase', marginBottom: '0.2rem' },
  statValue:   { fontSize: '1.6rem', fontWeight: '700' },
  row:         { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' },
  card:        { backgroundColor: 'var(--bg-card)', padding: '1.25rem', borderRadius: '12px', boxShadow: 'var(--shadow-sm)' },
  cardTitle:   { fontWeight: '700', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-primary)' },
  alertBadge:  { backgroundColor: 'var(--bg-badge-yellow)', color: 'var(--text-badge-yellow)', padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: '600' },
  empty:       { color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '2rem 0' },
  table:       { width: '100%', borderCollapse: 'collapse' },
  th:          { padding: '0.5rem 0.75rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)' },
  tr:          { borderBottom: '1px solid var(--border)' },
  td:          { padding: '0.6rem 0.75rem', fontSize: '0.875rem', color: 'var(--text-primary)' },
  badge:       { padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: '600' },
  badgeLow:    { backgroundColor: 'var(--bg-badge-red)',   color: 'var(--text-badge-red)',   padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: '600' },
  badgeOk:     { backgroundColor: 'var(--bg-badge-green)', color: 'var(--text-badge-green)', padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: '600' },
}