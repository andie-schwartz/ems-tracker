import { useState, useEffect } from 'react'
import api from '../utils/api'

function Notifications() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadNotifications()
  }, [])

  const loadNotifications = async () => {
    try {
      const res = await api.get('/notifications')
      setNotifications(res.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all')
      loadNotifications()
    } catch (e) {
      console.error(e)
    }
  }

  const markRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`)
      loadNotifications()
    } catch (e) {
      console.error(e)
    }
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  if (loading) return <div style={{ color: '#8795a8', padding: '40px 0' }}>Loading...</div>

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontFamily: 'Libre Baskerville, serif', fontSize: '1.5rem', color: '#1a2e4a' }}>Alerts</h1>
          <p style={{ color: '#8795a8', fontSize: '0.875rem', marginTop: '4px' }}>
            Low score notifications requiring attention
          </p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} style={{
            background: '#f4f6f9', border: '1px solid #dde3eb', borderRadius: '8px',
            padding: '9px 18px', fontSize: '0.875rem', cursor: 'pointer',
            fontFamily: 'Source Sans 3, sans-serif', color: '#4a5568'
          }}>Mark all read</button>
        )}
      </div>

      <div style={{ background: '#fff', border: '1px solid #dde3eb', borderRadius: '12px', boxShadow: '0 1px 3px rgba(26,46,74,0.08)', overflow: 'hidden' }}>
        {notifications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px', color: '#8795a8' }}>
            <div style={{ fontSize: '2rem', marginBottom: '12px' }}>✅</div>
            <p style={{ fontSize: '0.875rem' }}>No alerts — all scores are looking good!</p>
          </div>
        ) : (
          notifications.map(n => (
            <div key={n.id} style={{
              display: 'flex', gap: '14px', padding: '16px 20px',
              borderBottom: '1px solid #dde3eb',
              alignItems: 'flex-start',
              background: n.is_read ? '#fff' : '#fffbf5',
              opacity: n.is_read ? 0.6 : 1,
            }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '8px',
                background: n.score <= 2 ? '#fdecea' : '#fef3c7',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1rem', flexShrink: 0
              }}>⚠️</div>

              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.875rem', color: '#1a2332' }}>
                  <strong style={{ color: '#1a2e4a' }}>{n.trainee_name}</strong> scored{' '}
                  <strong style={{ color: n.score <= 2 ? '#c0392b' : '#d97706' }}>{n.score}/7</strong>{' '}
                  on <strong>{n.skill_name}</strong>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#8795a8', marginTop: '3px', fontFamily: 'Source Code Pro, monospace' }}>
                  {new Date(n.created_at).toLocaleDateString()} · {new Date(n.created_at).toLocaleTimeString()}
                </div>
              </div>

              {!n.is_read && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0d7a6e' }} />
                  <button onClick={() => markRead(n.id)} style={{
                    background: 'transparent', border: '1px solid #dde3eb', borderRadius: '6px',
                    padding: '5px 10px', fontSize: '0.75rem', cursor: 'pointer',
                    fontFamily: 'Source Sans 3, sans-serif', color: '#4a5568'
                  }}>Dismiss</button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default Notifications