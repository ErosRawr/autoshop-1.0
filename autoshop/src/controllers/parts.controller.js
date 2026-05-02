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

// PUT /parts/:id
async function update(req, res) {
  const { id } = req.params
  const { supplier_id, name, description, part_number, cost_price, sale_price } = req.body

  try {
    const result = await pool.query(
      `UPDATE parts
       SET supplier_id  = COALESCE($1, supplier_id),
           name         = COALESCE($2, name),
           description  = COALESCE($3, description),
           part_number  = COALESCE($4, part_number),
           cost_price   = COALESCE($5, cost_price),
           sale_price   = COALESCE($6, sale_price),
           updated_at   = now()
       WHERE part_id = $7
       RETURNING *`,
      [supplier_id, name, description, part_number, cost_price, sale_price, id]
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

module.exports = { getAll, getOne, create, update }