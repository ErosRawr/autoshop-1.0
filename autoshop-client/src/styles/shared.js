export const shared = {
  // Layout
  pageHeader: {
    display:        'flex',
    justifyContent: 'space-between',
    alignItems:     'center',
    marginBottom:   '1.5rem',
  },
  pageTitle: {
    fontSize:   '1.5rem',
    fontWeight: '700',
    color:      'var(--text-primary)',
  },

  // Cards
  card: {
    backgroundColor: 'var(--bg-card)',
    borderRadius:    'var(--radius-lg)',
    boxShadow:       'var(--shadow-md)',
    border:          '1px solid var(--border)',
    padding:         '1.5rem',
  },

  // Form
  formGrid: {
    display:             'grid',
    gridTemplateColumns: '1fr 1fr',
    gap:                 '1rem',
  },
  field: {
    display:       'flex',
    flexDirection: 'column',
    gap:           '0.35rem',
  },
  label: {
    fontSize:   '0.8rem',
    fontWeight: '600',
    color:      'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  input: {
    padding:         '0.6rem 0.875rem',
    borderRadius:    'var(--radius-sm)',
    border:          '1px solid var(--border-input)',
    fontSize:        '0.95rem',
    backgroundColor: 'var(--bg-input)',
    color:           'var(--text-primary)',
    outline:         'none',
    width:           '100%',
  },

  // Buttons
  btnPrimary: {
    backgroundColor: 'var(--accent)',
    color:           '#ffffff',
    border:          'none',
    padding:         '0.6rem 1.25rem',
    borderRadius:    'var(--radius-sm)',
    cursor:          'pointer',
    fontWeight:      '600',
    fontSize:        '0.9rem',
  },
  btnSuccess: {
    backgroundColor: 'var(--accent-success)',
    color:           '#ffffff',
    border:          'none',
    padding:         '0.65rem 1.5rem',
    borderRadius:    'var(--radius-sm)',
    cursor:          'pointer',
    fontWeight:      '600',
    alignSelf:       'flex-start',
  },
  btnDanger: {
    backgroundColor: 'transparent',
    border:          '1px solid var(--accent-danger)',
    color:           'var(--accent-danger)',
    padding:         '0.25rem 0.6rem',
    borderRadius:    'var(--radius-sm)',
    cursor:          'pointer',
    fontSize:        '0.8rem',
  },
  btnGhost: {
    backgroundColor: 'transparent',
    border:          '1px solid var(--border-input)',
    color:           'var(--text-secondary)',
    padding:         '0.6rem 1.25rem',
    borderRadius:    'var(--radius-sm)',
    cursor:          'pointer',
    fontWeight:      '600',
    fontSize:        '0.9rem',
  },

  // Table
  tableWrapper: {
    backgroundColor: 'var(--bg-card)',
    borderRadius:    'var(--radius-lg)',
    boxShadow:       'var(--shadow-md)',
    border:          '1px solid var(--border)',
    overflow:        'hidden',
  },
  table: {
    width:           '100%',
    borderCollapse:  'collapse',
  },
  thead: {
    backgroundColor: 'var(--bg-table-head)',
  },
  th: {
    padding:        '0.875rem 1rem',
    textAlign:      'left',
    fontSize:       '0.75rem',
    fontWeight:     '700',
    color:          'var(--text-secondary)',
    textTransform:  'uppercase',
    letterSpacing:  '0.05em',
    borderBottom:   '1px solid var(--border)',
  },
  tr: {
    borderBottom: '1px solid var(--border)',
  },
  td: {
    padding:  '0.875rem 1rem',
    fontSize: '0.9rem',
    color:    'var(--text-primary)',
  },

  // Badges
  badge: {
    padding:      '0.2rem 0.65rem',
    borderRadius: '999px',
    fontSize:     '0.75rem',
    fontWeight:   '600',
  },
  badgeBlue:   { backgroundColor: 'var(--bg-badge-blue)',   color: 'var(--text-badge-blue)'   },
  badgeGreen:  { backgroundColor: 'var(--bg-badge-green)',  color: 'var(--text-badge-green)'  },
  badgeYellow: { backgroundColor: 'var(--bg-badge-yellow)', color: 'var(--text-badge-yellow)' },
  badgeRed:    { backgroundColor: 'var(--bg-badge-red)',    color: 'var(--text-badge-red)'    },
  badgeGray:   { backgroundColor: 'var(--bg-badge-gray)',   color: 'var(--text-badge-gray)'   },

  // Empty state
  empty: {
    color:     'var(--text-muted)',
    fontSize:  '0.9rem',
    textAlign: 'center',
    padding:   '3rem 0',
  },
}