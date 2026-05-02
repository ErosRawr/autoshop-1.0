import { useState, useEffect } from 'react'
import api from '../api'
import Layout from '../components/Layout'
import { shared } from '../styles/shared'

export default function VehiclesPage() {
  const [vehicles, setVehicles]   = useState([])
  const [customers, setCustomers] = useState([])
  const [loading, setLoading]     = useState(true)
  const [showForm, setShowForm]   = useState(false)
  const [saving, setSaving]       = useState(false)
  const [form, setForm]           = useState({
    customer_id: '', make: '', model: '', year: '', plate: '', color: '', vehicle_type: ''
  })

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    try {
      const [vRes, cRes] = await Promise.all([api.get('/vehicles'), api.get('/customers')])
      setVehicles(vRes.data)
      setCustomers(cRes.data)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  function handleChange(e) { setForm({ ...form, [e.target.name]: e.target.value }) }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/vehicles', form)
      setForm({ customer_id: '', make: '', model: '', year: '', plate: '', color: '', vehicle_type: '' })
      setShowForm(false)
      fetchAll()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create vehicle')
    } finally { setSaving(false) }
  }

  if (loading) return <Layout><p style={shared.empty}>Loading...</p></Layout>

  return (
    <Layout>
      <div style={shared.pageHeader}>
        <h2 style={shared.pageTitle}>Vehicles</h2>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {showForm && <button style={shared.btnGhost} onClick={() => setShowForm(false)}>Cancel</button>}
          <button style={shared.btnPrimary} onClick={() => setShowForm(!showForm)}>+ New Vehicle</button>
        </div>
      </div>

      {showForm && (
        <div style={{ ...shared.card, marginBottom: '1.5rem' }}>
          <h3 style={styles.formTitle}>New Vehicle</h3>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={shared.formGrid}>
              <div style={shared.field}>
                <label style={shared.label}>Customer *</label>
                <select style={shared.input} name="customer_id" value={form.customer_id} onChange={handleChange} required>
                  <option value="">Select a customer</option>
                  {customers.filter(c => c.is_active).map(c => (
                    <option key={c.customer_id} value={c.customer_id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div style={shared.field}>
                <label style={shared.label}>Make *</label>
                <input style={shared.input} name="make" value={form.make} onChange={handleChange} placeholder="Toyota" required />
              </div>
              <div style={shared.field}>
                <label style={shared.label}>Model *</label>
                <input style={shared.input} name="model" value={form.model} onChange={handleChange} placeholder="Corolla" required />
              </div>
              <div style={shared.field}>
                <label style={shared.label}>Year *</label>
                <input style={shared.input} name="year" type="number" value={form.year} onChange={handleChange} placeholder="2020" required />
              </div>
              <div style={shared.field}>
                <label style={shared.label}>Plate</label>
                <input style={shared.input} name="plate" value={form.plate} onChange={handleChange} placeholder="ABC-123" />
              </div>
              <div style={shared.field}>
                <label style={shared.label}>Color</label>
                <input style={shared.input} name="color" value={form.color} onChange={handleChange} placeholder="White" />
              </div>
              <div style={shared.field}>
                <label style={shared.label}>Type</label>
                <input style={shared.input} name="vehicle_type" value={form.vehicle_type} onChange={handleChange} placeholder="Sedan, SUV, Truck..." />
              </div>
            </div>
            <button style={shared.btnSuccess} type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save Vehicle'}
            </button>
          </form>
        </div>
      )}

      {vehicles.length === 0 ? (
        <p style={shared.empty}>No vehicles yet.</p>
      ) : (
        <div style={shared.tableWrapper}>
          <table style={shared.table}>
            <thead style={shared.thead}>
              <tr>
                <th style={shared.th}>Customer</th>
                <th style={shared.th}>Vehicle</th>
                <th style={shared.th}>Year</th>
                <th style={shared.th}>Plate</th>
                <th style={shared.th}>Color</th>
                <th style={shared.th}>Type</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map(v => (
                <tr key={v.vehicle_id} style={shared.tr}>
                  <td style={shared.td}>{v.customer_name}</td>
                  <td style={{ ...shared.td, fontWeight: '600' }}>{v.make} {v.model}</td>
                  <td style={shared.td}>{v.year}</td>
                  <td style={shared.td}>{v.plate || '—'}</td>
                  <td style={shared.td}>{v.color || '—'}</td>
                  <td style={shared.td}>{v.vehicle_type || '—'}</td>
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
}