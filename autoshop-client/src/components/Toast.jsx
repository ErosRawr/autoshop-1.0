export default function Toast({ error, success }) {
  if (!error && !success) return null

  return (
    <div style={{
      position:     'fixed',
      bottom:       '1.5rem',
      right:        '1.5rem',
      zIndex:       999,
      display:      'flex',
      flexDirection:'column',
      gap:          '0.5rem',
    }}>
      {error && (
        <div style={{
          backgroundColor: 'var(--accent-danger)',
          color:           '#fff',
          padding:         '0.75rem 1.25rem',
          borderRadius:    'var(--radius-md)',
          boxShadow:       'var(--shadow-md)',
          fontSize:        '0.9rem',
          fontWeight:      '500',
          maxWidth:        '360px',
          display:         'flex',
          alignItems:      'center',
          gap:             '0.5rem',
          animation:       'slideIn 0.2s ease',
        }}>
          ❌ {error}
        </div>
      )}
      {success && (
        <div style={{
          backgroundColor: 'var(--accent-success)',
          color:           '#fff',
          padding:         '0.75rem 1.25rem',
          borderRadius:    'var(--radius-md)',
          boxShadow:       'var(--shadow-md)',
          fontSize:        '0.9rem',
          fontWeight:      '500',
          maxWidth:        '360px',
          display:         'flex',
          alignItems:      'center',
          gap:             '0.5rem',
        }}>
          ✅ {success}
        </div>
      )}
    </div>
  )
}