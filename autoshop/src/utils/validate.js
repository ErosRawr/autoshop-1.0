// autoshop/src/utils/validate.js
// Lightweight validation helpers — no external dependencies needed.
// Each function returns an error message string, or null if valid.

// ── Primitives ──────────────────────────────────────────────

function isPresent(value) {
  return value !== undefined && value !== null && String(value).trim() !== ''
}

function requireFields(body, fields) {
  const missing = fields.filter(f => !isPresent(body[f]))
  if (missing.length > 0) {
    return `Missing required fields: ${missing.join(', ')}`
  }
  return null
}

function isPositiveNumber(value) {
  const n = parseFloat(value)
  return !isNaN(n) && n > 0
}

function isNonNegativeInteger(value) {
  const n = parseInt(value, 10)
  return !isNaN(n) && n >= 0 && Number.isInteger(n)
}

function isPositiveInteger(value) {
  const n = parseInt(value, 10)
  return !isNaN(n) && n > 0 && Number.isInteger(n)
}

function isInEnum(value, allowed) {
  return allowed.includes(value)
}

// ── Format checks ────────────────────────────────────────────

// Basic email — just checks for @ and a dot after it
function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

// Mexican RFC: 12 chars for companies, 13 for individuals
function isValidRFC(value) {
  return /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/.test(value.toUpperCase())
}

// Year between 1900 and 5 years from now (future purchases)
function isValidYear(value) {
  const n = parseInt(value, 10)
  return !isNaN(n) && n >= 1900 && n <= new Date().getFullYear() + 5
}

// ── Reusable domain validators ────────────────────────────────

function validateCustomer(body) {
  const required = requireFields(body, ['name', 'phone'])
  if (required) return required

  if (body.email && !isValidEmail(body.email)) {
    return 'Invalid email format'
  }
  if (body.rfc && !isValidRFC(body.rfc)) {
    return 'Invalid RFC format'
  }
  return null
}

function validateVehicle(body) {
  const required = requireFields(body, ['customer_id', 'make', 'model', 'year'])
  if (required) return required

  if (!isValidYear(body.year)) {
    return `Year must be between 1900 and ${new Date().getFullYear() + 5}`
  }
  if (!isPositiveInteger(body.customer_id)) {
    return 'customer_id must be a positive integer'
  }
  return null
}

function validateWorkOrder(body) {
  const required = requireFields(body, ['customer_id', 'vehicle_id'])
  if (required) return required

  const validPriorities = ['low', 'normal', 'high', 'urgent']
  if (body.priority && !isInEnum(body.priority, validPriorities)) {
    return `priority must be one of: ${validPriorities.join(', ')}`
  }
  return null
}

function validatePart(body) {
  const required = requireFields(body, ['name', 'cost_price', 'sale_price'])
  if (required) return required
  if (!isPositiveNumber(body.cost_price)) return 'cost_price must be positive'
  if (!isPositiveNumber(body.sale_price)) return 'sale_price must be positive'
  return null
}

function validatePayment(body) {
  const required = requireFields(body, ['invoice_id', 'amount', 'payment_method'])
  if (required) return required

  if (!isPositiveNumber(body.amount)) {
    return 'amount must be a positive number'
  }

  const validMethods = ['cash', 'card', 'transfer', 'check']
  if (!isInEnum(body.payment_method, validMethods)) {
    return `payment_method must be one of: ${validMethods.join(', ')}`
  }
  return null
}

function validateInvoiceGenerate(body) {
  if (body.iva_rate !== undefined) {
    const rate = parseFloat(body.iva_rate)
    if (isNaN(rate) || rate < 0 || rate > 1) {
      return 'iva_rate must be a decimal between 0 and 1 (e.g. 0.16)'
    }
  }
  return null
}

// ── Express middleware factory ────────────────────────────────

function validate(validatorFn) {
  return (req, res, next) => {
    // FIX: Ensure req.body is at least an empty object before validation
    if (!req.body) req.body = {};

    const error = validatorFn(req.body)
    if (error) {
      return res.status(400).json({ message: error })
    }
    next()
  }
}

module.exports = {
  validate,
  validateCustomer,
  validateVehicle,
  validateWorkOrder,
  validatePart,
  validatePayment,
  validateInvoiceGenerate
} 