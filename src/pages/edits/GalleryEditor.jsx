import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
// import '../EditPage.css'

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY)

export default function GalleryEditor() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
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
      setRows(prev => { const copy = [...prev]; copy[i] = { ...copy[i], src: path, preview: publicUrl }; return copy })
    } catch (err) { setError(err.message || String(err)) }
  }

  async function saveRow(i) {
    const r = rows[i]
    if (!r) return
    setSaving(true); setError(null)
    try {
      const payload = { src: r.src || '', caption: r.caption || '', category: r.category || '' }
      if (r.id) payload.id = r.id
      const { error } = await supabase.from('gallery').upsert(payload).select()
      if (error) throw error
      await loadGallery()
    } catch (err) { setError(err.message || String(err)) }
    finally { setSaving(false) }
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
      setRows(prev => prev.filter((_, idx) => idx !== i))
    }
  }

  return (
    <div style={{ padding: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3>Gallery Editor</h3>
        <div>
          <button onClick={addRow} style={{ marginRight: 8 }}>+ New</button>
          <button onClick={loadGallery}>Refresh</button>
        </div>
      </div>
      {loading ? <p>Loading gallery...</p> : error ? <p style={{ color: 'red' }}>{error}</p> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
          {rows.map((r, i) => (
            <div key={r.id ?? `new-${i}`} style={{ padding: 12, background: '#fff', borderRadius: 8, border: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <input value={r.caption || ''} onChange={(e) => updateField(i, 'caption', e.target.value)} placeholder="Caption" style={{ width: '100%', padding: 8 }} />
                  <input value={r.category || ''} onChange={(e) => updateField(i, 'category', e.target.value)} placeholder="Category" style={{ width: '100%', padding: 8, marginTop: 8 }} />
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <input type="file" accept="image/*" onChange={(e) => uploadImage(e.target.files?.[0], i)} />
                    <button onClick={() => saveRow(i)} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
                    <button onClick={() => deleteRow(i)} style={{ background: '#ef4444', color: '#fff' }}>Delete</button>
                  </div>
                </div>
                <div style={{ width: 180, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {r.preview ? <img src={r.preview} alt={r.caption} style={{ maxWidth: '100%', maxHeight: 120, objectFit: 'contain' }} /> : <div style={{ color: '#666' }}>No image</div>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
