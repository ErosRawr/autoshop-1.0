const express = require('express')
const router  = express.Router()
const ctrl    = require('../controllers/workorders.controller')
const { assignToWorkOrder } = require('../controllers/mechanics.controller')
const { authenticate, authorize } = require('../middleware/auth.middleware')
const { getAll, getOne, create, updateStatus, addService, addPart, removeService, removePart, removeMechanic } = require('../controllers/workorders.controller')


router.use(authenticate)

router.get('/',                                ctrl.getAll)
router.get('/:id',                             ctrl.getOne)
router.post('/',  authorize('admin', 'receptionist'), ctrl.create)
router.patch('/:id/status',                    ctrl.updateStatus)
router.post('/:id/services',                   ctrl.addService)
router.post('/:id/parts',                      ctrl.addPart)
router.post('/:id/mechanics',                  assignToWorkOrder)
router.delete('/:id/services/:serviceId',      removeService)
router.delete('/:id/parts/:partLineId',        removePart)
router.delete('/:id/mechanics/:mechanicId',    removeMechanic)

module.exports = router