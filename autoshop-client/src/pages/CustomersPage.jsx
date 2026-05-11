import { useState, useEffect } from 'react'
import api from '../api'
import Layout from '../components/Layout'
import SearchBar  from '../components/SearchBar'
import TableMeta  from '../components/TableMeta'
import SortableTh from '../components/SortableTh'
import Toast from '../components/Toast'
import Pagination from '../components/Pagination' // [NEW]
import { shared } from '../styles/shared'
import { useSort } from '../hooks/useSort'
import { useError } from '../hooks/useError'
import { usePagination } from '../hooks/usePagination' // [NEW]

export default function CustomersPage() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading]     = useState(true)
  const [showForm, setShowForm]   = useState(false)
  const [saving, setSaving]       = useState(false)
  const [search, setSearch]       = useState('')
  const [form, setForm]           = useState({ name: '', phone: '', email: '', rfc: '' })
  
  const { toggle, sort, indicator } = useSort('name')
  const { error, success, showError, showSuccess } = useError()

  useEffect(() => { fetchCustomers() }, [])

  async function fetchCustomers() {
    try {
      const res = await api.get('/customers')
      setCustomers(res.data)
    } catch (err) { 
      console.error(err)
      showError('Failed to fetch customers')
    }
    finally { setLoading(false) }
  }

  function handleChange(e) { setForm({ ...form, [e.target.name]: e.target.value }) }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/customers', form)
      showSuccess('Customer created successfully')
      setForm({ name: '', phone: '', email: '', rfc: '' })
      setShowForm(false)
      fetchCustomers()
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to create customer')
    } finally { setSaving(false) }
  }

  async function handleDeactivate(id) {
    if (!confirm('Deactivate this customer?')) return
    try {
      await api.delete(`/customers/${id}`)
      showSuccess('Customer deactivated')
      fetchCustomers()
    } catch (err) { 
      showError('Failed to deactivate') 
    }
  }

  const filtered = sort(
    customers.filter(c =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      (c.email || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.rfc  || '').toLowerCase().includes(search.toLowerCase())
    )
  )

  // [NEW] Initialize Pagination
  const { page, totalPages, paginated, nextPage, prevPage, goToPage, reset } = usePagination(filtered, 15)

  // [NEW] Reset to page 1 when searching
  useEffect(() => { reset() }, [search])

  if (loading) return <Layout><p style={shared.empty}>Loading...</p></Layout>

  return (
    <Layout>
      <Toast error={error} success={success} />
      
      <div style={shared.pageHeader}>
        <h2 style={shared.pageTitle}>Customers</h2>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Search customers..." />
          {showForm && <button style={shared.btnGhost} onClick={() => setShowForm(false)}>Cancel</button>}
          <button style={shared.btnPrimary} onClick={() => setShowForm(!showForm)}>+ New Customer</button>
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

      <TableMeta total={customers.length} showing={filtered.length} label="customers" />

      {filtered.length === 0 ? (
        <div style={styles.emptyState}>
          <p style={styles.emptyIcon}>👥</p>
          <p style={styles.emptyText}>{search ? `No customers match "${search}"` : 'No customers yet'}</p>
          {search && <button style={shared.btnGhost} onClick={() => setSearch('')}>Clear search</button>}
        </div>
      ) : (
        <>
          <div style={shared.tableWrapper}>
            <table style={shared.table}>
              <thead style={shared.thead}>
                <tr>
                  <SortableTh label="Name"   sortKey="name"  currentKey="name"  onSort={toggle} indicator={indicator} />
                  <SortableTh label="Phone"  sortKey="phone" currentKey="phone" onSort={toggle} indicator={indicator} />
                  <SortableTh label="Email"  sortKey="email" currentKey="email" onSort={toggle} indicator={indicator} />
                  <th style={shared.th}>RFC</th>
                  <SortableTh label="Status" sortKey="is_active" currentKey="is_active" onSort={toggle} indicator={indicator} />
                  <th style={shared.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {/* [MODIFIED] Use paginated instead of filtered */}
                {paginated.map(c => (
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
          
          {/* [NEW] Pagination Component */}
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
  formTitle:  { fontWeight: '700', marginBottom: '1rem', color: 'var(--text-primary)' },
  emptyState: { textAlign: 'center', padding: '4rem 2rem', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' },
  emptyIcon:  { fontSize: '2.5rem', marginBottom: '0.75rem' },
  emptyText:  { color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.95rem' },
}