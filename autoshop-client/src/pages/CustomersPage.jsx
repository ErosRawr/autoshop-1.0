import { useState, useEffect } from 'react'
import api from '../api'
import Layout from '../components/Layout'
import { shared } from '../styles/shared'

export default function CustomersPage() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading]     = useState(true)
  const [showForm, setShowForm]   = useState(false)
  const [saving, setSaving]       = useState(false)
  const [form, setForm]           = useState({ name: '', phone: '', email: '', rfc: '' })

  useEffect(() => { fetchCustomers() }, [])

  async function fetchCustomers() {
    try {
      const res = await api.get('/customers')
      setCustomers(res.data)
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
      await api.post('/customers', form)
      setForm({ name: '', phone: '', email: '', rfc: '' })
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
      alert('Failed to deactivate')
    }
  }

  if (loading) return <Layout><p style={shared.empty}>Loading...</p></Layout>

  return (
    <Layout>
      <div style={shared.pageHeader}>
        <h2 style={shared.pageTitle}>Customers</h2>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {showForm && (
            <button style={shared.btnGhost} onClick={() => setShowForm(false)}>
              Cancel
            </button>
          )}
          <button style={shared.btnPrimary} onClick={() => setShowForm(!showForm)}>
            + New Customer
          </button>
        </div>
      </div>

      {showForm && (
        <div style={{ ...shared.card, marginBottom: '1.5rem' }}>
          <h3 style={styles.formTitle}>New Customer</h3>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={shared.formGrid}>
              <div style={shared.field}>
                <label style={shared.label}>Name *</label>
                <input style={shared.input} name="name" value={form.name} onChange={handleChange} placeholder="Full name" required />
              </div>
              <div style={shared.field}>
                <label style={shared.label}>Phone *</label>
                <input style={shared.input} name="phone" value={form.phone} onChange={handleChange} placeholder="8711234567" required />
              </div>
              <div style={shared.field}>
                <label style={shared.label}>Email</label>
                <input style={shared.input} name="email" value={form.email} onChange={handleChange} placeholder="email@example.com" />
              </div>
              <div style={shared.field}>
                <label style={shared.label}>RFC</label>
                <input style={shared.input} name="rfc" value={form.rfc} onChange={handleChange} placeholder="RFC123456789" />
              </div>
            </div>
            <button style={shared.btnSuccess} type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save Customer'}
            </button>
          </form>
        </div>
      )}

      {customers.length === 0 ? (
        <p style={shared.empty}>No customers yet.</p>
      ) : (
        <div style={shared.tableWrapper}>
          <table style={shared.table}>
            <thead style={shared.thead}>
              <tr>
                <th style={shared.th}>Name</th>
                <th style={shared.th}>Phone</th>
                <th style={shared.th}>Email</th>
                <th style={shared.th}>RFC</th>
                <th style={shared.th}>Status</th>
                <th style={shared.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map(c => (
                <tr key={c.customer_id} style={shared.tr}>
                  <td style={{ ...shared.td, fontWeight: '600' }}>{c.name}</td>
                  <td style={shared.td}>{c.phone}</td>
                  <td style={shared.td}>{c.email || '—'}</td>
                  <td style={shared.td}>{c.rfc || '—'}</td>
                  <td style={shared.td}>
                    <span style={{ ...shared.badge, ...(c.is_active ? shared.badgeGreen : shared.badgeRed) }}>
                      {c.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={shared.td}>
                    {c.is_active && (
                      <button style={shared.btnDanger} onClick={() => handleDeactivate(c.customer_id)}>
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
  formTitle: { fontWeight: '700', marginBottom: '1rem', color: 'var(--text-primary)' },
}