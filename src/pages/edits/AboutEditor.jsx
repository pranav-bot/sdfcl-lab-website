import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY)

// Simple editor for About page content. Stores a single row in `about_page`.
export default function AboutEditor() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const [row, setRow] = useState(null)
  const [title, setTitle] = useState('')
  const [intro, setIntro] = useState('')
  const [location, setLocation] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [mapSrc, setMapSrc] = useState('')

  useEffect(() => {
    let mounted = true
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await supabase.from('about_page').select('*').order('created_at', { ascending: false }).limit(1)
        if (!mounted) return
        if (res.error) throw res.error
        const r = Array.isArray(res.data) && res.data.length > 0 ? res.data[0] : null
        if (r) {
          setRow(r)
          setTitle(r.title || '')
          setIntro(r.intro || r.content || '')
          setLocation(r.location || '')
          setContactEmail(r.contact_email || '')
          setContactPhone(r.contact_phone || '')
          setMapSrc(r.map_src || r.map || '')
        }
      } catch (err) {
        console.error('AboutEditor load', err)
        if (mounted) setError(String(err))
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      const payload = {
        title: title || null,
        intro: intro || null,
        location: location || null,
        contact_email: contactEmail || null,
        contact_phone: contactPhone || null,
        map_src: mapSrc || null
      }
      if (row && row.id) payload.id = row.id
      const { data, error } = await supabase.from('about_page').upsert(payload).select()
      if (error) throw error
      const newRow = Array.isArray(data) && data.length > 0 ? data[0] : null
      setRow(newRow)
    } catch (err) {
      console.error('AboutEditor save', err)
      setError(String(err))
    } finally {
      setSaving(false)
    }
  }

  async function handleReset() {
    setError(null)
    setLoading(true)
    try {
      const res = await supabase.from('about_page').select('*').order('created_at', { ascending: false }).limit(1)
      if (res.error) throw res.error
      const r = Array.isArray(res.data) && res.data.length > 0 ? res.data[0] : null
      setRow(r)
      setTitle(r?.title || '')
      setIntro(r?.intro || r?.content || '')
      setLocation(r?.location || '')
      setContactEmail(r?.contact_email || '')
      setContactPhone(r?.contact_phone || '')
      setMapSrc(r?.map_src || r?.map || '')
    } catch (err) {
      console.error('AboutEditor reset', err)
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div style={{ padding: 12 }}>Loading About editor...</div>

  return (
    <div style={{ padding: 16, maxWidth: 900, margin: '0 auto' }}>
      <h3 style={{ marginBottom: 12 }}>About Page Editor</h3>
      {error && <div style={{ color: 'salmon', marginBottom: 12 }}>{error}</div>}

      <div style={{ display: 'grid', gap: 12 }}>
        <div>
          <label style={{ display: 'block', marginBottom: 6 }}>Page Title</label>
          <input value={title} onChange={e => setTitle(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6edf0' }} />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: 6 }}>Intro / Paragraph</label>
          <textarea value={intro} onChange={e => setIntro(e.target.value)} rows={5} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6edf0' }} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 6 }}>Location (address)</label>
            <input value={location} onChange={e => setLocation(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6edf0' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 6 }}>Contact Email</label>
            <input value={contactEmail} onChange={e => setContactEmail(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6edf0' }} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 6 }}>Contact Phone</label>
            <input value={contactPhone} onChange={e => setContactPhone(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6edf0' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 6 }}>Map Iframe Src</label>
            <input value={mapSrc} onChange={e => setMapSrc(e.target.value)} placeholder="iframe src URL" style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e6edf0' }} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={handleSave} disabled={saving} style={{ padding: '8px 12px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6 }}>{saving ? 'Saving...' : 'Save'}</button>
          <button onClick={handleReset} style={{ padding: '8px 12px', background: '#fff', border: '1px solid #d1d5db', borderRadius: 6 }}>Reset</button>
        </div>
      </div>
    </div>
  )
}
