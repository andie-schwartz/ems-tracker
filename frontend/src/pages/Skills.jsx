import { useState, useEffect } from 'react'
import api from '../utils/api'

function Skills() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [newCatName, setNewCatName] = useState('')
  const [newSkills, setNewSkills] = useState({})
  const [expandedCat, setExpandedCat] = useState(null)

  useEffect(() => {
    loadSkills()
  }, [])

  const loadSkills = async () => {
    try {
      const res = await api.get('/skills')
      setCategories(res.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
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

  const totalSkills = categories.reduce((acc, c) => acc + c.skills.length, 0)

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontFamily: 'Libre Baskerville, serif', fontSize: '1.5rem', color: '#1a2e4a' }}>Skill Manager</h1>
          <p style={{ color: '#8795a8', fontSize: '0.875rem', marginTop: '4px' }}>
            {categories.length} categories · {totalSkills} skills
          </p>
        </div>
      </div>

      {/* Add Category */}
      <div style={{ background: '#fff', border: '1px solid #dde3eb', borderRadius: '12px', boxShadow: '0 1px 3px rgba(26,46,74,0.08)', marginBottom: '20px', padding: '20px' }}>
        <div style={{ fontFamily: 'Libre Baskerville, serif', fontSize: '0.95rem', fontWeight: '700', color: '#1a2e4a', marginBottom: '14px' }}>Add New Category</div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            placeholder="Category name e.g. Airway Management..."
            value={newCatName}
            onChange={e => setNewCatName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addCategory()}
            style={{ flex: 1, padding: '9px 12px', border: '1px solid #dde3eb', borderRadius: '7px', fontSize: '0.875rem', fontFamily: 'Source Sans 3, sans-serif', outline: 'none' }}
          />
          <button onClick={addCategory} style={{
            background: '#0d7a6e', color: '#fff', border: 'none', borderRadius: '7px',
            padding: '9px 18px', fontSize: '0.875rem', fontWeight: '500', cursor: 'pointer',
            fontFamily: 'Source Sans 3, sans-serif', whiteSpace: 'nowrap'
          }}>+ Add Category</button>
        </div>
      </div>

      {/* Categories */}
      <div style={{ background: '#fff', border: '1px solid #dde3eb', borderRadius: '12px', boxShadow: '0 1px 3px rgba(26,46,74,0.08)', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #dde3eb' }}>
          <div style={{ fontFamily: 'Libre Baskerville, serif', fontSize: '0.95rem', fontWeight: '700', color: '#1a2e4a' }}>All Categories & Skills</div>
        </div>
        <div style={{ padding: '16px 20px' }}>
          {categories.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#8795a8', fontSize: '0.875rem' }}>
              No categories yet — add one above
            </div>
          ) : (
            categories.map(cat => (
              <div key={cat.id} style={{ border: '1px solid #dde3eb', borderRadius: '8px', marginBottom: '12px', overflow: 'hidden' }}>

                {/* Category header */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 16px', background: '#f4f6f9', cursor: 'pointer'
                }} onClick={() => setExpandedCat(expandedCat === cat.id ? null : cat.id)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '0.75rem', color: '#8795a8' }}>{expandedCat === cat.id ? '▼' : '▶'}</span>
                    <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1a2e4a' }}>{cat.name}</h4>
                    <span style={{
                      background: '#e8edf5', border: '1px solid #c5d0e0', color: '#1a2e4a',
                      padding: '2px 8px', borderRadius: '20px', fontSize: '0.7rem',
                      fontFamily: 'Source Code Pro, monospace'
                    }}>{cat.skills.length} skills</span>
                  </div>
                  <button onClick={e => { e.stopPropagation(); deleteCategory(cat.id, cat.name) }} style={{
                    background: '#fdecea', border: '1px solid #fca5a5', borderRadius: '6px',
                    padding: '4px 12px', fontSize: '0.75rem', cursor: 'pointer',
                    fontFamily: 'Source Sans 3, sans-serif', color: '#c0392b'
                  }}>Delete Category</button>
                </div>

                {/* Skills */}
                {expandedCat === cat.id && (
                  <div>
                    {cat.skills.length === 0 ? (
                      <div style={{ padding: '16px', borderTop: '1px solid #dde3eb', color: '#8795a8', fontSize: '0.875rem', textAlign: 'center' }}>
                        No skills yet — add one below
                      </div>
                    ) : (
                      cat.skills.map(skill => (
                        <div key={skill.id} style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '11px 16px', borderTop: '1px solid #dde3eb',
                        }}>
                          <span style={{ fontSize: '0.875rem', color: '#1a2332' }}>{skill.name}</span>
                          <button onClick={() => deleteSkill(skill.id, skill.name)} style={{
                            background: 'transparent', border: '1px solid #dde3eb', borderRadius: '5px',
                            padding: '4px 12px', fontSize: '0.75rem', cursor: 'pointer',
                            fontFamily: 'Source Sans 3, sans-serif', color: '#8795a8'
                          }}>Remove</button>
                        </div>
                      ))
                    )}

                    {/* Add skill */}
                    <div style={{ padding: '12px 16px', borderTop: '1px solid #dde3eb', background: '#f8fafc', display: 'flex', gap: '8px' }}>
                      <input
                        placeholder="New skill name..."
                        value={newSkills[cat.id] || ''}
                        onChange={e => setNewSkills({ ...newSkills, [cat.id]: e.target.value })}
                        onKeyDown={e => e.key === 'Enter' && addSkill(cat.id)}
                        style={{ flex: 1, padding: '7px 10px', border: '1px solid #dde3eb', borderRadius: '6px', fontSize: '0.8rem', fontFamily: 'Source Sans 3, sans-serif', outline: 'none' }}
                      />
                      <button onClick={() => addSkill(cat.id)} style={{
                        background: '#0d7a6e', color: '#fff', border: 'none', borderRadius: '6px',
                        padding: '7px 16px', fontSize: '0.8rem', cursor: 'pointer',
                        fontFamily: 'Source Sans 3, sans-serif'
                      }}>+ Add Skill</button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default Skills