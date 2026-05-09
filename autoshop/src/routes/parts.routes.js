const express = require('express')
const router  = express.Router()
const ctrl    = require('../controllers/parts.controller')
const { authenticate, authorize } = require('../middleware/auth.middleware')
const { validate, validatePart } = require('../utils/validate')

router.use(authenticate)

router.get('/',    ctrl.getAll)
router.get('/:id', ctrl.getOne)
router.post('/',   authorize('admin'), validate(validatePart), ctrl.create)
router.put('/:id', authorize('admin'), validate(validatePart), ctrl.update)

module.exports = router