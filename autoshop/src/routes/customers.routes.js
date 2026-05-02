const express    = require('express')
const router     = express.Router()
const ctrl       = require('../controllers/customers.controller')
const { authenticate, authorize } = require('../middleware/auth.middleware')

// All customer routes require a valid token
router.use(authenticate)

router.get('/',     ctrl.getAll)
router.get('/:id',  ctrl.getOne)
router.post('/',    authorize('admin', 'receptionist'), ctrl.create)
router.put('/:id',  authorize('admin', 'receptionist'), ctrl.update)
router.delete('/:id', authorize('admin'),               ctrl.remove)

module.exports = router