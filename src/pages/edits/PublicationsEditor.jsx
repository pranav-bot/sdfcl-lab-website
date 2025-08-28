import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY)

function PublicationsEditor() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [publications, setPublications] = useState([])
  const [conferences, setConferences] = useState([])
  const [iac, setIac] = useState([])
  // Logos for publications (storage: Logos/Publications)
  const [logos, setLogos] = useState([])
  const [loadingLogos, setLoadingLogos] = useState(false)
  const [uploadingLogos, setUploadingLogos] = useState(false)
  const [logosError, setLogosError] = useState(null)

  async function loadAll() {
    setLoading(true)
    setError(null)
    try {
      const [pubRes, confRes, iacRes] = await Promise.all([
        supabase.from('publications').select('*').order('year', { ascending: false }),
        supabase.from('conferences').select('*').order('year', { ascending: false }),
        supabase.from('congress_presentations').select('*').order('year', { ascending: false }),
      ])
      if (pubRes.error) throw pubRes.error
      if (confRes.error) throw confRes.error
      if (iacRes.error) throw iacRes.error

      setPublications(Array.isArray(pubRes.data) ? pubRes.data : [])
      setConferences(Array.isArray(confRes.data) ? confRes.data : [])
      setIac(Array.isArray(iacRes.data) ? iacRes.data : [])
    } catch (err) {
      console.error('loadAll', err)
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
    loadLogos()
  }, [])

  async function loadLogos() {
    setLoadingLogos(true)
    setLogosError(null)
    try {
      const { data, error } = await supabase.storage.from('assets').list('Logos/Publications')
      if (error) throw error
      const urls = (data || []).map((f) => ({ name: f.name, url: supabase.storage.from('assets').getPublicUrl(`Logos/Publications/${f.name}`).data.publicUrl }))
      setLogos(urls)
    } catch (err) {
      console.error('loadLogos', err)
      setLogosError(String(err))
      setLogos([])
    } finally {
      setLoadingLogos(false)
    }
  }

  async function handleUploadLogos(files) {
    if (!files || files.length === 0) return
    setUploadingLogos(true)
    setLogosError(null)
    try {
      for (const file of Array.from(files)) {
        const path = `Logos/Publications/${file.name}`
        const { error } = await supabase.storage.from('assets').upload(path, file, { upsert: true })
        if (error) throw error
      }
      await loadLogos()
    } catch (err) {
      console.error('handleUploadLogos', err)
      setLogosError(String(err))
    } finally {
      setUploadingLogos(false)
    }
  }

  async function handleDeleteLogo(name) {
    if (!name) return
    if (!confirm(`Delete logo ${name}? This will remove the file from the storage bucket.`)) return
    setLogosError(null)
    try {
      const { error } = await supabase.storage.from('assets').remove([`Logos/Publications/${name}`])
      if (error) throw error
      await loadLogos()
    } catch (err) {
      console.error('handleDeleteLogo', err)
      setLogosError(String(err))
    }
  }

  // Generic save (upsert) for a table
  async function saveRow(table, row) {
    setError(null)
    try {
      const payload = { ...row }
      // remove local helpers if present
      delete payload.__local
  const res = await supabase.from(table).upsert(payload).select()
  if (res.error) throw res.error
      await loadAll()
    } catch (err) {
      console.error('saveRow', err)
      setError(String(err))
    }
  }

  async function deleteRow(table, row) {
    setError(null)
    try {
      if (!row.id) {
        // local-only, just remove
        if (table === 'publications') setPublications(prev => prev.filter(r => r !== row))
        if (table === 'conferences') setConferences(prev => prev.filter(r => r !== row))
        if (table === 'congress_presentations') setIac(prev => prev.filter(r => r !== row))
        return
      }
      const { error } = await supabase.from(table).delete().eq('id', row.id)
      if (error) throw error
      await loadAll()
    } catch (err) {
      console.error('deleteRow', err)
      setError(String(err))
    }
  }

  function addRow(table) {
    const baseYear = new Date().getFullYear()
    if (table === 'publications') setPublications(prev => [...prev, { authors: '', title: '', journal: '', status: '', year: baseYear }])
    if (table === 'conferences') setConferences(prev => [...prev, { authors: '', title: '', conference: '', location: '', date: '', status: '', year: baseYear }])
    if (table === 'congress_presentations') setIac(prev => [...prev, { authors: '', title: '', event: '', location: '', dates: '', year: baseYear }])
  }

  if (loading) return <div style={{ padding: 12 }}>Loading publications editor...</div>

  return (
    <div style={{ padding: 12 }}>
      <h3>Publications Editor</h3>
      {error && <div style={{ color: 'salmon' }}>{error}</div>}

      <section style={{ marginTop: 12 }}>
        <h4>Journals</h4>
        {publications.map((r, i) => (
          <div key={r.id || i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'flex-start' }}>
            <input placeholder="Authors" value={r.authors || ''} onChange={e => setPublications(prev => prev.map((p,idx) => idx === i ? { ...p, authors: e.target.value } : p))} style={{ flex: 2 }} />
            <input placeholder="Title" value={r.title || ''} onChange={e => setPublications(prev => prev.map((p,idx) => idx === i ? { ...p, title: e.target.value } : p))} style={{ flex: 3 }} />
            <input placeholder="Journal" value={r.journal || ''} onChange={e => setPublications(prev => prev.map((p,idx) => idx === i ? { ...p, journal: e.target.value } : p))} style={{ flex: 2 }} />
            <input placeholder="Status" value={r.status || ''} onChange={e => setPublications(prev => prev.map((p,idx) => idx === i ? { ...p, status: e.target.value } : p))} style={{ width: 140 }} />
            <input placeholder="Year" value={r.year || ''} onChange={e => setPublications(prev => prev.map((p,idx) => idx === i ? { ...p, year: e.target.value } : p))} style={{ width: 100 }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <button onClick={() => saveRow('publications', r)}>Save</button>
              <button onClick={() => deleteRow('publications', r)}>Delete</button>
            </div>
          </div>
        ))}
        <div>
          <button onClick={() => addRow('publications')}>Add Journal</button>
        </div>
      </section>

      <section style={{ marginTop: 16 }}>
        <h4>Publication Logos (Logos/Publications)</h4>
        <div style={{ marginBottom: 8 }}>
          <input type="file" accept="image/*" multiple onChange={(e) => handleUploadLogos(e.target.files)} />
          <div style={{ marginTop: 8 }}>{uploadingLogos ? <small>Uploading logos...</small> : <small style={{ color: '#666' }}>Upload images to <code>Logos/Publications/</code>. Existing files with the same name will be replaced.</small>}</div>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {loadingLogos ? (
            <div>Loading logos...</div>
          ) : logos.length === 0 ? (
            <div>No logos found in <code>Logos/Publications/</code></div>
          ) : (
            logos.map(l => (
              <div key={l.name} style={{ width: 160, border: '1px solid #eee', padding: 8, borderRadius: 6 }}>
                <img src={l.url} alt={l.name} style={{ width: '100%', height: 80, objectFit: 'contain' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                  <small style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.name}</small>
                  <button onClick={() => handleDeleteLogo(l.name)} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: 6 }}>Delete</button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section style={{ marginTop: 16 }}>
        <h4>IAC (Congress Presentations)</h4>
        {iac.map((r, i) => (
          <div key={r.id || i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'flex-start' }}>
            <input placeholder="Authors" value={r.authors || ''} onChange={e => setIac(prev => prev.map((p,idx) => idx === i ? { ...p, authors: e.target.value } : p))} style={{ flex: 2 }} />
            <input placeholder="Title" value={r.title || ''} onChange={e => setIac(prev => prev.map((p,idx) => idx === i ? { ...p, title: e.target.value } : p))} style={{ flex: 3 }} />
            <input placeholder="Event" value={r.event || ''} onChange={e => setIac(prev => prev.map((p,idx) => idx === i ? { ...p, event: e.target.value } : p))} style={{ flex: 2 }} />
            <input placeholder="Location" value={r.location || ''} onChange={e => setIac(prev => prev.map((p,idx) => idx === i ? { ...p, location: e.target.value } : p))} style={{ width: 160 }} />
            <input placeholder="Dates" value={r.dates || ''} onChange={e => setIac(prev => prev.map((p,idx) => idx === i ? { ...p, dates: e.target.value } : p))} style={{ width: 140 }} />
            <input placeholder="Year" value={r.year || ''} onChange={e => setIac(prev => prev.map((p,idx) => idx === i ? { ...p, year: e.target.value } : p))} style={{ width: 100 }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <button onClick={() => saveRow('congress_presentations', r)}>Save</button>
              <button onClick={() => deleteRow('congress_presentations', r)}>Delete</button>
            </div>
          </div>
        ))}
        <div>
          <button onClick={() => addRow('congress_presentations')}>Add IAC Row</button>
        </div>
      </section>

      <section style={{ marginTop: 16 }}>
        <h4>Conferences</h4>
        {conferences.map((r, i) => (
          <div key={r.id || i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'flex-start' }}>
            <input placeholder="Authors" value={r.authors || ''} onChange={e => setConferences(prev => prev.map((p,idx) => idx === i ? { ...p, authors: e.target.value } : p))} style={{ flex: 2 }} />
            <input placeholder="Title" value={r.title || ''} onChange={e => setConferences(prev => prev.map((p,idx) => idx === i ? { ...p, title: e.target.value } : p))} style={{ flex: 3 }} />
            <input placeholder="Conference" value={r.conference || ''} onChange={e => setConferences(prev => prev.map((p,idx) => idx === i ? { ...p, conference: e.target.value } : p))} style={{ flex: 2 }} />
            <input placeholder="Location" value={r.location || ''} onChange={e => setConferences(prev => prev.map((p,idx) => idx === i ? { ...p, location: e.target.value } : p))} style={{ width: 160 }} />
            <input placeholder="Date" value={r.date || ''} onChange={e => setConferences(prev => prev.map((p,idx) => idx === i ? { ...p, date: e.target.value } : p))} style={{ width: 140 }} />
            <input placeholder="Year" value={r.year || ''} onChange={e => setConferences(prev => prev.map((p,idx) => idx === i ? { ...p, year: e.target.value } : p))} style={{ width: 100 }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <button onClick={() => saveRow('conferences', r)}>Save</button>
              <button onClick={() => deleteRow('conferences', r)}>Delete</button>
            </div>
          </div>
        ))}
        <div>
          <button onClick={() => addRow('conferences')}>Add Conference</button>
        </div>
      </section>
    </div>
  )
}

export default PublicationsEditor
