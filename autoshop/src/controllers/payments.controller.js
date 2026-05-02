const pool = require('../db/pool')

// POST /payments
async function create(req, res) {
  const { invoice_id, amount, payment_method, reference, notes } = req.body

  if (!invoice_id || !amount || !payment_method) {
    return res.status(400).json({ message: 'invoice_id, amount and payment_method are required' })
  }

  try {
    // 1. Get the invoice
    const invoiceResult = await pool.query(
      `SELECT invoice_id, total, status FROM invoices WHERE invoice_id = $1`,
      [invoice_id]
    )
    if (invoiceResult.rows.length === 0) {
      return res.status(404).json({ message: 'Invoice not found' })
    }
    const invoice = invoiceResult.rows[0]
    if (invoice.status === 'cancelled') {
      return res.status(400).json({ message: 'Cannot pay a cancelled invoice' })
    }
    if (invoice.status === 'paid') {
      return res.status(400).json({ message: 'Invoice is already fully paid' })
    }

    // 2. Record the payment
    const paymentResult = await pool.query(
      `INSERT INTO payments (invoice_id, amount, payment_method, reference, notes)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [invoice_id, amount, payment_method, reference || null, notes || null]
    )

    // 3. Check total paid so far
    const paidResult = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) AS total_paid
       FROM payments WHERE invoice_id = $1`,
      [invoice_id]
    )
    const totalPaid = parseFloat(paidResult.rows[0].total_paid)
    const invoiceTotal = parseFloat(invoice.total)

    // 4. Auto-update invoice status based on how much has been paid
    let newStatus = 'partially_paid'
    if (totalPaid >= invoiceTotal) newStatus = 'paid'

    await pool.query(
      `UPDATE invoices SET status = $1, updated_at = now() WHERE invoice_id = $2`,
      [newStatus, invoice_id]
    )

    res.status(201).json({
      payment:     paymentResult.rows[0],
      total_paid:  totalPaid,
      balance_due: parseFloat((invoiceTotal - totalPaid).toFixed(2)),
      invoice_status: newStatus,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

// GET /payments?invoice_id=1
async function getByInvoice(req, res) {
  const { invoice_id } = req.query
  if (!invoice_id) {
    return res.status(400).json({ message: 'invoice_id is required' })
  }

  try {
    const result = await pool.query(
      `SELECT * FROM payments
       WHERE invoice_id = $1
       ORDER BY date ASC`,
      [invoice_id]
    )
    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

module.exports = { create, getByInvoice }