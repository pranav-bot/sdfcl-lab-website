import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'
// import './EditPage.css'

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY)

export default function ProjectsEditor() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [currentTable, setCurrentTable] = useState('ongoing_projects')

  const loadProjects = useCallback(async (table) => {
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase.from(table).select('*').order('created_at', { ascending: false })
      if (error) throw error
      const mapped = (data || []).map((r) => ({
        ...r,
        mainImageUrl: r?.main_image_path ? supabase.storage.from('assets').getPublicUrl(r.main_image_path).data.publicUrl : ''
      }))
      setProjects(Array.isArray(mapped) ? mapped : [])
    } catch (err) {
      setError(err.message || String(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadProjects(currentTable)
  }, [currentTable, loadProjects])

  function addEmpty() {
    setProjects((p) => [{ name: '', content: '', main_image_path: '', mainImageUrl: '', _new: true }, ...p])
  }

  function updateField(idx, field, value) {
    setProjects((prev) => {
      const copy = [...prev]
      copy[idx] = { ...copy[idx], [field]: value }
      return copy
    })
  }

  async function uploadMainImage(file, idx) {
    if (!file) return
    setError(null)
    try {
      const path = `ProjectPhotos/${Date.now()}_${file.name}`
      const { error } = await supabase.storage.from('assets').upload(path, file, { upsert: true })
      if (error) throw error
      const publicUrl = supabase.storage.from('assets').getPublicUrl(path).data.publicUrl
      setProjects((prev) => {
        const copy = [...prev]
        copy[idx] = { ...copy[idx], main_image_path: path, mainImageUrl: publicUrl }
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
        await loadProjects(currentTable)
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
        main_image_path: p.main_image_path || ''
      }
      if (p.id) payload.id = p.id
  const { error: upsertErr } = await supabase.from(currentTable).upsert(payload).select()
  if (upsertErr) throw upsertErr
      await loadProjects(currentTable)
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
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <input value={proj.name || ''} onChange={(e) => updateField(i, 'name', e.target.value)} placeholder="Name" style={{ width: '100%', padding: 8 }} />
                    <textarea value={proj.content || ''} onChange={(e) => updateField(i, 'content', e.target.value)} placeholder="Short description" rows={4} style={{ width: '100%', padding: 8, marginTop: 8 }} />
                    <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        {proj.mainImageUrl ? (
                          <img src={proj.mainImageUrl} alt="main" style={{ width: 120, height: 80, objectFit: 'cover', borderRadius: 6, border: '1px solid #e5e7eb' }} />
                        ) : (
                          <div style={{ width: 120, height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6', color: '#666', borderRadius: 6 }}>No image</div>
                        )}
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <label style={{ fontSize: 12, marginBottom: 4 }}>Main image</label>
                          <input type="file" accept="image/*" onChange={(e) => uploadMainImage(e.target.files?.[0], i)} />
                        </div>
                        <button onClick={() => setProjects(prev => { const copy = [...prev]; copy[i] = { ...copy[i], main_image_path: '', mainImageUrl: '' }; return copy })} style={{ padding: '6px 8px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 6 }}>Clear</button>
                      </div>
                      <div style={{ display: 'flex', gap: 8, marginLeft: 12, alignItems: 'center' }}>
                        <button onClick={() => saveProject(i)} disabled={saving} style={{ padding: '6px 10px' }}>{saving ? 'Saving...' : 'Save'}</button>
                        <button onClick={() => removeProject(i)} style={{ background: '#ef4444', color: '#fff', padding: '6px 10px' }}>Delete</button>
                      </div>
                    </div>
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
