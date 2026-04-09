import { useState, useEffect } from 'react'
import api from '../utils/api'

function ScoreChip({ score }) {
  if (score === null) return (
    <span style={{ background: '#f4f6f9', border: '1px solid #dde3eb', color: '#8795a8', padding: '3px 10px', borderRadius: '6px', fontSize: '0.85rem', fontFamily: 'Libre Baskerville, serif' }}>—</span>
  )
  const style = score >= 5
    ? { bg: '#dcfce7', border: '#86efac', color: '#166534' }
    : score >= 3
    ? { bg: '#fef3c7', border: '#fcd34d', color: '#d97706' }
    : { bg: '#fdecea', border: '#fca5a5', color: '#c0392b' }
  return (
    <span style={{ background: style.bg, border: `1px solid ${style.border}`, color: style.color, padding: '3px 10px', borderRadius: '6px', fontSize: '0.85rem', fontFamily: 'Libre Baskerville, serif', fontWeight: '700' }}>{score}</span>
  )
}

function TraineeProfile({ traineeId, user, setCurrentPage }) {
  const [trainee, setTrainee] = useState(null)
  const [skillData, setSkillData] = useState(null)
  const [notes, setNotes] = useState([])
  const [callLogs, setCallLogs] = useState([])
  const [callTypes, setCallTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [newNote, setNewNote] = useState('')
  const [addingNote, setAddingNote] = useState(false)
  const [evaluating, setEvaluating] = useState(null)
  const [evalScore, setEvalScore] = useState(null)
  const [evalNote, setEvalNote] = useState('')
  const [showCallModal, setShowCallModal] = useState(false)
  const [callForm, setCallForm] = useState({ call_date: '', call_type: '', supervisor: '', notes: '' })
  const [showEditModal, setShowEditModal] = useState(false)
  const [editForm, setEditForm] = useState({})
  const [instructors, setInstructors] = useState([])

  const canEdit = user.role === 'admin' || user.role === 'instructor'

  useEffect(() => {
    if (traineeId) loadAll()
  }, [traineeId])

  const loadAll = async () => {
    try {
      const [tRes, skRes, nRes, clRes, ctRes] = await Promise.all([
        api.get(`/trainees/${traineeId}`),
        api.get(`/skills/trainee/${traineeId}`),
        api.get(`/trainees/${traineeId}/notes`),
        api.get(`/calllogs/trainee/${traineeId}`),
        api.get(`/calllogs/types`),
      ])
      setTrainee(tRes.data)
      setSkillData(skRes.data)
      setNotes(nRes.data)
      setCallLogs(clRes.data.logs)
      setCallTypes(ctRes.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const submitNote = async () => {
    if (!newNote.trim()) return
    try {
      await api.post(`/trainees/${traineeId}/notes`, { content: newNote })
      setNewNote('')
      setAddingNote(false)
      loadAll()
    } catch (e) {
      console.error(e)
    }
  }

  const submitEval = async (skillId) => {
    if (!evalScore) return
    try {
      await api.post('/skills/evaluate', {
        trainee_id: traineeId,
        skill_id: skillId,
        score: evalScore,
        notes: evalNote,
      })
      setEvaluating(null)
      setEvalScore(null)
      setEvalNote('')
      loadAll()
    } catch (e) {
      console.error(e)
    }
  }

  const submitCallLog = async () => {
    if (!callForm.call_date || !callForm.call_type) return
    try {
      await api.post(`/calllogs/trainee/${traineeId}`, callForm)
      setCallForm({ call_date: '', call_type: '', supervisor: '', notes: '' })
      setShowCallModal(false)
      loadAll()
    } catch (e) {
      console.error(e)
    }
  }

  const deleteCallLog = async (id) => {
    if (!confirm('Delete this call log entry?')) return
    try {
      await api.delete(`/calllogs/${id}`)
      loadAll()
    } catch (e) {
      console.error(e)
    }
  }

  const openEditModal = async () => {
    try {
      if (user.role === 'admin') {
        const res = await api.get('/users/instructors')
        setInstructors(res.data)
      }
      setEditForm({
        name: trainee.trainee_name,
        email: trainee.trainee_email,
        start_date: trainee.start_date || '',
        expected_end: trainee.expected_end || '',
        status: trainee.status,
        notes: trainee.notes || '',
        instructor_ids: trainee.instructors ? trainee.instructors.map(i => i.id) : [],
      })
      setShowEditModal(true)
    } catch (e) {
      console.error(e)
    }
  }

  const submitEdit = async () => {
    try {
      await api.put(`/trainees/${traineeId}`, {
        start_date: editForm.start_date || null,
        expected_end: editForm.expected_end || null,
        status: editForm.status,
        notes: editForm.notes,
        instructor_ids: editForm.instructor_ids,
        instructor_id: editForm.instructor_ids[0] || null,
      })
      await api.put(`/users/${trainee.user_id}`, {
        name: editForm.name,
        email: editForm.email,
      })
      setShowEditModal(false)
      loadAll()
    } catch (e) {
      console.error(e)
    }
  }

  const toggleInstructor = (id) => {
    const current = editForm.instructor_ids || []
    if (current.includes(id)) {
      setEditForm({ ...editForm, instructor_ids: current.filter(i => i !== id) })
    } else {
      setEditForm({ ...editForm, instructor_ids: [...current, id] })
    }
  }

  if (loading) return <div style={{ color: '#8795a8', padding: '40px 0' }}>Loading...</div>
  if (!trainee) return <div style={{ color: '#c0392b' }}>Trainee not found.</div>

  const { summary, thresholds } = skillData

  return (
    <div>
      {/* Back button + Edit button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
        <button onClick={() => setCurrentPage('trainees')} style={{
          background: 'none', border: 'none', color: '#8795a8', cursor: 'pointer',
          fontSize: '0.875rem', padding: '0', fontFamily: 'Source Sans 3, sans-serif'
        }}>← Back to Trainees</button>
        {canEdit && (
          <button onClick={openEditModal} style={{
            background: '#f4f6f9', border: '1px solid #dde3eb', borderRadius: '8px',
            padding: '7px 16px', fontSize: '0.8rem', cursor: 'pointer',
            fontFamily: 'Source Sans 3, sans-serif', color: '#4a5568', marginLeft: 'auto'
          }}>Edit Trainee</button>
        )}
      </div>

      {/* Profile hero */}
      <div style={{
        background: '#fff', border: '1px solid #dde3eb', borderRadius: '12px',
        padding: '24px', marginBottom: '20px',
        display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap',
        boxShadow: '0 1px 3px rgba(26,46,74,0.08)'
      }}>
        <div style={{
          width: '56px', height: '56px', borderRadius: '12px',
          background: '#1a2e4a', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'Libre Baskerville, serif', fontSize: '1.3rem', color: '#fff', flexShrink: 0
        }}>
          {trainee.trainee_name.split(' ').map(n => n[0]).join('')}
        </div>
        <div>
          <h2 style={{ fontFamily: 'Libre Baskerville, serif', fontSize: '1.2rem', color: '#1a2e4a' }}>{trainee.trainee_name}</h2>
          <p style={{ fontSize: '0.85rem', color: '#8795a8', marginTop: '2px' }}>
            {trainee.trainee_email} · Instructor: <strong>{trainee.instructor_name || 'Unassigned'}</strong>
          </p>
          {trainee.instructors && trainee.instructors.length > 0 && (
            <p style={{ fontSize: '0.8rem', color: '#8795a8', marginTop: '2px' }}>
              All instructors: {trainee.instructors.map(i => i.name).join(', ')}
            </p>
          )}
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
          {[
            { val: `${summary.percent}%`, label: 'Passed' },
            { val: summary.passed, label: 'Skills Done' },
            { val: summary.total - summary.passed, label: 'Remaining' },
            { val: callLogs.length, label: 'Patient Calls' },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'Libre Baskerville, serif', fontSize: '1.4rem', fontWeight: '700', color: '#1a2e4a' }}>{s.val}</div>
              <div style={{ fontSize: '0.7rem', color: '#8795a8', fontFamily: 'Source Code Pro, monospace', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

        {/* ── LEFT: Skills ── */}
        <div>
          <div style={{ background: '#fff', border: '1px solid #dde3eb', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(26,46,74,0.08)' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #dde3eb' }}>
              <div style={{ fontFamily: 'Libre Baskerville, serif', fontSize: '0.95rem', fontWeight: '700', color: '#1a2e4a' }}>Skills Checklist</div>
            </div>
            <div style={{ padding: '16px' }}>
              {skillData.categories.map(cat => (
                <div key={cat.id} style={{ marginBottom: '16px' }}>
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '10px 14px', background: '#f4f6f9',
                    border: '1px solid #dde3eb', borderRadius: '7px 7px 0 0'
                  }}>
                    <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1a2e4a' }}>{cat.name}</h4>
                    <span style={{ fontSize: '0.75rem', color: '#8795a8', fontFamily: 'Source Code Pro, monospace' }}>
                      {cat.skills.filter(s => s.passed).length}/{cat.skills.length}
                    </span>
                  </div>
                  <div style={{ border: '1px solid #dde3eb', borderTop: 'none', borderRadius: '0 0 7px 7px', overflow: 'hidden' }}>
                    {cat.skills.map(skill => (
                      <div key={skill.id}>
                        <div style={{
                          display: 'flex', alignItems: 'center', padding: '10px 14px',
                          borderBottom: '1px solid #dde3eb', gap: '10px',
                          background: evaluating === skill.id ? '#f8fafc' : '#fff'
                        }}>
                          <span style={{ flex: 1, fontSize: '0.875rem' }}>{skill.name}</span>
                          <ScoreChip score={skill.latest_score} />
                          {skill.evaluated_by_name && (
                            <span style={{ fontSize: '0.72rem', color: '#8795a8', fontFamily: 'Source Code Pro, monospace' }}>
                              {skill.evaluated_by_name.split(' ')[1]} · {new Date(skill.evaluated_at).toLocaleDateString()}
                            </span>
                          )}
                          {canEdit && evaluating !== skill.id && (
                            <button onClick={() => { setEvaluating(skill.id); setEvalScore(null); setEvalNote('') }} style={{
                              background: '#f4f6f9', border: '1px solid #dde3eb', borderRadius: '5px',
                              padding: '4px 10px', fontSize: '0.75rem', cursor: 'pointer',
                              fontFamily: 'Source Sans 3, sans-serif', color: '#4a5568'
                            }}>Rate</button>
                          )}
                        </div>

                        {evaluating === skill.id && (
                          <div style={{ padding: '12px 14px', background: '#f8fafc', borderBottom: '1px solid #dde3eb' }}>
                            <div style={{ fontSize: '0.8rem', color: '#4a5568', marginBottom: '8px' }}>Select score (1–7):</div>
                            <div style={{ display: 'flex', gap: '6px', marginBottom: '10px', flexWrap: 'wrap' }}>
                              {[1,2,3,4,5,6,7].map(n => {
                                const isSelected = evalScore === n
                                const scoreColor = n <= thresholds.alert
                                  ? { bg: '#fdecea', border: '#fca5a5', color: '#c0392b' }
                                  : n < thresholds.pass
                                  ? { bg: '#fef3c7', border: '#fcd34d', color: '#d97706' }
                                  : { bg: '#dcfce7', border: '#86efac', color: '#166534' }
                                return (
                                  <button key={n} onClick={() => setEvalScore(n)} style={{
                                    width: '34px', height: '34px', borderRadius: '6px',
                                    border: `1px solid ${isSelected ? scoreColor.border : '#dde3eb'}`,
                                    background: isSelected ? scoreColor.bg : '#fff',
                                    color: isSelected ? scoreColor.color : '#4a5568',
                                    fontFamily: 'Libre Baskerville, serif',
                                    fontWeight: '700', fontSize: '0.9rem', cursor: 'pointer',
                                  }}>{n}</button>
                                )
                              })}
                            </div>
                            <input
                              placeholder="Optional note..."
                              value={evalNote}
                              onChange={e => setEvalNote(e.target.value)}
                              style={{
                                width: '100%', padding: '7px 10px', border: '1px solid #dde3eb',
                                borderRadius: '6px', fontSize: '0.8rem', marginBottom: '8px',
                                fontFamily: 'Source Sans 3, sans-serif', outline: 'none'
                              }}
                            />
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button onClick={() => submitEval(skill.id)} disabled={!evalScore} style={{
                                background: evalScore ? '#0d7a6e' : '#dde3eb',
                                color: evalScore ? '#fff' : '#8795a8',
                                border: 'none', borderRadius: '6px', padding: '7px 16px',
                                fontSize: '0.8rem', cursor: evalScore ? 'pointer' : 'not-allowed',
                                fontFamily: 'Source Sans 3, sans-serif'
                              }}>Save Score</button>
                              <button onClick={() => setEvaluating(null)} style={{
                                background: 'transparent', border: '1px solid #dde3eb',
                                borderRadius: '6px', padding: '7px 16px', fontSize: '0.8rem',
                                cursor: 'pointer', fontFamily: 'Source Sans 3, sans-serif', color: '#4a5568'
                              }}>Cancel</button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT: Notes + Call Log ── */}
        <div>
          <div style={{ background: '#fff', border: '1px solid #dde3eb', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(26,46,74,0.08)', marginBottom: '20px' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #dde3eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontFamily: 'Libre Baskerville, serif', fontSize: '0.95rem', fontWeight: '700', color: '#1a2e4a' }}>Supervisor Notes</div>
              {canEdit && (
                <button onClick={() => setAddingNote(!addingNote)} style={{
                  background: '#f4f6f9', border: '1px solid #dde3eb', borderRadius: '6px',
                  padding: '6px 12px', fontSize: '0.8rem', cursor: 'pointer',
                  fontFamily: 'Source Sans 3, sans-serif', color: '#4a5568'
                }}>+ Add Note</button>
              )}
            </div>
            <div style={{ padding: '16px' }}>
              {addingNote && (
                <div style={{ marginBottom: '16px', padding: '14px', background: '#f8fafc', border: '1px solid #dde3eb', borderRadius: '8px' }}>
                  <textarea value={newNote} onChange={e => setNewNote(e.target.value)}
                    placeholder="Write your observation..." rows={3}
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid #dde3eb', borderRadius: '6px', fontSize: '0.875rem', resize: 'vertical', fontFamily: 'Source Sans 3, sans-serif', outline: 'none', marginBottom: '8px' }} />
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={submitNote} style={{ background: '#0d7a6e', color: '#fff', border: 'none', borderRadius: '6px', padding: '7px 16px', fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'Source Sans 3, sans-serif' }}>Save Note</button>
                    <button onClick={() => setAddingNote(false)} style={{ background: 'transparent', border: '1px solid #dde3eb', borderRadius: '6px', padding: '7px 16px', fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'Source Sans 3, sans-serif', color: '#4a5568' }}>Cancel</button>
                  </div>
                </div>
              )}
              {notes.length === 0 && !addingNote ? (
                <div style={{ textAlign: 'center', padding: '32px', color: '#8795a8', fontSize: '0.875rem' }}>No notes yet</div>
              ) : (
                notes.map(note => (
                  <div key={note.id} style={{ padding: '14px', background: '#f4f6f9', border: '1px solid #dde3eb', borderRadius: '8px', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#1a2e4a' }}>{note.author_name}</span>
                      <span style={{ fontSize: '0.72rem', color: '#8795a8', fontFamily: 'Source Code Pro, monospace' }}>{new Date(note.created_at).toLocaleDateString()}</span>
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#4a5568', lineHeight: '1.6' }}>{note.content}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div style={{ background: '#fff', border: '1px solid #dde3eb', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(26,46,74,0.08)' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #dde3eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontFamily: 'Libre Baskerville, serif', fontSize: '0.95rem', fontWeight: '700', color: '#1a2e4a' }}>
                Patient Calls <span style={{ fontFamily: 'Source Code Pro, monospace', fontSize: '0.8rem', color: '#8795a8', fontWeight: '400' }}>({callLogs.length} total)</span>
              </div>
              {canEdit && (
                <button onClick={() => setShowCallModal(true)} style={{ background: '#f4f6f9', border: '1px solid #dde3eb', borderRadius: '6px', padding: '6px 12px', fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'Source Sans 3, sans-serif', color: '#4a5568' }}>+ Log Call</button>
              )}
            </div>
            <div style={{ padding: '16px' }}>
              {callLogs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px', color: '#8795a8', fontSize: '0.875rem' }}>No calls logged yet</div>
              ) : (
                callLogs.map(log => (
                  <div key={log.id} style={{ padding: '12px', background: '#f4f6f9', border: '1px solid #dde3eb', borderRadius: '8px', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span style={{ background: '#e8edf5', border: '1px solid #c5d0e0', color: '#1a2e4a', padding: '2px 8px', borderRadius: '20px', fontSize: '0.72rem', fontFamily: 'Source Code Pro, monospace' }}>{log.call_type}</span>
                        <span style={{ fontSize: '0.78rem', color: '#8795a8', fontFamily: 'Source Code Pro, monospace' }}>{new Date(log.call_date).toLocaleDateString()}</span>
                      </div>
                      {canEdit && (
                        <button onClick={() => deleteCallLog(log.id)} style={{ background: 'transparent', border: 'none', color: '#8795a8', cursor: 'pointer', fontSize: '0.75rem', padding: '0' }}>✕</button>
                      )}
                    </div>
                    {log.supervisor && <div style={{ fontSize: '0.8rem', color: '#4a5568', marginBottom: '4px' }}>Supervisor: <strong>{log.supervisor}</strong></div>}
                    {log.notes && <div style={{ fontSize: '0.8rem', color: '#4a5568', lineHeight: '1.5' }}>{log.notes}</div>}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Call Modal */}
      {showCallModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '28px', width: '100%', maxWidth: '440px', boxShadow: '0 12px 32px rgba(26,46,74,0.14)' }}>
            <h3 style={{ fontFamily: 'Libre Baskerville, serif', fontSize: '1.2rem', color: '#1a2e4a', marginBottom: '20px' }}>Log Patient Call</h3>
            <div style={{ marginBottom: '14px' }}>
              <label style={labelStyle}>Date of Call</label>
              <input type="date" value={callForm.call_date} onChange={e => setCallForm({ ...callForm, call_date: e.target.value })} style={inputStyle} />
            </div>
            <div style={{ marginBottom: '14px' }}>
              <label style={labelStyle}>Call Type</label>
              <select value={callForm.call_type} onChange={e => setCallForm({ ...callForm, call_type: e.target.value })} style={inputStyle}>
                <option value="">— Select type —</option>
                {callTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: '14px' }}>
              <label style={labelStyle}>Supervisor Present</label>
              <input type="text" placeholder="Name of supervising paramedic..." value={callForm.supervisor} onChange={e => setCallForm({ ...callForm, supervisor: e.target.value })} style={inputStyle} />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>Notes</label>
              <textarea placeholder="Any observations or details..." value={callForm.notes} onChange={e => setCallForm({ ...callForm, notes: e.target.value })} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowCallModal(false)} style={{ background: 'transparent', border: '1px solid #dde3eb', borderRadius: '8px', padding: '9px 18px', fontSize: '0.875rem', cursor: 'pointer', fontFamily: 'Source Sans 3, sans-serif', color: '#4a5568' }}>Cancel</button>
              <button onClick={submitCallLog} disabled={!callForm.call_date || !callForm.call_type} style={{ background: callForm.call_date && callForm.call_type ? '#0d7a6e' : '#dde3eb', color: callForm.call_date && callForm.call_type ? '#fff' : '#8795a8', border: 'none', borderRadius: '8px', padding: '9px 18px', fontSize: '0.875rem', fontWeight: '500', cursor: callForm.call_date && callForm.call_type ? 'pointer' : 'not-allowed', fontFamily: 'Source Sans 3, sans-serif' }}>Save Call</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Trainee Modal */}
      {showEditModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '28px', width: '100%', maxWidth: '480px', boxShadow: '0 12px 32px rgba(26,46,74,0.14)', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ fontFamily: 'Libre Baskerville, serif', fontSize: '1.2rem', color: '#1a2e4a', marginBottom: '20px' }}>Edit Trainee</h3>

            <div style={{ marginBottom: '14px' }}>
              <label style={labelStyle}>Full Name</label>
              <input type="text" value={editForm.name || ''} onChange={e => setEditForm({ ...editForm, name: e.target.value })} style={inputStyle} />
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={labelStyle}>Email</label>
              <input type="email" value={editForm.email || ''} onChange={e => setEditForm({ ...editForm, email: e.target.value })} style={inputStyle} />
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={labelStyle}>Start Date</label>
              <input type="date" value={editForm.start_date || ''} onChange={e => setEditForm({ ...editForm, start_date: e.target.value })} style={inputStyle} />
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={labelStyle}>Expected End Date</label>
              <input type="date" value={editForm.expected_end || ''} onChange={e => setEditForm({ ...editForm, expected_end: e.target.value })} style={inputStyle} />
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={labelStyle}>Status</label>
              <select value={editForm.status || 'active'} onChange={e => setEditForm({ ...editForm, status: e.target.value })} style={inputStyle}>
                <option value="active">Active</option>
                <option value="on_hold">On Hold</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
              </select>
            </div>

            {user.role === 'admin' && instructors.length > 0 && (
              <div style={{ marginBottom: '14px' }}>
                <label style={labelStyle}>Assigned Instructors</label>
                <div style={{ border: '1px solid #dde3eb', borderRadius: '7px', overflow: 'hidden' }}>
                  {instructors.map(inst => (
                    <div key={inst.id} style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '10px 12px', borderBottom: '1px solid #dde3eb',
                      cursor: 'pointer',
                      background: editForm.instructor_ids?.includes(inst.id) ? '#f0fdf4' : '#fff'
                    }} onClick={() => toggleInstructor(inst.id)}>
                      <div style={{
                        width: '18px', height: '18px', borderRadius: '4px',
                        border: `2px solid ${editForm.instructor_ids?.includes(inst.id) ? '#16a34a' : '#dde3eb'}`,
                        background: editForm.instructor_ids?.includes(inst.id) ? '#16a34a' : '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                      }}>
                        {editForm.instructor_ids?.includes(inst.id) && <span style={{ color: '#fff', fontSize: '11px' }}>✓</span>}
                      </div>
                      <span style={{ fontSize: '0.875rem' }}>{inst.name}</span>
                      <span style={{ fontSize: '0.78rem', color: '#8795a8', marginLeft: 'auto' }}>{inst.email}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>Internal Notes</label>
              <textarea value={editForm.notes || ''} onChange={e => setEditForm({ ...editForm, notes: e.target.value })} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowEditModal(false)} style={{ background: 'transparent', border: '1px solid #dde3eb', borderRadius: '8px', padding: '9px 18px', fontSize: '0.875rem', cursor: 'pointer', fontFamily: 'Source Sans 3, sans-serif', color: '#4a5568' }}>Cancel</button>
              <button onClick={submitEdit} style={{ background: '#0d7a6e', color: '#fff', border: 'none', borderRadius: '8px', padding: '9px 18px', fontSize: '0.875rem', fontWeight: '500', cursor: 'pointer', fontFamily: 'Source Sans 3, sans-serif' }}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

const labelStyle = {
  display: 'block', fontSize: '0.75rem', fontFamily: 'Source Code Pro, monospace',
  textTransform: 'uppercase', letterSpacing: '0.08em', color: '#8795a8', marginBottom: '5px'
}

const inputStyle = {
  width: '100%', padding: '9px 12px', border: '1px solid #dde3eb',
  borderRadius: '7px', fontSize: '0.875rem', fontFamily: 'Source Sans 3, sans-serif', outline: 'none'
}

export default TraineeProfile