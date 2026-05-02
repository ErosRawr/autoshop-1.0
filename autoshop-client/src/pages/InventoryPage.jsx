import { useState, useEffect } from 'react'
import api from '../api'
import Layout from '../components/Layout'

export default function InventoryPage() {
  const [stock, setStock]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving]     = useState(false)
  const [parts, setParts]       = useState([])
  const [form, setForm]         = useState({ part_id: '', quantity: '', notes: '' })
  const LOCATION_ID = 1  // hardcoded for now

  useEffect(() => {
    fetchAll()
  }, [])

  async function fetchAll() {
    try {
      const [stockRes, partsRes] = await Promise.all([
        api.get(`/inventory?location_id=${LOCATION_ID}`),
        api.get('/parts'),
      ])
      setStock(stockRes.data)
      setParts(partsRes.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
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
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Layout><p>Loading...</p></Layout>

  const lowStock = stock.filter(s => s.is_low_stock)

  return (
    <Layout>
      <div style={styles.header}>
        <h2 style={styles.title}>Inventory</h2>
        <button style={styles.addButton} onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Receive Stock'}
        </button>
      </div>

      {/* Low stock alert */}
      {lowStock.length > 0 && (
        <div style={styles.alert}>
          ⚠️ {lowStock.length} item{lowStock.length > 1 ? 's are' : ' is'} below minimum stock level:
          {' '}{lowStock.map(s => s.part_name).join(', ')}
        </div>
      )}

      {/* Receive Stock Form */}
      {showForm && (
        <div style={styles.formCard}>
          <h3 style={styles.formTitle}>Receive Stock</h3>
          <form onSubmit={handleReceive} style={styles.form}>
            <div style={styles.formGrid}>
              <div style={styles.field}>
                <label style={styles.label}>Part *</label>
                <select
                  style={styles.input}
                  value={form.part_id}
                  onChange={e => setForm({ ...form, part_id: e.target.value })}
                  required
                >
                  <option value="">Select a part</option>
                  {parts.map(p => (
                    <option key={p.part_id} value={p.part_id}>
                      {p.name} {p.part_number ? `(${p.part_number})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Quantity *</label>
                <input
                  style={styles.input}
                  type="number"
                  min="1"
                  value={form.quantity}
                  onChange={e => setForm({ ...form, quantity: e.target.value })}
                  placeholder="50"
                  required
                />
              </div>
              <div style={{ ...styles.field, gridColumn: '1 / -1' }}>
                <label style={styles.label}>Notes</label>
                <input
                  style={styles.input}
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                  placeholder="Shipment reference, supplier, etc."
                />
              </div>
            </div>
            <button style={styles.saveButton} type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Confirm Receipt'}
            </button>
          </form>
        </div>
      )}

      {/* Stock Table */}
      {stock.length === 0 ? (
        <p style={{ color: '#6b7280', marginTop: '2rem' }}>No inventory yet.</p>
      ) : (
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.thead}>
                <th style={styles.th}>Part</th>
                <th style={styles.th}>Part #</th>
                <th style={styles.th}>Supplier</th>
                <th style={styles.th}>Stock</th>
                <th style={styles.th}>Min Stock</th>
                <th style={styles.th}>Sale Price</th>
                <th style={styles.th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {stock.map(s => (
                <tr key={s.part_id} style={styles.tr}>
                  <td style={styles.td}>{s.part_name}</td>
                  <td style={styles.td}>{s.part_number || '—'}</td>
                  <td style={styles.td}>{s.supplier_name || '—'}</td>
                  <td style={{ ...styles.td, fontWeight: '700' }}>{s.stock}</td>
                  <td style={styles.td}>{s.min_stock}</td>
                  <td style={styles.td}>${parseFloat(s.sale_price).toFixed(2)}</td>
                  <td style={styles.td}>
                    {s.is_low_stock ? (
                      <span style={styles.badgeLow}>Low Stock</span>
                    ) : (
                      <span style={styles.badgeOk}>OK</span>
                    )}
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
  header:       { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' },
  title:        { fontSize: '1.5rem', fontWeight: '700' },
  addButton:    { backgroundColor: '#2563eb', color: '#fff', border: 'none', padding: '0.6rem 1.25rem', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' },
  alert:        { backgroundColor: '#fef9c3', border: '1px solid #fde047', color: '#854d0e', padding: '0.875rem 1rem', borderRadius: '8px', marginBottom: '1.25rem', fontSize: '0.9rem' },
  formCard:     { backgroundColor: '#fff', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', marginBottom: '1.5rem' },
  formTitle:    { marginBottom: '1rem', fontWeight: '600' },
  form:         { display: 'flex', flexDirection: 'column', gap: '1rem' },
  formGrid:     { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' },
  field:        { display: 'flex', flexDirection: 'column', gap: '0.35rem' },
  label:        { fontSize: '0.8rem', fontWeight: '600', color: '#374151' },
  input:        { padding: '0.6rem 0.875rem', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.95rem' },
  saveButton:   { backgroundColor: '#16a34a', color: '#fff', border: 'none', padding: '0.65rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', alignSelf: 'flex-start' },
  tableWrapper: { backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', overflow: 'hidden' },
  table:        { width: '100%', borderCollapse: 'collapse' },
  thead:        { backgroundColor: '#f9fafb' },
  th:           { padding: '0.875rem 1rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' },
  tr:           { borderTop: '1px solid #f3f4f6' },
  td:           { padding: '0.875rem 1rem', fontSize: '0.9rem', color: '#111827' },
  badgeLow:     { backgroundColor: '#fee2e2', color: '#b91c1c', padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: '600' },
  badgeOk:      { backgroundColor: '#dcfce7', color: '#15803d', padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: '600' },
}