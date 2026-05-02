const express = require('express')
const router  = express.Router()
const ctrl    = require('../controllers/appointments.controller')
const { authenticate, authorize } = require('../middleware/auth.middleware')

router.use(authenticate)
router.get('/',              ctrl.getAll)
router.post('/',             authorize('admin', 'receptionist'), ctrl.create)
router.patch('/:id/status',  ctrl.updateStatus)

module.exports = router