const express = require('express')
const router  = express.Router()
const ctrl    = require('../controllers/inventory.controller')
const { authenticate, authorize } = require('../middleware/auth.middleware')

router.use(authenticate)

router.get('/',            ctrl.getStock)
router.post('/receive',    authorize('admin', 'receptionist'), ctrl.receive)
router.get('/movements',   ctrl.getMovements)

module.exports = router