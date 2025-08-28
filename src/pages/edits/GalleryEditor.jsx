import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import './GalleryEditor.css'

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY)

export default function GalleryEditor() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savingIndex, setSavingIndex] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => { loadGallery() }, [])

  async function loadGallery() {
    setLoading(true); setError(null)
    try {
      const { data, error } = await supabase.from('gallery').select('*').order('created_at', { ascending: false })
      if (error) throw error
      const mapped = (data || []).map(r => ({ ...r, preview: r.src && r.src.startsWith('http') ? r.src : (r.src ? supabase.storage.from('assets').getPublicUrl(r.src).data.publicUrl : '') }))
      setRows(mapped)
    } catch (err) {
      setError(err.message || String(err))
    } finally { setLoading(false) }
  }

  function addRow() {
    setRows(prev => [{ src: '', caption: '', category: '', _new: true }, ...prev])
  }

  function getFileName(src) {
    if (!src) return ''
    try {
      return src.split('/').pop()
    } catch {
      return src
    }
  }

  function updateField(i, field, value) {
    setRows(prev => { const copy = [...prev]; copy[i] = { ...copy[i], [field]: value }; return copy })
  }

  async function uploadImage(file, i) {
    if (!file) return
    setError(null)
    try {
      const path = `Gallery/${file.name}`
      const { error } = await supabase.storage.from('assets').upload(path, file, { upsert: true })
      if (error) throw error
      const publicUrl = supabase.storage.from('assets').getPublicUrl(path).data.publicUrl
  setRows(prev => { const copy = [...prev]; copy[i] = { ...copy[i], src: path, preview: publicUrl, _fileName: file.name }; return copy })
    } catch (err) { setError(err.message || String(err)) }
  }

  async function saveRow(i) {
    const r = rows[i]
    if (!r) return
    setSaving(true); setSavingIndex(i); setError(null)
    try {
      const payload = { src: r.src || '', caption: r.caption || '', category: r.category || '' }
      if (r.id) payload.id = r.id
      const { error } = await supabase.from('gallery').upsert(payload).select()
      if (error) throw error
      await loadGallery()
    } catch (err) { setError(err.message || String(err)) }
    finally { setSaving(false); setSavingIndex(null) }
  }

  async function deleteRow(i) {
    const r = rows[i]
    if (!r) return
    if (r.id) {
      if (!confirm(`Delete gallery item "${r.caption || r.id}"?`)) return
      try {
        const { error } = await supabase.from('gallery').delete().eq('id', r.id)
        if (error) throw error
        await loadGallery()
      } catch (err) { setError(err.message || String(err)) }
    } else {
      // remove unsaved row without prompt
      setRows(prev => prev.filter((_, idx) => idx !== i))
    }
  }

  return (
    <div className="gallery-editor">
      <div className="ge-header">
        <h3>Gallery Editor</h3>
        <div className="ge-controls">
          <button className="btn" onClick={addRow}>+ New</button>
          <button className="btn btn-ghost" onClick={loadGallery}>Refresh</button>
        </div>
      </div>
      {loading ? <p>Loading gallery...</p> : error ? <p style={{ color: 'red' }}>{error}</p> : (
        <div className="ge-list">
          {rows.map((r, i) => (
            <div key={r.id ?? `new-${i}`} className="ge-card">
              <div className="ge-card-left">
                <input className="ge-input" value={r.caption || ''} onChange={(e) => updateField(i, 'caption', e.target.value)} placeholder="Caption" />
                <input className="ge-input" value={r.category || ''} onChange={(e) => updateField(i, 'category', e.target.value)} placeholder="Category" />

                <div className="ge-actions">
                  <label className="file-label">
                    <input className="file-input" type="file" accept="image/*" onChange={(e) => uploadImage(e.target.files?.[0], i)} />
                    <span>Upload</span>
                  </label>
                  <div className="file-name">{r._fileName || getFileName(r.src) || 'No file'}</div>
                  <button className="btn" onClick={() => saveRow(i)} disabled={saving && savingIndex !== i}>{savingIndex === i ? 'Saving...' : 'Save'}</button>
                  <button className="btn btn-danger" onClick={() => deleteRow(i)}>Delete</button>
                </div>
              </div>
              <div className="ge-card-right">
                {r.preview ? <img src={r.preview} alt={r.caption} className="ge-preview" /> : <div className="ge-noimg">No image</div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
