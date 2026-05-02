const pool = require('../db/pool')

// GET /inventory?location_id=1
// Returns stock levels for a location, flags low stock items
async function getStock(req, res) {
  const { location_id } = req.query

  if (!location_id) {
    return res.status(400).json({ message: 'location_id is required' })
  }

  try {
    const result = await pool.query(
      `SELECT
         li.location_id, li.part_id, li.stock, li.min_stock,
         p.name AS part_name, p.part_number, p.cost_price, p.sale_price,
         s.name AS supplier_name,
         CASE WHEN li.stock <= li.min_stock THEN true ELSE false END AS is_low_stock
       FROM location_inventory li
       JOIN parts     p ON p.part_id     = li.part_id
       LEFT JOIN suppliers s ON s.supplier_id = p.supplier_id
       WHERE li.location_id = $1
       ORDER BY is_low_stock DESC, p.name ASC`,
      [location_id]
    )
    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

// POST /inventory/receive
// Manually add stock to a location (e.g. a shipment arrives)
async function receive(req, res) {
  const { location_id, part_id, quantity, notes } = req.body

  if (!location_id || !part_id || !quantity || quantity <= 0) {
    return res.status(400).json({ message: 'location_id, part_id and a positive quantity are required' })
  }

  try {
    // Insert a movement — the trigger handles updating location_inventory
    const result = await pool.query(
      `INSERT INTO inventory_movements (location_id, part_id, user_id, quantity, reason, notes)
       VALUES ($1, $2, $3, $4, 'purchase', $5)
       RETURNING *`,
      [location_id, part_id, req.user.user_id, quantity, notes || null]
    )
    res.status(201).json(result.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

// GET /inventory/movements?location_id=1
// Full movement history for a location
async function getMovements(req, res) {
  const { location_id } = req.query

  if (!location_id) {
    return res.status(400).json({ message: 'location_id is required' })
  }

  try {
    const result = await pool.query(
      `SELECT
         im.*,
         p.name AS part_name, p.part_number,
         u.name AS user_name
       FROM inventory_movements im
       JOIN parts p ON p.part_id = im.part_id
       JOIN users u ON u.user_id = im.user_id
       WHERE im.location_id = $1
       ORDER BY im.date DESC`,
      [location_id]
    )
    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

module.exports = { getStock, receive, getMovements }