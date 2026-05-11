// autoshop/src/routes/customers.routes.js
const express = require('express')
const router  = express.Router()
const ctrl    = require('../controllers/customers.controller')
const { authenticate, authorize }  = require('../middleware/auth.middleware')
const { validate, validateCustomer } = require('../utils/validate')

router.use(authenticate)

router.get('/',       ctrl.getAll)
router.get('/:id',    ctrl.getOne)
router.post('/',      authorize('admin', 'receptionist'), validate(validateCustomer), ctrl.create)
router.put('/:id',    authorize('admin', 'receptionist'), validate(validateCustomer), ctrl.update)
router.delete('/:id', authorize('admin'), ctrl.remove)
router.patch('/:id/status', authorize('admin'), ctrl.setStatus)

module.exports = router