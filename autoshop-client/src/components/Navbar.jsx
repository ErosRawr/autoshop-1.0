import { Link, useLocation } from 'react-router-dom'
import { useAuth }  from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

const links = [
  { to: '/',           label: 'Dashboard'   },
  { to: '/customers',  label: 'Customers'   },
  { to: '/vehicles',   label: 'Vehicles'    },
  { to: '/workorders', label: 'Work Orders' },
  { to: '/inventory',  label: 'Inventory'   },
  { to: '/invoices',   label: 'Invoices'    },
]

export default function Navbar() {
  const { user, logout }    = useAuth()
  const { theme, toggleTheme } = useTheme()
  const location            = useLocation()

  return (
    <nav style={styles.nav}>
      {/* Brand */}
      <div style={styles.brand}>
        <span style={styles.brandIcon}>⚙</span>
        <span style={styles.brandText}>AutoShop</span>
      </div>

      {/* Links */}
      <div style={styles.links}>
        {links.map(link => {
          const active = location.pathname === link.to
          return (
            <Link
              key={link.to}
              to={link.to}
              style={{ ...styles.link, ...(active ? styles.linkActive : {}) }}
            >
              {link.label}
              {active && <span style={styles.activeDot} />}
            </Link>
          )
        })}
      </div>

      {/* Right side */}
      <div style={styles.right}>
        {/* Theme toggle */}
        <button style={styles.iconBtn} onClick={toggleTheme} title="Toggle theme">
          {theme === 'light' ? '🌙' : '☀️'}
        </button>

        {/* User info */}
        <div style={styles.userInfo}>
          <div style={styles.avatar}>
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div style={styles.userText}>
            <span style={styles.userName}>{user?.name}</span>
            <span style={styles.userRole}>{user?.role}</span>
          </div>
        </div>

        <button style={styles.logoutBtn} onClick={logout}>
          Sign out
        </button>
      </div>
    </nav>
  )
}

const styles = {
  nav: {
    display:         'flex',
    alignItems:      'center',
    justifyContent:  'space-between',
    backgroundColor: 'var(--bg-nav)',
    padding:         '0 1.5rem',
    height:          'var(--nav-height)',
    position:        'sticky',
    top:             0,
    zIndex:          100,
    borderBottom:    '1px solid rgba(255,255,255,0.06)',
    boxShadow:       '0 1px 12px rgba(0,0,0,0.15)',
  },
  brand: {
    display:    'flex',
    alignItems: 'center',
    gap:        '0.5rem',
    minWidth:   '140px',
  },
  brandIcon: {
    fontSize:   '1.3rem',
    color:      'var(--accent)',
  },
  brandText: {
    color:      '#ffffff',
    fontWeight: '700',
    fontSize:   '1.1rem',
    letterSpacing: '-0.01em',
  },
  links: {
    display:    'flex',
    alignItems: 'center',
    gap:        '0.125rem',
  },
  link: {
    position:       'relative',
    color:          'var(--text-nav)',
    textDecoration: 'none',
    padding:        '0.4rem 0.75rem',
    borderRadius:   'var(--radius-sm)',
    fontSize:       '0.875rem',
    fontWeight:     '500',
    display:        'flex',
    flexDirection:  'column',
    alignItems:     'center',
    gap:            '2px',
    transition:     'color 0.15s',
  },
  linkActive: {
    color: 'var(--text-nav-active)',
  },
  activeDot: {
    width:           '4px',
    height:          '4px',
    borderRadius:    '50%',
    backgroundColor: 'var(--accent)',
  },
  right: {
    display:    'flex',
    alignItems: 'center',
    gap:        '0.75rem',
    minWidth:   '200px',
    justifyContent: 'flex-end',
  },
  iconBtn: {
    background:   'rgba(255,255,255,0.08)',
    border:       'none',
    borderRadius: 'var(--radius-sm)',
    width:        '34px',
    height:       '34px',
    cursor:       'pointer',
    fontSize:     '1rem',
    display:      'flex',
    alignItems:   'center',
    justifyContent: 'center',
  },
  userInfo: {
    display:    'flex',
    alignItems: 'center',
    gap:        '0.5rem',
  },
  avatar: {
    width:           '32px',
    height:          '32px',
    borderRadius:    '50%',
    backgroundColor: 'var(--accent)',
    color:           '#fff',
    display:         'flex',
    alignItems:      'center',
    justifyContent:  'center',
    fontWeight:      '700',
    fontSize:        '0.85rem',
    flexShrink:      0,
  },
  userText: {
    display:       'flex',
    flexDirection: 'column',
  },
  userName: {
    color:      '#fff',
    fontSize:   '0.8rem',
    fontWeight: '600',
    lineHeight: 1.2,
  },
  userRole: {
    color:      'var(--text-nav)',
    fontSize:   '0.7rem',
    textTransform: 'capitalize',
  },
  logoutBtn: {
    backgroundColor: 'transparent',
    border:          '1px solid rgba(255,255,255,0.15)',
    color:           'var(--text-nav)',
    padding:         '0.3rem 0.75rem',
    borderRadius:    'var(--radius-sm)',
    cursor:          'pointer',
    fontSize:        '0.78rem',
    fontWeight:      '500',
    transition:      'border-color 0.15s',
  },
}