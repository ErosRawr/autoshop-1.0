import { useState, useEffect } from 'react'
import api from '../api'
import Layout from '../components/Layout'
import Pagination from '../components/Pagination'
import { shared } from '../styles/shared'
import { useLocation } from '../context/LocationContext'
import { usePagination } from '../hooks/usePagination'

const STATUS_BADGE = {
  draft:          { ...shared.badge, ...shared.badgeGray   },
  issued:         { ...shared.badge, ...shared.badgeBlue   },
  partially_paid: { ...shared.badge, ...shared.badgeYellow },
  paid:           { ...shared.badge, ...shared.badgeGreen  },
  cancelled:      { ...shared.badge, ...shared.badgeRed    },
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading]   = useState(true)
  const [selected, setSelected] = useState(null)
  const [paying, setPaying]     = useState(false)
  const [payForm, setPayForm]   = useState({ amount: '', payment_method: 'cash', reference: '' })
  const { currentLocation }     = useLocation()

  // Pagination Logic
  const { page, totalPages, paginated, nextPage, prevPage, goToPage, reset } = usePagination(invoices, 20)

  useEffect(() => {
    if (currentLocation) fetchInvoices()
  }, [currentLocation])

  // Reset pagination when location changes
  useEffect(() => { reset() }, [currentLocation])

  async function fetchInvoices() {
    try {
      const res = await api.get(`/invoices?location_id=${currentLocation.location_id}`)
      setInvoices(res.data)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  async function openDetail(id) {
    try {
      const res = await api.get(`/invoices/${id}`)
      setSelected(res.data)
    } catch (err) { alert('Failed to load invoice') }
  }

  async function handlePayment(e) {
    e.preventDefault()
    setPaying(true)
    try {
      await api.post('/payments', {
        invoice_id:     selected.invoice_id,
        amount:         parseFloat(payForm.amount),
        payment_method: payForm.payment_method,
        reference:      payForm.reference || undefined,
      })
      setPayForm({ amount: '', payment_method: 'cash', reference: '' })
      fetchInvoices()
      openDetail(selected.invoice_id)
    } catch (err) {
      alert(err.response?.data?.message || 'Payment failed')
    } finally { setPaying(false) }
  }

  if (loading) return <Layout><p style={shared.empty}>Loading...</p></Layout>

  return (
    <Layout>
      <div style={shared.pageHeader}>
        <h2 style={shared.pageTitle}>
          Invoices
          {currentLocation && (
            <span style={styles.locationBadge}>{currentLocation.name}</span>
          )}
        </h2>
      </div>

      <div style={styles.splitView}>
        {/* List */}
        <div style={styles.list}>
          {invoices.length === 0 ? (
            <div style={styles.emptyState}>
              <p style={styles.emptyIcon}>🧾</p>
              <p style={styles.emptyText}>No invoices at {currentLocation?.name} yet</p>
            </div>
          ) : (
            <>
              {paginated.map(inv => (
                <div
                  key={inv.invoice_id}
                  style={{ ...styles.invoiceCard, ...(selected?.invoice_id === inv.invoice_id ? styles.invoiceCardActive : {}) }}
                  onClick={() => openDetail(inv.invoice_id)}
                >
                  <div style={styles.invoiceCardTop}>
                    <span style={styles.folio}>{inv.folio}</span>
                    <span style={STATUS_BADGE[inv.status]}>{inv.status.replace('_', ' ')}</span>
                  </div>
                  <p style={styles.invoiceCustomer}>{inv.customer_name}</p>
                  <div style={styles.invoiceCardBottom}>
                    <span style={styles.invoiceTotal}>${parseFloat(inv.total).toFixed(2)}</span>
                    <span style={styles.invoiceDate}>{new Date(inv.date).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
              
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

        {/* Detail */}
        {selected ? (
          <div style={{ ...shared.card }}>
            <div style={styles.detailHeader}>
              <div>
                <h3 style={styles.detailFolio}>{selected.folio}</h3>
                <p style={styles.detailSub}>Work Order #{selected.work_order_id}</p>
              </div>
              <span style={STATUS_BADGE[selected.status]}>{selected.status.replace('_', ' ')}</span>
            </div>

            <div style={styles.infoGrid}>
              <div style={styles.infoBlock}>
                <p style={shared.label}>Customer</p>
                <p style={styles.infoValue}>{selected.customer_name}</p>
                <p style={styles.infoSub}>{selected.customer_phone}</p>
              </div>
              <div style={styles.infoBlock}>
                <p style={shared.label}>Vehicle</p>
                <p style={styles.infoValue}>{selected.make} {selected.model} {selected.year}</p>
                <p style={styles.infoSub}>{selected.plate || 'No plate'}</p>
              </div>
            </div>

            {selected.services.length > 0 && (
              <div style={styles.section}>
                <p style={styles.sectionTitle}>Services</p>
                <table style={shared.table}>
                  <thead><tr>
                    <th style={shared.th}>Service</th>
                    <th style={shared.th}>Hours</th>
                    <th style={shared.th}>Price</th>
                    <th style={shared.th}>Subtotal</th>
                  </tr></thead>
                  <tbody>
                    {selected.services.map((s, i) => (
                      <tr key={i} style={shared.tr}>
                        <td style={shared.td}>{s.service_name}</td>
                        <td style={shared.td}>{s.hours}</td>
                        <td style={shared.td}>${parseFloat(s.price_at_time).toFixed(2)}</td>
                        <td style={shared.td}>${(s.hours * s.price_at_time).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {selected.parts.length > 0 && (
              <div style={styles.section}>
                <p style={styles.sectionTitle}>Parts</p>
                <table style={shared.table}>
                  <thead><tr>
                    <th style={shared.th}>Part</th>
                    <th style={shared.th}>Qty</th>
                    <th style={shared.th}>Price</th>
                    <th style={shared.th}>Subtotal</th>
                  </tr></thead>
                  <tbody>
                    {selected.parts.map((p, i) => (
                      <tr key={i} style={shared.tr}>
                        <td style={shared.td}>{p.part_name}</td>
                        <td style={shared.td}>{p.quantity}</td>
                        <td style={shared.td}>${parseFloat(p.price_at_time).toFixed(2)}</td>
                        <td style={shared.td}>${(p.quantity * p.price_at_time).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div style={styles.totals}>
              <div style={styles.totalRow}>
                <span style={{ color: 'var(--text-secondary)' }}>Subtotal</span>
                <span>${parseFloat(selected.subtotal).toFixed(2)}</span>
              </div>
              <div style={styles.totalRow}>
                <span style={{ color: 'var(--text-secondary)' }}>IVA ({(selected.iva_rate * 100).toFixed(0)}%)</span>
                <span>${parseFloat(selected.iva).toFixed(2)}</span>
              </div>
              <div style={{ ...styles.totalRow, ...styles.totalFinal }}>
                <span>Total</span>
                <span>${parseFloat(selected.total).toFixed(2)}</span>
              </div>
            </div>

            {selected.payments.length > 0 && (
              <div style={styles.section}>
                <p style={styles.sectionTitle}>Payments</p>
                {selected.payments.map((p, i) => (
                  <div key={i} style={styles.paymentRow}>
                    <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>{p.payment_method}</span>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      {new Date(p.date).toLocaleDateString()}
                    </span>
                    <span style={{ color: 'var(--accent-success)', fontWeight: '600' }}>
                      +${parseFloat(p.amount).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {!['paid', 'cancelled'].includes(selected.status) && (
              <div style={styles.section}>
                <p style={styles.sectionTitle}>Record Payment</p>
                <form onSubmit={handlePayment} style={styles.payForm}>
                  <input style={{ ...shared.input, flex: 1 }} type="number" placeholder="Amount" value={payForm.amount} onChange={e => setPayForm({ ...payForm, amount: e.target.value })} required />
                  <select style={{ ...shared.input, flex: 1 }} value={payForm.payment_method} onChange={e => setPayForm({ ...payForm, payment_method: e.target.value })}>
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="transfer">Transfer</option>
                    <option value="check">Check</option>
                  </select>
                  <input style={{ ...shared.input, flex: 1 }} placeholder="Reference (optional)" value={payForm.reference} onChange={e => setPayForm({ ...payForm, reference: e.target.value })} />
                  <button style={shared.btnPrimary} type="submit" disabled={paying}>
                    {paying ? 'Processing...' : 'Record Payment'}
                  </button>
                </form>
              </div>
            )}
          </div>
        ) : (
          <div style={{ ...shared.card, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={shared.empty}>Select an invoice to view details</p>
          </div>
        )}
      </div>
    </Layout>
  )
}

const styles = {
  locationBadge:   { fontSize: '0.75rem', fontWeight: '600', backgroundColor: 'var(--bg-badge-blue)', color: 'var(--text-badge-blue)', padding: '0.2rem 0.6rem', borderRadius: '999px', marginLeft: '0.75rem', verticalAlign: 'middle' },
  splitView:       { display: 'grid', gridTemplateColumns: '300px 1fr', gap: '1.5rem', alignItems: 'start' },
  list:            { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  invoiceCard:     { backgroundColor: 'var(--bg-card)', padding: '1rem', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', cursor: 'pointer', border: '2px solid var(--border)', transition: 'border-color 0.15s' },
  invoiceCardActive: { border: '2px solid var(--accent)' },
  invoiceCardTop:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' },
  folio:           { fontWeight: '700', fontSize: '0.95rem', color: 'var(--text-primary)' },
  invoiceCustomer: { color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.5rem' },
  invoiceCardBottom: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  invoiceTotal:    { fontWeight: '700', color: 'var(--text-primary)' },
  invoiceDate:     { fontSize: '0.8rem', color: 'var(--text-muted)' },
  detailHeader:    { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' },
  detailFolio:     { fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)' },
  detailSub:       { color: 'var(--text-secondary)', fontSize: '0.85rem' },
  infoGrid:        { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' },
  infoBlock:       { backgroundColor: 'var(--bg-table-head)', padding: '0.875rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' },
  infoValue:       { fontWeight: '600', fontSize: '0.95rem', color: 'var(--text-primary)', margin: '0.25rem 0' },
  infoSub:         { color: 'var(--text-secondary)', fontSize: '0.8rem' },
  section:         { marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border)' },
  sectionTitle:    { fontWeight: '700', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: '0.75rem' },
  totals:          { marginTop: '1.25rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' },
  totalRow:        { display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0', fontSize: '0.9rem', color: 'var(--text-primary)' },
  totalFinal:      { fontWeight: '700', fontSize: '1.05rem', borderTop: '1px solid var(--border)', marginTop: '0.5rem', paddingTop: '0.5rem' },
  paymentRow:      { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid var(--border)' },
  payForm:         { display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' },
  emptyState:      { textAlign: 'center', padding: '3rem 1rem', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' },
  emptyIcon:       { fontSize: '2.5rem', marginBottom: '0.75rem' },
  emptyText:       { color: 'var(--text-secondary)', fontSize: '0.95rem' },
}