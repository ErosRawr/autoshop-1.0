const pool = require('../db/pool')

async function getAll(req, res) {
  try {
    const result = await pool.query(
      `SELECT location_id, name, address, phone, email, is_active, created_at
       FROM locations
       ORDER BY name ASC`
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
    const result = await pool.query(
      `SELECT * FROM locations WHERE location_id = $1`, [id]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Location not found' })
    }
    res.json(result.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

async function create(req, res) {
  const { name, address, phone, email } = req.body

  if (!name || !address) {
    return res.status(400).json({ message: 'name and address are required' })
  }

  try {
    const result = await pool.query(
      `INSERT INTO locations (name, address, phone, email)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name, address, phone || null, email || null]
    )
    res.status(201).json(result.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

async function update(req, res) {
  const { id } = req.params

  try {
    const existing = await pool.query(
      `SELECT * FROM locations WHERE location_id = $1`, [id]
    )
    if (existing.rows.length === 0) {
      return res.status(404).json({ message: 'Location not found' })
    }
    const current = existing.rows[0]

    const name    = req.body.name    !== undefined ? req.body.name    : current.name
    const address = req.body.address !== undefined ? req.body.address : current.address
    const phone   = req.body.phone   !== undefined ? req.body.phone   : current.phone
    const email   = req.body.email   !== undefined ? req.body.email   : current.email

    const result = await pool.query(
      `UPDATE locations
       SET name       = $1,
           address    = $2,
           phone      = $3,
           email      = $4,
           updated_at = now()
       WHERE location_id = $5
       RETURNING *`,
      [name, address, phone, email, id]
    )
    res.json(result.rows[0])
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
      `UPDATE locations SET is_active = $1, updated_at = now()
       WHERE location_id = $2
       RETURNING location_id, name, is_active`,
      [is_active, id]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Location not found' })
    }
    res.json(result.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

module.exports = { getAll, getOne, create, update, setStatus }