const express = require('express')
const router  = express.Router()
const ctrl    = require('../controllers/workorders.controller')
const { authenticate, authorize } = require('../middleware/auth.middleware')

router.use(authenticate)

router.get('/',                          ctrl.getAll)
router.get('/:id',                       ctrl.getOne)
router.post('/', authorize('admin', 'receptionist'), ctrl.create)
router.patch('/:id/status',              ctrl.updateStatus)
router.post('/:id/services',             ctrl.addService)
router.post('/:id/parts',               ctrl.addPart)

module.exports = router