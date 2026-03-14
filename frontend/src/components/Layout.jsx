
import api from '../utils/api'

function Layout({ user, setUser, children, currentPage, setCurrentPage }) {
  //const [notifCount, setNotifCount] = useState(0)

  const handleLogout = async () => {
    await api.post('/auth/logout')
    setUser(null)
  }

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '⊞' },
    { id: 'trainees', label: user.role === 'trainee' ? 'My Progress' : user.role === 'instructor' ? 'My Trainees' : 'All Trainees', icon: '👥' },
    { id: 'notifications', label: 'Alerts', icon: '🔔', roles: ['admin', 'instructor'] },
    { id: 'users', label: 'Users', icon: '🔑', roles: ['admin'] },
    { id: 'settings', label: 'Settings', icon: '⚙', roles: ['admin'] },
  ].filter(item => !item.roles || item.roles.includes(user.role))

  const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase()

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>

      {/* ── SIDEBAR ── */}
      <aside style={{
        width: '230px',
        background: '#1a2e4a',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0, left: 0, bottom: 0,
        zIndex: 50,
      }}>
        {/* Logo */}
        <div style={{
          padding: '22px 20px 18px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}>
          <div style={{
            width: '34px', height: '34px',
            background: '#0d7a6e',
            borderRadius: '7px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '17px',
            boxShadow: '0 2px 8px rgba(13,122,110,0.4)',
            flexShrink: 0,
          }}>✚</div>
          <div>
            <div style={{ fontFamily: 'Libre Baskerville, serif', fontSize: '1.05rem', color: '#fff' }}>
              EMS Tracker
            </div>
            <div style={{ fontFamily: 'Source Code Pro, monospace', fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Progress System
            </div>
          </div>
        </div>

        {/* Nav */}
        <div style={{ padding: '16px 12px', flex: 1 }}>
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '9px 10px',
                borderRadius: '6px',
                color: currentPage === item.id ? '#fff' : 'rgba(255,255,255,0.6)',
                background: currentPage === item.id ? 'rgba(13,122,110,0.25)' : 'transparent',
                border: 'none',
                cursor: 'pointer',
                width: '100%',
                textAlign: 'left',
                fontSize: '0.875rem',
                fontFamily: 'Source Sans 3, sans-serif',
                marginBottom: '2px',
                transition: 'all 0.15s',
              }}
            >
              <span style={{ width: '18px', textAlign: 'center' }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>

        {/* User footer */}
        <div style={{
          padding: '14px 12px',
          borderTop: '1px solid rgba(255,255,255,0.08)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px' }}>
            <div style={{
              width: '32px', height: '32px',
              borderRadius: '50%',
              background: '#2f5080',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.8rem', fontWeight: '600', color: '#fff',
              flexShrink: 0,
              border: '2px solid rgba(255,255,255,0.15)',
            }}>{initials}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.8)', fontWeight: '500' }}>{user.name}</div>
              <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)', fontFamily: 'Source Code Pro, monospace', textTransform: 'uppercase' }}>{user.role}</div>
            </div>
            <button onClick={handleLogout} style={{
              background: 'none', border: 'none',
              color: 'rgba(255,255,255,0.3)',
              cursor: 'pointer', fontSize: '0.85rem',
              padding: '4px',
            }} title="Sign out">↩</button>
          </div>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div style={{ marginLeft: '230px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Topbar */}
        <header style={{
          background: '#fff',
          borderBottom: '1px solid #dde3eb',
          padding: '0 28px',
          height: '58px',
          display: 'flex',
          alignItems: 'center',
          position: 'sticky', top: 0, zIndex: 40,
          boxShadow: '0 1px 3px rgba(26,46,74,0.08)',
        }}>
          <div style={{ fontFamily: 'Libre Baskerville, serif', fontSize: '1.1rem', color: '#1a2e4a', fontWeight: '700' }}>
            {navItems.find(n => n.id === currentPage)?.label || 'Dashboard'}
          </div>
        </header>

        {/* Page content */}
        <div style={{ padding: '28px', flex: 1 }}>
          {children}
        </div>
      </div>
    </div>
  )
}

export default Layout