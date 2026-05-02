const pool = require('../db/pool')

// GET /customers
async function getAll(req, res) {
  try {
    const result = await pool.query(
      `SELECT customer_id, name, phone, email, rfc, business_name, is_active, created_at
       FROM customers
       ORDER BY created_at DESC`
    )
    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

// GET /customers/:id
async function getOne(req, res) {
  const { id } = req.params
  try {
    const result = await pool.query(
      `SELECT customer_id, name, phone, email, rfc, business_name, fiscal_address, is_active, created_at
       FROM customers WHERE customer_id = $1`,
      [id]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Customer not found' })
    }
    res.json(result.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

// POST /customers
async function create(req, res) {
  const { name, phone, email, rfc, business_name, fiscal_address } = req.body

  if (!name || !phone) {
    return res.status(400).json({ message: 'name and phone are required' })
  }

  try {
    const result = await pool.query(
      `INSERT INTO customers (name, phone, email, rfc, business_name, fiscal_address)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [name, phone, email || null, rfc || null, business_name || null, fiscal_address || null]
    )
    res.status(201).json(result.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

// PUT /customers/:id
async function update(req, res) {
  const { id } = req.params
  const { name, phone, email, rfc, business_name, fiscal_address } = req.body

  try {
    const result = await pool.query(
      `UPDATE customers
       SET name           = COALESCE($1, name),
           phone          = COALESCE($2, phone),
           email          = COALESCE($3, email),
           rfc            = COALESCE($4, rfc),
           business_name  = COALESCE($5, business_name),
           fiscal_address = COALESCE($6, fiscal_address),
           updated_at     = now()
       WHERE customer_id = $7
       RETURNING *`,
      [name, phone, email, rfc, business_name, fiscal_address, id]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Customer not found' })
    }
    res.json(result.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

// DELETE /customers/:id  (soft delete)
async function remove(req, res) {
  const { id } = req.params
  try {
    const result = await pool.query(
      `UPDATE customers SET is_active = false, updated_at = now()
       WHERE customer_id = $1 RETURNING customer_id`,
      [id]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Customer not found' })
    }
    res.json({ message: 'Customer deactivated' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

module.exports = { getAll, getOne, create, update, remove }