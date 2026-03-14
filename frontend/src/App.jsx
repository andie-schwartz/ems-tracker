import { useState, useEffect } from 'react'
import api from './utils/api'
import Login from './pages/Login'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import TraineeProfile from './pages/TraineeProfile'
import Notifications from './pages/Notifications'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [selectedTrainee, setSelectedTrainee] = useState(null)

  useEffect(() => {
    api.get('/auth/me')
      .then(res => setUser(res.data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div style={{padding:'40px',textAlign:'center'}}>Loading…</div>
  if (!user) return <Login setUser={setUser} />

  return (
    <Layout user={user} setUser={setUser} currentPage={currentPage} setCurrentPage={setCurrentPage}>
      {currentPage === 'dashboard' && <Dashboard user={user} setCurrentPage={setCurrentPage} setSelectedTrainee={setSelectedTrainee} />}
      {currentPage === 'trainees' && <div>Trainees page coming soon</div>}
      {currentPage === 'profile' && <TraineeProfile traineeId={selectedTrainee} user={user} setCurrentPage={setCurrentPage} />}
      {currentPage === 'notifications' && <Notifications />}
      {currentPage === 'users' && <div>Users page coming soon</div>}
      {currentPage === 'settings' && <div>Settings page coming soon</div>}
    </Layout>
  )
}

export default App