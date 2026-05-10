const pool = require('../db/pool')

async function getAll(req, res) {
  try {
    const result = await pool.query(
      `SELECT * FROM services WHERE is_active = true ORDER BY category, name`
    )
    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

async function getOne(req, res) {
  const { id } = req.params
  try {
    const result = await pool.query(`SELECT * FROM services WHERE service_id = $1`, [id])
    if (result.rows.length === 0) return res.status(404).json({ message: 'Service not found' })
    res.json(result.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

async function create(req, res) {
  const { name, description, category, base_price } = req.body
  if (!name || !base_price) return res.status(400).json({ message: 'name and base_price are required' })
  try {
    const result = await pool.query(
      `INSERT INTO services (name, description, category, base_price)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [name, description || null, category || 'other', base_price]
    )
    res.status(201).json(result.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

// PUT /services/:id - Fixed COALESCE null-clear bug
async function update(req, res) {
  const { id } = req.params

  try {
    // 1. Fetch existing record
    const existing = await pool.query(
      'SELECT * FROM services WHERE service_id = $1', 
      [id]
    )
    
    if (existing.rows.length === 0) {
      return res.status(404).json({ message: 'Service not found' })
    }
    
    const current = existing.rows[0]

    // 2. Merge: use incoming value if provided (including null), fall back to current if undefined
    const name        = req.body.name        !== undefined ? req.body.name        : current.name
    const description = req.body.description !== undefined ? req.body.description : current.description
    const category    = req.body.category    !== undefined ? req.body.category    : current.category
    const base_price  = req.body.base_price  !== undefined ? req.body.base_price  : current.base_price

    // 3. Execute update with direct assignments
    const result = await pool.query(
      `UPDATE services
       SET name        = $1,
           description = $2,
           category    = $3,
           base_price  = $4,
           updated_at  = now()
       WHERE service_id = $5 
       RETURNING *`,
      [name, description, category, base_price, id]
    )
    
    res.json(result.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

async function remove(req, res) {
  const { id } = req.params
  try {
    await pool.query(`UPDATE services SET is_active = false WHERE service_id = $1`, [id])
    res.json({ message: 'Service deactivated' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

module.exports = { getAll, getOne, create, update, remove }