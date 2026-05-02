const pool = require('../db/pool')

// GET /workorders?location_id=1&status=open
async function getAll(req, res) {
  const { location_id, status } = req.query

  const scopedLocation = req.user.role === 'mechanic'
    ? req.user.location_id
    : location_id

  try {
    let query = `
      SELECT
        wo.work_order_id, wo.status, wo.priority, wo.mileage, wo.fuel_level,
        wo.date_open, wo.date_estimated, wo.created_at, wo.updated_at,
        c.name  AS customer_name,
        v.make, v.model, v.year, v.plate,
        l.name  AS location_name,
        u.name  AS created_by_name
      FROM work_orders wo
      JOIN customers c ON c.customer_id = wo.customer_id
      JOIN vehicles  v ON v.vehicle_id  = wo.vehicle_id
      JOIN locations l ON l.location_id = wo.location_id
      JOIN users     u ON u.user_id     = wo.created_by
      WHERE 1=1
    `
    const params = []

    if (scopedLocation) {
      params.push(scopedLocation)
      query += ` AND wo.location_id = $${params.length}`
    }
    if (status) {
      params.push(status)
      query += ` AND wo.status = $${params.length}`
    }

    query += ` ORDER BY wo.created_at DESC`

    const result = await pool.query(query, params)
    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

// GET /workorders/:id  (full detail with services and parts)
async function getOne(req, res) {
  const { id } = req.params
  try {
    const woResult = await pool.query(
      `SELECT
        wo.*,
        c.name  AS customer_name, c.phone AS customer_phone,
        v.make, v.model, v.year, v.plate, v.color,
        l.name  AS location_name,
        u.name  AS created_by_name
       FROM work_orders wo
       JOIN customers c ON c.customer_id = wo.customer_id
       JOIN vehicles  v ON v.vehicle_id  = wo.vehicle_id
       JOIN locations l ON l.location_id = wo.location_id
       JOIN users     u ON u.user_id     = wo.created_by
       WHERE wo.work_order_id = $1`,
      [id]
    )
    if (woResult.rows.length === 0) {
      return res.status(404).json({ message: 'Work order not found' })
    }

    const servicesResult = await pool.query(
      `SELECT wos.*, s.name AS service_name,
              u.name AS mechanic_name
       FROM workorder_services wos
       JOIN services  s ON s.service_id  = wos.service_id
       JOIN mechanics m ON m.mechanic_id = wos.mechanic_id
       JOIN users     u ON u.user_id     = m.user_id
       WHERE wos.work_order_id = $1`,
      [id]
    )

    const partsResult = await pool.query(
      `SELECT wop.*, p.name AS part_name, p.part_number
       FROM workorder_parts wop
       JOIN parts p ON p.part_id = wop.part_id
       WHERE wop.work_order_id = $1`,
      [id]
    )

    res.json({
      ...woResult.rows[0],
      services: servicesResult.rows,
      parts:    partsResult.rows,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

// POST /workorders
async function create(req, res) {
  const {
    location_id, customer_id, vehicle_id,
    priority, mileage, fuel_level,
    problem_description, date_estimated
  } = req.body

  if (!location_id || !customer_id || !vehicle_id) {
    return res.status(400).json({ message: 'location_id, customer_id and vehicle_id are required' })
  }

  try {
    const result = await pool.query(
      `INSERT INTO work_orders
        (location_id, customer_id, vehicle_id, created_by,
         date_open, date_estimated, priority, mileage, fuel_level, problem_description)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        location_id, customer_id, vehicle_id,
        req.user.user_id,
        new Date(),
        date_estimated      || null,
        priority            || 'normal',
        mileage             || null,
        fuel_level          || null,
        problem_description || null,
      ]
    )
    res.status(201).json(result.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

// PATCH /workorders/:id/status
async function updateStatus(req, res) {
  const { id }     = req.params
  const { status } = req.body

  const validStatuses = ['open', 'in_progress', 'waiting_parts', 'completed', 'cancelled']
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` })
  }

  try {
    const result = await pool.query(
      `UPDATE work_orders
       SET status = $1, updated_at = now()
       WHERE work_order_id = $2
       RETURNING *`,
      [status, id]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Work order not found' })
    }
    res.json(result.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

// POST /workorders/:id/services
async function addService(req, res) {
  const { id } = req.params
  const { service_id, mechanic_id, hours, price_at_time } = req.body

  if (!service_id || !mechanic_id) {
    return res.status(400).json({ message: 'service_id and mechanic_id are required' })
  }

  try {
    const result = await pool.query(
      `INSERT INTO workorder_services (work_order_id, service_id, mechanic_id, hours, price_at_time)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [id, service_id, mechanic_id, hours || 1, price_at_time]
    )
    res.status(201).json(result.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

// POST /workorders/:id/parts
async function addPart(req, res) {
  const { id } = req.params
  const { part_id, quantity, price_at_time, cost_price_at_time } = req.body

  if (!part_id || !quantity) {
    return res.status(400).json({ message: 'part_id and quantity are required' })
  }

  try {
    const result = await pool.query(
      `INSERT INTO workorder_parts (work_order_id, part_id, quantity, price_at_time, cost_price_at_time)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [id, part_id, quantity, price_at_time, cost_price_at_time]
    )
    res.status(201).json(result.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

module.exports = { getAll, getOne, create, updateStatus, addService, addPart }