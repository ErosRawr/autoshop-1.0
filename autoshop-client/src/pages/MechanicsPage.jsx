import { useState, useEffect } from 'react'
import api from '../api'
import Layout from '../components/Layout'
import SearchBar from '../components/SearchBar'
import TableMeta from '../components/TableMeta'
import SortableTh from '../components/SortableTh'
import { shared } from '../styles/shared'
import { useSort } from '../hooks/useSort'
import { useLocation } from '../context/LocationContext'

export default function MechanicsPage() {
  const [mechanics, setMechanics] = useState([])
  const [loading, setLoading]     = useState(true)
  const [showForm, setShowForm]   = useState(false)
  const [saving, setSaving]       = useState(false)
  const [search, setSearch]       = useState('')
  const [form, setForm]           = useState({
    name: '', username: '', password: '', specialty: ''
  })
  const [showPassword, setShowPassword] = useState(false)

  const { currentLocation }         = useLocation()
  const { toggle, sort, indicator } = useSort('name')

  useEffect(() => { if (currentLocation) fetchMechanics() }, [currentLocation])

  async function fetchMechanics() {
    try {
      const res = await api.get('/mechanics')
      setMechanics(res.data)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  function handleChange(e) { setForm({ ...form, [e.target.name]: e.target.value }) }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/mechanics', {
        ...form,
        location_id: currentLocation.location_id,
        specialty:   form.specialty || null,
      })
      setForm({ name: '', username: '', password: '', specialty: '' })
      setShowForm(false)
      fetchMechanics()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create mechanic')
    } finally { setSaving(false) }
  }

  const filtered = sort(
    mechanics.filter(m => {
      const q = search.toLowerCase()
      return (
        m.name.toLowerCase().includes(q) ||
        m.username.toLowerCase().includes(q) ||
        (m.specialty || '').toLowerCase().includes(q)
      )
    })
  )

  if (loading) return <Layout><p style={shared.empty}>Loading...</p></Layout>

  return (
    <Layout>
      <div style={shared.pageHeader}>
        <h2 style={shared.pageTitle}>Mechanics</h2>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Search mechanics..." />
          {showForm && <button style={shared.btnGhost} onClick={() => setShowForm(false)}>Cancel</button>}
          <button style={shared.btnPrimary} onClick={() => setShowForm(!showForm)}>+ New Mechanic</button>
        </div>
      </div>

      {showForm && (
        <div style={{ ...shared.card, marginBottom: '1.5rem' }}>
          <h3 style={{ fontWeight: '700', marginBottom: '0.25rem' }}>New Mechanic</h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            This will create a user account with the mechanic role at {currentLocation?.name}.
          </p>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={shared.formGrid}>
              <div style={shared.field}>
                <label style={shared.label}>Full Name *</label>
                <input
                  style={shared.input}
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Juan García"
                  required
                />
              </div>
              <div style={shared.field}>
                <label style={shared.label}>Username *</label>
                <input
                  style={shared.input}
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  placeholder="jgarcia"
                  autoComplete="off"
                  required
                />
              </div>
              <div style={shared.field}>
                <label style={shared.label}>Password *</label>
                <div style={{ position: 'relative' }}>
                  <input
                    style={{ ...shared.input, paddingRight: '2.5rem' }}
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Min. 8 characters"
                    autoComplete="new-password"
                    minLength={8}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(p => !p)}
                    style={styles.eyeBtn}
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>
              <div style={shared.field}>
                <label style={shared.label}>Specialty</label>
                <input
                  style={shared.input}
                  name="specialty"
                  value={form.specialty}
                  onChange={handleChange}
                  placeholder="Engine, Electrical, Bodywork..."
                />
              </div>
            </div>
            <button style={shared.btnSuccess} type="submit" disabled={saving}>
              {saving ? 'Creating...' : 'Create Mechanic'}
            </button>
          </form>
        </div>
      )}

      <TableMeta total={mechanics.length} showing={filtered.length} label="mechanics" />

      {filtered.length === 0 ? (
        <div style={styles.emptyState}>
          <p style={styles.emptyIcon}>👨‍🔧</p>
          <p style={styles.emptyText}>{search ? `No mechanics match "${search}"` : 'No mechanics yet'}</p>
          {search && <button style={shared.btnGhost} onClick={() => setSearch('')}>Clear search</button>}
        </div>
      ) : (
        <div style={shared.tableWrapper}>
          <table style={shared.table}>
            <thead style={shared.thead}>
              <tr>
                <SortableTh label="Name"      sortKey="name"      currentKey="name"      onSort={toggle} indicator={indicator} />
                <SortableTh label="Username"  sortKey="username"  currentKey="username"  onSort={toggle} indicator={indicator} />
                <SortableTh label="Specialty" sortKey="specialty" currentKey="specialty" onSort={toggle} indicator={indicator} />
                <th style={shared.th}>Location</th>
                <SortableTh label="Status"    sortKey="is_active" currentKey="is_active" onSort={toggle} indicator={indicator} />
              </tr>
            </thead>
            <tbody>
              {filtered.map(m => (
                <tr key={m.mechanic_id} style={shared.tr}>
                  <td style={{ ...shared.td, fontWeight: '600' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <div style={styles.avatar}>
                        {m.name.charAt(0).toUpperCase()}
                      </div>
                      {m.name}
                    </div>
                  </td>
                  <td style={{ ...shared.td, color: 'var(--text-secondary)' }}>@{m.username}</td>
                  <td style={shared.td}>
                    {m.specialty
                      ? <span style={{ ...shared.badge, ...shared.badgeBlue }}>{m.specialty}</span>
                      : <span style={{ color: 'var(--text-muted)' }}>—</span>
                    }
                  </td>
                  <td style={{ ...shared.td, color: 'var(--text-secondary)' }}>
                    {m.location_id}
                  </td>
                  <td style={shared.td}>
                    <span style={{ ...shared.badge, ...(m.is_active ? shared.badgeGreen : shared.badgeRed) }}>
                      {m.is_active ? 'Active' : 'Inactive'}
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
  avatar:     { width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '0.75rem', flexShrink: 0 },
  eyeBtn:     { position: 'absolute', right: '0.6rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem', padding: '0', color: 'var(--text-muted)' },
}