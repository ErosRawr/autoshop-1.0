const express = require('express')
const router  = express.Router()
const ctrl    = require('../controllers/mechanics.controller')
const { authenticate, authorize } = require('../middleware/auth.middleware')

router.use(authenticate)
router.get('/',                      ctrl.getAll)
router.post('/', authorize('admin'), ctrl.create)

module.exports = router