import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const links = [
  { to: '/',           label: '📊 Dashboard' },
  { to: '/customers',  label: '👥 Customers' },
  { to: '/vehicles',   label: '🚗 Vehicles'  },
  { to: '/workorders', label: '🔧 Work Orders' },
  { to: '/inventory',  label: '📦 Inventory' },
  { to: '/invoices',   label: '🧾 Invoices'  },
]

export default function Navbar() {
  const { user, logout } = useAuth()
  const location = useLocation()

  return (
    <nav style={styles.nav}>
      <span style={styles.brand}>🔧 AutoShop</span>

      <div style={styles.links}>
        {links.map(link => (
          <Link
            key={link.to}
            to={link.to}
            style={{
              ...styles.link,
              ...(location.pathname === link.to ? styles.activeLink : {})
            }}
          >
            {link.label}
          </Link>
        ))}
      </div>

      <div style={styles.user}>
        <span style={styles.username}>👤 {user?.name}</span>
        <button style={styles.logout} onClick={logout}>Logout</button>
      </div>
    </nav>
  )
}

const styles = {
  nav: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1e3a5f',
    padding: '0 2rem',
    height: '60px',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  brand: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: '1.2rem',
    minWidth: '120px',
  },
  links: {
    display: 'flex',
    gap: '0.25rem',
  },
  link: {
    color: '#93c5fd',
    textDecoration: 'none',
    padding: '0.4rem 0.75rem',
    borderRadius: '6px',
    fontSize: '0.875rem',
    transition: 'background 0.2s',
  },
  activeLink: {
    backgroundColor: '#2563eb',
    color: '#ffffff',
  },
  user: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    minWidth: '120px',
    justifyContent: 'flex-end',
  },
  username: {
    color: '#93c5fd',
    fontSize: '0.875rem',
  },
  logout: {
    backgroundColor: 'transparent',
    border: '1px solid #93c5fd',
    color: '#93c5fd',
    padding: '0.3rem 0.75rem',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.8rem',
  },
}