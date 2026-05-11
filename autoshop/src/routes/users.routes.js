const express = require('express')
const router  = express.Router()
const ctrl    = require('../controllers/users.controller')
const { authenticate, authorize } = require('../middleware/auth.middleware')

router.use(authenticate)
router.use(authorize('admin'))   // all user management is admin-only

router.get('/',                  ctrl.getAll)
router.get('/:id',               ctrl.getOne)
router.post('/',                 ctrl.create)
router.put('/:id',               ctrl.update)
router.patch('/:id/password',    ctrl.changePassword)
router.patch('/:id/status',      ctrl.setStatus)

module.exports = router