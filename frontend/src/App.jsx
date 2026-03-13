import { useState, useEffect } from 'react'
import api from './utils/api'
import Login from './pages/Login'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/auth/me')
      .then(res => setUser(res.data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div style={{padding:'40px',textAlign:'center'}}>Loading…</div>

  if (!user) return <Login setUser={setUser} />

  return (
    <div>
      <h1>Welcome {user.name}!</h1>
      <p>Role: {user.role}</p>
      <button onClick={() => {
        api.post('/auth/logout').then(() => setUser(null))
      }}>Sign out</button>
    </div>
  )
}

export default App