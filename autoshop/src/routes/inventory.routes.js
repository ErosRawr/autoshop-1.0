const express = require('express')
const router  = express.Router()
const ctrl    = require('../controllers/inventory.controller')
const { authenticate, authorize } = require('../middleware/auth.middleware')
const { validate, validateInventoryReceive } = require('../utils/validate')

router.use(authenticate)

router.get('/',          ctrl.getStock)
router.post('/receive',  authorize('admin', 'receptionist'), validate(validateInventoryReceive), ctrl.receive)
router.get('/movements', ctrl.getMovements)

module.exports = router