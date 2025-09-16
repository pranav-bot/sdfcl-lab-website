import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import './CollaboratorsEditor.css'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

export default function CollaboratorsEditor() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [newItem, setNewItem] = useState({ name: '', title: '', content: '', photoFile: null })

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase.from('collaborators').select('*').order('name', { ascending: true })
      if (error) throw error
      const resolved = await Promise.all((Array.isArray(data) ? data : []).map(async (r) => {
        let photo = r.photo || ''
        if (photo && !photo.startsWith('http')) {
          try {
            const { data: urlData } = await supabase.storage.from('assets').getPublicUrl(photo)
            photo = urlData?.publicUrl || photo
          } catch {
            // keep original
          }
        }
        return { ...r, photo }
      }))
      setRows(resolved)
    } catch (err) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  function updateField(idx, field, value) {
    setRows(prev => {
      const copy = [...prev]
      copy[idx] = { ...copy[idx], [field]: value }
      return copy
    })
  }

  async function uploadFile(file, destName) {
    if (!file) return null
    const path = `Logos/Collaborators/${destName}`
    const { error } = await supabase.storage.from('assets').upload(path, file, { upsert: true })
    if (error) throw error
    const { data } = await supabase.storage.from('assets').getPublicUrl(path)
    return data?.publicUrl || path
  }

  async function saveRow(idx) {
    const r = rows[idx]
    if (!r) return
    if (!r.name?.trim()) { setError('Name required'); return }
    setSaving(true)
    try {
      let photoToSave = r.photo || ''
      // if there's a temporary file object stored on row (photoFile), upload it
      if (r.photoFile && r.photoFile instanceof File) {
        const dest = `${r.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${Date.now()}_${r.photoFile.name}`
        const url = await uploadFile(r.photoFile, dest)
        photoToSave = url
      }
      const payload = { name: r.name, title: r.title, content: r.content, photo: photoToSave }
      const hasId = !!r.id
      if (hasId) delete payload.id
      if (hasId) {
        const res = await supabase.from('collaborators').update(payload).eq('id', r.id)
        if (res.error) throw res.error
      } else {
        const res = await supabase.from('collaborators').insert(payload)
        if (res.error) throw res.error
      }
      await load()
    } catch (err) {
      setError(String(err))
    } finally {
      setSaving(false)
    }
  }

  async function deleteRow(idx) {
    const r = rows[idx]
    if (!r?.id) return
    if (!confirm(`Delete collaborator ${r.name}?`)) return
    setSaving(true)
    try {
      const { error } = await supabase.from('collaborators').delete().eq('id', r.id)
      if (error) throw error
      await load()
    } catch (err) {
      setError(String(err))
    } finally {
      setSaving(false)
    }
  }

  async function addNew() {
    if (!newItem.name?.trim()) { setError('Name required'); return }
    setSaving(true)
    try {
      let photo = ''
      if (newItem.photoFile) {
        const dest = `${newItem.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${Date.now()}_${newItem.photoFile.name}`
        photo = await uploadFile(newItem.photoFile, dest)
      }
      const payload = { name: newItem.name, title: newItem.title, content: newItem.content, photo }
      const { error } = await supabase.from('collaborators').insert(payload)
      if (error) throw error
      setNewItem({ name: '', title: '', content: '', photoFile: null })
      await load()
    } catch (err) {
      setError(String(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="collab-editor-container">
      <aside className="collab-editor-aside">
        <h4>Add Collaborator</h4>
        {error && <div style={{ color: 'red' }}>{error}</div>}
        <label className="collab-aside-note">Name</label>
        <input className="collab-input" value={newItem.name} onChange={e => setNewItem(s => ({ ...s, name: e.target.value }))} />
        <label className="collab-aside-note">Title</label>
        <input className="collab-input" value={newItem.title} onChange={e => setNewItem(s => ({ ...s, title: e.target.value }))} />
        <label className="collab-aside-note">Content</label>
        <textarea className="collab-textarea" value={newItem.content} onChange={e => setNewItem(s => ({ ...s, content: e.target.value }))} rows={4} />
        <label className="collab-aside-note">Photo (optional)</label>
        <input type="file" accept="image/*" onChange={e => setNewItem(s => ({ ...s, photoFile: e.target.files[0] }))} />
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button onClick={addNew} disabled={saving} className="collab-button save">{saving ? 'Saving...' : 'Add'}</button>
        </div>
      </aside>

      <div>
  <h3 style={{ color: '#fff' }}>Existing Collaborators</h3>
        {loading ? <div>Loading...</div> : null}
        {rows.length === 0 ? <div className="collab-small">No collaborators found.</div> : (
          <div className="collab-list">
            {rows.map((r, idx) => (
              <div key={r.id || idx} className="collab-row">
                <div className="collab-thumb">
                  {r.photo ? <img src={r.photo} alt={r.name} /> : <div style={{ color: '#999' }}>No image</div>}
                </div>
                <div className="collab-fields">
                  <input value={r.name || ''} onChange={e => updateField(idx, 'name', e.target.value)} style={{ fontWeight: 700 }} />
                  <input value={r.title || ''} onChange={e => updateField(idx, 'title', e.target.value)} />
                  <textarea value={r.content || ''} onChange={e => updateField(idx, 'content', e.target.value)} rows={2} />
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input type="file" accept="image/*" onChange={e => updateField(idx, 'photoFile', e.target.files[0])} />
                    <div className="collab-actions">
                      <button onClick={() => saveRow(idx)} disabled={saving} className="collab-button save">Save</button>
                      <button onClick={() => deleteRow(idx)} disabled={saving} className="collab-button delete">Delete</button>
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
