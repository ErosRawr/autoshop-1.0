import { Link, useLocation as useRouterLocation } from 'react-router-dom'
import { useAuth }     from '../context/AuthContext'
import { useTheme }    from '../context/ThemeContext'
import { useLocation } from '../context/LocationContext'

const links = [
  { to: '/',           label: 'Dashboard'   },
  { to: '/customers',  label: 'Customers'   },
  { to: '/vehicles',   label: 'Vehicles'    },
  { to: '/workorders', label: 'Work Orders' },
  { to: '/inventory',  label: 'Inventory'   },
  { to: '/invoices',   label: 'Invoices'    },
  { to: '/locations',  label: 'Locations'   },
]

export default function Navbar() {
  const { user, logout }               = useAuth()
  const { theme, toggleTheme }         = useTheme()
  const { locations, currentLocation, switchLocation } = useLocation()
  const routerLocation                 = useRouterLocation()

  return (
    <nav style={styles.nav}>
      {/* Brand - Always Light */}
      <div style={styles.brand}>
        <span style={styles.brandIcon}>⚙️</span>
        <span style={styles.brandText}>AutoShop</span>
      </div>

      {/* Links */}
      <div style={styles.links}>
        {links.map(link => {
          const active = routerLocation.pathname === link.to
          return (
            <Link 
              key={link.to} 
              to={link.to} 
              style={{ ...styles.link, ...(active ? styles.linkActive : {}) }}
            >
              {link.label}
              {active && <div style={styles.activeIndicator} />}
            </Link>
          )
        })}
      </div>

      {/* Actions */}
      <div style={styles.actions}>
        
        {/* Location Switcher */}
        <div style={styles.locationSwitcher}>
          <span style={styles.locationPin}>📍</span>
          <select 
            style={styles.locationSelect}
            value={currentLocation?.location_id || ''}
            onChange={(e) => switchLocation(e.target.value)}
          >
            {locations.map(loc => (
              <option key={loc.location_id} value={loc.location_id} style={styles.optionStyle}>
                {loc.name}
              </option>
            ))}
          </select>
          <span style={styles.chevron}>▾</span>
        </div>

        <button style={styles.iconBtn} onClick={toggleTheme}>
          {theme === 'dark' ? '🌙' : '☀️'}
        </button>

        {/* User Info - Always Light */}
        <div style={styles.userInfo}>
          <div style={styles.avatar}>
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div style={styles.userText}>
            <span style={styles.userName}>{user?.name || 'User'}</span>
            <button style={styles.logoutBtn} onClick={logout}>Logout</button>
          </div>
        </div>
      </div>
    </nav>
  )
}

const styles = {
  nav: {
    height: 'var(--nav-height)',
    backgroundColor: '#111827', // Fixed dark background
    borderBottom: '1px solid rgba(255,255,255,0.1)',
    display: 'flex',
    alignItems: 'center',
    padding: '0 1.5rem',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    backdropFilter: 'blur(10px)',
  },
  brand: { display: 'flex', alignItems: 'center', gap: '0.6rem', marginRight: '2rem' },
  brandIcon: { fontSize: '1.4rem' },
  brandText: { 
    fontWeight: '800', 
    fontSize: '1.1rem', 
    letterSpacing: '-0.02em', 
    color: '#ffffff' // Always white
  },
  
  links: { display: 'flex', gap: '0.5rem', flex: 1 },
  link: { 
    textDecoration: 'none', 
    color: 'rgba(255,255,255,0.6)', 
    fontSize: '0.875rem', 
    fontWeight: '500',
    padding: '0.5rem 0.75rem',
    borderRadius: 'var(--radius-sm)',
    transition: 'all 0.2s',
    position: 'relative'
  },
  linkActive: { color: '#ffffff', backgroundColor: 'rgba(255,255,255,0.1)' },
  activeIndicator: { position: 'absolute', bottom: '0', left: '0.75rem', right: '0.75rem', height: '2px', backgroundColor: 'var(--accent)', borderRadius: '2px' },

  actions: { display: 'flex', alignItems: 'center', gap: '1.25rem' },
  
  locationSwitcher: { 
    display: 'flex', 
    alignItems: 'center', 
    gap: '0.35rem', 
    backgroundColor: 'rgba(255,255,255,0.1)', 
    padding: '0.3rem 0.6rem', 
    borderRadius: 'var(--radius-sm)', 
    border: '1px solid rgba(255,255,255,0.15)',
    position: 'relative'
  },
  locationPin: { fontSize: '0.85rem', opacity: 0.8 },
  locationSelect: {
    background:  'transparent',
    border:      'none',
    color:       '#ffffff',
    fontSize:    '0.82rem',
    fontWeight:  '700',
    cursor:      'pointer',
    outline:     'none',
    maxWidth:    '140px',
    appearance:  'none',
    paddingRight: '1rem',
    colorScheme: 'dark', // Forces OS dropdown to use dark theme colors
  },
  optionStyle: {
    backgroundColor: '#1f2937', // Darker background for the list
    color: '#ffffff',
    padding: '10px'
  },
  chevron: {
    fontSize: '0.6rem',
    position: 'absolute',
    right: '0.5rem',
    pointerEvents: 'none',
    opacity: 0.6,
    color: '#fff'
  },

  iconBtn: { background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 'var(--radius-sm)', width: '34px', height: '34px', cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  userInfo: { display: 'flex', alignItems: 'center', gap: '0.75rem' },
  avatar: { width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '0.85rem', flexShrink: 0 },
  userText: { display: 'flex', flexDirection: 'column', gap: '2px' },
  userName: { fontSize: '0.8rem', fontWeight: '600', color: '#ffffff' }, // Always white
  
  logoutBtn: { 
    background: 'rgba(239, 68, 68, 0.15)', 
    border: '1px solid rgba(239, 68, 68, 0.4)', 
    color: '#f87171', 
    fontSize: '0.6rem', 
    cursor: 'pointer', 
    padding: '1px 6px', 
    borderRadius: '4px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    transition: 'all 0.2s',
    marginTop: '2px',
    width: 'fit-content'
  }
}