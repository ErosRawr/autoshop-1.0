export default function TableMeta({ total, showing, label = 'records' }) {
  return (
    <p style={styles.meta}>
      Showing <strong style={styles.num}>{showing}</strong> of{' '}
      <strong style={styles.num}>{total}</strong> {label}
    </p>
  )
}

const styles = {
  meta: {
    fontSize:     '0.82rem',
    color:        'var(--text-muted)',
    marginBottom: '0.75rem',
  },
  num: {
    color: 'var(--text-secondary)',
  },
}