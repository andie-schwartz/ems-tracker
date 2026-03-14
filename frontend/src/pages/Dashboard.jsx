import { useState, useEffect } from 'react'
import api from '../utils/api'

function StatCard({ value, label, color, sub }) {
  return (
    <div style={{
      background: '#fff',
      border: '1px solid #dde3eb',
      borderTop: `3px solid ${color}`,
      borderRadius: '12px',
      padding: '18px 20px',
      boxShadow: '0 1px 3px rgba(26,46,74,0.08)',
    }}>
      <div style={{ fontFamily: 'Libre Baskerville, serif', fontSize: '2rem', fontWeight: '700', color: '#1a2e4a', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: '0.75rem', color: '#8795a8', marginTop: '5px', fontFamily: 'Source Code Pro, monospace', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
      {sub && <div style={{ fontSize: '0.78rem', color: '#8795a8', marginTop: '8px' }}>{sub}</div>}
    </div>
  )
}

function ProgressBar({ percent }) {
  const color = percent >= 75 ? '#16a34a' : percent >= 40 ? '#d97706' : '#c0392b'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <div style={{ flex: 1, height: '7px', background: '#f4f6f9', borderRadius: '4px', overflow: 'hidden', border: '1px solid #dde3eb', minWidth: '80px' }}>
        <div style={{ height: '100%', width: `${percent}%`, background: color, borderRadius: '4px', transition: 'width 0.5s ease' }} />
      </div>
      <span style={{ fontFamily: 'Source Code Pro, monospace', fontSize: '0.75rem', color: '#4a5568', width: '36px', textAlign: 'right' }}>{percent}%</span>
    </div>
  )
}

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

function Dashboard({ user, setCurrentPage, setSelectedTrainee }) {
  const [trainees, setTrainees] = useState([])
  const [progress, setProgress] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const res = await api.get('/trainees')
      setTrainees(res.data)

      // Load progress for each trainee
      const progressMap = {}
      await Promise.all(res.data.map(async t => {
        try {
          const sk = await api.get(`/skills/trainee/${t.id}`)
          progressMap[t.id] = sk.data.summary.percent
        } catch {
          progressMap[t.id] = 0
        }
      }))
      setProgress(progressMap)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const active    = trainees.filter(t => t.status === 'active').length
  const completed = trainees.filter(t => t.status === 'completed').length
  const flagged   = trainees.filter(t => (progress[t.id] || 0) < 30 && t.status === 'active').length

  if (loading) return <div style={{ color: '#8795a8', padding: '40px 0' }}>Loading...</div>

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontFamily: 'Libre Baskerville, serif', fontSize: '1.5rem', color: '#1a2e4a' }}>Dashboard</h1>
        <p style={{ color: '#8795a8', fontSize: '0.875rem', marginTop: '4px' }}>
          {user.role === 'trainee' ? 'Your training overview' : 'Overview sorted by start date'}
        </p>
      </div>

      {/* Stats */}
      {user.role !== 'trainee' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '14px', marginBottom: '24px' }}>
          <StatCard value={trainees.length} label="Total Trainees" color="#0d7a6e" />
          <StatCard value={active} label="Active" color="#16a34a" />
          <StatCard value={flagged} label="Flagged" color="#c0392b" sub="Low progress" />
          <StatCard value={completed} label="Completed" color="#1d4ed8" />
        </div>
      )}

      {/* Table */}
      <div style={{ background: '#fff', border: '1px solid #dde3eb', borderRadius: '12px', boxShadow: '0 1px 3px rgba(26,46,74,0.08)', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #dde3eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontFamily: 'Libre Baskerville, serif', fontSize: '0.95rem', fontWeight: '700', color: '#1a2e4a' }}>
            {user.role === 'instructor' ? 'My Trainees' : user.role === 'trainee' ? 'My Progress' : 'All Trainees'}
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f4f6f9' }}>
                <th style={thStyle}>Name</th>
                {user.role === 'admin' && <th style={thStyle}>Instructor</th>}
                <th style={thStyle}>Start Date</th>
                <th style={thStyle}>Progress</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}></th>
              </tr>
            </thead>
            <tbody>
              {trainees.length === 0 ? (
                <tr><td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: '#8795a8' }}>No trainees yet</td></tr>
              ) : (
                trainees.map(t => (
                  <tr key={t.id} style={{ borderBottom: '1px solid #dde3eb' }}>
                    <td style={tdStyle}>
                      <strong>{t.trainee_name}</strong>
                      <div style={{ fontSize: '0.78rem', color: '#8795a8' }}>{t.trainee_email}</div>
                    </td>
                    {user.role === 'admin' && <td style={tdStyle}>{t.instructor_name || <span style={{ color: '#8795a8' }}>Unassigned</span>}</td>}
                    <td style={{ ...tdStyle, fontFamily: 'Source Code Pro, monospace', fontSize: '0.8rem' }}>{t.start_date || '—'}</td>
                    <td style={{ ...tdStyle, minWidth: '140px' }}><ProgressBar percent={progress[t.id] || 0} /></td>
                    <td style={tdStyle}><StatusBadge status={t.status} /></td>
                    <td style={tdStyle}>
                      <button onClick={() => { setSelectedTrainee(t.id); setCurrentPage('profile') }} style={viewBtnStyle}>
                        View →
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

const thStyle = {
  textAlign: 'left',
  fontFamily: 'Source Code Pro, monospace',
  fontSize: '0.65rem',
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  color: '#8795a8',
  padding: '10px 16px',
  borderBottom: '1px solid #dde3eb',
  whiteSpace: 'nowrap',
}

const tdStyle = {
  padding: '13px 16px',
  fontSize: '0.875rem',
  color: '#1a2332',
  verticalAlign: 'middle',
}

const viewBtnStyle = {
  background: 'transparent',
  border: '1px solid #dde3eb',
  borderRadius: '6px',
  padding: '6px 12px',
  fontSize: '0.8rem',
  cursor: 'pointer',
  fontFamily: 'Source Sans 3, sans-serif',
  color: '#4a5568',
}

export default Dashboard