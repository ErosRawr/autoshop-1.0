const pool    = require('../db/pool')
const bcrypt  = require('bcryptjs')

// GET /users
async function getAll(req, res) {
  try {
    const result = await pool.query(
      `SELECT u.user_id, u.name, u.username, u.role, u.is_active,
              u.created_at, u.location_id, l.name AS location_name
       FROM users u
       JOIN locations l ON l.location_id = u.location_id
       ORDER BY u.created_at DESC`
    )
    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

// GET /users/:id
async function getOne(req, res) {
  const { id } = req.params
  try {
    const result = await pool.query(
      `SELECT u.user_id, u.name, u.username, u.role, u.is_active,
              u.created_at, u.location_id, l.name AS location_name
       FROM users u
       JOIN locations l ON l.location_id = u.location_id
       WHERE u.user_id = $1`,
      [id]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' })
    }
    res.json(result.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

// POST /users
async function create(req, res) {
  const { name, username, password, role, location_id } = req.body

  if (!name || !username || !password || !role || !location_id) {
    return res.status(400).json({ message: 'name, username, password, role and location_id are required' })
  }

  const validRoles = ['admin', 'receptionist']
  if (!validRoles.includes(role)) {
    return res.status(400).json({ message: 'role must be admin or receptionist — use /mechanics for mechanic accounts' })
  }

  try {
    const existing = await pool.query(
      `SELECT user_id FROM users WHERE username = $1`, [username]
    )
    if (existing.rows.length > 0) {
      return res.status(409).json({ message: 'Username already taken' })
    }

    const hashed = await bcrypt.hash(password, 10)
    const result = await pool.query(
      `INSERT INTO users (name, username, password, role, location_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING user_id, name, username, role, is_active, location_id, created_at`,
      [name, username, hashed, role, location_id]
    )
    res.status(201).json(result.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

// PUT /users/:id
async function update(req, res) {
  const { id } = req.params

  try {
    const existing = await pool.query(
      `SELECT * FROM users WHERE user_id = $1`, [id]
    )
    if (existing.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' })
    }
    const current = existing.rows[0]

    const name        = req.body.name        !== undefined ? req.body.name        : current.name
    const role        = req.body.role        !== undefined ? req.body.role        : current.role
    const location_id = req.body.location_id !== undefined ? req.body.location_id : current.location_id

    const result = await pool.query(
      `UPDATE users
       SET name        = $1,
           role        = $2,
           location_id = $3,
           updated_at  = now()
       WHERE user_id = $4
       RETURNING user_id, name, username, role, is_active, location_id, created_at`,
      [name, role, location_id, id]
    )
    res.json(result.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

// PATCH /users/:id/password
async function changePassword(req, res) {
  const { id }       = req.params
  const { password } = req.body

  if (!password || password.length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters' })
  }

  try {
    const hashed = await bcrypt.hash(password, 10)
    const result = await pool.query(
      `UPDATE users SET password = $1, updated_at = now()
       WHERE user_id = $2 RETURNING user_id`,
      [hashed, id]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' })
    }
    res.json({ message: 'Password updated' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

// PATCH /users/:id/status
async function setStatus(req, res) {
  const { id }        = req.params
  const { is_active } = req.body

  if (typeof is_active !== 'boolean') {
    return res.status(400).json({ message: 'is_active must be a boolean' })
  }

  try {
    const result = await pool.query(
      `UPDATE users SET is_active = $1, updated_at = now()
       WHERE user_id = $2
       RETURNING user_id, name, username, role, is_active`,
      [is_active, id]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' })
    }
    res.json(result.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

module.exports = { getAll, getOne, create, update, changePassword, setStatus }