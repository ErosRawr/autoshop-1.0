import { useState, useEffect } from 'react'
import api from '../api'
import Layout from '../components/Layout'
import SearchBar from '../components/SearchBar'
import TableMeta from '../components/TableMeta'
import SortableTh from '../components/SortableTh'
import Toast from '../components/Toast'
import { shared } from '../styles/shared'
import { useSort } from '../hooks/useSort'
import { useError } from '../hooks/useError'

export default function PartsPage() {
  const [parts, setParts]         = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading]     = useState(true)
  const [showForm, setShowForm]   = useState(false)
  const [saving, setSaving]       = useState(false)
  const [search, setSearch]       = useState('')
  const [form, setForm]           = useState({
    name: '', part_number: '', description: '',
    supplier_id: '', cost_price: '', sale_price: ''
  })
  
  const { toggle, sort, indicator } = useSort('name')
  const { error, success, showError, showSuccess } = useError()

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    try {
      const [pRes, sRes] = await Promise.all([
        api.get('/parts'),
        api.get('/suppliers'),
      ])
      setParts(pRes.data)
      setSuppliers(sRes.data)
    } catch (err) { 
      console.error(err)
      showError('Failed to fetch parts and suppliers')
    }
    finally { setLoading(false) }
  }

  function handleChange(e) { setForm({ ...form, [e.target.name]: e.target.value }) }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/parts', {
        ...form,
        supplier_id: form.supplier_id || null,
        cost_price:  parseFloat(form.cost_price),
        sale_price:  parseFloat(form.sale_price),
      })
      showSuccess('Part created successfully')
      setForm({ name: '', part_number: '', description: '', supplier_id: '', cost_price: '', sale_price: '' })
      setShowForm(false)
      fetchAll()
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to create part')
    } finally { setSaving(false) }
  }

  const filtered = sort(
    parts.filter(p => {
      const q = search.toLowerCase()
      return (
        p.name.toLowerCase().includes(q) ||
        (p.part_number   || '').toLowerCase().includes(q) ||
        (p.supplier_name || '').toLowerCase().includes(q) ||
        (p.description   || '').toLowerCase().includes(q)
      )
    })
  )

  if (loading) return <Layout><p style={shared.empty}>Loading...</p></Layout>

  return (
    <Layout>
      <Toast error={error} success={success} />
      
      <div style={shared.pageHeader}>
        <h2 style={shared.pageTitle}>Parts</h2>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Search parts..." />
          {showForm && <button style={shared.btnGhost} onClick={() => setShowForm(false)}>Cancel</button>}
          <button style={shared.btnPrimary} onClick={() => setShowForm(!showForm)}>+ New Part</button>
        </div>
      </div>

      {showForm && (
        <div style={{ ...shared.card, marginBottom: '1.5rem' }}>
          <h3 style={{ fontWeight: '700', marginBottom: '1rem' }}>New Part</h3>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={shared.formGrid}>
              <div style={shared.field}>
                <label style={shared.label}>Name *</label>
                <input style={shared.input} name="name" value={form.name} onChange={handleChange} placeholder="Oil Filter" required />
              </div>
              <div style={shared.field}>
                <label style={shared.label}>Part Number</label>
                <input style={shared.input} name="part_number" value={form.part_number} onChange={handleChange} placeholder="OEM-1234" />
              </div>
              <div style={shared.field}>
                <label style={shared.label}>Supplier</label>
                <select style={shared.input} name="supplier_id" value={form.supplier_id} onChange={handleChange}>
                  <option value="">No supplier</option>
                  {suppliers.filter(s => s.is_active).map(s => (
                    <option key={s.supplier_id} value={s.supplier_id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div style={shared.field}>
                <label style={shared.label}>Description</label>
                <input style={shared.input} name="description" value={form.description} onChange={handleChange} placeholder="Optional description" />
              </div>
              <div style={shared.field}>
                <label style={shared.label}>Cost Price *</label>
                <input style={shared.input} name="cost_price" type="number" step="0.01" min="0" value={form.cost_price} onChange={handleChange} placeholder="0.00" required />
              </div>
              <div style={shared.field}>
                <label style={shared.label}>Sale Price *</label>
                <input style={shared.input} name="sale_price" type="number" step="0.01" min="0" value={form.sale_price} onChange={handleChange} placeholder="0.00" required />
              </div>
            </div>
            {form.cost_price && form.sale_price && (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Margin: ${(parseFloat(form.sale_price) - parseFloat(form.cost_price)).toFixed(2)} ({((( parseFloat(form.sale_price) - parseFloat(form.cost_price)) / parseFloat(form.sale_price)) * 100).toFixed(1)}%)
              </p>
            )}
            <button style={shared.btnSuccess} type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save Part'}
            </button>
          </form>
        </div>
      )}

      <TableMeta total={parts.length} showing={filtered.length} label="parts" />

      {filtered.length === 0 ? (
        <div style={styles.emptyState}>
          <p style={styles.emptyIcon}>🔩</p>
          <p style={styles.emptyText}>{search ? `No parts match "${search}"` : 'No parts yet'}</p>
          {search && <button style={shared.btnGhost} onClick={() => setSearch('')}>Clear search</button>}
        </div>
      ) : (
        <div style={shared.tableWrapper}>
          <table style={shared.table}>
            <thead style={shared.thead}>
              <tr>
                <SortableTh label="Name"        sortKey="name"          currentKey="name"          onSort={toggle} indicator={indicator} />
                <SortableTh label="Part #"      sortKey="part_number"   currentKey="part_number"   onSort={toggle} indicator={indicator} />
                <SortableTh label="Supplier"    sortKey="supplier_name" currentKey="supplier_name" onSort={toggle} indicator={indicator} />
                <SortableTh label="Cost"        sortKey="cost_price"    currentKey="cost_price"    onSort={toggle} indicator={indicator} />
                <SortableTh label="Sale Price"  sortKey="sale_price"    currentKey="sale_price"    onSort={toggle} indicator={indicator} />
                <th style={shared.th}>Margin</th>
                <SortableTh label="Status"      sortKey="is_active"     currentKey="is_active"     onSort={toggle} indicator={indicator} />
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => {
                const margin = parseFloat(p.sale_price) - parseFloat(p.cost_price)
                const marginPct = ((margin / parseFloat(p.sale_price)) * 100).toFixed(1)
                return (
                  <tr key={p.part_id} style={shared.tr}>
                    <td style={{ ...shared.td, fontWeight: '600' }}>
                      {p.name}
                      {p.description && (
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>{p.description}</p>
                      )}
                    </td>
                    <td style={{ ...shared.td, color: 'var(--text-secondary)' }}>{p.part_number || '—'}</td>
                    <td style={shared.td}>{p.supplier_name || '—'}</td>
                    <td style={shared.td}>${parseFloat(p.cost_price).toFixed(2)}</td>
                    <td style={{ ...shared.td, fontWeight: '700' }}>${parseFloat(p.sale_price).toFixed(2)}</td>
                    <td style={shared.td}>
                      <span style={{ ...shared.badge, ...shared.badgeGreen }}>
                        {marginPct}%
                      </span>
                    </td>
                    <td style={shared.td}>
                      <span style={{ ...shared.badge, ...(p.is_active ? shared.badgeGreen : shared.badgeRed) }}>
                        {p.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                )
              })}
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