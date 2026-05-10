const pool = require('../db/pool')

// POST /invoices/generate/:work_order_id
// Generates an invoice from a completed work order
async function generate(req, res) {
  const { work_order_id } = req.params
  // FIX: Option 1 - Defensive destructuring
  const { iva_rate = 0.16, payment_method, payment_form, cfdi_use } = req.body || {}

  try {
    // 1. Make sure the work order exists and is completed
    const woResult = await pool.query(
      `SELECT wo.work_order_id, wo.customer_id, wo.status, wo.location_id
       FROM work_orders wo
       WHERE wo.work_order_id = $1`,
      [work_order_id]
    )
    if (woResult.rows.length === 0) {
      return res.status(404).json({ message: 'Work order not found' })
    }
    const wo = woResult.rows[0]
    if (wo.status !== 'completed') {
      return res.status(400).json({ message: 'Work order must be completed before invoicing' })
    }

    // 2. Check an invoice doesn't already exist for this work order
    const existing = await pool.query(
      `SELECT invoice_id FROM invoices WHERE work_order_id = $1`,
      [work_order_id]
    )
    if (existing.rows.length > 0) {
      return res.status(409).json({ message: 'Invoice already exists for this work order' })
    }

    // 3. Sum up all services on this work order
    const servicesTotal = await pool.query(
      `SELECT COALESCE(SUM(price_at_time * hours), 0) AS total
       FROM workorder_services
       WHERE work_order_id = $1`,
      [work_order_id]
    )

    // 4. Sum up all parts on this work order
    const partsTotal = await pool.query(
      `SELECT COALESCE(SUM(price_at_time * quantity), 0) AS total
       FROM workorder_parts
       WHERE work_order_id = $1`,
      [work_order_id]
    )

    // 5. Calculate totals
    const rawSubtotal = parseFloat(servicesTotal.rows[0].total) + parseFloat(partsTotal.rows[0].total)
    const subtotal    = Math.round(rawSubtotal * 100) / 100
    const iva         = Math.round((subtotal * iva_rate) * 100) / 100
    const total       = Math.round((subtotal + iva) * 100) / 100

    // 6. Generate a simple folio (e.g. INV-000001)
    const countResult = await pool.query(`SELECT COUNT(*) FROM invoices`)
    const folio = `INV-${String(parseInt(countResult.rows[0].count) + 1).padStart(6, '0')}`

    // 7. Insert the invoice
    const result = await pool.query(
      `INSERT INTO invoices
        (work_order_id, customer_id, folio, subtotal, iva_rate, iva, total,
         payment_method, payment_form, cfdi_use, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'draft')
       RETURNING *`,
      [
        work_order_id, wo.customer_id, folio,
        subtotal, iva_rate, iva, total,
        payment_method || null, payment_form || null, cfdi_use || null
      ]
    )

    res.status(201).json(result.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

// GET /invoices
async function getAll(req, res) {
  const { location_id, status } = req.query
  try {
    let query = `
      SELECT
        i.invoice_id, i.folio, i.subtotal, i.iva, i.total,
        i.status, i.date, i.payment_method,
        c.name  AS customer_name,
        wo.work_order_id,
        l.name  AS location_name
      FROM invoices i
      JOIN customers c ON c.customer_id = i.customer_id
      JOIN work_orders wo ON wo.work_order_id = i.work_order_id
      JOIN locations l ON l.location_id = wo.location_id
      WHERE 1=1
    `
    const params = []
    if (location_id) {
      params.push(location_id)
      query += ` AND wo.location_id = $${params.length}`
    }
    if (status) {
      params.push(status)
      query += ` AND i.status = $${params.length}`
    }
    query += ` ORDER BY i.date DESC`

    const result = await pool.query(query, params)
    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

// GET /invoices/:id
async function getOne(req, res) {
  const { id } = req.params
  try {
    const invoiceResult = await pool.query(
      `SELECT i.*, c.name AS customer_name, c.phone AS customer_phone, c.rfc, c.business_name
       FROM invoices i
       JOIN customers c ON c.customer_id = i.customer_id
       WHERE i.invoice_id = $1`,
      [id]
    )
    if (invoiceResult.rows.length === 0) {
      return res.status(404).json({ message: 'Invoice not found' })
    }

    const services = await pool.query(
      `SELECT wos.*, s.name FROM workorder_services wos
       JOIN services s ON s.service_id = wos.service_id
       WHERE wos.work_order_id = $1`,
      [invoiceResult.rows[0].work_order_id]
    )

    const parts = await pool.query(
      `SELECT wop.*, p.name, p.part_number FROM workorder_parts wop
       JOIN parts p ON p.part_id = wop.part_id
       WHERE wop.work_order_id = $1`,
      [invoiceResult.rows[0].work_order_id]
    )

    const payments = await pool.query(
      `SELECT * FROM payments WHERE invoice_id = $1 ORDER BY date ASC`,
      [id]
    )

    res.json({
      ...invoiceResult.rows[0],
      services: services.rows,
      parts:    parts.rows,
      payments: payments.rows,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

// PATCH /invoices/:id/status
async function updateStatus(req, res) {
  const { id }     = req.params
  const { status } = req.body || {}

  const validStatuses = ['draft', 'issued', 'partially_paid', 'paid', 'cancelled']
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: `Invalid status.` })
  }

  try {
    const result = await pool.query(
      `UPDATE invoices SET status = $1, updated_at = now() WHERE invoice_id = $2 RETURNING *`,
      [status, id]
    )
    res.json(result.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

module.exports = { generate, getAll, getOne, updateStatus }