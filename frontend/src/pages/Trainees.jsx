import { useState, useEffect } from 'react'
import api from '../utils/api'

function StatusBadge({ status }) {
  const styles = {
    active:    { bg: '#dcfce7', border: '#86efac', color: '#166534' },
    on_hold:   { bg: '#fef3c7', border: '#fcd34d', color: '#d97706' },
    completed: { bg: '#dbeafe', border: '#93c5fd', color: '#1d4ed8' },
    failed:    { bg: '#fdecea', border: '#fca5a5', color: '#c0392b' },
  }
  const s = styles[status] || styles.active
  return (
    <span style={{
      background: s.bg, border: `1px solid ${s.border}`, color: s.color,
      padding: '3px 9px', borderRadius: '20px', fontSize: '0.72rem',
      fontFamily: 'Source Code Pro, monospace', letterSpacing: '0.04em'
    }}>{status.replace('_', ' ')}</span>
  )
}

function Trainees({ user, setCurrentPage, setSelectedTrainee }) {
  const [trainees, setTrainees] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [instructors, setInstructors] = useState([])
  const [form, setForm] = useState({ name: '', email: '', password: '', instructor_id: '', start_date: '' })
  const [error, setError] = useState('')

  useEffect(() => {
    loadTrainees()
    if (user.role === 'admin') loadInstructors()
  }, [])

  const loadTrainees = async () => {
    try {
      const res = await api.get('/trainees')
      setTrainees(res.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const loadInstructors = async () => {
    try {
      const res = await api.get('/users/instructors')
      setInstructors(res.data)
    } catch (e) {
      console.error(e)
    }
  }

  const submitAddTrainee = async () => {
    setError('')
    try {
      // Create user account
      await api.post('/users', {
        name: form.name,
        email: form.email,
        password: form.password,
        role: 'trainee',
      })

      // Find the new trainee record and update it
      const traineesRes = await api.get('/trainees')
      const newTrainee = traineesRes.data.find(t => t.trainee_email === form.email)
      if (newTrainee) {
        await api.put(`/trainees/${newTrainee.id}`, {
          instructor_id: form.instructor_id || null,
          start_date: form.start_date || null,
        })
      }

      setShowModal(false)
      setForm({ name: '', email: '', password: '', instructor_id: '', start_date: '' })
      loadTrainees()
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to add trainee.')
    }
  }

  if (loading) return <div style={{ color: '#8795a8', padding: '40px 0' }}>Loading...</div>

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontFamily: 'Libre Baskerville, serif', fontSize: '1.5rem', color: '#1a2e4a' }}>
            {user.role === 'instructor' ? 'My Trainees' : 'All Trainees'}
          </h1>
          <p style={{ color: '#8795a8', fontSize: '0.875rem', marginTop: '4px' }}>{trainees.length} trainee{trainees.length !== 1 ? 's' : ''} total</p>
        </div>
        {user.role === 'admin' && (
          <button onClick={() => setShowModal(true)} style={{
            background: '#0d7a6e', color: '#fff', border: 'none', borderRadius: '8px',
            padding: '9px 18px', fontSize: '0.875rem', fontWeight: '500', cursor: 'pointer',
            fontFamily: 'Source Sans 3, sans-serif'
          }}>+ Add Trainee</button>
        )}
      </div>

      <div style={{ background: '#fff', border: '1px solid #dde3eb', borderRadius: '12px', boxShadow: '0 1px 3px rgba(26,46,74,0.08)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f4f6f9' }}>
                <th style={thStyle}>Name</th>
                {user.role === 'admin' && <th style={thStyle}>Instructor</th>}
                <th style={thStyle}>Start Date</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}></th>
              </tr>
            </thead>
            <tbody>
              {trainees.length === 0 ? (
                <tr><td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: '#8795a8' }}>No trainees yet</td></tr>
              ) : (
                trainees.map(t => (
                  <tr key={t.id} style={{ borderBottom: '1px solid #dde3eb' }}>
                    <td style={tdStyle}>
                      <strong>{t.trainee_name}</strong>
                      <div style={{ fontSize: '0.78rem', color: '#8795a8' }}>{t.trainee_email}</div>
                    </td>
                    {user.role === 'admin' && (
                      <td style={tdStyle}>{t.instructor_name || <span style={{ color: '#8795a8' }}>Unassigned</span>}</td>
                    )}
                    <td style={{ ...tdStyle, fontFamily: 'Source Code Pro, monospace', fontSize: '0.8rem' }}>{t.start_date || '—'}</td>
                    <td style={tdStyle}><StatusBadge status={t.status} /></td>
                    <td style={tdStyle}>
                      <button onClick={() => { setSelectedTrainee(t.id); setCurrentPage('profile') }} style={{
                        background: 'transparent', border: '1px solid #dde3eb', borderRadius: '6px',
                        padding: '6px 12px', fontSize: '0.8rem', cursor: 'pointer',
                        fontFamily: 'Source Sans 3, sans-serif', color: '#4a5568'
                      }}>View →</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Trainee Modal */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 200, padding: '20px'
        }}>
          <div style={{
            background: '#fff', borderRadius: '12px', padding: '28px',
            width: '100%', maxWidth: '440px',
            boxShadow: '0 12px 32px rgba(26,46,74,0.14)'
          }}>
            <h3 style={{ fontFamily: 'Libre Baskerville, serif', fontSize: '1.2rem', color: '#1a2e4a', marginBottom: '20px' }}>Add New Trainee</h3>

            {error && (
              <div style={{ background: '#fdecea', border: '1px solid #fca5a5', borderRadius: '8px', padding: '10px 14px', color: '#c0392b', fontSize: '0.875rem', marginBottom: '16px' }}>{error}</div>
            )}

            {[
              { label: 'Full Name', key: 'name', type: 'text' },
              { label: 'Email', key: 'email', type: 'email' },
              { label: 'Temporary Password', key: 'password', type: 'password' },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontFamily: 'Source Code Pro, monospace', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#8795a8', marginBottom: '5px' }}>{f.label}</label>
                <input
                  type={f.type}
                  value={form[f.key]}
                  onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #dde3eb', borderRadius: '7px', fontSize: '0.875rem', fontFamily: 'Source Sans 3, sans-serif', outline: 'none' }}
                />
              </div>
            ))}

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontFamily: 'Source Code Pro, monospace', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#8795a8', marginBottom: '5px' }}>Assign Instructor</label>
              <select value={form.instructor_id} onChange={e => setForm({ ...form, instructor_id: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', border: '1px solid #dde3eb', borderRadius: '7px', fontSize: '0.875rem', fontFamily: 'Source Sans 3, sans-serif', outline: 'none' }}>
                <option value="">— Unassigned —</option>
                {instructors.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontFamily: 'Source Code Pro, monospace', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#8795a8', marginBottom: '5px' }}>Start Date</label>
              <input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', border: '1px solid #dde3eb', borderRadius: '7px', fontSize: '0.875rem', fontFamily: 'Source Sans 3, sans-serif', outline: 'none' }} />
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => { setShowModal(false); setError('') }} style={{
                background: 'transparent', border: '1px solid #dde3eb', borderRadius: '8px',
                padding: '9px 18px', fontSize: '0.875rem', cursor: 'pointer',
                fontFamily: 'Source Sans 3, sans-serif', color: '#4a5568'
              }}>Cancel</button>
              <button onClick={submitAddTrainee} style={{
                background: '#0d7a6e', color: '#fff', border: 'none', borderRadius: '8px',
                padding: '9px 18px', fontSize: '0.875rem', fontWeight: '500', cursor: 'pointer',
                fontFamily: 'Source Sans 3, sans-serif'
              }}>Add Trainee</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const thStyle = {
  textAlign: 'left', fontFamily: 'Source Code Pro, monospace', fontSize: '0.65rem',
  textTransform: 'uppercase', letterSpacing: '0.1em', color: '#8795a8',
  padding: '10px 16px', borderBottom: '1px solid #dde3eb', whiteSpace: 'nowrap',
}

const tdStyle = {
  padding: '13px 16px', fontSize: '0.875rem', color: '#1a2332', verticalAlign: 'middle',
}

export default Trainees