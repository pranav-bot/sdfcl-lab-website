import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'
import './OutreachEditor.css'

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY)

export default function OutreachEditor() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [query, setQuery] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase.from('outreach').select('*').order('created_at', { ascending: false })
      if (error) throw error
      const mapped = await Promise.all((data || []).map(async (r) => {
        const copy = { ...r }
        if (copy.photo && typeof copy.photo === 'string' && copy.photo.indexOf('http') !== 0) {
          try {
            const { data: urlData } = supabase.storage.from('assets').getPublicUrl(copy.photo)
            if (urlData?.publicUrl) copy.photo = urlData.publicUrl
          } catch (err) {
            // continue with path
            console.warn('resolve photo url error', err)
          }
        }
        return copy
      }))
      setItems(Array.isArray(mapped) ? mapped : [])
    } catch (err) {
      console.warn('load outreach error', err)
      setError(err.message || String(err))
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  function addEmpty() {
    setItems((p) => [{ title: '', content: '', photo: '', _new: true }, ...p])
  }

  function updateField(idx, field, value) {
    setItems((prev) => {
      const copy = [...prev]
      copy[idx] = { ...copy[idx], [field]: value }
      return copy
    })
  }

  async function uploadPhoto(file, idx) {
    if (!file) return
    setError(null)
    try {
      const path = `Outreach/${Date.now()}_${file.name}`
      const { error } = await supabase.storage.from('assets').upload(path, file, { upsert: true })
      if (error) throw error
      const publicUrl = supabase.storage.from('assets').getPublicUrl(path).data.publicUrl
      setItems((prev) => {
        const copy = [...prev]
        copy[idx] = { ...copy[idx], photo: publicUrl, photo_path: path }
        return copy
      })
    } catch (err) {
      setError(err.message || String(err))
    }
  }

  async function removeItem(idx) {
    const it = items[idx]
    if (!it) return
    if (it.id) {
      if (!confirm(`Delete outreach "${it.title || it.id}"?`)) return
      try {
        const { error } = await supabase.from('outreach').delete().eq('id', it.id)
        if (error) throw error
        await load()
      } catch (err) {
        setError(err.message || String(err))
      }
    } else {
      setItems((prev) => prev.filter((_, i) => i !== idx))
    }
  }

  async function saveItem(idx) {
    const it = items[idx]
    if (!it) return
    setSaving(true)
    setError(null)
    try {
      const payload = {
        title: it.title || '',
        content: it.content || '',
        photo: it.photo_path || (typeof it.photo === 'string' && it.photo.indexOf('http') !== 0 ? it.photo : (it.photo || ''))
      }
      // avoid inserting explicit id into identity column
      const hasId = !!it.id
      if (hasId) delete payload.id
      if (hasId) {
        const res = await supabase.from('outreach').update(payload).eq('id', it.id).select()
        if (res.error) throw res.error
      } else {  
        const res = await supabase.from('outreach').insert(payload).select()
        if (res.error) throw res.error
      }
      await load()
    } catch (err) {
      setError(err.message || String(err))
    } finally {
      setSaving(false)
    }
  }

  const filtered = items.filter(i => (i.title || '').toLowerCase().includes(query.toLowerCase()) || (i.content || '').toLowerCase().includes(query.toLowerCase()))

  return (
    <div style={{ display: 'flex', gap: 12 }}>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>Outreach Editor</h3>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input placeholder="Search..." value={query} onChange={(e) => setQuery(e.target.value)} style={{ padding: 6 }} />
            <button onClick={addEmpty}>+ New</button>
            <button onClick={() => load()}>Refresh</button>
          </div>
        </div>

        {loading ? <p>Loading outreach...</p> : error ? <p style={{ color: 'salmon' }}>{error}</p> : filtered.length === 0 ? (
          <div style={{ padding: 12, background: '#fff', borderRadius: 8 }}>
            <p style={{ color: '#666' }}>No outreach items found.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filtered.map((it, i) => (
              <div key={it.id ?? `new-${i}`} style={{ border: '1px solid #e5e7eb', padding: 12, borderRadius: 8, background: '#fff' }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ flex: 0, width: 220 }}>
                    {it.photo ? (
                      <img src={it.photo} alt={it.title} style={{ width: 220, height: 160, objectFit: 'cover', borderRadius: 8 }} />
                    ) : (
                      <div style={{ width: 220, height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6', color: '#666', borderRadius: 8 }}>No image</div>
                    )}
                    <div style={{ marginTop: 8 }}>
                      <label style={{ display: 'block', fontSize: 12, marginBottom: 6 }}>Photo</label>
                      <input type="file" accept="image/*" onChange={(e) => {
                        const f = e.target.files?.[0]
                        if (!f) return
                        uploadPhoto(f, i)
                      }} />
                    </div>
                  </div>

                  <div style={{ flex: 1 }}>
                    <input value={it.title || ''} onChange={(e) => updateField(i, 'title', e.target.value)} placeholder="Title" style={{ width: '100%', padding: 8 }} />
                    <textarea value={it.content || ''} onChange={(e) => updateField(i, 'content', e.target.value)} placeholder="Content" rows={5} style={{ width: '100%', padding: 8, marginTop: 8 }} />

                    <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center' }}>
                      <button onClick={() => saveItem(i)} disabled={saving} style={{ padding: '6px 10px' }}>{saving ? 'Saving...' : 'Save'}</button>
                      <button onClick={() => removeItem(i)} style={{ background: '#ef4444', color: '#fff', padding: '6px 10px' }}>Delete</button>
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
