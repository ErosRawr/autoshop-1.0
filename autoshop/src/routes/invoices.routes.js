const express = require('express')
const router  = express.Router()
const ctrl    = require('../controllers/invoices.controller')
const { authenticate, authorize } = require('../middleware/auth.middleware')
const { validate, validateInvoiceGenerate } = require('../utils/validate')

router.use(authenticate)

router.post('/generate/:work_order_id', authorize('admin', 'receptionist'), validate(validateInvoiceGenerate), ctrl.generate)
router.get('/',                         ctrl.getAll)
router.get('/:id',                      ctrl.getOne)
router.patch('/:id/status',             authorize('admin', 'receptionist'), ctrl.updateStatus)

module.exports = router