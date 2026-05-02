const pool = require('../db/pool')

async function getAll(req, res) {
  const { location_id, status } = req.query
  try {
    let query = `
      SELECT
        a.*,
        c.name  AS customer_name, c.phone AS customer_phone,
        v.make, v.model, v.year, v.plate,
        u.name  AS mechanic_name,
        l.name  AS location_name
      FROM appointments a
      JOIN customers c  ON c.customer_id   = a.customer_id
      JOIN vehicles  v  ON v.vehicle_id    = a.vehicle_id
      JOIN locations l  ON l.location_id   = a.location_id
      LEFT JOIN mechanics m ON m.mechanic_id = a.assigned_to
      LEFT JOIN users    u ON u.user_id      = m.user_id
      WHERE 1=1
    `
    const params = []
    if (location_id) { params.push(location_id); query += ` AND a.location_id = $${params.length}` }
    if (status)      { params.push(status);      query += ` AND a.status = $${params.length}` }
    query += ` ORDER BY a.scheduled_at ASC`
    const result = await pool.query(query, params)
    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

async function create(req, res) {
  const { location_id, customer_id, vehicle_id, assigned_to, scheduled_at, duration_estimate, notes } = req.body
  if (!location_id || !customer_id || !vehicle_id || !scheduled_at) {
    return res.status(400).json({ message: 'location_id, customer_id, vehicle_id and scheduled_at are required' })
  }
  try {
    const result = await pool.query(
      `INSERT INTO appointments (location_id, customer_id, vehicle_id, assigned_to, scheduled_at, duration_estimate, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [location_id, customer_id, vehicle_id, assigned_to || null, scheduled_at, duration_estimate || null, notes || null]
    )
    res.status(201).json(result.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

async function updateStatus(req, res) {
  const { id }     = req.params
  const { status } = req.body
  const valid = ['scheduled', 'confirmed', 'cancelled', 'completed']
  if (!valid.includes(status)) return res.status(400).json({ message: `Status must be one of: ${valid.join(', ')}` })
  try {
    const result = await pool.query(
      `UPDATE appointments SET status = $1, updated_at = now() WHERE appointment_id = $2 RETURNING *`,
      [status, id]
    )
    if (result.rows.length === 0) return res.status(404).json({ message: 'Appointment not found' })
    res.json(result.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

module.exports = { getAll, create, updateStatus }