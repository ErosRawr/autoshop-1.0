import { useState } from 'react'
import { Link, useLocation as useRouterLocation, useNavigate } from 'react-router-dom'
import { useAuth }     from '../context/AuthContext'
import { useTheme }    from '../context/ThemeContext'
import { useLocation } from '../context/LocationContext'

const NAV_GROUPS = [
  {
    label: 'Operations',
    roles: ['admin', 'receptionist', 'mechanic'],
    links: [
      { to: '/workorders',   label: 'Work Orders', roles: ['admin', 'receptionist', 'mechanic'] },
      { to: '/appointments', label: 'Appointments', roles: ['admin', 'receptionist'] },
      { to: '/inventory',    label: 'Inventory',    roles: ['admin', 'receptionist', 'mechanic'] },
    ]
  },
  {
    label: 'Customers',
    roles: ['admin', 'receptionist'],
    links: [
      { to: '/customers', label: 'Customers', roles: ['admin', 'receptionist'] },
      { to: '/vehicles',  label: 'Vehicles',  roles: ['admin', 'receptionist'] },
    ]
  },
  {
    label: 'Finance',
    roles: ['admin', 'receptionist'],
    links: [
      { to: '/invoices', label: 'Invoices', roles: ['admin', 'receptionist'] },
    ]
  },
  {
    label: 'Catalog',
    roles: ['admin'],
    links: [
      { to: '/parts',     label: 'Parts',     roles: ['admin'] },
      { to: '/suppliers', label: 'Suppliers', roles: ['admin'] },
      {to: '/locations', label: 'Locations', roles: ['admin'] },
    ]
  },
  {
    label: 'Staff',
    roles: ['admin'],
    links: [
      { to: '/mechanics', label: 'Mechanics', roles: ['admin'] },
      { to: '/users',     label: 'Users',     roles: ['admin'] },
    ]
  },
]

