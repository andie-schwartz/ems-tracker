import { useState, useEffect } from 'react'
import api from '../utils/api'

function Settings() {
  const [settings, setSettings] = useState({ alert_threshold: '3', pass_threshold: '5' })
  const [loading, setLoading] = useState(true)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [categories, setCategories] = useState([])
  const [newCatName, setNewCatName] = useState('')
  const [newSkills, setNewSkills] = useState({})
  const [expandedCat, setExpandedCat] = useState(null)

  useEffect(() => {
    loadSettings()
    loadSkills()
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

  const loadSkills = async () => {
    try {
      const res = await api.get('/skills')
      setCategories(res.data)
    } catch (e) {
      console.error(e)
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

  const addCategory = async () => {
    if (!newCatName.trim()) return
    try {
      await api.post('/skills/categories', { name: newCatName })
      setNewCatName('')
      loadSkills()
    } catch (e) {
      console.error(e)
    }
  }

  const deleteCategory = async (id, name) => {
    if (!confirm(`Delete category "${name}" and all its skills? This cannot be undone.`)) return
    try {
      await api.delete(`/skills/categories/${id}`)
      loadSkills()
    } catch (e) {
      console.error(e)
    }
  }

  const addSkill = async (categoryId) => {
    const name = newSkills[categoryId]
    if (!name || !name.trim()) return
    try {
      await api.post('/skills/item', { category_id: categoryId, name })
      setNewSkills({ ...newSkills, [categoryId]: '' })
      loadSkills()
    } catch (e) {
      console.error(e)
    }
  }

  const deleteSkill = async (id, name) => {
    if (!confirm(`Delete skill "${name}"?`)) return
    try {
      await api.delete(`/skills/item/${id}`)
      loadSkills()
    } catch (e) {
      console.error(e)
    }
  }

  if (loading) return <div style={{ color: '#8795a8', padding: '40px 0' }}>Loading...</div>

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontFamily: 'Libre Baskerville, serif', fontSize: '1.5rem', color: '#1a2e4a' }}>Settings</h1>
          <p style={{ color: '#8795a8', fontSize: '0.875rem', marginTop: '4px' }}>Configure scoring thresholds and skill lists</p>
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
              <input type="number" min="1" max="7" value={settings.alert_threshold}
                onChange={e => setSettings({ ...settings, alert_threshold: e.target.value })}
                style={{ width: '70px', padding: '8px 10px', border: '1px solid #dde3eb', borderRadius: '7px', fontSize: '1rem', textAlign: 'center', fontFamily: 'Libre Baskerville, serif', fontWeight: '700', color: '#c0392b', outline: 'none' }} />
              <span style={{ fontSize: '0.8rem', color: '#8795a8' }}>out of 7</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '20px', gap: '20px', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: '0.875rem', fontWeight: '500', color: '#1a2332', marginBottom: '4px' }}>Pass Threshold</div>
              <div style={{ fontSize: '0.8rem', color: '#8795a8' }}>Minimum score for a skill to count toward completion percentage</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
              <input type="number" min="1" max="7" value={settings.pass_threshold}
                onChange={e => setSettings({ ...settings, pass_threshold: e.target.value })}
                style={{ width: '70px', padding: '8px 10px', border: '1px solid #dde3eb', borderRadius: '7px', fontSize: '1rem', textAlign: 'center', fontFamily: 'Libre Baskerville, serif', fontWeight: '700', color: '#166534', outline: 'none' }} />
              <span style={{ fontSize: '0.8rem', color: '#8795a8' }}>out of 7</span>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div style={{ background: '#fff', border: '1px solid #dde3eb', borderRadius: '12px', boxShadow: '0 1px 3px rgba(26,46,74,0.08)', overflow: 'hidden', marginBottom: '20px' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #dde3eb' }}>
          <div style={{ fontFamily: 'Libre Baskerville, serif', fontSize: '0.95rem', fontWeight: '700', color: '#1a2e4a' }}>Notifications</div>
        </div>
        <div style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '20px', borderBottom: '1px solid #dde3eb', gap: '20px' }}>
            <div>
              <div style={{ fontSize: '0.875rem', fontWeight: '500', color: '#1a2332', marginBottom: '4px' }}>In-App Alerts</div>
              <div style={{ fontSize: '0.8rem', color: '#8795a8' }}>Show alert badge when low scores are submitted</div>
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

      {/* Skill Manager */}
      <div style={{ background: '#fff', border: '1px solid #dde3eb', borderRadius: '12px', boxShadow: '0 1px 3px rgba(26,46,74,0.08)', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #dde3eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontFamily: 'Libre Baskerville, serif', fontSize: '0.95rem', fontWeight: '700', color: '#1a2e4a' }}>Skill Manager</div>
          <span style={{ fontSize: '0.78rem', color: '#8795a8' }}>{categories.length} categories · {categories.reduce((acc, c) => acc + c.skills.length, 0)} skills</span>
        </div>
        <div style={{ padding: '20px' }}>

          {/* Add category */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            <input
              placeholder="New category name..."
              value={newCatName}
              onChange={e => setNewCatName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addCategory()}
              style={{ flex: 1, padding: '9px 12px', border: '1px solid #dde3eb', borderRadius: '7px', fontSize: '0.875rem', fontFamily: 'Source Sans 3, sans-serif', outline: 'none' }}
            />
            <button onClick={addCategory} style={{
              background: '#0d7a6e', color: '#fff', border: 'none', borderRadius: '7px',
              padding: '9px 16px', fontSize: '0.875rem', cursor: 'pointer',
              fontFamily: 'Source Sans 3, sans-serif', whiteSpace: 'nowrap'
            }}>+ Add Category</button>
          </div>

          {/* Categories list */}
          {categories.map(cat => (
            <div key={cat.id} style={{ border: '1px solid #dde3eb', borderRadius: '8px', marginBottom: '12px', overflow: 'hidden' }}>
              {/* Category header */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 14px', background: '#f4f6f9', cursor: 'pointer'
              }} onClick={() => setExpandedCat(expandedCat === cat.id ? null : cat.id)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '0.75rem', color: '#8795a8' }}>{expandedCat === cat.id ? '▼' : '▶'}</span>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1a2e4a' }}>{cat.name}</h4>
                  <span style={{ fontSize: '0.75rem', color: '#8795a8', fontFamily: 'Source Code Pro, monospace' }}>{cat.skills.length} skills</span>
                </div>
                <button onClick={e => { e.stopPropagation(); deleteCategory(cat.id, cat.name) }} style={{
                  background: '#fdecea', border: '1px solid #fca5a5', borderRadius: '5px',
                  padding: '3px 10px', fontSize: '0.75rem', cursor: 'pointer',
                  fontFamily: 'Source Sans 3, sans-serif', color: '#c0392b'
                }}>Delete</button>
              </div>

              {/* Skills list */}
              {expandedCat === cat.id && (
                <div>
                  {cat.skills.map(skill => (
                    <div key={skill.id} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '10px 14px', borderTop: '1px solid #dde3eb'
                    }}>
                      <span style={{ fontSize: '0.875rem', color: '#1a2332' }}>{skill.name}</span>
                      <button onClick={() => deleteSkill(skill.id, skill.name)} style={{
                        background: 'transparent', border: '1px solid #dde3eb', borderRadius: '5px',
                        padding: '3px 10px', fontSize: '0.75rem', cursor: 'pointer',
                        fontFamily: 'Source Sans 3, sans-serif', color: '#8795a8'
                      }}>Remove</button>
                    </div>
                  ))}

                  {/* Add skill input */}
                  <div style={{ padding: '10px 14px', borderTop: '1px solid #dde3eb', display: 'flex', gap: '8px' }}>
                    <input
                      placeholder="New skill name..."
                      value={newSkills[cat.id] || ''}
                      onChange={e => setNewSkills({ ...newSkills, [cat.id]: e.target.value })}
                      onKeyDown={e => e.key === 'Enter' && addSkill(cat.id)}
                      style={{ flex: 1, padding: '7px 10px', border: '1px solid #dde3eb', borderRadius: '6px', fontSize: '0.8rem', fontFamily: 'Source Sans 3, sans-serif', outline: 'none' }}
                    />
                    <button onClick={() => addSkill(cat.id)} style={{
                      background: '#0d7a6e', color: '#fff', border: 'none', borderRadius: '6px',
                      padding: '7px 14px', fontSize: '0.8rem', cursor: 'pointer',
                      fontFamily: 'Source Sans 3, sans-serif'
                    }}>+ Add</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Settings