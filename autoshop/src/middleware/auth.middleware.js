const jwt = require('jsonwebtoken')

function authenticate(req, res, next) {
  // The token arrives in the header as: Authorization: Bearer <token>
  const authHeader = req.headers['authorization']
  const token      = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ message: 'No token provided' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded  // attach user info to every subsequent request
    next()
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' })
  }
}

// Role guard — use after authenticate
// Example: authorize('admin', 'manager')
function authorize(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' })
    }
    next()
  }
}

module.exports = { authenticate, authorize }