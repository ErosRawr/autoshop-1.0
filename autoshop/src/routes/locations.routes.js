const express = require('express')
const router  = express.Router()
const ctrl    = require('../controllers/locations.controller')
const { authenticate, authorize } = require('../middleware/auth.middleware')

router.use(authenticate)

router.get('/',             ctrl.getAll)
router.get('/:id',          ctrl.getOne)
router.post('/',            authorize('admin'), ctrl.create)
router.put('/:id',          authorize('admin'), ctrl.update)
router.patch('/:id/status', authorize('admin'), ctrl.setStatus)

module.exports = router