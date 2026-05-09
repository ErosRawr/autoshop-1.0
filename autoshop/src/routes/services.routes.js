    const express = require('express')
const router  = express.Router()
const ctrl    = require('../controllers/services.controller')
const { authenticate, authorize } = require('../middleware/auth.middleware')
const { validate, validateService } = require('../utils/validate')

router.use(authenticate)

router.get('/',       ctrl.getAll)
router.get('/:id',    ctrl.getOne)
router.post('/',      authorize('admin', 'receptionist'), validate(validateService), ctrl.create)
router.put('/:id',    authorize('admin', 'receptionist'), validate(validateService), ctrl.update)
router.delete('/:id', authorize('admin'), ctrl.remove)

module.exports = router