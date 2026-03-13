import { useState } from 'react'
import api from '../utils/api'

function Login({ setUser }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleLogin = async () => {
    setError('')
    try {
      const res = await api.post('/auth/login', { email, password })
      setUser(res.data.user)
    } catch (e) {
      setError(e.response?.data?.error || 'Login failed.')
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f4f6f9'
    }}>
      <div style={{
        background: '#fff',
        border: '1px solid #dde3eb',
        borderRadius: '12px',
        padding: '40px',
        width: '100%',
        maxWidth: '380px',
        boxShadow: '0 4px 12px rgba(26,46,74,0.10)'
      }}>
        <h1 style={{
          fontFamily: 'Libre Baskerville, serif',
          fontSize: '1.5rem',
          color: '#1a2e4a',
          marginBottom: '6px'
        }}>EMS Tracker</h1>
        <p style={{ color: '#8795a8', fontSize: '0.875rem', marginBottom: '28px' }}>
          Sign in to your account
        </p>

        {error && (
          <div style={{
            background: '#fdecea',
            border: '1px solid #fca5a5',
            borderRadius: '8px',
            padding: '10px 14px',
            color: '#c0392b',
            fontSize: '0.875rem',
            marginBottom: '16px'
          }}>{error}</div>
        )}

        <div style={{ marginBottom: '16px' }}>
          <label style={{
            display: 'block',
            fontSize: '0.75rem',
            fontFamily: 'Source Code Pro, monospace',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: '#8795a8',
            marginBottom: '6px'
          }}>Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@ems.local"
            style={{
              width: '100%',
              padding: '10px 14px',
              border: '1px solid #dde3eb',
              borderRadius: '8px',
              fontSize: '0.9rem',
              outline: 'none',
              fontFamily: 'Source Sans 3, sans-serif'
            }}
          />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{
            display: 'block',
            fontSize: '0.75rem',
            fontFamily: 'Source Code Pro, monospace',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: '#8795a8',
            marginBottom: '6px'
          }}>Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            style={{
              width: '100%',
              padding: '10px 14px',
              border: '1px solid #dde3eb',
              borderRadius: '8px',
              fontSize: '0.9rem',
              outline: 'none',
              fontFamily: 'Source Sans 3, sans-serif'
            }}
          />
        </div>

        <button
          onClick={handleLogin}
          style={{
            width: '100%',
            padding: '12px',
            background: '#0d7a6e',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '0.95rem',
            fontWeight: '500',
            cursor: 'pointer',
            fontFamily: 'Source Sans 3, sans-serif'
          }}
        >Sign in →</button>
      </div>
    </div>
  )
}

export default Login