const pool = require('../db/pool')

// GET /customers
// Support filtering for active-only: /customers?activeOnly=true
async function getAll(req, res) {
  const { activeOnly } = req.query;
  
  try {
    let queryText = `
      SELECT customer_id, name, phone, email, rfc, business_name, is_active, created_at
      FROM customers
    `;

    // If activeOnly is passed as true, filter out soft-deleted records
    if (activeOnly === 'true') {
      queryText += ` WHERE is_active = true`;
    }

    queryText += ` ORDER BY created_at DESC`;

    const result = await pool.query(queryText);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
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
  try {
    const result = await pool.query(
      `INSERT INTO customers (name, phone, email, rfc, business_name, fiscal_address)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [name, phone, email, rfc, business_name, fiscal_address]
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
  const { name, phone, email, rfc, business_name, fiscal_address, is_active } = req.body

  try {
    const result = await pool.query(
      `UPDATE customers
       SET name           = COALESCE($1, name),
           phone          = COALESCE($2, phone),
           email          = COALESCE($3, email),
           rfc            = COALESCE($4, rfc),
           business_name  = COALESCE($5, business_name),
           fiscal_address = COALESCE($6, fiscal_address),
           is_active      = COALESCE($7, is_active),
           updated_at     = now()
       WHERE customer_id = $8
       RETURNING *`,
      [name, phone, email, rfc, business_name, fiscal_address, is_active, id]
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

// DELETE /customers/:id (soft delete)
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
    res.json({ message: 'Customer deactivated successfully', customer_id: id })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

async function setStatus(req, res) {
  const { id }        = req.params
  const { is_active } = req.body

  if (typeof is_active !== 'boolean') {
    return res.status(400).json({ message: 'is_active must be a boolean' })
  }

  try {
    const result = await pool.query(
      `UPDATE customers SET is_active = $1, updated_at = now()
       WHERE customer_id = $2
       RETURNING customer_id, name, is_active`,
      [is_active, id]
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

module.exports = { getAll, getOne, create, update, remove, setStatus }