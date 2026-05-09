const express = require('express')
const router  = express.Router()
const ctrl    = require('../controllers/vehicles.controller')
const { authenticate, authorize } = require('../middleware/auth.middleware')
const { validate, validateVehicle } = require('../utils/validate')

router.use(authenticate)

router.get('/',    ctrl.getAll)
router.get('/:id', ctrl.getOne)
router.post('/',   authorize('admin', 'receptionist'), validate(validateVehicle), ctrl.create)
router.put('/:id', authorize('admin', 'receptionist'), validate(validateVehicle), ctrl.update)
router.delete('/:id', authorize('admin'), ctrl.remove)
module.exports = router