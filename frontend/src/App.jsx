import { useState, useEffect } from 'react'
import api from './utils/api'
import Login from './pages/Login'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import TraineeProfile from './pages/TraineeProfile'
import Notifications from './pages/Notifications'
import Trainees from './pages/Trainees'
import Users from './pages/Users'
import Settings from './pages/Settings'
import Skills from './pages/Skills'

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
      {currentPage === 'trainees' && <Trainees user={user} setCurrentPage={setCurrentPage} setSelectedTrainee={setSelectedTrainee} />}
      {currentPage === 'profile' && <TraineeProfile traineeId={selectedTrainee} user={user} setCurrentPage={setCurrentPage} />}
      {currentPage === 'notifications' && <Notifications />}
      {currentPage === 'users' && <Users />}
      {currentPage === 'settings' && <Settings user={user} />}
      {currentPage === 'skills' && <Skills />}
    </Layout>
  )
}

export default App