import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY)

function TeamEditor() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // master card (single row)
  const [master, setMaster] = useState({ title: '', content: '', image: '', email: '', linkedinLink: '', googleScholarLink: '' })
  const [loadingMaster, setLoadingMaster] = useState(false)
  const [savingMaster, setSavingMaster] = useState(false)

  // current members
  const [phd, setPhd] = useState([])
  const [masters, setMasters] = useState([])
  const [interns, setInterns] = useState([])

  // alumni members
  const [alumniPhd, setAlumniPhd] = useState([])
  const [alumniMasters, setAlumniMasters] = useState([])
  const [alumniInterns, setAlumniInterns] = useState([])

  const [loadingLists, setLoadingLists] = useState(false)
  const [viewMode, setViewMode] = useState('current')

  useEffect(() => {
    let mounted = true
    ;(async () => {
      setError(null)
      setLoading(true)
      setLoadingMaster(true)
      setLoadingLists(true)
      try {
        const [masterRes, phdRes, mastersRes, internsRes, alumniPhdRes, alumniMastersRes, alumniInternsRes] = await Promise.all([
          supabase.from('master_card').select('*').order('id', { ascending: false }).limit(1),
          supabase.from('phd_students').select('*').order('id', { ascending: true }),
          supabase.from('masters_students').select('*').order('id', { ascending: true }),
          supabase.from('research_interns').select('*').order('id', { ascending: true }),
          supabase.from('alumini_phd_students').select('*').order('id', { ascending: true }),
          supabase.from('alumini_master_students').select('*').order('id', { ascending: true }),
          supabase.from('alumini_research_interns').select('*').order('id', { ascending: true }),
        ])

        if (!mounted) return

        if (masterRes?.error) throw masterRes.error
        if (phdRes?.error) throw phdRes.error
        if (mastersRes?.error) throw mastersRes.error
        if (internsRes?.error) throw internsRes.error

        setMaster((masterRes.data && masterRes.data[0]) ? {
          ...masterRes.data[0],
          image: mapImage(masterRes.data[0].image || masterRes.data[0].image_path || '')
        } : { title: '', content: '', image: '', email: '', linkedinLink: '', googleScholarLink: '' })

        setPhd((phdRes.data || []).map(r => ({ ...r, image: mapImage(r.image) })))
        setMasters((mastersRes.data || []).map(r => ({ ...r, image: mapImage(r.image) })))
        setInterns((internsRes.data || []).map(r => ({ ...r, image: mapImage(r.image) })))

        setAlumniPhd((alumniPhdRes.data || []).map(r => ({ ...r, image: mapImage(r.image) })))
        setAlumniMasters((alumniMastersRes.data || []).map(r => ({ ...r, image: mapImage(r.image) })))
        setAlumniInterns((alumniInternsRes.data || []).map(r => ({ ...r, image: mapImage(r.image) })))

      } catch (err) {
        console.error('TeamEditor load error', err)
        setError(err.message || String(err))
      } finally {
        if (mounted) {
          setLoading(false)
          setLoadingMaster(false)
          setLoadingLists(false)
        }
      }
    })()
    return () => { mounted = false }
  }, [])

  const mapImage = (img) => {
    if (!img) return ''
    if (img.startsWith('http') || img.startsWith('/')) return img
    return supabase.storage.from('assets').getPublicUrl(img).data.publicUrl
  }

  // loadAll was inlined into useEffect; no standalone function needed

  async function uploadImage(file, folder = 'LabMembers') {
    if (!file) return ''
    const filePath = `${folder}/${Date.now()}_${file.name}`
  const { error } = await supabase.storage.from('assets').upload(filePath, file, { upsert: true })
    if (error) {
      console.error('upload error', error)
      setError(error.message || String(error))
      return ''
    }
    return filePath
  }

  // generic save for member rows
  async function saveRow(table, row, setRows) {
    try {
      const payload = { ...row }
      // remove client-side preview key
      delete payload.imageUrl
      setError(null)
      const { data, error } = await supabase.from(table).upsert(payload).select()
      if (error) throw error
      // update local cache with returned row(s)
      // if returned is array, replace by id where possible
      if (data && data.length > 0) {
        const updated = data[0]
        setRows(prev => prev.map(r => (r.id === updated.id ? { ...r, ...updated, image: mapImage(updated.image || updated.image_path || '') } : r)))
      }
    } catch (err) {
      console.error('saveRow error', err)
      setError(err.message || String(err))
    }
  }

  async function deleteRow(table, row, setRows) {
    try {
      setError(null)
      if (!row.id) {
        // local unsaved row — just remove
        setRows(prev => prev.filter(r => r !== row))
        return
      }
      const { error } = await supabase.from(table).delete().eq('id', row.id)
      if (error) throw error
      setRows(prev => prev.filter(r => r.id !== row.id))
    } catch (err) {
      console.error('deleteRow error', err)
      setError(err.message || String(err))
    }
  }

  // master save
  async function saveMaster() {
    setSavingMaster(true)
    setError(null)
    try {
      const payload = { ...master }
      delete payload.imageUrl
      const { data, error } = await supabase.from('master_card').upsert(payload).select()
      if (error) throw error
      if (data && data[0]) setMaster(prev => ({ ...prev, ...data[0], image: mapImage(data[0].image || data[0].image_path || '') }))
    } catch (err) {
      console.error('saveMaster error', err)
      setError(err.message || String(err))
    } finally {
      setSavingMaster(false)
    }
  }

  function addEmptyRow(setRows) {
    setRows(prev => [...prev, { name: '', content: '', image: '', email: '', linkedinLink: '', githubLink: '', websiteLink: '' }])
  }

  if (loading) {
    return (
      <div style={{ color: '#fff' }}>
        <h2>Team Editor</h2>
        <p>Loading team data...</p>
      </div>
    )
  }

  return (
    <div style={{ color: '#fff' }}>
      <h2>Team Editor</h2>
      {error && <p style={{ color: 'salmon' }}>{error}</p>}

      <section style={{ background: '#fff', color: '#000', padding: 12, borderRadius: 8, marginBottom: 12 }}>
        <h3>Principal Investigator (Master Card)</h3>
  {loadingMaster && <p>Loading master card...</p>}
  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <input placeholder="Title" value={master.title || ''} onChange={e => setMaster(prev => ({ ...prev, title: e.target.value }))} style={{ width: '100%', padding: 8 }} />
            <textarea placeholder="Content" value={master.content || ''} onChange={e => setMaster(prev => ({ ...prev, content: e.target.value }))} style={{ width: '100%', padding: 8, marginTop: 8, minHeight: 120 }} />
            <input placeholder="Email" value={master.email || ''} onChange={e => setMaster(prev => ({ ...prev, email: e.target.value }))} style={{ width: '100%', padding: 8, marginTop: 8 }} />
            <input placeholder="LinkedIn" value={master.linkedinLink || ''} onChange={e => setMaster(prev => ({ ...prev, linkedinLink: e.target.value }))} style={{ width: '100%', padding: 8, marginTop: 8 }} />
            <input placeholder="Google Scholar" value={master.googleScholarLink || ''} onChange={e => setMaster(prev => ({ ...prev, googleScholarLink: e.target.value }))} style={{ width: '100%', padding: 8, marginTop: 8 }} />
            <div style={{ marginTop: 8 }}>
              <button onClick={saveMaster} disabled={savingMaster || loadingMaster} style={{ padding: '8px 12px' }}>{savingMaster ? 'Saving...' : 'Save Master Card'}</button>
            </div>
          </div>
          <div style={{ width: 220 }}>
            <div style={{ marginBottom: 8 }}>
              <img src={master.image || ''} alt="preview" style={{ width: '100%', height: 'auto', display: master.image ? 'block' : 'none' }} />
            </div>
            <input type="file" accept="image/*" onChange={async (e) => {
              const f = e.target.files?.[0]
              if (!f) return
              const path = await uploadImage(f)
              if (path) setMaster(prev => ({ ...prev, image: path }))
            }} />
          </div>
        </div>
      </section>

      <section style={{ marginBottom: 12 }}>
        <h3>Members</h3>
        <div style={{ marginBottom: 8 }}>
          <button onClick={() => setViewMode('current')} style={{ marginRight: 8, padding: '6px 10px', background: viewMode === 'current' ? '#ffd700' : '#ccc' }}>Current</button>
          <button onClick={() => setViewMode('alumni')} style={{ padding: '6px 10px', background: viewMode === 'alumni' ? '#ffd700' : '#ccc' }}>Alumni</button>
        </div>

        {/* helper to render an editable list */}
        {['PhD', 'Masters', 'Interns'].map((label) => {
          const tableMap = {
            PhD: { current: ['phd_students', phd, setPhd], alumni: ['alumini_phd_students', alumniPhd, setAlumniPhd] },
            Masters: { current: ['masters_students', masters, setMasters], alumni: ['alumini_master_students', alumniMasters, setAlumniMasters] },
            Interns: { current: ['research_interns', interns, setInterns], alumni: ['alumini_research_interns', alumniInterns, setAlumniInterns] }
          }
          const [table, rows, setRows] = tableMap[label][viewMode]

          return (
            <div key={label} style={{ background: '#fff', color: '#000', padding: 12, borderRadius: 8, marginBottom: 12 }}>
              <h4>{label} ({rows.length})</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {rows.map((r, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <div style={{ width: 160 }}>
                      <img src={r.image || ''} alt="preview" style={{ width: '100%', display: r.image ? 'block' : 'none' }} />
                      <input type="file" accept="image/*" onChange={async (e) => {
                        const f = e.target.files?.[0]; if (!f) return
                        const path = await uploadImage(f)
                        if (path) setRows(prev => prev.map((p, idx) => idx === i ? { ...p, image: path } : p))
                      }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <input placeholder="Name" value={r.name || ''} onChange={e => setRows(prev => prev.map((p, idx) => idx === i ? { ...p, name: e.target.value } : p))} style={{ width: '100%', padding: 8 }} />
                      <input placeholder="Email" value={r.email || ''} onChange={e => setRows(prev => prev.map((p, idx) => idx === i ? { ...p, email: e.target.value } : p))} style={{ width: '100%', padding: 8, marginTop: 6 }} />
                      <input placeholder="LinkedIn" value={r.linkedinLink || ''} onChange={e => setRows(prev => prev.map((p, idx) => idx === i ? { ...p, linkedinLink: e.target.value } : p))} style={{ width: '100%', padding: 8, marginTop: 6 }} />
                      <textarea placeholder="Content" value={r.content || ''} onChange={e => setRows(prev => prev.map((p, idx) => idx === i ? { ...p, content: e.target.value } : p))} style={{ width: '100%', padding: 8, marginTop: 6 }} />
                      <div style={{ marginTop: 6 }}>
                        <button onClick={() => saveRow(table, r, setRows)} disabled={loadingLists} style={{ marginRight: 8, padding: '6px 10px' }}>Save</button>
                        <button onClick={() => deleteRow(table, r, setRows)} disabled={loadingLists} style={{ padding: '6px 10px' }}>Delete</button>
                      </div>
                    </div>
                  </div>
                ))}
                <div>
                  <button onClick={() => addEmptyRow(setRows)} disabled={loadingLists} style={{ padding: '6px 10px' }}>Add new {label.slice(0, -1)}</button>
                </div>
              </div>
            </div>
          )
        })}
      </section>
    </div>
  )
}

export default TeamEditor
