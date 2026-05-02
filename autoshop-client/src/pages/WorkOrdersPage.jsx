import { useState, useEffect } from 'react'
import api from '../api'
import Layout from '../components/Layout'
import { shared } from '../styles/shared'

const STATUS_BADGE = {
  open:          { ...shared.badge, ...shared.badgeBlue   },
  in_progress:   { ...shared.badge, ...shared.badgeYellow },
  waiting_parts: { ...shared.badge, ...shared.badgeYellow },
  completed:     { ...shared.badge, ...shared.badgeGreen  },
  cancelled:     { ...shared.badge, ...shared.badgeRed    },
}

const PRIORITY_BADGE = {
  low:    { ...shared.badge, ...shared.badgeGray   },
  normal: { ...shared.badge, ...shared.badgeBlue   },
  high:   { ...shared.badge, ...shared.badgeYellow },
  urgent: { ...shared.badge, ...shared.badgeRed    },
}

export default function WorkOrdersPage() {
  const [workOrders, setWorkOrders] = useState([])
  const [customers, setCustomers]   = useState([])
  const [vehicles, setVehicles]     = useState([])
  const [loading, setLoading]       = useState(true)
  const [showForm, setShowForm]     = useState(false)
  const [saving, setSaving]         = useState(false)
  const [filterStatus, setFilterStatus] = useState('')
  const [form, setForm] = useState({
    location_id: '1', customer_id: '', vehicle_id: '',
    priority: 'normal', mileage: '', problem_description: ''
  })

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    try {
      const [woRes, cRes, vRes] = await Promise.all([
        api.get('/workorders'),
        api.get('/customers'),
        api.get('/vehicles'),
      ])
      setWorkOrders(woRes.data)
      setCustomers(cRes.data)
      setVehicles(vRes.data)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  function handleChange(e) { setForm({ ...form, [e.target.name]: e.target.value }) }
  function handleCustomerChange(e) { setForm({ ...form, customer_id: e.target.value, vehicle_id: '' }) }

  const filteredVehicles = vehicles.filter(v => v.customer_id === parseInt(form.customer_id))

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/workorders', form)
      setForm({ location_id: '1', customer_id: '', vehicle_id: '', priority: 'normal', mileage: '', problem_description: '' })
      setShowForm(false)
      fetchAll()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create work order')
    } finally { setSaving(false) }
  }

  async function handleStatusChange(id, status) {
    try {
      await api.patch(`/workorders/${id}/status`, { status })
      fetchAll()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status')
    }
  }

  const displayed = filterStatus ? workOrders.filter(wo => wo.status === filterStatus) : workOrders

  if (loading) return <Layout><p style={shared.empty}>Loading...</p></Layout>

  return (
    <Layout>
      <div style={shared.pageHeader}>
        <h2 style={shared.pageTitle}>Work Orders</h2>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <select style={{ ...shared.input, width: 'auto' }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="waiting_parts">Waiting Parts</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          {showForm && <button style={shared.btnGhost} onClick={() => setShowForm(false)}>Cancel</button>}
          <button style={shared.btnPrimary} onClick={() => setShowForm(!showForm)}>+ New Work Order</button>
        </div>
      </div>

      {showForm && (
        <div style={{ ...shared.card, marginBottom: '1.5rem' }}>
          <h3 style={styles.formTitle}>New Work Order</h3>
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
                <label style={shared.label}>Priority</label>
                <select style={shared.input} name="priority" value={form.priority} onChange={handleChange}>
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div style={shared.field}>
                <label style={shared.label}>Mileage</label>
                <input style={shared.input} name="mileage" type="number" value={form.mileage} onChange={handleChange} placeholder="45000" />
              </div>
              <div style={{ ...shared.field, gridColumn: '1 / -1' }}>
                <label style={shared.label}>Problem Description</label>
                <textarea style={{ ...shared.input, minHeight: '80px', resize: 'vertical' }} name="problem_description" value={form.problem_description} onChange={handleChange} placeholder="Describe the issue..." />
              </div>
            </div>
            <button style={shared.btnSuccess} type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Open Work Order'}
            </button>
          </form>
        </div>
      )}

      {displayed.length === 0 ? (
        <p style={shared.empty}>No work orders found.</p>
      ) : (
        <div style={shared.tableWrapper}>
          <table style={shared.table}>
            <thead style={shared.thead}>
              <tr>
                <th style={shared.th}>#</th>
                <th style={shared.th}>Customer</th>
                <th style={shared.th}>Vehicle</th>
                <th style={shared.th}>Priority</th>
                <th style={shared.th}>Status</th>
                <th style={shared.th}>Opened</th>
                <th style={shared.th}>Update Status</th>
              </tr>
            </thead>
            <tbody>
              {displayed.map(wo => (
                <tr key={wo.work_order_id} style={shared.tr}>
                  <td style={{ ...shared.td, fontWeight: '700', color: 'var(--accent)' }}>#{wo.work_order_id}</td>
                  <td style={shared.td}>{wo.customer_name}</td>
                  <td style={shared.td}>{wo.make} {wo.model} ({wo.year})</td>
                  <td style={shared.td}>
                    <span style={PRIORITY_BADGE[wo.priority]}>{wo.priority}</span>
                  </td>
                  <td style={shared.td}>
                    <span style={STATUS_BADGE[wo.status]}>{wo.status.replace('_', ' ')}</span>
                  </td>
                  <td style={{ ...shared.td, color: 'var(--text-secondary)' }}>
                    {new Date(wo.created_at).toLocaleDateString()}
                  </td>
                  <td style={shared.td}>
                    <select style={{ ...shared.input, padding: '0.35rem 0.6rem', width: 'auto' }} value={wo.status} onChange={e => handleStatusChange(wo.work_order_id, e.target.value)}>
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="waiting_parts">Waiting Parts</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
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