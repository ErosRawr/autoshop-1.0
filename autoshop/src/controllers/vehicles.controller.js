const pool = require('../db/pool')

// GET /vehicles?customer_id=1
async function getAll(req, res) {
  const { customer_id } = req.query
  try {
    let query = `
      SELECT v.*, c.name AS customer_name
      FROM vehicles v
      JOIN customers c ON c.customer_id = v.customer_id
    `
    const params = []
    if (customer_id) {
      query += ` WHERE v.customer_id = $1`
      params.push(customer_id)
    }
    query += ` ORDER BY v.created_at DESC`

    const result = await pool.query(query, params)
    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

// GET /vehicles/:id
async function getOne(req, res) {
  const { id } = req.params
  try {
    const result = await pool.query(
      `SELECT v.*, c.name AS customer_name
       FROM vehicles v
       JOIN customers c ON c.customer_id = v.customer_id
       WHERE v.vehicle_id = $1`,
      [id]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Vehicle not found' })
    }
    res.json(result.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

// POST /vehicles
async function create(req, res) {
  const { customer_id, make, model, year, vin, plate, color, vehicle_type, notes } = req.body

  if (!customer_id || !make || !model || !year) {
    return res.status(400).json({ message: 'customer_id, make, model and year are required' })
  }

  try {
    const result = await pool.query(
      `INSERT INTO vehicles (customer_id, make, model, year, vin, plate, color, vehicle_type, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [customer_id, make, model, year, vin || null, plate || null, color || null, vehicle_type || null, notes || null]
    )
    res.status(201).json(result.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

// PUT /vehicles/:id
async function update(req, res) {
  const { id } = req.params
  const { make, model, year, vin, plate, color, vehicle_type, notes } = req.body

  try {
    const result = await pool.query(
      `UPDATE vehicles
       SET make         = COALESCE($1, make),
           model        = COALESCE($2, model),
           year         = COALESCE($3, year),
           vin          = COALESCE($4, vin),
           plate        = COALESCE($5, plate),
           color        = COALESCE($6, color),
           vehicle_type = COALESCE($7, vehicle_type),
           notes        = COALESCE($8, notes),
           updated_at   = now()
       WHERE vehicle_id = $9
       RETURNING *`,
      [make, model, year, vin, plate, color, vehicle_type, notes, id]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Vehicle not found' })
    }
    res.json(result.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

// Added the missing remove function
async function remove(req, res) {
  const { id } = req.params
  try {
    const result = await pool.query('DELETE FROM vehicles WHERE vehicle_id = $1 RETURNING *', [id])
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Vehicle not found' })
    }
    res.json({ message: 'Vehicle deleted successfully' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

// Added remove to exports
module.exports = { getAll, getOne, create, update, remove }