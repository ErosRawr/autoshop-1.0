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

// PUT /suppliers/:id - Fixed COALESCE null-clear bug
async function update(req, res) {
  const { id } = req.params

  try {
    // 1. Fetch existing record
    const existing = await pool.query(
      'SELECT * FROM suppliers WHERE supplier_id = $1',
      [id]
    )

    if (existing.rows.length === 0) {
      return res.status(404).json({ message: 'Supplier not found' })
    }

    const current = existing.rows[0]

    // 2. Merge: use incoming value if provided (including null), fall back to current if undefined
    const name         = req.body.name         !== undefined ? req.body.name         : current.name
    const contact_name = req.body.contact_name !== undefined ? req.body.contact_name : current.contact_name
    const phone        = req.body.phone        !== undefined ? req.body.phone        : current.phone
    const email        = req.body.email        !== undefined ? req.body.email        : current.email
    const notes        = req.body.notes        !== undefined ? req.body.notes        : current.notes

    // 3. Execute update with direct assignments
    const result = await pool.query(
      `UPDATE suppliers
       SET name         = $1,
           contact_name = $2,
           phone        = $3,
           email        = $4,
           notes        = $5,
           updated_at   = now()
       WHERE supplier_id = $6
       RETURNING *`,
      [name, contact_name, phone, email, notes, id]
    )

    res.json(result.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

module.exports = { getAll, getOne, create, update } 