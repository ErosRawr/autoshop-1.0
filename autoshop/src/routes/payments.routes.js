const express = require('express')
const router  = express.Router()
const ctrl    = require('../controllers/payments.controller')
const { authenticate, authorize } = require('../middleware/auth.middleware')
const { validate, validatePayment } = require('../utils/validate')

router.use(authenticate)

router.post('/', authorize('admin', 'receptionist'), validate(validatePayment), ctrl.create)
router.get('/',  ctrl.getByInvoice)

module.exports = router