import { useState, useEffect } from 'react'
import api from '../utils/api'

function Users() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'instructor' })
  const [error, setError] = useState('')

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      const res = await api.get('/users')
      setUsers(res.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const submitAddUser = async () => {
    setError('')
    try {
      await api.post('/users', form)
      setShowModal(false)
      setForm({ name: '', email: '', password: '', role: 'instructor' })
      loadUsers()
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to create user.')
    }
  }

  const deleteUser = async (id, name) => {
    if (!confirm(`Delete user "${name}"? This cannot be undone.`)) return
    try {
      await api.delete(`/users/${id}`)
      loadUsers()
    } catch (e) {
      console.error(e)
    }
  }

  const roleBadge = (role) => {
    const styles = {
      admin:      { bg: '#e8edf5', border: '#c5d0e0', color: '#1a2e4a' },
      instructor: { bg: '#dcfce7', border: '#86efac', color: '#166534' },
      trainee:    { bg: '#fef3c7', border: '#fcd34d', color: '#d97706' },
    }
    const s = styles[role] || styles.trainee
    return (
      <span style={{
        background: s.bg, border: `1px solid ${s.border}`, color: s.color,
        padding: '3px 9px', borderRadius: '20px', fontSize: '0.72rem',
        fontFamily: 'Source Code Pro, monospace', letterSpacing: '0.04em'
      }}>{role}</span>
    )
  }

  if (loading) return <div style={{ color: '#8795a8', padding: '40px 0' }}>Loading...</div>

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontFamily: 'Libre Baskerville, serif', fontSize: '1.5rem', color: '#1a2e4a' }}>User Management</h1>
          <p style={{ color: '#8795a8', fontSize: '0.875rem', marginTop: '4px' }}>Manage all system accounts</p>
        </div>
        <button onClick={() => setShowModal(true)} style={{
          background: '#0d7a6e', color: '#fff', border: 'none', borderRadius: '8px',
          padding: '9px 18px', fontSize: '0.875rem', fontWeight: '500', cursor: 'pointer',
          fontFamily: 'Source Sans 3, sans-serif'
        }}>+ Add User</button>
      </div>

      <div style={{ background: '#fff', border: '1px solid #dde3eb', borderRadius: '12px', boxShadow: '0 1px 3px rgba(26,46,74,0.08)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f4f6f9' }}>
                <th style={thStyle}>Name</th>
                <th style={thStyle}>Email</th>
                <th style={thStyle}>Role</th>
                <th style={thStyle}>Created</th>
                <th style={thStyle}></th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid #dde3eb' }}>
                  <td style={tdStyle}><strong>{u.name}</strong></td>
                  <td style={{ ...tdStyle, color: '#8795a8', fontSize: '0.8rem' }}>{u.email}</td>
                  <td style={tdStyle}>{roleBadge(u.role)}</td>
                  <td style={{ ...tdStyle, fontFamily: 'Source Code Pro, monospace', fontSize: '0.78rem', color: '#8795a8' }}>
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td style={tdStyle}>
                    <button onClick={() => deleteUser(u.id, u.name)} style={{
                      background: '#fdecea', border: '1px solid #fca5a5', borderRadius: '6px',
                      padding: '5px 12px', fontSize: '0.78rem', cursor: 'pointer',
                      fontFamily: 'Source Sans 3, sans-serif', color: '#c0392b'
                    }}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
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
            <h3 style={{ fontFamily: 'Libre Baskerville, serif', fontSize: '1.2rem', color: '#1a2e4a', marginBottom: '20px' }}>Add New User</h3>

            {error && (
              <div style={{ background: '#fdecea', border: '1px solid #fca5a5', borderRadius: '8px', padding: '10px 14px', color: '#c0392b', fontSize: '0.875rem', marginBottom: '16px' }}>{error}</div>
            )}

            {[
              { label: 'Full Name', key: 'name', type: 'text' },
              { label: 'Email', key: 'email', type: 'email' },
              { label: 'Password', key: 'password', type: 'password' },
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

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontFamily: 'Source Code Pro, monospace', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#8795a8', marginBottom: '5px' }}>Role</label>
              <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', border: '1px solid #dde3eb', borderRadius: '7px', fontSize: '0.875rem', fontFamily: 'Source Sans 3, sans-serif', outline: 'none' }}>
                <option value="instructor">Instructor</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => { setShowModal(false); setError('') }} style={{
                background: 'transparent', border: '1px solid #dde3eb', borderRadius: '8px',
                padding: '9px 18px', fontSize: '0.875rem', cursor: 'pointer',
                fontFamily: 'Source Sans 3, sans-serif', color: '#4a5568'
              }}>Cancel</button>
              <button onClick={submitAddUser} style={{
                background: '#0d7a6e', color: '#fff', border: 'none', borderRadius: '8px',
                padding: '9px 18px', fontSize: '0.875rem', fontWeight: '500', cursor: 'pointer',
                fontFamily: 'Source Sans 3, sans-serif'
              }}>Create User</button>
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

export default Users