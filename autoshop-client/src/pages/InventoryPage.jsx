import { useState, useEffect } from 'react'
import api from '../api'
import Layout from '../components/Layout'
import { shared } from '../styles/shared'

const LOCATION_ID = 1

export default function InventoryPage() {
  const [stock, setStock]       = useState([])
  const [parts, setParts]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving]     = useState(false)
  const [form, setForm]         = useState({ part_id: '', quantity: '', notes: '' })

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    try {
      const [sRes, pRes] = await Promise.all([
        api.get(`/inventory?location_id=${LOCATION_ID}`),
        api.get('/parts'),
      ])
      setStock(sRes.data)
      setParts(pRes.data)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  async function handleReceive(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/inventory/receive', {
        location_id: LOCATION_ID,
        part_id:     parseInt(form.part_id),
        quantity:    parseInt(form.quantity),
        notes:       form.notes || undefined,
      })
      setForm({ part_id: '', quantity: '', notes: '' })
      setShowForm(false)
      fetchAll()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to receive stock')
    } finally { setSaving(false) }
  }

  if (loading) return <Layout><p style={shared.empty}>Loading...</p></Layout>

  const lowStock = stock.filter(s => s.is_low_stock)

  return (
    <Layout>
      <div style={shared.pageHeader}>
        <h2 style={shared.pageTitle}>Inventory</h2>
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
          <h3 style={styles.formTitle}>Receive Stock</h3>
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
        <p style={shared.empty}>No inventory yet.</p>
      ) : (
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
              {stock.map(s => (
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
      )}
    </Layout>
  )
}

const styles = {
  formTitle: { fontWeight: '700', marginBottom: '1rem', color: 'var(--text-primary)' },
  alert:     { backgroundColor: 'var(--bg-badge-yellow)', border: '1px solid var(--accent-warning)', color: 'var(--text-badge-yellow)', padding: '0.875rem 1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', fontSize: '0.9rem' },
}