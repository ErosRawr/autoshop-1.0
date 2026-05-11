import { useState, useEffect } from 'react'
import api from '../api'
import Layout from '../components/Layout'
import SearchBar from '../components/SearchBar'
import TableMeta from '../components/TableMeta'
import SortableTh from '../components/SortableTh'
import Pagination from '../components/Pagination' // Added
import Toast from '../components/Toast'
import { shared } from '../styles/shared'
import { useSort } from '../hooks/useSort'
import { useAuth } from '../context/AuthContext'
import { useLocation } from '../context/LocationContext'
import { useError } from '../hooks/useError'
import { usePagination } from '../hooks/usePagination' // Added

const STATUS_BADGE = {
  scheduled:  { ...shared.badge, ...shared.badgeBlue   },
  confirmed:  { ...shared.badge, ...shared.badgeGreen  },
  cancelled:  { ...shared.badge, ...shared.badgeRed    },
  completed:  { ...shared.badge, ...shared.badgeGray   },
}

const STATUS_OPTIONS = ['scheduled', 'confirmed', 'cancelled', 'completed']

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState([])
  const [customers, setCustomers]       = useState([])
  const [vehicles, setVehicles]         = useState([])
  const [mechanics, setMechanics]       = useState([])
  const [loading, setLoading]           = useState(true)
  const [showForm, setShowForm]         = useState(false)
  const [saving, setSaving]             = useState(false)
  const [search, setSearch]             = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [form, setForm]                 = useState({
    customer_id: '', vehicle_id: '', assigned_to: '',
    scheduled_at: '', duration_estimate: '', notes: ''
  })

  const { currentLocation } = useLocation()
  
  // Destructured sortKey to fix header indicators
  const { toggle, sort, indicator, sortKey } = useSort('scheduled_at', 'asc')
  const { error, success, showError, showSuccess } = useError()

  useEffect(() => { if (currentLocation) fetchAll() }, [currentLocation])

  async function fetchAll() {
    try {
      const [aRes, cRes, vRes, mRes] = await Promise.all([
        api.get(`/appointments?location_id=${currentLocation.location_id}`),
        api.get('/customers'),
        api.get('/vehicles'),
        api.get('/mechanics'),
      ])
      setAppointments(aRes.data)
      setCustomers(cRes.data)
      setVehicles(vRes.data)
      setMechanics(mRes.data)
    } catch (err) { 
      console.error(err)
      showError('Failed to fetch appointments data')
    }
    finally { setLoading(false) }
  }

  function handleChange(e) { setForm({ ...form, [e.target.name]: e.target.value }) }
  function handleCustomerChange(e) { setForm({ ...form, customer_id: e.target.value, vehicle_id: '' }) }

  const filteredVehicles = vehicles.filter(v => String(v.customer_id) === String(form.customer_id))

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/appointments', {
        ...form,
        location_id:       currentLocation.location_id,
        assigned_to:       form.assigned_to       || null,
        duration_estimate: form.duration_estimate ? parseInt(form.duration_estimate) : null,
        notes:             form.notes             || null,
      })
      showSuccess('Appointment booked successfully')
      setForm({ customer_id: '', vehicle_id: '', assigned_to: '', scheduled_at: '', duration_estimate: '', notes: '' })
      setShowForm(false)
      fetchAll()
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to create appointment')
    } finally { setSaving(false) }
  }

  async function handleStatusChange(id, status) {
    try {
      await api.patch(`/appointments/${id}/status`, { status })
      showSuccess(`Status updated to ${status}`)
      fetchAll()
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to update status')
    }
  }

  const now = new Date()
  const filtered = sort(
    appointments.filter(a => {
      const matchesStatus = filterStatus ? a.status === filterStatus : true
      const q = search.toLowerCase()
      const matchesSearch =
        a.customer_name.toLowerCase().includes(q) ||
        a.make.toLowerCase().includes(q)          ||
        a.model.toLowerCase().includes(q)         ||
        (a.plate         || '').toLowerCase().includes(q) ||
        (a.mechanic_name || '').toLowerCase().includes(q)
      return matchesStatus && matchesSearch
    })
  )

  const upcomingData = filtered.filter(a => new Date(a.scheduled_at) >= now && a.status !== 'cancelled')
  const pastData     = filtered.filter(a => new Date(a.scheduled_at) <  now || a.status === 'cancelled')

  // Pagination for both sections
  const upcomingPaginator = usePagination(upcomingData, 10)
  const pastPaginator     = usePagination(pastData, 10)

  // Reset pagination on search or filter
  useEffect(() => { 
    upcomingPaginator.reset()
    pastPaginator.reset()
  }, [search, filterStatus])

  if (loading) return <Layout><p style={shared.empty}>Loading...</p></Layout>

  return (
    <Layout>
      <Toast error={error} success={success} />
      
      <div style={shared.pageHeader}>
        <h2 style={shared.pageTitle}>Appointments</h2>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Search appointments..." />
          <select
            style={{ ...shared.input, width: 'auto' }}
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
          >
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map(s => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
          {showForm && <button style={shared.btnGhost} onClick={() => setShowForm(false)}>Cancel</button>}
          <button style={shared.btnPrimary} onClick={() => setShowForm(!showForm)}>+ New Appointment</button>
        </div>
      </div>

      {showForm && (
        <div style={{ ...shared.card, marginBottom: '1.5rem' }}>
          <h3 style={{ fontWeight: '700', marginBottom: '1rem' }}>New Appointment</h3>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={shared.formGrid}>
              <div style={shared.field}>
                <label style={shared.label}>Customer *</label>
                <select style={shared.input} name="customer_id" value={form.customer_id} onChange={handleCustomerChange} required>
                  <option value="">Select a customer</option>
                  {customers.filter(c => c.is_active).map(c => (
                    <option key={c.customer_id} value={c.customer_id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div style={shared.field}>
                <label style={shared.label}>Vehicle *</label>
                <select style={shared.input} name="vehicle_id" value={form.vehicle_id} onChange={handleChange} required disabled={!form.customer_id}>
                  <option value="">{form.customer_id ? 'Select a vehicle' : 'Select customer first'}</option>
                  {filteredVehicles.map(v => (
                    <option key={v.vehicle_id} value={v.vehicle_id}>
                      {v.make} {v.model} {v.year} — {v.plate || 'No plate'}
                    </option>
                  ))}
                </select>
              </div>
              <div style={shared.field}>
                <label style={shared.label}>Date & Time *</label>
                <input
                  style={shared.input}
                  type="datetime-local"
                  name="scheduled_at"
                  value={form.scheduled_at}
                  onChange={handleChange}
                  min={new Date().toISOString().slice(0, 16)}
                  required
                />
              </div>
              <div style={shared.field}>
                <label style={shared.label}>Assign Mechanic</label>
                <select style={shared.input} name="assigned_to" value={form.assigned_to} onChange={handleChange}>
                  <option value="">Unassigned</option>
                  {mechanics.map(m => (
                    <option key={m.mechanic_id} value={m.mechanic_id}>{m.name} {m.specialty ? `— ${m.specialty}` : ''}</option>
                  ))}
                </select>
              </div>
              <div style={shared.field}>
                <label style={shared.label}>Duration (minutes)</label>
                <input
                  style={shared.input}
                  type="number"
                  name="duration_estimate"
                  value={form.duration_estimate}
                  onChange={handleChange}
                  placeholder="60"
                  min="15"
                  step="15"
                />
              </div>
              <div style={shared.field}>
                <label style={shared.label}>Notes</label>
                <input style={shared.input} name="notes" value={form.notes} onChange={handleChange} placeholder="Customer concerns, reminders..." />
              </div>
            </div>
            <button style={shared.btnSuccess} type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Book Appointment'}
            </button>
          </form>
        </div>
      )}

      <TableMeta total={appointments.length} showing={filtered.length} label="appointments" />

      {upcomingData.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <p style={styles.sectionLabel}>📅 Upcoming ({upcomingData.length})</p>
          <AppointmentTable
            appointments={upcomingPaginator.paginated}
            toggle={toggle}
            indicator={indicator}
            sortKey={sortKey}
            onStatusChange={handleStatusChange}
            highlight
          />
          <Pagination {...upcomingPaginator} />
        </div>
      )}

      {pastData.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <p style={{ ...styles.sectionLabel, marginTop: '1.5rem' }}>🗂 Past & Cancelled ({pastData.length})</p>
          <AppointmentTable
            appointments={pastPaginator.paginated}
            toggle={toggle}
            indicator={indicator}
            sortKey={sortKey}
            onStatusChange={handleStatusChange}
          />
          <Pagination {...pastPaginator} />
        </div>
      )}

      {filtered.length === 0 && (
        <div style={styles.emptyState}>
          <p style={styles.emptyIcon}>📅</p>
          <p style={styles.emptyText}>{search ? `No appointments match "${search}"` : 'No appointments yet'}</p>
          {search && <button style={shared.btnGhost} onClick={() => setSearch('')}>Clear search</button>}
        </div>
      )}
    </Layout>
  )
}

function AppointmentTable({ appointments, toggle, indicator, sortKey, onStatusChange, highlight }) {
  return (
    <div style={shared.tableWrapper}>
      <table style={shared.table}>
        <thead style={shared.thead}>
          <tr>
            <SortableTh label="Date & Time" sortKey="scheduled_at"  currentKey={sortKey} onSort={toggle} indicator={indicator} />
            <SortableTh label="Customer"    sortKey="customer_name" currentKey={sortKey} onSort={toggle} indicator={indicator} />
            <SortableTh label="Vehicle"     sortKey="make"          currentKey={sortKey} onSort={toggle} indicator={indicator} />
            <th style={shared.th}>Mechanic</th>
            <th style={shared.th}>Duration</th>
            <th style={shared.th}>Notes</th>
            <SortableTh label="Status"      sortKey="status"        currentKey={sortKey} onSort={toggle} indicator={indicator} />
            <th style={shared.th}>Update Status</th>
          </tr>
        </thead>
        <tbody>
          {appointments.map(a => {
            const isToday = new Date(a.scheduled_at).toDateString() === new Date().toDateString()
            return (
              <tr
                key={a.appointment_id}
                style={{
                  ...shared.tr,
                  backgroundColor: highlight && isToday ? 'rgba(251, 191, 36, 0.1)' : 'transparent',
                }}
              >
                <td style={{ ...shared.td, fontWeight: '600', whiteSpace: 'nowrap' }}>
                  {new Date(a.scheduled_at).toLocaleDateString()}{' '}
                  <span style={{ color: 'var(--accent)', fontWeight: '700' }}>
                    {new Date(a.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </td>
                <td style={shared.td}>{a.customer_name}</td>
                <td style={shared.td}>{a.make} {a.model} ({a.year})</td>
                <td style={shared.td}>{a.mechanic_name || <span style={{ color: 'var(--text-muted)' }}>Unassigned</span>}</td>
                <td style={{ ...shared.td, color: 'var(--text-secondary)' }}>
                  {a.duration_estimate ? `${a.duration_estimate} min` : '—'}
                </td>
                <td style={{ ...shared.td, color: 'var(--text-secondary)', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {a.notes || '—'}
                </td>
                <td style={shared.td}>
                  <span style={STATUS_BADGE[a.status]}>{a.status}</span>
                </td>
                <td style={shared.td}>
                  <select
                    style={{ ...shared.input, padding: '0.35rem 0.6rem', width: 'auto' }}
                    value={a.status}
                    onChange={e => onStatusChange(a.appointment_id, e.target.value)}
                  >
                    {STATUS_OPTIONS.map(s => (
                      <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                    ))}
                  </select>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

const styles = {
  sectionLabel: { fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' },
  emptyState:   { textAlign: 'center', padding: '4rem 2rem', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' },
  emptyIcon:    { fontSize: '2.5rem', marginBottom: '0.75rem' },
  emptyText:    { color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.95rem' },
}