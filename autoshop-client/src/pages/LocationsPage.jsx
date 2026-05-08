import { useState } from 'react'
import api from '../api'
import Layout from '../components/Layout'
import { shared } from '../styles/shared'
import { useLocation } from '../context/LocationContext'

export default function LocationsPage() {
  const { locations, currentLocation, switchLocation } = useLocation()
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving]     = useState(false)
  const [form, setForm]         = useState({ name: '', address: '', phone: '', email: '' })

  function handleChange(e) { setForm({ ...form, [e.target.name]: e.target.value }) }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/locations', form)
      setForm({ name: '', address: '', phone: '', email: '' })
      setShowForm(false)
      window.location.reload() // reload to refresh LocationContext
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create location')
    } finally { setSaving(false) }
  }

  return (
    <Layout>
      <div style={shared.pageHeader}>
        <h2 style={shared.pageTitle}>Locations</h2>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {showForm && <button style={shared.btnGhost} onClick={() => setShowForm(false)}>Cancel</button>}
          <button style={shared.btnPrimary} onClick={() => setShowForm(!showForm)}>+ New Location</button>
        </div>
      </div>

      {showForm && (
        <div style={{ ...shared.card, marginBottom: '1.5rem' }}>
          <h3 style={styles.formTitle}>New Location</h3>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={shared.formGrid}>
              <div style={shared.field}>
                <label style={shared.label}>Name *</label>
                <input style={shared.input} name="name" value={form.name} onChange={handleChange} placeholder="Main Branch" required />
              </div>
              <div style={shared.field}>
                <label style={shared.label}>Phone</label>
                <input style={shared.input} name="phone" value={form.phone} onChange={handleChange} placeholder="8711234567" />
              </div>
              <div style={{ ...shared.field, gridColumn: '1 / -1' }}>
                <label style={shared.label}>Address *</label>
                <input style={shared.input} name="address" value={form.address} onChange={handleChange} placeholder="123 Main St, City" required />
              </div>
              <div style={{ ...shared.field, gridColumn: '1 / -1' }}>
                <label style={shared.label}>Email</label>
                <input style={shared.input} name="email" value={form.email} onChange={handleChange} placeholder="branch@autoshop.com" />
              </div>
            </div>
            <button style={shared.btnSuccess} type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Create Location'}
            </button>
          </form>
        </div>
      )}

      <div style={styles.grid}>
        {locations.map(loc => (
          <div
            key={loc.location_id}
            style={{
              ...styles.locationCard,
              ...(currentLocation?.location_id === loc.location_id ? styles.locationCardActive : {})
            }}
          >
            <div style={styles.cardHeader}>
              <div style={styles.cardIcon}>🏪</div>
              {currentLocation?.location_id === loc.location_id && (
                <span style={{ ...shared.badge, ...shared.badgeGreen }}>Current</span>
              )}
            </div>
            <h3 style={styles.cardName}>{loc.name}</h3>
            <p style={styles.cardDetail}>📍 {loc.address}</p>
            {loc.phone && <p style={styles.cardDetail}>📞 {loc.phone}</p>}
            {loc.email && <p style={styles.cardDetail}>✉️ {loc.email}</p>}
            {currentLocation?.location_id !== loc.location_id && (
              <button
                style={{ ...shared.btnPrimary, marginTop: '1rem', width: '100%' }}
                onClick={() => switchLocation(String(loc.location_id))}
              >
                Switch to this location
              </button>
            )}
          </div>
        ))}
      </div>
    </Layout>
  )
}

const styles = {
  formTitle:          { fontWeight: '700', marginBottom: '1rem', color: 'var(--text-primary)' },
  grid:               { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' },
  locationCard:       { backgroundColor: 'var(--bg-card)', border: '2px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', boxShadow: 'var(--shadow-sm)' },
  locationCardActive: { border: '2px solid var(--accent)' },
  cardHeader:         { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' },
  cardIcon:           { fontSize: '1.75rem' },
  cardName:           { fontWeight: '700', fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '0.5rem' },
  cardDetail:         { fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' },
}