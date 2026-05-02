const bcrypt = require('bcryptjs')
const jwt    = require('jsonwebtoken')
const pool   = require('../db/pool')

function generateToken(user) {
  return jwt.sign(
    {
      user_id:     user.user_id,
      username:    user.username,
      role:        user.role,
      location_id: user.location_id,
    },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  )
}

// POST /auth/register
async function register(req, res) {
  const { name, username, password, role, location_id } = req.body

  if (!name || !username || !password || !location_id) {
    return res.status(400).json({ message: 'name, username, password and location_id are required' })
  }

  try {
    const existing = await pool.query(
      'SELECT user_id FROM users WHERE username = $1',
      [username]
    )
    if (existing.rows.length > 0) {
      return res.status(409).json({ message: 'Username already taken' })
    }

    const hashed = await bcrypt.hash(password, 10)

    const result = await pool.query(
      `INSERT INTO users (name, username, password, role, location_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING user_id, name, username, role, location_id`,
      [name, username, hashed, role || 'receptionist', location_id]
    )

    const user  = result.rows[0]
    const token = generateToken(user)

    res.status(201).json({ user, token })

  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

// POST /auth/login
async function login(req, res) {
  const { username, password } = req.body

  if (!username || !password) {
    return res.status(400).json({ message: 'username and password are required' })
  }

  try {
    const result = await pool.query(
      `SELECT user_id, name, username, role, location_id, password, is_active
       FROM users WHERE username = $1`,
      [username]
    )

    const user = result.rows[0]

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    if (!user.is_active) {
      return res.status(403).json({ message: 'Account is deactivated' })
    }

    const passwordMatch = await bcrypt.compare(password, user.password)
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    const token = generateToken(user)
    delete user.password  // never send the hash back

    res.json({ user, token })

  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

// GET /auth/me
async function me(req, res) {
  try {
    const result = await pool.query(
      `SELECT user_id, name, username, role, location_id, is_active
       FROM users WHERE user_id = $1`,
      [req.user.user_id]
    )
    res.json(result.rows[0])
  } catch (err) {
    res.status(500).json({ message: 'Server error' })
  }
}

module.exports = { register, login, me }