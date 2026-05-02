import { useState, useEffect } from 'react'
import api from '../api'
import Layout from '../components/Layout'

const STATUS_COLORS = {
  draft:          { bg: '#f3f4f6', color: '#6b7280' },
  issued:         { bg: '#dbeafe', color: '#1d4ed8' },
  partially_paid: { bg: '#fef9c3', color: '#854d0e' },
  paid:           { bg: '#dcfce7', color: '#15803d' },
  cancelled:      { bg: '#fee2e2', color: '#b91c1c' },
}

export default function InvoicesPage() {
  const [invoices, setInvoices]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [selected, setSelected]   = useState(null)  // invoice detail
  const [paying, setPaying]       = useState(false)
  const [payForm, setPayForm]     = useState({ amount: '', payment_method: 'cash', reference: '' })

  useEffect(() => {
    fetchInvoices()
  }, [])

  async function fetchInvoices() {
    try {
      const res = await api.get('/invoices')
      setInvoices(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function openDetail(id) {
    try {
      const res = await api.get(`/invoices/${id}`)
      setSelected(res.data)
    } catch (err) {
      alert('Failed to load invoice')
    }
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
      // Refresh both the list and the detail
      fetchInvoices()
      openDetail(selected.invoice_id)
    } catch (err) {
      alert(err.response?.data?.message || 'Payment failed')
    } finally {
      setPaying(false)
    }
  }

  if (loading) return <Layout><p>Loading...</p></Layout>

  return (
    <Layout>
      <div style={styles.header}>
        <h2 style={styles.title}>Invoices</h2>
      </div>

      <div style={styles.splitView}>
        {/* Left — Invoice List */}
        <div style={styles.list}>
          {invoices.length === 0 ? (
            <p style={{ color: '#6b7280' }}>No invoices yet.</p>
          ) : (
            invoices.map(inv => (
              <div
                key={inv.invoice_id}
                style={{
                  ...styles.invoiceCard,
                  ...(selected?.invoice_id === inv.invoice_id ? styles.invoiceCardActive : {})
                }}
                onClick={() => openDetail(inv.invoice_id)}
              >
                <div style={styles.invoiceCardTop}>
                  <span style={styles.folio}>{inv.folio}</span>
                  <span style={{ ...styles.badge, ...STATUS_COLORS[inv.status] }}>
                    {inv.status.replace('_', ' ')}
                  </span>
                </div>
                <p style={styles.invoiceCustomer}>{inv.customer_name}</p>
                <div style={styles.invoiceCardBottom}>
                  <span style={styles.invoiceTotal}>${parseFloat(inv.total).toFixed(2)}</span>
                  <span style={styles.invoiceDate}>
                    {new Date(inv.date).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right — Invoice Detail */}
        {selected ? (
          <div style={styles.detail}>
            {/* Invoice Header */}
            <div style={styles.detailHeader}>
              <div>
                <h3 style={styles.detailFolio}>{selected.folio}</h3>
                <p style={styles.detailSub}>Work Order #{selected.work_order_id}</p>
              </div>
              <span style={{ ...styles.badge, ...STATUS_COLORS[selected.status] }}>
                {selected.status.replace('_', ' ')}
              </span>
            </div>

            {/* Customer + Vehicle */}
            <div style={styles.infoGrid}>
              <div style={styles.infoBlock}>
                <p style={styles.infoLabel}>Customer</p>
                <p style={styles.infoValue}>{selected.customer_name}</p>
                <p style={styles.infoSub}>{selected.customer_phone}</p>
              </div>
              <div style={styles.infoBlock}>
                <p style={styles.infoLabel}>Vehicle</p>
                <p style={styles.infoValue}>{selected.make} {selected.model} {selected.year}</p>
                <p style={styles.infoSub}>{selected.plate || 'No plate'}</p>
              </div>
            </div>

            {/* Services */}
            {selected.services.length > 0 && (
              <div style={styles.section}>
                <p style={styles.sectionTitle}>Services</p>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Service</th>
                      <th style={styles.th}>Hours</th>
                      <th style={styles.th}>Price</th>
                      <th style={styles.th}>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selected.services.map((s, i) => (
                      <tr key={i} style={styles.tr}>
                        <td style={styles.td}>{s.service_name}</td>
                        <td style={styles.td}>{s.hours}</td>
                        <td style={styles.td}>${parseFloat(s.price_at_time).toFixed(2)}</td>
                        <td style={styles.td}>${(s.hours * s.price_at_time).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Parts */}
            {selected.parts.length > 0 && (
              <div style={styles.section}>
                <p style={styles.sectionTitle}>Parts</p>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Part</th>
                      <th style={styles.th}>Qty</th>
                      <th style={styles.th}>Price</th>
                      <th style={styles.th}>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selected.parts.map((p, i) => (
                      <tr key={i} style={styles.tr}>
                        <td style={styles.td}>{p.part_name}</td>
                        <td style={styles.td}>{p.quantity}</td>
                        <td style={styles.td}>${parseFloat(p.price_at_time).toFixed(2)}</td>
                        <td style={styles.td}>${(p.quantity * p.price_at_time).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Totals */}
            <div style={styles.totals}>
              <div style={styles.totalRow}>
                <span>Subtotal</span>
                <span>${parseFloat(selected.subtotal).toFixed(2)}</span>
              </div>
              <div style={styles.totalRow}>
                <span>IVA ({(selected.iva_rate * 100).toFixed(0)}%)</span>
                <span>${parseFloat(selected.iva).toFixed(2)}</span>
              </div>
              <div style={{ ...styles.totalRow, ...styles.totalFinal }}>
                <span>Total</span>
                <span>${parseFloat(selected.total).toFixed(2)}</span>
              </div>
            </div>

            {/* Payment History */}
            {selected.payments.length > 0 && (
              <div style={styles.section}>
                <p style={styles.sectionTitle}>Payments</p>
                {selected.payments.map((p, i) => (
                  <div key={i} style={styles.paymentRow}>
                    <span>{p.payment_method}</span>
                    <span style={{ color: '#6b7280', fontSize: '0.85rem' }}>
                      {new Date(p.date).toLocaleDateString()}
                    </span>
                    <span style={{ color: '#16a34a', fontWeight: '600' }}>
                      +${parseFloat(p.amount).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Add Payment */}
            {!['paid', 'cancelled'].includes(selected.status) && (
              <div style={styles.section}>
                <p style={styles.sectionTitle}>Record Payment</p>
                <form onSubmit={handlePayment} style={styles.payForm}>
                  <input
                    style={styles.input}
                    type="number"
                    placeholder="Amount"
                    value={payForm.amount}
                    onChange={e => setPayForm({ ...payForm, amount: e.target.value })}
                    required
                  />
                  <select
                    style={styles.input}
                    value={payForm.payment_method}
                    onChange={e => setPayForm({ ...payForm, payment_method: e.target.value })}
                  >
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="transfer">Transfer</option>
                    <option value="check">Check</option>
                  </select>
                  <input
                    style={styles.input}
                    placeholder="Reference (optional)"
                    value={payForm.reference}
                    onChange={e => setPayForm({ ...payForm, reference: e.target.value })}
                  />
                  <button style={styles.payButton} type="submit" disabled={paying}>
                    {paying ? 'Processing...' : 'Record Payment'}
                  </button>
                </form>
              </div>
            )}
          </div>
        ) : (
          <div style={styles.detailEmpty}>
            <p>Select an invoice to view details</p>
          </div>
        )}
      </div>
    </Layout>
  )
}

const styles = {
  header:          { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' },
  title:           { fontSize: '1.5rem', fontWeight: '700' },
  splitView:       { display: 'grid', gridTemplateColumns: '320px 1fr', gap: '1.5rem', alignItems: 'start' },
  list:            { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  invoiceCard:     { backgroundColor: '#fff', padding: '1rem', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', cursor: 'pointer', border: '2px solid transparent' },
  invoiceCardActive: { border: '2px solid #2563eb' },
  invoiceCardTop:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' },
  folio:           { fontWeight: '700', fontSize: '0.95rem' },
  invoiceCustomer: { color: '#6b7280', fontSize: '0.85rem', marginBottom: '0.5rem' },
  invoiceCardBottom: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  invoiceTotal:    { fontWeight: '700', color: '#111827' },
  invoiceDate:     { fontSize: '0.8rem', color: '#9ca3af' },
  badge:           { padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: '600' },
  detail:          { backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', padding: '1.5rem' },
  detailEmpty:     { backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', padding: '3rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' },
  detailHeader:    { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' },
  detailFolio:     { fontSize: '1.25rem', fontWeight: '700' },
  detailSub:       { color: '#6b7280', fontSize: '0.85rem' },
  infoGrid:        { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' },
  infoBlock:       { backgroundColor: '#f9fafb', padding: '0.875rem', borderRadius: '8px' },
  infoLabel:       { fontSize: '0.75rem', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase', marginBottom: '0.25rem' },
  infoValue:       { fontWeight: '600', fontSize: '0.95rem' },
  infoSub:         { color: '#6b7280', fontSize: '0.8rem' },
  section:         { marginTop: '1.25rem' },
  sectionTitle:    { fontWeight: '700', fontSize: '0.875rem', textTransform: 'uppercase', color: '#6b7280', marginBottom: '0.5rem' },
  table:           { width: '100%', borderCollapse: 'collapse' },
  th:              { padding: '0.5rem 0.75rem', textAlign: 'left', fontSize: '0.78rem', fontWeight: '700', color: '#6b7280', borderBottom: '1px solid #e5e7eb' },
  tr:              { borderBottom: '1px solid #f3f4f6' },
  td:              { padding: '0.5rem 0.75rem', fontSize: '0.875rem' },
  totals:          { marginTop: '1.25rem', borderTop: '1px solid #e5e7eb', paddingTop: '1rem' },
  totalRow:        { display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0', fontSize: '0.9rem', color: '#374151' },
  totalFinal:      { fontWeight: '700', fontSize: '1rem', color: '#111827', borderTop: '1px solid #e5e7eb', marginTop: '0.5rem', paddingTop: '0.5rem' },
  paymentRow:      { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid #f3f4f6' },
  payForm:         { display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' },
  input:           { padding: '0.6rem 0.875rem', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.9rem' },
  payButton:       { backgroundColor: '#2563eb', color: '#fff', border: 'none', padding: '0.6rem 1.25rem', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' },
}