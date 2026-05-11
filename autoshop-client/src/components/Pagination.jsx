export default function Pagination({ page, totalPages, nextPage, prevPage, goToPage }) {
  if (totalPages <= 1) return null

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)

  return (
    <div style={styles.wrapper}>
      <button
        style={{ ...styles.btn, ...(page === 1 ? styles.btnDisabled : {}) }}
        onClick={prevPage}
        disabled={page === 1}
      >
        ← Prev
      </button>

      <div style={styles.pages}>
        {pages.map(p => (
          <button
            key={p}
            style={{ ...styles.btn, ...(p === page ? styles.btnActive : {}) }}
            onClick={() => goToPage(p)}
          >
            {p}
          </button>
        ))}
      </div>

      <button
        style={{ ...styles.btn, ...(page === totalPages ? styles.btnDisabled : {}) }}
        onClick={nextPage}
        disabled={page === totalPages}
      >
        Next →
      </button>

      <span style={styles.info}>
        Page {page} of {totalPages}
      </span>
    </div>
  )
}

const styles = {
  wrapper:    { display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem', justifyContent: 'center' },
  pages:      { display: 'flex', gap: '0.25rem' },
  btn:        { backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)', padding: '0.4rem 0.75rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '500' },
  btnActive:  { backgroundColor: 'var(--accent)', color: '#fff', border: '1px solid var(--accent)' },
  btnDisabled:{ opacity: 0.4, cursor: 'not-allowed' },
  info:       { fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '0.5rem' },
}