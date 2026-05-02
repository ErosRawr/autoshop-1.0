import { useState, useEffect } from 'react'
import api from '../api'
import Layout from '../components/Layout'

export default function CustomersPage() {
  const [customers, setCustomers]   = useState([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState(null)
  const [showForm, setShowForm]     = useState(false)
  const [form, setForm]             = useState({ name: '', phone: '', email: '' })
  const [saving, setSaving]         = useState(false)

  useEffect(() => {
    fetchCustomers()
  }, [])

  async function fetchCustomers() {
    try {
      const res = await api.get('/customers')
      setCustomers(res.data)
    } catch (err) {
      setError('Failed to load customers')
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
      await api.post('/customers', form)
      setForm({ name: '', phone: '', email: '' })
      setShowForm(false)
      fetchCustomers()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create customer')
    } finally {
      setSaving(false)
    }
  }

  async function handleDeactivate(id) {
    if (!confirm('Deactivate this customer?')) return
    try {
      await api.delete(`/customers/${id}`)
      fetchCustomers()
    } catch (err) {
      alert('Failed to deactivate customer')
    }
  }

  if (loading) return <Layout><p>Loading...</p></Layout>
  if (error)   return <Layout><p style={{ color: 'red' }}>{error}</p></Layout>

  return (
    <Layout>
      {/* Header */}
      <div style={styles.header}>
        <h2 style={styles.title}>Customers</h2>
        <button style={styles.addButton} onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ New Customer'}
        </button>
      </div>

      {/* New Customer Form */}
      {showForm && (
        <div style={styles.formCard}>
          <h3 style={styles.formTitle}>New Customer</h3>
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.formGrid}>
              <div style={styles.field}>
                <label style={styles.label}>Name *</label>
                <input
                  style={styles.input}
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Full name"
                  required
                />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Phone *</label>
                <input
                  style={styles.input}
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="8711234567"
                  required
                />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Email</label>
                <input
                  style={styles.input}
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="email@example.com"
                />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>RFC</label>
                <input
                  style={styles.input}
                  name="rfc"
                  value={form.rfc || ''}
                  onChange={handleChange}
                  placeholder="RFC123456789"
                />
              </div>
            </div>
            <button style={styles.saveButton} type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save Customer'}
            </button>
          </form>
        </div>
      )}

      {/* Customers Table */}
      {customers.length === 0 ? (
        <p style={{ color: '#6b7280', marginTop: '2rem' }}>No customers yet.</p>
      ) : (
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.thead}>
                <th style={styles.th}>Name</th>
                <th style={styles.th}>Phone</th>
                <th style={styles.th}>Email</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map(c => (
                <tr key={c.customer_id} style={styles.tr}>
                  <td style={styles.td}>{c.name}</td>
                  <td style={styles.td}>{c.phone}</td>
                  <td style={styles.td}>{c.email || '—'}</td>
                  <td style={styles.td}>
                    <span style={c.is_active ? styles.badgeActive : styles.badgeInactive}>
                      {c.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={styles.td}>
                    {c.is_active && (
                      <button
                        style={styles.dangerButton}
                        onClick={() => handleDeactivate(c.customer_id)}
                      >
                        Deactivate
                      </button>
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
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' },
  title:  { fontSize: '1.5rem', fontWeight: '700' },
  addButton: { backgroundColor: '#2563eb', color: '#fff', border: 'none', padding: '0.6rem 1.25rem', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' },
  formCard:  { backgroundColor: '#fff', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', marginBottom: '1.5rem' },
  formTitle: { marginBottom: '1rem', fontWeight: '600' },
  form:      { display: 'flex', flexDirection: 'column', gap: '1rem' },
  formGrid:  { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' },
  field:     { display: 'flex', flexDirection: 'column', gap: '0.35rem' },
  label:     { fontSize: '0.8rem', fontWeight: '600', color: '#374151' },
  input:     { padding: '0.6rem 0.875rem', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.95rem' },
  saveButton:  { backgroundColor: '#16a34a', color: '#fff', border: 'none', padding: '0.65rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', alignSelf: 'flex-start' },
  tableWrapper: { backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  thead: { backgroundColor: '#f9fafb' },
  th:    { padding: '0.875rem 1rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' },
  tr:    { borderTop: '1px solid #f3f4f6' },
  td:    { padding: '0.875rem 1rem', fontSize: '0.9rem', color: '#111827' },
  badgeActive:   { backgroundColor: '#dcfce7', color: '#16a34a', padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: '600' },
  badgeInactive: { backgroundColor: '#fee2e2', color: '#dc2626', padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: '600' },
  dangerButton:  { backgroundColor: 'transparent', border: '1px solid #dc2626', color: '#dc2626', padding: '0.25rem 0.6rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' },
}