import { useState, useEffect } from 'react'
import api from '../api'
import Layout from '../components/Layout'

export default function VehiclesPage() {
  const [vehicles, setVehicles]   = useState([])
  const [customers, setCustomers] = useState([])
  const [loading, setLoading]     = useState(true)
  const [showForm, setShowForm]   = useState(false)
  const [saving, setSaving]       = useState(false)
  const [form, setForm]           = useState({
    customer_id: '', make: '', model: '',
    year: '', plate: '', color: '', vehicle_type: ''
  })

  useEffect(() => {
    fetchAll()
  }, [])

  async function fetchAll() {
    try {
      const [vehiclesRes, customersRes] = await Promise.all([
        api.get('/vehicles'),
        api.get('/customers'),
      ])
      setVehicles(vehiclesRes.data)
      setCustomers(customersRes.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

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
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Layout><p>Loading...</p></Layout>

  return (
    <Layout>
      {/* Header */}
      <div style={styles.header}>
        <h2 style={styles.title}>Vehicles</h2>
        <button style={styles.addButton} onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ New Vehicle'}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div style={styles.formCard}>
          <h3 style={styles.formTitle}>New Vehicle</h3>
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.formGrid}>
              <div style={styles.field}>
                <label style={styles.label}>Customer *</label>
                <select
                  style={styles.input}
                  name="customer_id"
                  value={form.customer_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select a customer</option>
                  {customers.filter(c => c.is_active).map(c => (
                    <option key={c.customer_id} value={c.customer_id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Make *</label>
                <input
                  style={styles.input}
                  name="make"
                  value={form.make}
                  onChange={handleChange}
                  placeholder="Toyota"
                  required
                />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Model *</label>
                <input
                  style={styles.input}
                  name="model"
                  value={form.model}
                  onChange={handleChange}
                  placeholder="Corolla"
                  required
                />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Year *</label>
                <input
                  style={styles.input}
                  name="year"
                  type="number"
                  value={form.year}
                  onChange={handleChange}
                  placeholder="2020"
                  required
                />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Plate</label>
                <input
                  style={styles.input}
                  name="plate"
                  value={form.plate}
                  onChange={handleChange}
                  placeholder="ABC-123"
                />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Color</label>
                <input
                  style={styles.input}
                  name="color"
                  value={form.color}
                  onChange={handleChange}
                  placeholder="White"
                />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Type</label>
                <input
                  style={styles.input}
                  name="vehicle_type"
                  value={form.vehicle_type}
                  onChange={handleChange}
                  placeholder="Sedan, SUV, Truck..."
                />
              </div>
            </div>
            <button style={styles.saveButton} type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save Vehicle'}
            </button>
          </form>
        </div>
      )}

      {/* Table */}
      {vehicles.length === 0 ? (
        <p style={{ color: '#6b7280', marginTop: '2rem' }}>No vehicles yet.</p>
      ) : (
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.thead}>
                <th style={styles.th}>Customer</th>
                <th style={styles.th}>Vehicle</th>
                <th style={styles.th}>Year</th>
                <th style={styles.th}>Plate</th>
                <th style={styles.th}>Color</th>
                <th style={styles.th}>Type</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map(v => (
                <tr key={v.vehicle_id} style={styles.tr}>
                  <td style={styles.td}>{v.customer_name}</td>
                  <td style={styles.td}>{v.make} {v.model}</td>
                  <td style={styles.td}>{v.year}</td>
                  <td style={styles.td}>{v.plate || '—'}</td>
                  <td style={styles.td}>{v.color || '—'}</td>
                  <td style={styles.td}>{v.vehicle_type || '—'}</td>
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
  header:      { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' },
  title:       { fontSize: '1.5rem', fontWeight: '700' },
  addButton:   { backgroundColor: '#2563eb', color: '#fff', border: 'none', padding: '0.6rem 1.25rem', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' },
  formCard:    { backgroundColor: '#fff', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', marginBottom: '1.5rem' },
  formTitle:   { marginBottom: '1rem', fontWeight: '600' },
  form:        { display: 'flex', flexDirection: 'column', gap: '1rem' },
  formGrid:    { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' },
  field:       { display: 'flex', flexDirection: 'column', gap: '0.35rem' },
  label:       { fontSize: '0.8rem', fontWeight: '600', color: '#374151' },
  input:       { padding: '0.6rem 0.875rem', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.95rem' },
  saveButton:  { backgroundColor: '#16a34a', color: '#fff', border: 'none', padding: '0.65rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', alignSelf: 'flex-start' },
  tableWrapper:{ backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', overflow: 'hidden' },
  table:       { width: '100%', borderCollapse: 'collapse' },
  thead:       { backgroundColor: '#f9fafb' },
  th:          { padding: '0.875rem 1rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' },
  tr:          { borderTop: '1px solid #f3f4f6' },
  td:          { padding: '0.875rem 1rem', fontSize: '0.9rem', color: '#111827' },
}