const pool = require('../db/pool')

// GET /suppliers
async function getAll(req, res) {
  try {
    const result = await pool.query(
      `SELECT supplier_id, name, contact_name, phone, email, is_active, created_at
       FROM suppliers
       WHERE is_active = true
       ORDER BY name ASC`
    )
    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

// GET /suppliers/:id
async function getOne(req, res) {
  const { id } = req.params
  try {
    const result = await pool.query(
      `SELECT * FROM suppliers WHERE supplier_id = $1`,
      [id]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Supplier not found' })
    }
    res.json(result.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

// POST /suppliers
async function create(req, res) {
  const { name, contact_name, phone, email, notes } = req.body

  if (!name) {
    return res.status(400).json({ message: 'name is required' })
  }

  try {
    const result = await pool.query(
      `INSERT INTO suppliers (name, contact_name, phone, email, notes)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name, contact_name || null, phone || null, email || null, notes || null]
    )
    res.status(201).json(result.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

// PUT /suppliers/:id
async function update(req, res) {
  const { id } = req.params
  const { name, contact_name, phone, email, notes } = req.body

  try {
    const result = await pool.query(
      `UPDATE suppliers
       SET name         = COALESCE($1, name),
           contact_name = COALESCE($2, contact_name),
           phone        = COALESCE($3, phone),
           email        = COALESCE($4, email),
           notes        = COALESCE($5, notes),
           updated_at   = now()
       WHERE supplier_id = $6
       RETURNING *`,
      [name, contact_name, phone, email, notes, id]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Supplier not found' })
    }
    res.json(result.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

module.exports = { getAll, getOne, create, update }