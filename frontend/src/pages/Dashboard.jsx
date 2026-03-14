function Dashboard({ user }) {
  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontFamily: 'Libre Baskerville, serif', fontSize: '1.5rem', color: '#1a2e4a' }}>
          Dashboard
        </h1>
        <p style={{ color: '#8795a8', fontSize: '0.875rem', marginTop: '4px' }}>
          Welcome back, {user.name}
        </p>
      </div>
      <div style={{
        background: '#fff',
        border: '1px solid #dde3eb',
        borderRadius: '12px',
        padding: '40px',
        textAlign: 'center',
        color: '#8795a8'
      }}>
        Dashboard content coming soon...
      </div>
    </div>
  )
}

export default Dashboard