export default function Navbar() {
  const { user, logout }               = useAuth()
  const { theme, toggleTheme }         = useTheme()
  const { locations, currentLocation, switchLocation } = useLocation()
  const routerLocation                 = useRouterLocation()
  const navigate                       = useNavigate()
  const [openGroup, setOpenGroup]      = useState(null)

  function handleLogout() {
    logout()
    navigate('/login')
  }

  function toggleGroup(label) {
    setOpenGroup(prev => prev === label ? null : label)
  }

  const visibleGroups = NAV_GROUPS.filter(g =>
    g.roles.includes(user?.role)
  )

  return (
    <nav style={styles.nav} onMouseLeave={() => setOpenGroup(null)}>
      {/* Brand */}
      <div style={styles.brand}>
        <span style={styles.brandIcon}>⚙️</span>
        <span style={styles.brandText}>AutoShop</span>
      </div>

      {/* Links */}
      <div style={styles.links}>
        <Link
          to="/"
          style={{ ...styles.link, ...(routerLocation.pathname === '/' ? styles.linkActive : {}) }}
        >
          Dashboard
          {routerLocation.pathname === '/' && <span style={styles.activeDot} />}
        </Link>

        {visibleGroups.map(group => {
          const visibleLinks = group.links.filter(l => l.roles.includes(user?.role))
          if (visibleLinks.length === 0) return null

          const isGroupActive = visibleLinks.some(l => routerLocation.pathname === l.to)
          const isOpen        = openGroup === group.label

          return (
            <div key={group.label} style={styles.dropdownWrapper}>
              <button
                style={{
                  ...styles.link,
                  ...styles.dropdownTrigger,
                  ...(isGroupActive ? styles.linkActive : {}),
                }}
                onClick={() => toggleGroup(group.label)}
              >
                <span>{group.label} <span style={styles.caret}>{isOpen ? '▴' : '▾'}</span></span>
                {isGroupActive && <span style={styles.activeDot} />}
              </button>

              {isOpen && (
                <div style={styles.dropdown}>
                  {visibleLinks.map(link => (                    <Link
                      key={link.to}
                      to={link.to}
                      style={{
                        ...styles.dropdownItem,
                        ...(routerLocation.pathname === link.to ? styles.dropdownItemActive : {}),
                      }}
                      onClick={() => setOpenGroup(null)}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Right side actions */}
      <div style={styles.right}>
        {user?.role === 'admin' && (
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
          </div>
        )}

        <button style={styles.iconBtn} onClick={toggleTheme} title="Toggle theme">
          {theme === 'light' ? '🌙' : '☀️'}
        </button>

        <div style={styles.userInfo}>
          <div style={styles.avatar}>
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div style={styles.userText}>
            <span style={styles.userName}>{user?.name || 'User'}</span>
            <span style={styles.userRole}>{user?.role}</span>
          </div>
        </div>

        <button style={styles.logoutBtn} onClick={handleLogout}>Sign out</button>
      </div>
    </nav>
  )
}

const styles = {
  nav: { 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    backgroundColor: '#111827', // var(--bg-nav)
    padding: '0 1.5rem', 
    height: 'var(--nav-height)', 
    position: 'sticky', 
    top: 0, 
    zIndex: 100, 
    borderBottom: '1px solid rgba(255,255,255,0.06)', 
    boxShadow: '0 1px 12px rgba(0,0,0,0.15)' 
  },
  brand: { display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: '140px' },
  brandIcon: { fontSize: '1.3rem' },
  brandText: { color: '#ffffff', fontWeight: '700', fontSize: '1.1rem', letterSpacing: '-0.01em' },
  
  links: { display: 'flex', alignItems: 'center', gap: '0.125rem' },
  link: { 
    position: 'relative', 
    color: 'rgba(255,255,255,0.6)', // var(--text-nav)
    textDecoration: 'none', 
    padding: '0.4rem 0.75rem', 
    borderRadius: 'var(--radius-sm)', 
    fontSize: '0.875rem', 
    fontWeight: '500', 
    display: 'flex', 
    flexDirection: 'column', 
    alignItems: 'center', 
    gap: '2px', 
    transition: 'color 0.15s' 
  },
  linkActive: { color: '#ffffff' }, // var(--text-nav-active)
  activeDot: { width: '4px', height: '4px', borderRadius: '50%', backgroundColor: 'var(--accent)' },
  
  dropdownWrapper: { position: 'relative' },
  dropdownTrigger: { background: 'none', border: 'none', cursor: 'pointer' },
  caret: { fontSize: '0.65rem', marginLeft: '0.2rem' },
  dropdown: { 
    position: 'absolute', 
    top: 'calc(100% + 4px)', 
    left: '50%', 
    transform: 'translateX(-50%)', 
    backgroundColor: '#1f2937', // var(--bg-card)
    border: '1px solid rgba(255,255,255,0.1)', 
    borderRadius: 'var(--radius-md)', 
    boxShadow: 'var(--shadow-md)', 
    minWidth: '160px', 
    zIndex: 200, 
    overflow: 'hidden' 
  },
  dropdownItem: { 
    display: 'block', 
    padding: '0.65rem 1rem', 
    fontSize: '0.875rem', 
    color: '#ffffff', 
    textDecoration: 'none', 
    transition: 'background-color 0.1s', 
    whiteSpace: 'nowrap' 
  },
  dropdownItemActive: { backgroundColor: 'rgba(255,255,255,0.1)', color: 'var(--accent)', fontWeight: '600' },
  
  right: { display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: '200px', justifyContent: 'flex-end' },
  locationSwitcher: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.35rem',
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: '0.2rem 0.5rem',
    borderRadius: 'var(--radius-sm)',
  },
  locationPin: { fontSize: '0.8rem' },
  locationSelect: {
    background: 'transparent',
    border: 'none',
    color: '#ffffff',
    fontSize: '0.75rem',
    fontWeight: '600',
    cursor: 'pointer',
    outline: 'none',
  },
  optionStyle: { backgroundColor: '#1f2937', color: '#ffffff' },

  iconBtn: { 
    background: 'rgba(255,255,255,0.08)', 
    border: 'none', 
    borderRadius: 'var(--radius-sm)', 
    width: '34px', 
    height: '34px', 
    cursor: 'pointer', 
    fontSize: '1rem', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  userInfo: { display: 'flex', alignItems: 'center', gap: '0.5rem' },
  avatar: { 
    width: '32px', 
    height: '32px', 
    borderRadius: '50%', 
    backgroundColor: 'var(--accent)', 
    color: '#fff', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    fontWeight: '700', 
    fontSize: '0.85rem', 
    flexShrink: 0 
  },
  userText: { display: 'flex', flexDirection: 'column' },
  userName: { color: '#fff', fontSize: '0.8rem', fontWeight: '600', lineHeight: 1.2 },
  userRole: { color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem', textTransform: 'capitalize' },
  logoutBtn: { 
    backgroundColor: 'transparent', 
    border: '1px solid rgba(255,255,255,0.15)', 
    color: 'rgba(255,255,255,0.6)', 
    padding: '0.3rem 0.75rem', 
    borderRadius: 'var(--radius-sm)', 
    cursor: 'pointer', 
    fontSize: '0.78rem', 
    fontWeight: '500' 
  },
}