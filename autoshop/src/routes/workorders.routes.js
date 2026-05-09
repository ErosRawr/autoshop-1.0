const express = require('express')
const router  = express.Router()
const ctrl    = require('../controllers/workorders.controller')
const { assignToWorkOrder } = require('../controllers/mechanics.controller')
const { authenticate, authorize } = require('../middleware/auth.middleware')
const { validate, validateWorkOrder } = require('../utils/validate')

router.use(authenticate)

router.get('/',                                ctrl.getAll)
router.get('/:id',                             ctrl.getOne)
router.post('/',  authorize('admin', 'receptionist'), validate(validateWorkOrder), ctrl.create)
router.patch('/:id/status',                    ctrl.updateStatus)
router.post('/:id/services',                   ctrl.addService)
router.post('/:id/parts',                      ctrl.addPart)
router.post('/:id/mechanics',                  assignToWorkOrder)
router.delete('/:id/services/:serviceId',      ctrl.removeService)
router.delete('/:id/parts/:partLineId',        ctrl.removePart)
router.delete('/:id/mechanics/:mechanicId',    ctrl.removeMechanic)

module.exports = router