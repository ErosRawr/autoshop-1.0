import { useState, useEffect } from 'react'
import api from '../api'
import Layout from '../components/Layout'

const STATUS_COLORS = {
  open:          { bg: '#dbeafe', color: '#1d4ed8' },
  in_progress:   { bg: '#fef9c3', color: '#854d0e' },
  waiting_parts: { bg: '#ffedd5', color: '#9a3412' },
  completed:     { bg: '#dcfce7', color: '#15803d' },
  cancelled:     { bg: '#fee2e2', color: '#b91c1c' },
}

const PRIORITY_COLORS = {
  low:    { bg: '#f3f4f6', color: '#6b7280' },
  normal: { bg: '#dbeafe', color: '#1d4ed8' },
  high:   { bg: '#ffedd5', color: '#9a3412' },
  urgent: { bg: '#fee2e2', color: '#b91c1c' },
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

  useEffect(() => {
    fetchAll()
  }, [])

  async function fetchAll() {
    try {
      const [woRes, custRes, vehRes] = await Promise.all([
        api.get('/workorders'),
        api.get('/customers'),
        api.get('/vehicles'),
      ])
      setWorkOrders(woRes.data)
      setCustomers(custRes.data)
      setVehicles(vehRes.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  // When customer changes, reset vehicle selection
  function handleCustomerChange(e) {
    setForm({ ...form, customer_id: e.target.value, vehicle_id: '' })
  }

  // Only show vehicles belonging to selected customer
  const filteredVehicles = vehicles.filter(
    v => v.customer_id === parseInt(form.customer_id)
  )

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/workorders', form)
      setForm({
        location_id: '1', customer_id: '', vehicle_id: '',
        priority: 'normal', mileage: '', problem_description: ''
      })
      setShowForm(false)
      fetchAll()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create work order')
    } finally {
      setSaving(false)
    }
  }

  async function handleStatusChange(id, status) {
    try {
      await api.patch(`/workorders/${id}/status`, { status })
      fetchAll()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status')
    }
  }

  const displayed = filterStatus
    ? workOrders.filter(wo => wo.status === filterStatus)
    : workOrders

  if (loading) return <Layout><p>Loading...</p></Layout>

  return (
    <Layout>
      {/* Header */}
      <div style={styles.header}>
        <h2 style={styles.title}>Work Orders</h2>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <select
            style={styles.filterSelect}
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="waiting_parts">Waiting Parts</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <button style={styles.addButton} onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : '+ New Work Order'}
          </button>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div style={styles.formCard}>
          <h3 style={styles.formTitle}>New Work Order</h3>
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.formGrid}>
              <div style={styles.field}>
                <label style={styles.label}>Customer *</label>
                <select
                  style={styles.input}
                  name="customer_id"
                  value={form.customer_id}
                  onChange={handleCustomerChange}
                  required
                >
                  <option value="">Select a customer</option>
                  {customers.filter(c => c.is_active).map(c => (
                    <option key={c.customer_id} value={c.customer_id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Vehicle *</label>
                <select
                  style={styles.input}
                  name="vehicle_id"
                  value={form.vehicle_id}
                  onChange={handleChange}
                  required
                  disabled={!form.customer_id}
                >
                  <option value="">
                    {form.customer_id ? 'Select a vehicle' : 'Select customer first'}
                  </option>
                  {filteredVehicles.map(v => (
                    <option key={v.vehicle_id} value={v.vehicle_id}>
                      {v.make} {v.model} {v.year} — {v.plate || 'No plate'}
                    </option>
                  ))}
                </select>
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Priority</label>
                <select
                  style={styles.input}
                  name="priority"
                  value={form.priority}
                  onChange={handleChange}
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Mileage</label>
                <input
                  style={styles.input}
                  name="mileage"
                  type="number"
                  value={form.mileage}
                  onChange={handleChange}
                  placeholder="45000"
                />
              </div>
              <div style={{ ...styles.field, gridColumn: '1 / -1' }}>
                <label style={styles.label}>Problem Description</label>
                <textarea
                  style={{ ...styles.input, minHeight: '80px', resize: 'vertical' }}
                  name="problem_description"
                  value={form.problem_description}
                  onChange={handleChange}
                  placeholder="Describe the issue..."
                />
              </div>
            </div>
            <button style={styles.saveButton} type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Open Work Order'}
            </button>
          </form>
        </div>
      )}

      {/* Work Orders Table */}
      {displayed.length === 0 ? (
        <p style={{ color: '#6b7280', marginTop: '2rem' }}>No work orders found.</p>
      ) : (
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.thead}>
                <th style={styles.th}>#</th>
                <th style={styles.th}>Customer</th>
                <th style={styles.th}>Vehicle</th>
                <th style={styles.th}>Priority</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Opened</th>
                <th style={styles.th}>Update Status</th>
              </tr>
            </thead>
            <tbody>
              {displayed.map(wo => (
                <tr key={wo.work_order_id} style={styles.tr}>
                  <td style={styles.td}>#{wo.work_order_id}</td>
                  <td style={styles.td}>{wo.customer_name}</td>
                  <td style={styles.td}>{wo.make} {wo.model} ({wo.year})</td>
                  <td style={styles.td}>
                    <span style={{ ...styles.badge, ...PRIORITY_COLORS[wo.priority] }}>
                      {wo.priority}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <span style={{ ...styles.badge, ...STATUS_COLORS[wo.status] }}>
                      {wo.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td style={styles.td}>
                    {new Date(wo.created_at).toLocaleDateString()}
                  </td>
                  <td style={styles.td}>
                    <select
                      style={styles.statusSelect}
                      value={wo.status}
                      onChange={e => handleStatusChange(wo.work_order_id, e.target.value)}
                    >
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
  header:       { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' },
  title:        { fontSize: '1.5rem', fontWeight: '700' },
  addButton:    { backgroundColor: '#2563eb', color: '#fff', border: 'none', padding: '0.6rem 1.25rem', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' },
  filterSelect: { padding: '0.6rem 0.875rem', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.9rem' },
  formCard:     { backgroundColor: '#fff', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', marginBottom: '1.5rem' },
  formTitle:    { marginBottom: '1rem', fontWeight: '600' },
  form:         { display: 'flex', flexDirection: 'column', gap: '1rem' },
  formGrid:     { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' },
  field:        { display: 'flex', flexDirection: 'column', gap: '0.35rem' },
  label:        { fontSize: '0.8rem', fontWeight: '600', color: '#374151' },
  input:        { padding: '0.6rem 0.875rem', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.95rem' },
  saveButton:   { backgroundColor: '#16a34a', color: '#fff', border: 'none', padding: '0.65rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', alignSelf: 'flex-start' },
  tableWrapper: { backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', overflow: 'hidden' },
  table:        { width: '100%', borderCollapse: 'collapse' },
  thead:        { backgroundColor: '#f9fafb' },
  th:           { padding: '0.875rem 1rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' },
  tr:           { borderTop: '1px solid #f3f4f6' },
  td:           { padding: '0.875rem 1rem', fontSize: '0.9rem', color: '#111827' },
  badge:        { padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: '600' },
  statusSelect: { padding: '0.35rem 0.6rem', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.85rem', cursor: 'pointer' },
}