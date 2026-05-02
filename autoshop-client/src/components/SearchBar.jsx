export default function SearchBar({ value, onChange, placeholder = 'Search...' }) {
  return (
    <div style={styles.wrapper}>
      <span style={styles.icon}>🔍</span>
      <input
        style={styles.input}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
      />
      {value && (
        <button style={styles.clear} onClick={() => onChange('')}>✕</button>
      )}
    </div>
  )
}

const styles = {
  wrapper: {
    display:         'flex',
    alignItems:      'center',
    gap:             '0.5rem',
    backgroundColor: 'var(--bg-input)',
    border:          '1px solid var(--border-input)',
    borderRadius:    'var(--radius-sm)',
    padding:         '0.5rem 0.75rem',
    minWidth:        '260px',
  },
  icon:  { fontSize: '0.85rem', color: 'var(--text-muted)', flexShrink: 0 },
  input: {
    border:          'none',
    outline:         'none',
    backgroundColor: 'transparent',
    color:           'var(--text-primary)',
    fontSize:        '0.9rem',
    width:           '100%',
  },
  clear: {
    border:          'none',
    background:      'none',
    color:           'var(--text-muted)',
    cursor:          'pointer',
    fontSize:        '0.75rem',
    padding:         '0',
    flexShrink:      0,
  },
}