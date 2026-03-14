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
  const [loading, setLoading] = useState(true)
  const [newNote, setNewNote] = useState('')
  const [addingNote, setAddingNote] = useState(false)
  const [evaluating, setEvaluating] = useState(null)
  const [evalScore, setEvalScore] = useState(null)
  const [evalNote, setEvalNote] = useState('')

  const canEdit = user.role === 'admin' || user.role === 'instructor'

  useEffect(() => {
    if (traineeId) loadAll()
  }, [traineeId])

  const loadAll = async () => {
    try {
      const [tRes, skRes, nRes] = await Promise.all([
        api.get(`/trainees/${traineeId}`),
        api.get(`/skills/trainee/${traineeId}`),
        api.get(`/trainees/${traineeId}/notes`),
      ])
      setTrainee(tRes.data)
      setSkillData(skRes.data)
      setNotes(nRes.data)
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

  if (loading) return <div style={{ color: '#8795a8', padding: '40px 0' }}>Loading...</div>
  if (!trainee) return <div style={{ color: '#c0392b' }}>Trainee not found.</div>

  const { summary, thresholds } = skillData

  return (
    <div>
      {/* Back button */}
      <button onClick={() => setCurrentPage('trainees')} style={{
        background: 'none', border: 'none', color: '#8795a8', cursor: 'pointer',
        fontSize: '0.875rem', marginBottom: '16px', padding: '0',
        fontFamily: 'Source Sans 3, sans-serif'
      }}>← Back to Trainees</button>

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
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
          {[
            { val: `${summary.percent}%`, label: 'Passed' },
            { val: summary.passed, label: 'Skills Done' },
            { val: summary.total - summary.passed, label: 'Remaining' },
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

                        {/* Score selector */}
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

        {/* ── RIGHT: Notes ── */}
        <div>
          <div style={{ background: '#fff', border: '1px solid #dde3eb', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(26,46,74,0.08)' }}>
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
                  <textarea
                    value={newNote}
                    onChange={e => setNewNote(e.target.value)}
                    placeholder="Write your observation..."
                    rows={3}
                    style={{
                      width: '100%', padding: '8px 10px', border: '1px solid #dde3eb',
                      borderRadius: '6px', fontSize: '0.875rem', resize: 'vertical',
                      fontFamily: 'Source Sans 3, sans-serif', outline: 'none', marginBottom: '8px'
                    }}
                  />
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={submitNote} style={{
                      background: '#0d7a6e', color: '#fff', border: 'none', borderRadius: '6px',
                      padding: '7px 16px', fontSize: '0.8rem', cursor: 'pointer',
                      fontFamily: 'Source Sans 3, sans-serif'
                    }}>Save Note</button>
                    <button onClick={() => setAddingNote(false)} style={{
                      background: 'transparent', border: '1px solid #dde3eb', borderRadius: '6px',
                      padding: '7px 16px', fontSize: '0.8rem', cursor: 'pointer',
                      fontFamily: 'Source Sans 3, sans-serif', color: '#4a5568'
                    }}>Cancel</button>
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
        </div>
      </div>
    </div>
  )
}

export default TraineeProfile