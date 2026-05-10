const pool = require('../db/pool')

// GET /parts
async function getAll(req, res) {
  try {
    const result = await pool.query(
      `SELECT p.*, s.name AS supplier_name
       FROM parts p
       LEFT JOIN suppliers s ON s.supplier_id = p.supplier_id
       WHERE p.is_active = true
       ORDER BY p.name ASC`
    )
    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

// GET /parts/:id
async function getOne(req, res) {
  const { id } = req.params
  try {
    const result = await pool.query(
      `SELECT p.*, s.name AS supplier_name
       FROM parts p
       LEFT JOIN suppliers s ON s.supplier_id = p.supplier_id
       WHERE p.part_id = $1`,
      [id]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Part not found' })
    }
    res.json(result.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

// POST /parts
async function create(req, res) {
  const { supplier_id, name, description, part_number, cost_price, sale_price } = req.body

  if (!name || !cost_price || !sale_price) {
    return res.status(400).json({ message: 'name, cost_price and sale_price are required' })
  }

  try {
    const result = await pool.query(
      `INSERT INTO parts (supplier_id, name, description, part_number, cost_price, sale_price)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [supplier_id || null, name, description || null, part_number || null, cost_price, sale_price]
    )
    res.status(201).json(result.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

// PUT /parts/:id - Fixed COALESCE null-clear bug
async function update(req, res) {
  const { id } = req.params

  try {
    // 1. Fetch existing record to handle partial updates correctly
    const existing = await pool.query(
      'SELECT * FROM parts WHERE part_id = $1', 
      [id]
    )
    
    if (existing.rows.length === 0) {
      return res.status(404).json({ message: 'Part not found' })
    }
    
    const current = existing.rows[0]

    // 2. Merge: use incoming value if provided (including null), fall back to current if undefined
    const supplier_id = req.body.supplier_id !== undefined ? req.body.supplier_id : current.supplier_id
    const name        = req.body.name        !== undefined ? req.body.name        : current.name
    const description = req.body.description !== undefined ? req.body.description : current.description
    const part_number = req.body.part_number !== undefined ? req.body.part_number : current.part_number
    const cost_price  = req.body.cost_price  !== undefined ? req.body.cost_price  : current.cost_price
    const sale_price  = req.body.sale_price  !== undefined ? req.body.sale_price  : current.sale_price

    // 3. Execute update with direct assignments
    const result = await pool.query(
      `UPDATE parts
       SET supplier_id  = $1,
           name         = $2,
           description  = $3,
           part_number  = $4,
           cost_price   = $5,
           sale_price   = $6,
           updated_at   = now()
       WHERE part_id = $7
       RETURNING *`,
      [supplier_id, name, description, part_number, cost_price, sale_price, id]
    )
    
    res.json(result.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

module.exports = { getAll, getOne, create, update }