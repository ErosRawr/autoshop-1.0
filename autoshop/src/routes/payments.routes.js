const express = require('express')
const router  = express.Router()
const ctrl    = require('../controllers/payments.controller')
const { authenticate, authorize } = require('../middleware/auth.middleware')

router.use(authenticate)

router.post('/',  authorize('admin', 'receptionist'), ctrl.create)
router.get('/',   ctrl.getByInvoice)

module.exports = router