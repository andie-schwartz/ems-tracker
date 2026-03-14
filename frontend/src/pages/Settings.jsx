import { useState, useEffect } from 'react'
import api from '../utils/api'

function Settings() {
  const [settings, setSettings] = useState({ alert_threshold: '3', pass_threshold: '5' })
  const [loading, setLoading] = useState(true)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const res = await api.get('/settings')
      setSettings(res.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    setError('')
    setSaved(false)
    try {
      await api.put('/settings', {
        alert_threshold: parseInt(settings.alert_threshold),
        pass_threshold: parseInt(settings.pass_threshold),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to save settings.')
    }
  }

  if (loading) return <div style={{ color: '#8795a8', padding: '40px 0' }}>Loading...</div>

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontFamily: 'Libre Baskerville, serif', fontSize: '1.5rem', color: '#1a2e4a' }}>Settings</h1>
          <p style={{ color: '#8795a8', fontSize: '0.875rem', marginTop: '4px' }}>Configure scoring thresholds and notifications</p>
        </div>
        <button onClick={saveSettings} style={{
          background: '#0d7a6e', color: '#fff', border: 'none', borderRadius: '8px',
          padding: '9px 18px', fontSize: '0.875rem', fontWeight: '500', cursor: 'pointer',
          fontFamily: 'Source Sans 3, sans-serif'
        }}>Save Changes</button>
      </div>

      {saved && (
        <div style={{ background: '#dcfce7', border: '1px solid #86efac', borderRadius: '8px', padding: '12px 16px', color: '#166534', fontSize: '0.875rem', marginBottom: '20px' }}>
          ✅ Settings saved successfully!
        </div>
      )}

      {error && (
        <div style={{ background: '#fdecea', border: '1px solid #fca5a5', borderRadius: '8px', padding: '12px 16px', color: '#c0392b', fontSize: '0.875rem', marginBottom: '20px' }}>{error}</div>
      )}

      {/* Scoring Thresholds */}
      <div style={{ background: '#fff', border: '1px solid #dde3eb', borderRadius: '12px', boxShadow: '0 1px 3px rgba(26,46,74,0.08)', marginBottom: '20px', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #dde3eb' }}>
          <div style={{ fontFamily: 'Libre Baskerville, serif', fontSize: '0.95rem', fontWeight: '700', color: '#1a2e4a' }}>Scoring Thresholds</div>
        </div>
        <div style={{ padding: '20px' }}>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '20px', borderBottom: '1px solid #dde3eb', gap: '20px', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: '0.875rem', fontWeight: '500', color: '#1a2332', marginBottom: '4px' }}>Alert Threshold</div>
              <div style={{ fontSize: '0.8rem', color: '#8795a8' }}>Send an alert when a trainee scores at or below this value</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
              <input
                type="number"
                min="1" max="7"
                value={settings.alert_threshold}
                onChange={e => setSettings({ ...settings, alert_threshold: e.target.value })}
                style={{
                  width: '70px', padding: '8px 10px', border: '1px solid #dde3eb',
                  borderRadius: '7px', fontSize: '1rem', textAlign: 'center',
                  fontFamily: 'Libre Baskerville, serif', fontWeight: '700',
                  color: '#c0392b', outline: 'none'
                }}
              />
              <span style={{ fontSize: '0.8rem', color: '#8795a8' }}>out of 7</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '20px', gap: '20px', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: '0.875rem', fontWeight: '500', color: '#1a2332', marginBottom: '4px' }}>Pass Threshold</div>
              <div style={{ fontSize: '0.8rem', color: '#8795a8' }}>Minimum score for a skill to count toward completion percentage</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
              <input
                type="number"
                min="1" max="7"
                value={settings.pass_threshold}
                onChange={e => setSettings({ ...settings, pass_threshold: e.target.value })}
                style={{
                  width: '70px', padding: '8px 10px', border: '1px solid #dde3eb',
                  borderRadius: '7px', fontSize: '1rem', textAlign: 'center',
                  fontFamily: 'Libre Baskerville, serif', fontWeight: '700',
                  color: '#166534', outline: 'none'
                }}
              />
              <span style={{ fontSize: '0.8rem', color: '#8795a8' }}>out of 7</span>
            </div>
          </div>

        </div>
      </div>

      {/* Notifications */}
      <div style={{ background: '#fff', border: '1px solid #dde3eb', borderRadius: '12px', boxShadow: '0 1px 3px rgba(26,46,74,0.08)', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #dde3eb' }}>
          <div style={{ fontFamily: 'Libre Baskerville, serif', fontSize: '0.95rem', fontWeight: '700', color: '#1a2e4a' }}>Notifications</div>
        </div>
        <div style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '20px', borderBottom: '1px solid #dde3eb', gap: '20px' }}>
            <div>
              <div style={{ fontSize: '0.875rem', fontWeight: '500', color: '#1a2332', marginBottom: '4px' }}>In-App Alerts</div>
              <div style={{ fontSize: '0.8rem', color: '#8795a8' }}>Show alert badge and notifications panel when low scores are submitted</div>
            </div>
            <span style={{ fontSize: '0.875rem', color: '#166534', fontWeight: '500', flexShrink: 0 }}>● Enabled</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '20px', gap: '20px' }}>
            <div>
              <div style={{ fontSize: '0.875rem', fontWeight: '500', color: '#1a2332', marginBottom: '4px' }}>Email Notifications</div>
              <div style={{ fontSize: '0.8rem', color: '#8795a8' }}>Send email to instructor and admin when a low score alert is triggered</div>
            </div>
            <span style={{ fontSize: '0.875rem', color: '#8795a8', fontWeight: '500', flexShrink: 0 }}>○ Coming soon</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings