import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
// import './EditPage.css'

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY)

export default function ProjectsEditor() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [currentTable, setCurrentTable] = useState('ongoing_projects')

  useEffect(() => {
    loadProjects(currentTable)
  }, [currentTable])
  async function loadProjects(table) {
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase.from(table).select('*').order('created_at', { ascending: false })
      if (error) throw error
      // add image URL resolver
      const mapped = (data || []).map((r) => ({ ...r, imageUrl: r.image_path ? supabase.storage.from('assets').getPublicUrl(r.image_path).data.publicUrl : '' }))
      setProjects(Array.isArray(mapped) ? mapped : [])
    } catch (err) {
      setError(err.message || String(err))
    } finally {
      setLoading(false)
    }
  }

  function addEmpty() {
    setProjects((p) => [{ name: '', content: '', image_path: '', imageUrl: '', _new: true }, ...p])
  }

  function updateField(idx, field, value) {
    setProjects((prev) => {
      const copy = [...prev]
      copy[idx] = { ...copy[idx], [field]: value }
      return copy
    })
  }

  async function uploadImage(file, idx) {
    if (!file) return
    setError(null)
    try {
      const path = `ProjectPhotos/${file.name}`
      const { error } = await supabase.storage.from('assets').upload(path, file, { upsert: true })
      if (error) throw error
      // update project row locally
      setProjects((prev) => {
        const copy = [...prev]
        copy[idx] = { ...copy[idx], image_path: path, imageUrl: supabase.storage.from('assets').getPublicUrl(path).data.publicUrl }
        return copy
      })
    } catch (err) {
      setError(err.message || String(err))
    }
  }

  async function removeProject(idx) {
    const p = projects[idx]
    if (!p) return
    if (p.id) {
      if (!confirm(`Delete project "${p.name}" from database?`)) return
      try {
  const { error } = await supabase.from(currentTable).delete().eq('id', p.id)
        if (error) throw error
        await loadProjects()
      } catch (err) {
        setError(err.message || String(err))
      }
    } else {
      // just remove local
      setProjects((prev) => prev.filter((_, i) => i !== idx))
    }
  }

  async function saveProject(idx) {
    const p = projects[idx]
    if (!p) return
    setSaving(true)
    setError(null)
    try {
      const payload = {
        name: p.name || '',
        content: p.content || '',
        image_path: p.image_path || ''
      }
      if (p.id) payload.id = p.id
  const { error } = await supabase.from(currentTable).upsert(payload).select()
  if (error) throw error
      // refresh list
      await loadProjects()
    } catch (err) {
      setError(err.message || String(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ display: 'flex', gap: 12 }}>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>Projects Editor</h3>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div>
              <button onClick={() => setCurrentTable('ongoing_projects')} style={{ marginRight: 6, background: currentTable === 'ongoing_projects' ? '#2563eb' : undefined, color: currentTable === 'ongoing_projects' ? '#fff' : undefined }}>Ongoing</button>
              <button onClick={() => setCurrentTable('completed_projects')} style={{ marginRight: 8, background: currentTable === 'completed_projects' ? '#2563eb' : undefined, color: currentTable === 'completed_projects' ? '#fff' : undefined }}>Completed</button>
            </div>
            <button onClick={addEmpty} style={{ marginRight: 8 }}>+ New</button>
            <button onClick={() => loadProjects(currentTable)}>Refresh</button>
          </div>
        </div>
        {loading ? <p>Loading projects...</p> : error ? <p style={{ color: 'red' }}>{error}</p> : projects.length === 0 ? (
          <div style={{ padding: 12, background: '#fff', borderRadius: 8 }}>
            {currentTable === 'completed_projects' ? (
              <p style={{ color: '#666' }}>No completed projects found.</p>
            ) : (
              <p style={{ color: '#666' }}>No ongoing projects found.</p>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {projects.map((proj, i) => (
              <div key={proj.id ?? `new-${i}`} style={{ border: '1px solid #e5e7eb', padding: 12, borderRadius: 8, background: '#fff' }}>
                <div style={{ display: 'flex', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <input value={proj.name || ''} onChange={(e) => updateField(i, 'name', e.target.value)} placeholder="Name" style={{ width: '100%', padding: 8 }} />
                    <textarea value={proj.content || ''} onChange={(e) => updateField(i, 'content', e.target.value)} placeholder="Short description" rows={4} style={{ width: '100%', padding: 8, marginTop: 8 }} />
                    <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center' }}>
                      <input type="file" accept="image/*" onChange={(e) => uploadImage(e.target.files?.[0], i)} />
                      <button onClick={() => saveProject(i)} disabled={saving} style={{ padding: '6px 10px' }}>{saving ? 'Saving...' : 'Save'}</button>
                      <button onClick={() => removeProject(i)} style={{ background: '#ef4444', color: '#fff', padding: '6px 10px' }}>Delete</button>
                    </div>
                  </div>
                  <div style={{ width: 180, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {proj.imageUrl ? <img src={proj.imageUrl} alt={proj.name} style={{ maxWidth: '100%', maxHeight: 120, objectFit: 'contain' }} /> : <div style={{ color: '#666' }}>No image</div>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
