import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import api from '../api'

export default function LoginPage() {
  const { login } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [form, setForm]       = useState({ username: '', password: '' })
  const [error, setError]     = useState(null)
  const [loading, setLoading] = useState(false)

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await api.post('/auth/login', form)
      login(res.data.user, res.data.token)
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    
    <div style={styles.wrapper}>
      <button
        onClick={toggleTheme}
        style={{
          position:        'fixed',
          top:             '1rem',
          right:           '1rem',
          background:      'var(--bg-card)',
          border:          '1px solid var(--border)',
          borderRadius:    'var(--radius-sm)',
          width:           '36px',
          height:          '36px',
          cursor:          'pointer',
          fontSize:        '1rem',
          display:         'flex',
          alignItems:      'center',
          justifyContent:  'center',
          boxShadow:       'var(--shadow-sm)',
        }}
      >
        {theme === 'light' ? '🌙' : '☀️'}
      </button>

      <div style={styles.card}>
        <h1 style={styles.title}>🔧 AutoShop</h1>
        <p style={styles.subtitle}>Sign in to your account</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Username</label>
            <input
              style={styles.input}
              name="username"
              value={form.username}
              onChange={handleChange}
              placeholder="admin1"
              autoComplete="username"
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              style={styles.input}
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          {error && <p style={styles.error}>{error}</p>}

          <button style={styles.button} type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}

const styles = {
  wrapper: {
    minHeight:       '100vh',
    display:         'flex',
    alignItems:      'center',
    justifyContent:  'center',
    backgroundColor: 'var(--bg-app)',
  },
  card: {
    backgroundColor: 'var(--bg-card)',
    padding:         '2.5rem',
    borderRadius:    'var(--radius-lg)',
    boxShadow:       'var(--shadow-md)',
    width:           '100%',
    maxWidth:        '400px',
    border:          '1px solid var(--border)',
  },
  title: {
    fontSize:      '1.8rem',
    fontWeight:    '700',
    textAlign:     'center',
    marginBottom:  '0.25rem',
    color:         'var(--text-primary)',
  },
  subtitle: {
    textAlign:     'center',
    color:         'var(--text-secondary)',
    marginBottom:  '2rem',
    fontSize:      '0.9rem',
  },
  form: {
    display:       'flex',
    flexDirection: 'column',
    gap:           '1.25rem',
  },
  field: {
    display:       'flex',
    flexDirection: 'column',
    gap:           '0.4rem',
  },
  label: {
    fontSize:   '0.875rem',
    fontWeight: '600',
    color:      'var(--text-primary)',
  },
  input: {
    padding:         '0.65rem 0.875rem',
    borderRadius:    'var(--radius-sm)',
    border:          '1px solid var(--border-input)',
    fontSize:        '1rem',
    backgroundColor: 'var(--bg-input)',
    color:           'var(--text-primary)',
    outline:         'none',
  },
  error: {
    color:     'var(--accent-danger)',
    fontSize:  '0.875rem',
    textAlign: 'center',
  },
  button: {
    padding:         '0.75rem',
    backgroundColor: 'var(--accent)',
    color:           '#ffffff',
    border:          'none',
    borderRadius:    'var(--radius-sm)',
    fontSize:        '1rem',
    fontWeight:      '600',
    cursor:          'pointer',
    marginTop:       '0.5rem',
  },
}