const pool = require('../db/pool')

async function getAll(req, res) {
  try {
    const result = await pool.query(
      `SELECT m.mechanic_id, m.specialty, u.name, u.username, u.is_active, u.location_id
       FROM mechanics m
       JOIN users u ON u.user_id = m.user_id
       WHERE u.is_active = true
       ORDER BY u.name ASC`
    )
    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

async function create(req, res) {
  const { name, username, password, specialty, location_id } = req.body
  if (!name || !username || !password || !location_id) {
    return res.status(400).json({ message: 'name, username, password and location_id are required' })
  }
  const bcrypt = require('bcryptjs')
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const hash = await bcrypt.hash(password, 10)
    const userRes = await client.query(
      `INSERT INTO users (name, username, password, role, location_id)
       VALUES ($1, $2, $3, 'mechanic', $4) RETURNING user_id`,
      [name, username, hash, location_id]
    )
    const mechRes = await client.query(
      `INSERT INTO mechanics (user_id, specialty) VALUES ($1, $2) RETURNING *`,
      [userRes.rows[0].user_id, specialty || null]
    )
    await client.query('COMMIT')
    res.status(201).json({ ...mechRes.rows[0], name, username })
  } catch (err) {
    await client.query('ROLLBACK')
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  } finally {
    client.release()
  }
}

// POST /workorders/:id/mechanics
async function assignToWorkOrder(req, res) {
  const { id } = req.params
  const { mechanic_id, hours_worked } = req.body
  if (!mechanic_id) return res.status(400).json({ message: 'mechanic_id is required' })
  try {
    const result = await pool.query(
      `INSERT INTO workorder_mechanics (work_order_id, mechanic_id, hours_worked)
       VALUES ($1, $2, $3)
       ON CONFLICT (work_order_id, mechanic_id)
       DO UPDATE SET hours_worked = $3
       RETURNING *`,
      [id, mechanic_id, hours_worked || null]
    )
    res.status(201).json(result.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

module.exports = { getAll, create, assignToWorkOrder }