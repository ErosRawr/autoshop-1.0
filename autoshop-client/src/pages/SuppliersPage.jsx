import { useState, useEffect } from 'react'
import api from '../api'
import Layout from '../components/Layout'
import SearchBar from '../components/SearchBar'
import TableMeta from '../components/TableMeta'
import SortableTh from '../components/SortableTh'
import { shared } from '../styles/shared'
import { useSort } from '../hooks/useSort'

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading]     = useState(true)
  const [showForm, setShowForm]   = useState(false)
  const [saving, setSaving]       = useState(false)
  const [search, setSearch]       = useState('')
  const [form, setForm]           = useState({
    name: '', contact_name: '', phone: '', email: '', notes: ''
  })
  const { toggle, sort, indicator } = useSort('name')

  useEffect(() => { fetchSuppliers() }, [])

  async function fetchSuppliers() {
    try {
      const res = await api.get('/suppliers')
      setSuppliers(res.data)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  function handleChange(e) { setForm({ ...form, [e.target.name]: e.target.value }) }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/suppliers', form)
      setForm({ name: '', contact_name: '', phone: '', email: '', notes: '' })
      setShowForm(false)
      fetchSuppliers()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create supplier')
    } finally { setSaving(false) }
  }

  const filtered = sort(
    suppliers.filter(s => {
      const q = search.toLowerCase()
      return (
        s.name.toLowerCase().includes(q) ||
        (s.contact_name || '').toLowerCase().includes(q) ||
        (s.phone || '').includes(q) ||
        (s.email || '').toLowerCase().includes(q)
      )
    })
  )

  if (loading) return <Layout><p style={shared.empty}>Loading...</p></Layout>

  return (
    <Layout>
      <div style={shared.pageHeader}>
        <h2 style={shared.pageTitle}>Suppliers</h2>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Search suppliers..." />
          {showForm && <button style={shared.btnGhost} onClick={() => setShowForm(false)}>Cancel</button>}
          <button style={shared.btnPrimary} onClick={() => setShowForm(!showForm)}>+ New Supplier</button>
        </div>
      </div>

      {showForm && (
        <div style={{ ...shared.card, marginBottom: '1.5rem' }}>
          <h3 style={{ fontWeight: '700', marginBottom: '1rem' }}>New Supplier</h3>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={shared.formGrid}>
              <div style={shared.field}>
                <label style={shared.label}>Company Name *</label>
                <input style={shared.input} name="name" value={form.name} onChange={handleChange} placeholder="ACME Parts Co." required />
              </div>
              <div style={shared.field}>
                <label style={shared.label}>Contact Name</label>
                <input style={shared.input} name="contact_name" value={form.contact_name} onChange={handleChange} placeholder="John Smith" />
              </div>
              <div style={shared.field}>
                <label style={shared.label}>Phone</label>
                <input style={shared.input} name="phone" value={form.phone} onChange={handleChange} placeholder="8711234567" />
              </div>
              <div style={shared.field}>
                <label style={shared.label}>Email</label>
                <input style={shared.input} name="email" value={form.email} onChange={handleChange} placeholder="contact@supplier.com" />
              </div>
              <div style={{ ...shared.field, gridColumn: '1 / -1' }}>
                <label style={shared.label}>Notes</label>
                <textarea style={{ ...shared.input, minHeight: '70px', resize: 'vertical' }} name="notes" value={form.notes} onChange={handleChange} placeholder="Payment terms, delivery notes..." />
              </div>
            </div>
            <button style={shared.btnSuccess} type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save Supplier'}
            </button>
          </form>
        </div>
      )}

      <TableMeta total={suppliers.length} showing={filtered.length} label="suppliers" />

      {filtered.length === 0 ? (
        <div style={styles.emptyState}>
          <p style={styles.emptyIcon}>🏭</p>
          <p style={styles.emptyText}>{search ? `No suppliers match "${search}"` : 'No suppliers yet'}</p>
          {search && <button style={shared.btnGhost} onClick={() => setSearch('')}>Clear search</button>}
        </div>
      ) : (
        <div style={shared.tableWrapper}>
          <table style={shared.table}>
            <thead style={shared.thead}>
              <tr>
                <SortableTh label="Name"         sortKey="name"         currentKey="name"         onSort={toggle} indicator={indicator} />
                <SortableTh label="Contact"      sortKey="contact_name" currentKey="contact_name" onSort={toggle} indicator={indicator} />
                <SortableTh label="Phone"        sortKey="phone"        currentKey="phone"         onSort={toggle} indicator={indicator} />
                <SortableTh label="Email"        sortKey="email"        currentKey="email"         onSort={toggle} indicator={indicator} />
                <th style={shared.th}>Notes</th>
                <SortableTh label="Status"       sortKey="is_active"    currentKey="is_active"    onSort={toggle} indicator={indicator} />
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.supplier_id} style={shared.tr}>
                  <td style={{ ...shared.td, fontWeight: '600' }}>{s.name}</td>
                  <td style={shared.td}>{s.contact_name || '—'}</td>
                  <td style={shared.td}>{s.phone || '—'}</td>
                  <td style={shared.td}>{s.email || '—'}</td>
                  <td style={{ ...shared.td, color: 'var(--text-secondary)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {s.notes || '—'}
                  </td>
                  <td style={shared.td}>
                    <span style={{ ...shared.badge, ...(s.is_active ? shared.badgeGreen : shared.badgeRed) }}>
                      {s.is_active ? 'Active' : 'Inactive'}
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
  emptyState: { textAlign: 'center', padding: '4rem 2rem', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' },
  emptyIcon:  { fontSize: '2.5rem', marginBottom: '0.75rem' },
  emptyText:  { color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.95rem' },
}