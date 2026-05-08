require('dotenv').config()
const express         = require('express')
const cors            = require('cors')
const pool            = require('./db/pool')
const authRoutes      = require('./routes/auth.routes')
const customerRoutes  = require('./routes/customers.routes')
const vehicleRoutes   = require('./routes/vehicles.routes')
const workorderRoutes = require('./routes/workorders.routes')
const supplierRoutes   = require('./routes/suppliers.routes')
const partRoutes       = require('./routes/parts.routes')
const inventoryRoutes  = require('./routes/inventory.routes')
const invoiceRoutes  = require('./routes/invoices.routes')
const paymentRoutes  = require('./routes/payments.routes')
const mechanicRoutes     = require('./routes/mechanics.routes')
const serviceRoutes      = require('./routes/services.routes')
const appointmentRoutes  = require('./routes/appointments.routes')
const locationRoutes     = require('./routes/locations.routes')

const app  = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())

app.use('/auth',       authRoutes)
app.use('/customers',  customerRoutes)
app.use('/vehicles',   vehicleRoutes)
app.use('/workorders', workorderRoutes)
app.use('/suppliers',  supplierRoutes)
app.use('/parts',      partRoutes)
app.use('/inventory',  inventoryRoutes)
app.use('/invoices',  invoiceRoutes)
app.use('/payments',  paymentRoutes)
app.use('/mechanics',    mechanicRoutes)
app.use('/services',     serviceRoutes)
app.use('/appointments', appointmentRoutes)
app.use('/locations', locationRoutes)

app.get('/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() AS time')
    res.json({ status: 'ok', db_time: result.rows[0].time })
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message })
  }
})

app.get('/', (req, res) => {
  res.json({
    name: 'AutoShop API',
    status: 'running',
    version: '1.0.0'
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})