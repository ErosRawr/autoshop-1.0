import { useState, useEffect } from 'react'
import api from '../api'
import Layout from '../components/Layout'
import SearchBar from '../components/SearchBar'
import TableMeta from '../components/TableMeta'
import SortableTh from '../components/SortableTh'
import Toast from '../components/Toast'
import Pagination from '../components/Pagination'
import { shared } from '../styles/shared'
import { useSort } from '../hooks/useSort'
import { useError } from '../hooks/useError'
import { usePagination } from '../hooks/usePagination'
import { useAuth } from '../context/AuthContext'

const ROLE_BADGE = {
  admin:        { ...shared.badge, ...shared.badgeRed    },
  receptionist: { ...shared.badge, ...shared.badgeBlue   },
  mechanic:     { ...shared.badge, ...shared.badgeYellow },
}

export default function UsersPage() {
  const [users, setUsers]         = useState([])
  const [locations, setLocations] = useState([])
  const [loading, setLoading]     = useState(true)
  const [showForm, setShowForm]   = useState(false)
  const [saving, setSaving]       = useState(false)
  const [search, setSearch]       = useState('')
  const [filterRole, setFilterRole]     = useState('')
  const [filterStatus, setFilterStatus] = useState('active')
  const [editingPassword, setEditingPassword] = useState(null)
  const [newPassword, setNewPassword]         = useState('')
  const [showPassword, setShowPassword]       = useState(false)
  const [form, setForm] = useState({
    name: '', username: '', password: '', role: 'receptionist', location_id: ''
  })

  const { user: currentUser }       = useAuth()
  const { error, success, showError, showSuccess } = useError()
  const { toggle, sort, indicator } = useSort('name')

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    try {
      const [uRes, lRes] = await Promise.all([
        api.get('/users'),
        api.get('/locations'),
      ])
      setUsers(uRes.data)
      setLocations(lRes.data)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  function handleChange(e) { setForm({ ...form, [e.target.name]: e.target.value }) }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/users', form)
      setForm({ name: '', username: '', password: '', role: 'receptionist', location_id: '' })
      setShowForm(false)
      showSuccess('User created successfully')
      fetchAll()
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to create user')
    } finally { setSaving(false) }
  }

  async function handleToggleStatus(user) {
    const action = user.is_active ? 'deactivate' : 'reactivate'
    if (!confirm(`Are you sure you want to ${action} ${user.name}?`)) return
    try {
      await api.patch(`/users/${user.user_id}/status`, { is_active: !user.is_active })
      showSuccess(`User ${action}d successfully`)
      fetchAll()
    } catch (err) {
      showError(err.response?.data?.message || `Failed to ${action} user`)
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault()
    try {
      await api.patch(`/users/${editingPassword}/password`, { password: newPassword })
      setEditingPassword(null)
      setNewPassword('')
      showSuccess('Password updated successfully')
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to update password')
    }
  }

  const filtered = sort(
    users.filter(u => {
      const q             = search.toLowerCase()
      const matchesSearch = u.name.toLowerCase().includes(q) ||
                            u.username.toLowerCase().includes(q) ||
                            (u.location_name || '').toLowerCase().includes(q)
      const matchesRole   = filterRole   ? u.role      === filterRole   : true
      const matchesStatus = filterStatus === 'active'   ? u.is_active  === true  :
                            filterStatus === 'inactive' ? u.is_active  === false : true
      return matchesSearch && matchesRole && matchesStatus
    })
  )

  const { page, totalPages, paginated, nextPage, prevPage, goToPage, reset } = usePagination(filtered, 20)

  useEffect(() => { reset() }, [search, filterRole, filterStatus])

  if (loading) return <Layout><p style={shared.empty}>Loading...</p></Layout>

  return (
    <Layout>
      <Toast error={error} success={success} />

      <div style={shared.pageHeader}>
        <h2 style={shared.pageTitle}>Users</h2>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Search users..." />
          <select
            style={{ ...shared.input, width: 'auto' }}
            value={filterRole}
            onChange={e => setFilterRole(e.target.value)}
          >
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="receptionist">Receptionist</option>
            <option value="mechanic">Mechanic</option>
          </select>
          <select
            style={{ ...shared.input, width: 'auto' }}
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="">All</option>
          </select>
          {showForm && <button style={shared.btnGhost} onClick={() => setShowForm(false)}>Cancel</button>}
          <button style={shared.btnPrimary} onClick={() => setShowForm(!showForm)}>+ New User</button>
        </div>
      </div>

      {showForm && (
        <div style={{ ...shared.card, marginBottom: '1.5rem' }}>
          <h3 style={{ fontWeight: '700', marginBottom: '0.25rem' }}>New User</h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            For mechanic accounts use the Mechanics page — this creates admin and receptionist accounts only.
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
                  placeholder="Maria López"
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
                  placeholder="mlopez"
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
                <label style={shared.label}>Role *</label>
                <select style={shared.input} name="role" value={form.role} onChange={handleChange} required>
                  <option value="receptionist">Receptionist</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div style={shared.field}>
                <label style={shared.label}>Location *</label>
                <select style={shared.input} name="location_id" value={form.location_id} onChange={handleChange} required>
                  <option value="">Select a location</option>
                  {locations.filter(l => l.is_active).map(l => (
                    <option key={l.location_id} value={l.location_id}>{l.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <button style={shared.btnSuccess} type="submit" disabled={saving}>
              {saving ? 'Creating...' : 'Create User'}
            </button>
          </form>
        </div>
      )}

      {/* Password change modal */}
      {editingPassword && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h3 style={{ fontWeight: '700', marginBottom: '1rem' }}>Change Password</h3>
            <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={shared.field}>
                <label style={shared.label}>New Password *</label>
                <div style={{ position: 'relative' }}>
                  <input
                    style={{ ...shared.input, paddingRight: '2.5rem' }}
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    minLength={8}
                    autoFocus
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
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button style={shared.btnPrimary} type="submit">Update Password</button>
                <button
                  style={shared.btnGhost}
                  type="button"
                  onClick={() => { setEditingPassword(null); setNewPassword('') }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <TableMeta total={users.length} showing={filtered.length} label="users" />

      {filtered.length === 0 ? (
        <div style={styles.emptyState}>
          <p style={styles.emptyIcon}>👤</p>
          <p style={styles.emptyText}>{search ? `No users match "${search}"` : 'No users found'}</p>
          {search && <button style={shared.btnGhost} onClick={() => setSearch('')}>Clear search</button>}
        </div>
      ) : (
        <>
          <div style={shared.tableWrapper}>
            <table style={shared.table}>
              <thead style={shared.thead}>
                <tr>
                  <SortableTh label="Name"     sortKey="name"          currentKey="name"          onSort={toggle} indicator={indicator} />
                  <SortableTh label="Username" sortKey="username"      currentKey="username"      onSort={toggle} indicator={indicator} />
                  <SortableTh label="Role"     sortKey="role"          currentKey="role"          onSort={toggle} indicator={indicator} />
                  <SortableTh label="Location" sortKey="location_name" currentKey="location_name" onSort={toggle} indicator={indicator} />
                  <SortableTh label="Status"   sortKey="is_active"     currentKey="is_active"     onSort={toggle} indicator={indicator} />
                  <th style={shared.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map(u => (
                  <tr key={u.user_id} style={shared.tr}>
                    <td style={{ ...shared.td, fontWeight: '600' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <div style={{
                          ...styles.avatar,
                          backgroundColor: u.role === 'admin' ? 'var(--accent-danger)' :
                                           u.role === 'receptionist' ? 'var(--accent)' : 'var(--accent-warning)'
                        }}>
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        {u.name}
                        {u.user_id === currentUser?.user_id && (
                          <span style={{ ...shared.badge, ...shared.badgeGreen, fontSize: '0.7rem' }}>You</span>
                        )}
                      </div>
                    </td>
                    <td style={{ ...shared.td, color: 'var(--text-secondary)' }}>@{u.username}</td>
                    <td style={shared.td}>
                      <span style={ROLE_BADGE[u.role]}>{u.role}</span>
                    </td>
                    <td style={shared.td}>{u.location_name}</td>
                    <td style={shared.td}>
                      <span style={{ ...shared.badge, ...(u.is_active ? shared.badgeGreen : shared.badgeRed) }}>
                        {u.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={shared.td}>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          style={shared.btnGhost}
                          onClick={() => { setEditingPassword(u.user_id); setShowPassword(false) }}
                        >
                          🔑 Password
                        </button>
                        {u.user_id !== currentUser?.user_id && (
                          <button
                            style={{
                              ...shared.btnDanger,
                              ...(u.is_active ? {} : { borderColor: 'var(--accent-success)', color: 'var(--accent-success)' })
                            }}
                            onClick={() => handleToggleStatus(u)}
                          >
                            {u.is_active ? 'Deactivate' : 'Reactivate'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
  emptyState:   { textAlign: 'center', padding: '4rem 2rem', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' },
  emptyIcon:    { fontSize: '2.5rem', marginBottom: '0.75rem' },
  emptyText:    { color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.95rem' },
  avatar:       { width: '28px', height: '28px', borderRadius: '50%', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '0.75rem', flexShrink: 0 },
  eyeBtn:       { position: 'absolute', right: '0.6rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem', padding: '0', color: 'var(--text-muted)' },
  modalOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  modal:        { backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', padding: '2rem', width: '100%', maxWidth: '400px', boxShadow: 'var(--shadow-md)', border: '1px solid var(--border)' },
}