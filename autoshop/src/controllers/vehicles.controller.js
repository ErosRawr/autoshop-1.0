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

// PUT /vehicles/:id - Fixed COALESCE null-clear bug
async function update(req, res) {
  const { id } = req.params

  try {
    // 1. Fetch existing record to handle partial updates correctly
    const existing = await pool.query(
      'SELECT * FROM vehicles WHERE vehicle_id = $1', 
      [id]
    )
    
    if (existing.rows.length === 0) {
      return res.status(404).json({ message: 'Vehicle not found' })
    }
    
    const current = existing.rows[0]

    // 2. Merge: use incoming value if provided (including null), fall back to current if undefined
    const make         = req.body.make         !== undefined ? req.body.make         : current.make
    const model        = req.body.model        !== undefined ? req.body.model        : current.model
    const year         = req.body.year         !== undefined ? req.body.year         : current.year
    const vin          = req.body.vin          !== undefined ? req.body.vin          : current.vin
    const plate        = req.body.plate        !== undefined ? req.body.plate        : current.plate
    const color        = req.body.color        !== undefined ? req.body.color        : current.color
    const vehicle_type = req.body.vehicle_type !== undefined ? req.body.vehicle_type : current.vehicle_type
    const notes        = req.body.notes        !== undefined ? req.body.notes        : current.notes

    // 3. Execute update with direct assignments
    const result = await pool.query(
      `UPDATE vehicles
       SET make         = $1,
           model        = $2,
           year         = $3,
           vin          = $4,
           plate        = $5,
           color        = $6,
           vehicle_type = $7,
           notes        = $8,
           updated_at   = now()
       WHERE vehicle_id = $9
       RETURNING *`,
      [make, model, year, vin, plate, color, vehicle_type, notes, id]
    )
    
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

module.exports = { getAll, getOne, create, update, remove }