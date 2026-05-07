const pool = require('../db/pool')

async function getAll(req, res) {
  try {
    const result = await pool.query(
      `SELECT location_id, name, address, phone, email, is_active
       FROM locations
       WHERE is_active = true
       ORDER BY name ASC`
    )
    res.json(result.rows)
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
       VALUES ($1, $2, $3, $4) RETURNING *`,
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
  const { name, address, phone, email } = req.body
  try {
    const result = await pool.query(
      `UPDATE locations
       SET name       = COALESCE($1, name),
           address    = COALESCE($2, address),
           phone      = COALESCE($3, phone),
           email      = COALESCE($4, email),
           updated_at = now()
       WHERE location_id = $5 RETURNING *`,
      [name, address, phone, email, id]
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

module.exports = { getAll, create, update }