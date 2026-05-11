import { useState, useEffect } from 'react'
import api from '../api'
import Layout     from '../components/Layout'
import SearchBar  from '../components/SearchBar'
import TableMeta  from '../components/TableMeta'
import SortableTh from '../components/SortableTh'
import Pagination from '../components/Pagination'
import { shared } from '../styles/shared'
import { useSort } from '../hooks/useSort'
import { useLocation } from '../context/LocationContext'
import { usePagination } from '../hooks/usePagination'

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
  const { currentLocation } = useLocation()

  const [workOrders, setWorkOrders] = useState([])
  const [customers, setCustomers]   = useState([])
  const [vehicles, setVehicles]     = useState([])
  const [mechanics, setMechanics]   = useState([])
  const [services, setServices]     = useState([])
  const [parts, setParts]           = useState([])
  const [loading, setLoading]       = useState(true)
  const [showForm, setShowForm]     = useState(false)
  const [saving, setSaving]         = useState(false)
  const [selected, setSelected]     = useState(null)
  
  // FIX: Seed location_id from currentLocation
  const [form, setForm] = useState({
    location_id: currentLocation?.location_id?.toString() || '',
    customer_id: '', 
    vehicle_id: '',
    priority: 'normal', 
    mileage: '', 
    problem_description: ''
  })

  // Sync location_id when context becomes available
  useEffect(() => {
    if (currentLocation) {
      setForm(prev => ({ ...prev, location_id: String(currentLocation.location_id) }))
    }
  }, [currentLocation])

  const [detail, setDetail]         = useState(null)
  const [filterStatus, setFilterStatus] = useState('')
  const [search, setSearch]         = useState('')
  
  // Hooks
  const { toggle, sort, indicator, sortKey } = useSort('created_at', 'desc')
  
  const [serviceForm, setServiceForm] = useState({ service_id: '', mechanic_id: '', hours: '1', price_at_time: '' })
  const [partForm, setPartForm]       = useState({ part_id: '', quantity: '1', price_at_time: '', cost_price_at_time: '' })

  useEffect(() => { if (currentLocation) fetchAll() }, [currentLocation])

  async function fetchAll() {
    try {
      const [woRes, cRes, vRes, mRes, sRes, pRes] = await Promise.all([
        api.get(`/workorders?location_id=${currentLocation.location_id}`),
        api.get('/customers'),
        api.get('/vehicles'),
        api.get('/mechanics'),
        api.get('/services'),
        api.get('/parts'),
      ])
      setWorkOrders(woRes.data)
      setCustomers(cRes.data)
      setVehicles(vRes.data)
      setMechanics(mRes.data)
      setServices(sRes.data)
      setParts(pRes.data)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  async function openDetail(wo) {
    setSelected(wo)
    try {
      const res = await api.get(`/workorders/${wo.work_order_id}`)
      setDetail(res.data)
    } catch (err) { console.error(err) }
  }

  async function refreshDetail(id) {
    try {
      const res = await api.get(`/workorders/${id}`)
      setDetail(res.data)
    } catch (err) { console.error(err) }
  }

  function handleChange(e) { setForm({ ...form, [e.target.name]: e.target.value }) }
  function handleCustomerChange(e) { setForm({ ...form, customer_id: e.target.value, vehicle_id: '' }) }

  const filteredVehicles = vehicles.filter(v => v.customer_id === parseInt(form.customer_id))

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/workorders', {
        ...form,
        location_id: String(currentLocation.location_id),
      })
      alert('Work order created successfully')
      setForm({
        location_id: String(currentLocation.location_id),
        customer_id: '', vehicle_id: '',
        priority: 'normal', mileage: '', problem_description: ''
      })
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
      if (selected?.work_order_id === id) refreshDetail(id)
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status')
    }
  }

  async function handleAddService(e) {
    e.preventDefault()
    try {
      await api.post(`/workorders/${detail.work_order_id}/services`, {
        service_id:    parseInt(serviceForm.service_id),
        mechanic_id:   parseInt(serviceForm.mechanic_id),
        hours:         parseFloat(serviceForm.hours),
        price_at_time: parseFloat(serviceForm.price_at_time),
      })
      setServiceForm({ service_id: '', mechanic_id: '', hours: '1', price_at_time: '' })
      refreshDetail(detail.work_order_id)
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add service')
    }
  }

  async function handleAddPart(e) {
    e.preventDefault()
    try {
      await api.post(`/workorders/${detail.work_order_id}/parts`, {
        part_id:            parseInt(partForm.part_id),
        quantity:           parseInt(partForm.quantity),
        price_at_time:      parseFloat(partForm.price_at_time),
        cost_price_at_time: parseFloat(partForm.cost_price_at_time),
      })
      setPartForm({ part_id: '', quantity: '1', price_at_time: '', cost_price_at_time: '' })
      refreshDetail(detail.work_order_id)
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add part')
    }
  }

  async function handleRemoveService(serviceId) {
    if (!confirm('Remove this service?')) return
    try {
      await api.delete(`/workorders/${detail.work_order_id}/services/${serviceId}`)
      refreshDetail(detail.work_order_id)
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to remove service')
    }
  }

  async function handleRemovePart(partLineId) {
    if (!confirm('Remove this part? Stock will be restored.')) return
    try {
      await api.delete(`/workorders/${detail.work_order_id}/parts/${partLineId}`)
      refreshDetail(detail.work_order_id)
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to remove part')
    }
  }

  function handleServiceSelect(e) {
    const svc = services.find(s => String(s.service_id) === e.target.value)
    setServiceForm({ ...serviceForm, service_id: e.target.value, price_at_time: svc ? String(svc.base_price) : '' })
  }

  function handlePartSelect(e) {
    const part = parts.find(p => String(p.part_id) === e.target.value)
    setPartForm({
      ...partForm,
      part_id:            e.target.value,
      price_at_time:      part ? String(part.sale_price)  : '',
      cost_price_at_time: part ? String(part.cost_price)  : '',
    })
  }

  function getMechanicsSummary(services = []) {
    return Object.values(
      services.reduce((acc, s) => {
        const key = s.mechanic_name || 'Unassigned'
        if (!acc[key]) acc[key] = { name: key, hours: 0, services: 0 }
        acc[key].hours    += parseFloat(s.hours || 0)
        acc[key].services += 1
        return acc
      }, {})
    )
  }

  const filtered = sort(
    workOrders.filter(wo => {
      const matchesStatus = filterStatus ? wo.status === filterStatus : true
      const q = search.toLowerCase()
      const matchesSearch =
        wo.customer_name.toLowerCase().includes(q) ||
        wo.make.toLowerCase().includes(q)          ||
        wo.model.toLowerCase().includes(q)         ||
        (wo.plate || '').toLowerCase().includes(q) ||
        String(wo.work_order_id).includes(q)
      return matchesStatus && matchesSearch
    })
  )

  const { page, totalPages, paginated, nextPage, prevPage, goToPage, reset } = usePagination(filtered, 10)

  useEffect(() => { reset() }, [search, filterStatus])

  if (loading) return <Layout><p style={shared.empty}>Loading...</p></Layout>

  return (
    <Layout>
      <div style={shared.pageHeader}>
        <h2 style={shared.pageTitle}>Work Orders</h2>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Search work orders..." />
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
          <h3 style={styles.sectionTitle}>New Work Order</h3>
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

      <div style={selected ? styles.splitView : {}}>
        <div>
          <TableMeta total={workOrders.length} showing={filtered.length} label="work orders" />
          {filtered.length === 0 ? (
            <div style={styles.emptyState}>
              <p style={styles.emptyIcon}>🔧</p>
              <p style={styles.emptyText}>{search ? `No work orders match "${search}"` : 'No work orders found'}</p>
              {search && <button style={shared.btnGhost} onClick={() => setSearch('')}>Clear search</button>}
            </div>
          ) : (
            <>
              <div style={shared.tableWrapper}>
                <table style={shared.table}>
                  <thead style={shared.thead}>
                    <tr>
                      <SortableTh label="#"        sortKey="work_order_id" currentKey={sortKey} onSort={toggle} indicator={indicator} />
                      <SortableTh label="Customer" sortKey="customer_name" currentKey={sortKey} onSort={toggle} indicator={indicator} />
                      <SortableTh label="Vehicle"  sortKey="make"          currentKey={sortKey} onSort={toggle} indicator={indicator} />
                      <SortableTh label="Priority" sortKey="priority"      currentKey={sortKey} onSort={toggle} indicator={indicator} />
                      <SortableTh label="Status"   sortKey="status"        currentKey={sortKey} onSort={toggle} indicator={indicator} />
                      <SortableTh label="Opened"   sortKey="created_at"    currentKey={sortKey} onSort={toggle} indicator={indicator} />
                      <th style={shared.th}>Update Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map(wo => (
                      <tr
                        key={wo.work_order_id}
                        style={{
                          ...shared.tr,
                          cursor: 'pointer',
                          backgroundColor: selected?.work_order_id === wo.work_order_id
                            ? 'var(--bg-hover)' : 'transparent',
                        }}
                        onClick={() => openDetail(wo)}
                      >
                        <td style={{ ...shared.td, fontWeight: '700', color: 'var(--accent)' }}>#{wo.work_order_id}</td>
                        <td style={shared.td}>{wo.customer_name}</td>
                        <td style={shared.td}>{wo.make} {wo.model} ({wo.year})</td>
                        <td style={shared.td}>
                          <span style={PRIORITY_BADGE[wo.priority]}>{wo.priority}</span>
                        </td>
                        <td style={shared.td}>
                          <span style={STATUS_BADGE[wo.status]}>{wo.status.replace(/_/g, ' ')}</span>
                        </td>
                        <td style={{ ...shared.td, color: 'var(--text-secondary)' }}>
                          {new Date(wo.created_at).toLocaleDateString()}
                        </td>
                        <td style={shared.td} onClick={e => e.stopPropagation()}>
                          <select
                            style={{ ...shared.input, padding: '0.35rem 0.6rem', width: 'auto' }}
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

              <Pagination 
                page={page} 
                totalPages={totalPages} 
                nextPage={nextPage} 
                prevPage={prevPage} 
                goToPage={goToPage} 
              />
            </>
          )}
        </div>

        {selected && (
          <div style={styles.detailPanel}>
            <div style={styles.detailHeader}>
              <div>
                <h3 style={styles.detailTitle}>Work Order #{selected.work_order_id}</h3>
                <p style={styles.detailSub}>{selected.customer_name} — {selected.make} {selected.model}</p>
              </div>
              <button style={shared.btnGhost} onClick={() => { setSelected(null); setDetail(null) }}>✕</button>
            </div>

            {!detail ? (
              <p style={shared.empty}>Loading details...</p>
            ) : (
              <>
                <div style={styles.infoGrid}>
                  <InfoBlock label="Status">
                    <span style={STATUS_BADGE[detail.status]}>{detail.status.replace(/_/g, ' ')}</span>
                  </InfoBlock>
                  <InfoBlock label="Priority">
                    <span style={PRIORITY_BADGE[detail.priority]}>{detail.priority}</span>
                  </InfoBlock>
                  <InfoBlock label="Mileage">
                    {detail.mileage ? `${Number(detail.mileage).toLocaleString()} km` : '—'}
                  </InfoBlock>
                  <InfoBlock label="Opened">
                    {new Date(detail.created_at).toLocaleDateString()}
                  </InfoBlock>
                </div>

                {detail.problem_description && (
                  <div style={styles.descBlock}>
                    <p style={shared.label}>Problem Description</p>
                    <p style={styles.descText}>{detail.problem_description}</p>
                  </div>
                )}

                <Section title="👨‍🔧 Mechanics">
                  {detail.services?.length === 0 ? (
                    <p style={styles.subEmpty}>Add services to see mechanic assignments</p>
                  ) : (
                    getMechanicsSummary(detail.services).map((m, i) => (
                      <div key={i} style={styles.lineItem}>
                        <span style={{ fontWeight: '600' }}>{m.name}</span>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                          {m.services} service{m.services > 1 ? 's' : ''} · {m.hours.toFixed(1)}h
                        </span>
                      </div>
                    ))
                  )}
                </Section>

                <Section title="🔧 Services">
                  {detail.services?.map((s, i) => (
                    <div key={i} style={styles.lineItem}>
                      <div>
                        <p style={{ fontWeight: '600', fontSize: '0.9rem' }}>{s.service_name}</p>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                          {s.mechanic_name} · {s.hours}h
                        </p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ fontWeight: '700' }}>${parseFloat(s.price_at_time).toFixed(2)}</span>
                        {!['completed', 'cancelled'].includes(detail.status) && (
                          <button style={styles.removeBtn} onClick={() => handleRemoveService(s.id)}>✕</button>
                        )}
                      </div>
                    </div>
                  ))}
                  {!['completed', 'cancelled'].includes(detail.status) && (
                    <form onSubmit={handleAddService} style={{ ...styles.subForm, flexWrap: 'wrap' }}>
                      <select style={{ ...shared.input, flex: 2, minWidth: '140px' }} value={serviceForm.service_id} onChange={handleServiceSelect} required>
                        <option value="">Select service</option>
                        {services.filter(s => s.is_active).map(s => (
                          <option key={s.service_id} value={s.service_id}>{s.name} — ${s.base_price}</option>
                        ))}
                      </select>
                      <select style={{ ...shared.input, flex: 2, minWidth: '140px' }} value={serviceForm.mechanic_id} onChange={e => setServiceForm({ ...serviceForm, mechanic_id: e.target.value })} required>
                        <option value="">Mechanic</option>
                        {mechanics.map(m => (
                          <option key={m.mechanic_id} value={m.mechanic_id}>{m.name}</option>
                        ))}
                      </select>
                      <input style={{ ...shared.input, width: '70px' }} type="number" placeholder="Hrs" min="0.5" step="0.5" value={serviceForm.hours} onChange={e => setServiceForm({ ...serviceForm, hours: e.target.value })} required />
                      <input style={{ ...shared.input, width: '90px' }} type="number" placeholder="Price $" value={serviceForm.price_at_time} onChange={e => setServiceForm({ ...serviceForm, price_at_time: e.target.value })} required />
                      <button style={shared.btnSuccess} type="submit">Add</button>
                    </form>
                  )}
                </Section>

                <Section title="🔩 Parts Used">
                  {detail.parts?.map((p, i) => (
                    <div key={i} style={styles.lineItem}>
                      <div>
                        <p style={{ fontWeight: '600', fontSize: '0.9rem' }}>{p.part_name}</p>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                          {p.part_number} · qty {p.quantity}
                        </p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ fontWeight: '700' }}>${(parseFloat(p.price_at_time) * p.quantity).toFixed(2)}</span>
                        {!['completed', 'cancelled'].includes(detail.status) && (
                          <button style={styles.removeBtn} onClick={() => handleRemovePart(p.id)}>✕</button>
                        )}
                      </div>
                    </div>
                  ))}
                  {!['completed', 'cancelled'].includes(detail.status) && (
                    <form onSubmit={handleAddPart} style={{ ...styles.subForm, flexWrap: 'wrap' }}>
                      <select style={{ ...shared.input, flex: 2, minWidth: '140px' }} value={partForm.part_id} onChange={handlePartSelect} required>
                        <option value="">Select part</option>
                        {parts.map(p => (
                          <option key={p.part_id} value={p.part_id}>{p.name} {p.part_number ? `(${p.part_number})` : ''}</option>
                        ))}
                      </select>
                      <input style={{ ...shared.input, width: '60px' }} type="number" placeholder="Qty" min="1" value={partForm.quantity} onChange={e => setPartForm({ ...partForm, quantity: e.target.value })} required />
                      <input style={{ ...shared.input, width: '80px' }} type="number" placeholder="Sale $" value={partForm.price_at_time} onChange={e => setPartForm({ ...partForm, price_at_time: e.target.value })} required />
                      <input style={{ ...shared.input, width: '80px' }} type="number" placeholder="Cost $" value={partForm.cost_price_at_time} onChange={e => setPartForm({ ...partForm, cost_price_at_time: e.target.value })} required />
                      <button style={shared.btnSuccess} type="submit">Add</button>
                    </form>
                  )}
                </Section>

                {(detail.services?.length > 0 || detail.parts?.length > 0) && (
                  <div style={styles.totals}>
                    <TotalRow label="Services" value={detail.services.reduce((s, x) => s + parseFloat(x.price_at_time) * parseFloat(x.hours), 0)} />
                    <TotalRow label="Parts" value={detail.parts.reduce((s, x) => s + parseFloat(x.price_at_time) * x.quantity, 0)} />
                    <div style={styles.totalFinalRow}>
                      <span>Estimated Total</span>
                      <span>${(detail.services.reduce((s, x) => s + parseFloat(x.price_at_time) * parseFloat(x.hours), 0) + detail.parts.reduce((s, x) => s + parseFloat(x.price_at_time) * x.quantity, 0)).toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}

function Section({ title, children }) {
  return (
    <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border)' }}>
      <p style={{ fontWeight: '700', fontSize: '0.85rem', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>{title}</p>
      {children}
    </div>
  )
}

function InfoBlock({ label, children }) {
  return (
    <div style={{ backgroundColor: 'var(--bg-table-head)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
      <p style={{ fontSize: '0.7rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>{label}</p>
      <div style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-primary)' }}>{children}</div>
    </div>
  )
}

function TotalRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
      <span>{label}</span>
      <span>${value.toFixed(2)}</span>
    </div>
  )
}

const styles = {
  splitView:     { display: 'grid', gridTemplateColumns: '1fr 420px', gap: '1.5rem', alignItems: 'start' },
  detailPanel:   { backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)', padding: '1.25rem', position: 'sticky', top: 'calc(var(--nav-height) + 1rem)' },
  detailHeader:  { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' },
  detailTitle:   { fontWeight: '700', fontSize: '1.05rem', color: 'var(--text-primary)' },
  detailSub:     { color: 'var(--text-secondary)', fontSize: '0.82rem', marginTop: '0.2rem' },
  infoGrid:      { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.75rem' },
  descBlock:     { backgroundColor: 'var(--bg-table-head)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', marginBottom: '0.5rem' },
  descText:      { fontSize: '0.875rem', color: 'var(--text-primary)', lineHeight: 1.5 },
  lineItem:      { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid var(--border)' },
  subForm:       { display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.75rem' },
  subEmpty:      { color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic', padding: '0.5rem 0' },
  totals:        { marginTop: '1.25rem', paddingTop: '1rem', borderTop: '2px solid var(--border)' },
  totalFinalRow: { display: 'flex', justifyContent: 'space-between', fontWeight: '700', fontSize: '1rem', color: 'var(--text-primary)', borderTop: '1px solid var(--border)', marginTop: '0.5rem', paddingTop: '0.5rem' },
  sectionTitle:  { fontWeight: '700', marginBottom: '1rem', color: 'var(--text-primary)' },
  emptyState:    { textAlign: 'center', padding: '4rem 2rem', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' },
  emptyIcon:     { fontSize: '2.5rem', marginBottom: '0.75rem' },
  emptyText:     { color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.95rem' },
  removeBtn:     { background: 'none', border: 'none', color: 'var(--accent-danger)', cursor: 'pointer', fontSize: '0.85rem', padding: '0.1rem 0.25rem', borderRadius: 'var(--radius-sm)', flexShrink: 0 },
}