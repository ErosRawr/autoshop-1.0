import Navbar from './Navbar'

export default function Layout({ children }) {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-app)' }}>
      <Navbar />
      <main style={{
        padding:   '2rem',
        maxWidth:  '1280px',
        margin:    '0 auto',
      }}>
        {children}
      </main>
    </div>
  )
}