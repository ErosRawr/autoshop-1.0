import { useState, useEffect } from 'react'
import api from '../api'
import Layout from '../components/Layout'
import Toast from '../components/Toast'
import Pagination from '../components/Pagination' // [NEW]
import { shared } from '../styles/shared'
import { useLocation } from '../context/LocationContext'
import { useAuth } from '../context/AuthContext'
import { useError } from '../hooks/useError'
import { usePagination } from '../hooks/usePagination' // [NEW]

export default function InventoryPage() {
  const [stock, setStock]       = useState([])
  const [parts, setParts]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving]     = useState(false)
  const [form, setForm]         = useState({ part_id: '', quantity: '', notes: '' })
  
  const { currentLocation }     = useLocation()
  const { user }                = useAuth()
  const { error, success, showError, showSuccess } = useError()
  
  const LOCATION_ID = user?.location_id

  // [NEW] Initialize Pagination with stock data
  const { page, totalPages, paginated, nextPage, prevPage, goToPage, reset } = usePagination(stock, 15)

  useEffect(() => {
    if (currentLocation) {
      fetchAll()
      reset() // [NEW] Reset to page 1 when location changes
    }
  }, [currentLocation])

  async function fetchAll() {
    try {
      const [sRes, pRes] = await Promise.all([
        api.get(`/inventory?location_id=${currentLocation.location_id}`),
        api.get('/parts'),
      ])
      setStock(sRes.data)
      setParts(pRes.data)
    } catch (err) { 
      console.error(err) 
      showError('Failed to fetch inventory data')
    }
    finally { setLoading(false) }
  }

  async function handleReceive(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/inventory/receive', {
        location_id: currentLocation.location_id,
        part_id:     parseInt(form.part_id),
        quantity:    parseInt(form.quantity),
        notes:       form.notes || undefined,
      })
      showSuccess('Stock received successfully')
      setForm({ part_id: '', quantity: '', notes: '' })
      setShowForm(false)
      fetchAll()
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to receive stock')
    } finally { setSaving(false) }
  }

  if (loading) return <Layout><p style={shared.empty}>Loading...</p></Layout>

  const lowStock = stock.filter(s => s.is_low_stock)

  return (
    <Layout>
      <Toast error={error} success={success} />
      
      <div style={shared.pageHeader}>
        <h2 style={shared.pageTitle}>
          Inventory
          {currentLocation && (
            <span style={styles.locationBadge}>{currentLocation.name}</span>
          )}
        </h2>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {showForm && <button style={shared.btnGhost} onClick={() => setShowForm(false)}>Cancel</button>}
          <button style={shared.btnPrimary} onClick={() => setShowForm(!showForm)}>+ Receive Stock</button>
        </div>
      </div>

      {lowStock.length > 0 && (
        <div style={styles.alert}>
          ⚠️ {lowStock.length} item{lowStock.length > 1 ? 's are' : ' is'} below minimum stock:
          {' '}{lowStock.map(s => s.part_name).join(', ')}
        </div>
      )}

      {showForm && (
        <div style={{ ...shared.card, marginBottom: '1.5rem' }}>
          <h3 style={styles.formTitle}>Receive Stock — {currentLocation?.name}</h3>
          <form onSubmit={handleReceive} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={shared.formGrid}>
              <div style={shared.field}>
                <label style={shared.label}>Part *</label>
                <select style={shared.input} value={form.part_id} onChange={e => setForm({ ...form, part_id: e.target.value })} required>
                  <option value="">Select a part</option>
                  {parts.map(p => (
                    <option key={p.part_id} value={p.part_id}>
                      {p.name} {p.part_number ? `(${p.part_number})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div style={shared.field}>
                <label style={shared.label}>Quantity *</label>
                <input style={shared.input} type="number" min="1" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} placeholder="50" required />
              </div>
              <div style={{ ...shared.field, gridColumn: '1 / -1' }}>
                <label style={shared.label}>Notes</label>
                <input style={shared.input} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Shipment reference, supplier..." />
              </div>
            </div>
            <button style={shared.btnSuccess} type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Confirm Receipt'}
            </button>
          </form>
        </div>
      )}

      {stock.length === 0 ? (
        <div style={styles.emptyState}>
          <p style={styles.emptyIcon}>📦</p>
          <p style={styles.emptyText}>No inventory at {currentLocation?.name} yet</p>
        </div>
      ) : (
        <>
          <div style={shared.tableWrapper}>
            <table style={shared.table}>
              <thead style={shared.thead}>
                <tr>
                  <th style={shared.th}>Part</th>
                  <th style={shared.th}>Part #</th>
                  <th style={shared.th}>Supplier</th>
                  <th style={shared.th}>Stock</th>
                  <th style={shared.th}>Min Stock</th>
                  <th style={shared.th}>Sale Price</th>
                  <th style={shared.th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {/* [MODIFIED] Use paginated data */}
                {paginated.map(s => (
                  <tr key={s.part_id} style={shared.tr}>
                    <td style={{ ...shared.td, fontWeight: '600' }}>{s.part_name}</td>
                    <td style={{ ...shared.td, color: 'var(--text-secondary)' }}>{s.part_number || '—'}</td>
                    <td style={shared.td}>{s.supplier_name || '—'}</td>
                    <td style={{ ...shared.td, fontWeight: '700' }}>{s.stock}</td>
                    <td style={{ ...shared.td, color: 'var(--text-secondary)' }}>{s.min_stock}</td>
                    <td style={shared.td}>${parseFloat(s.sale_price).toFixed(2)}</td>
                    <td style={shared.td}>
                      <span style={{ ...shared.badge, ...(s.is_low_stock ? shared.badgeRed : shared.badgeGreen) }}>
                        {s.is_low_stock ? 'Low Stock' : 'OK'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* [NEW] Pagination Controls */}
          <Pagination 
            page={page} 
            totalPages={totalPages} 
            nextPage={nextPage} 
            prevPage={prevPage} 
            goToPage={goToPage} 
          />
        </>
      )}
    </Layout>
  )
}

const styles = {
  formTitle:    { fontWeight: '700', marginBottom: '1rem', color: 'var(--text-primary)' },
  locationBadge:{ fontSize: '0.75rem', fontWeight: '600', backgroundColor: 'var(--bg-badge-blue)', color: 'var(--text-badge-blue)', padding: '0.2rem 0.6rem', borderRadius: '999px', marginLeft: '0.75rem', verticalAlign: 'middle' },
  alert:        { backgroundColor: 'var(--bg-badge-yellow)', border: '1px solid var(--accent-warning)', color: 'var(--text-badge-yellow)', padding: '0.875rem 1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', fontSize: '0.9rem' },
  emptyState:   { textAlign: 'center', padding: '4rem 2rem', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' },
  emptyIcon:    { fontSize: '2.5rem', marginBottom: '0.75rem' },
  emptyText:    { color: 'var(--text-secondary)', fontSize: '0.95rem' },
}