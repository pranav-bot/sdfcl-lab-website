import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createClient } from '@supabase/supabase-js'
import './EditPage.css'

// Supabase client (matches LoginPage usage)
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

export default function EditPage() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const [selectedPage, setSelectedPage] = useState(null)

  useEffect(() => {
    // check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
      if (!session) navigate('/sdfcl-lab-website/login')
    })

    // listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setLoading(false)
      if (!session) navigate('/sdfcl-lab-website/login')
    })

    return () => subscription.unsubscribe()
  }, [navigate])

  if (loading) return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <p>Checking authentication...</p>
    </div>
  )

  if (!session) return null // redirecting to login

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Edit Page</h1>

      {/* Navigation buttons same as Navbar */}
      <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
  {[
          'Home',
          'Research',
          'Publications',
          'Openings',
          'Our Team',
          'Gallery',
          'About Us',
        ].map((item) => {
          const path =
            item === 'Home'
              ? '/sdfcl-lab-website/'
              : `/sdfcl-lab-website/${item.toLowerCase().replace(/\s/g, '')}`
          return (
            <button
              key={item}
              onClick={() => {
                if (item === 'Home') {
                  // do not navigate away from /edit; open Home editor in-place
                  setSelectedPage('home')
                } else {
                  navigate(path)
                  setSelectedPage(null)
                }
              }}
              style={{
                padding: '0.5rem 0.8rem',
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                background: 'white',
                cursor: 'pointer',
                boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
              }}
            >
              {item}
            </button>
          )
        })}
      </div>

      {/* Home editor: when Home clicked, show editable preview and controls */}
      <div style={{ marginTop: '1.5rem' }}>
        {selectedPage === 'home' ? (
          <HomeEditor />
        ) : (
          <p style={{ color: '#666' }}>Select a page button above to edit its content.</p>
        )}
      </div>
    </div>
  )
}

// Simple Home editor component
function HomeEditor() {
  // default values taken from src/pages/HomePage.jsx (core sections)
  const defaultWhoTitle = 'Who We Are'
  const defaultWhoParagraph = `The Space Dynamics and Flight Control Laboratory (SDFCL) is a research and development laboratory of the Department of Aerospace Engineering at the Indian Institute of Technology, Kanpur. SDFCL carries out fundamental and applied research activities in the convergence of Astrodynamics and Control to enable future aggregated and disaggregated satellite missions. These include but are not limited to spacecraft attitude dynamics, combined attitude and orbit control, spacecraft formation flying, rendezvous – docking and berthing of cooperative and non-cooperative targets, as well as pose estimation of moving targets. The vision of SDFCL is to ensure that control algorithms are used as effectively as possible for small satellite on-orbit operations, which will advance robotic and human space exploration. SDFCL is responsible for designing, developing, validating, and embedding the necessary cutting-edge technologies for on-orbit servicing for future space missions. To achieve the same, a first-generation spacecraft simulator testbed at IIT Kanpur is under development that would be used to test and validate new maneuvering controls for rendezvous and docking, new mission concepts for on-orbit servicing, and new algorithms for GN&C.`

  const defaultResearchBoxes = [
    { title: 'Lab Development', body: 'Space Dynamics and Flight Control Lab.' },
    { title: 'Total Funding', body: '7.27 Cr (Including external and internal)' },
    { title: 'Publications', body: '27 Journals, 70 Conferences' },
  ]

  const [whoTitle, setWhoTitle] = useState(() => localStorage.getItem('home_who_title') || defaultWhoTitle)
  const [whoParagraph, setWhoParagraph] = useState(() => localStorage.getItem('home_who_paragraph') || defaultWhoParagraph)
  const [researchBoxesJSON, setResearchBoxesJSON] = useState(() => localStorage.getItem('home_research_boxes') || JSON.stringify(defaultResearchBoxes, null, 2))
  const [saved, setSaved] = useState(false)
  const [videos, setVideos] = useState([])
  const [loadingVideos, setLoadingVideos] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [videoError, setVideoError] = useState(null)
  // Logos management
  const [logos, setLogos] = useState([])
  const [loadingLogos, setLoadingLogos] = useState(false)
  const [uploadingLogos, setUploadingLogos] = useState(false)
  const [logosError, setLogosError] = useState(null)

  // Topics (DB-backed)
  const [topics, setTopics] = useState([])
  const [loadingTopics, setLoadingTopics] = useState(false)
  const [savingTopics, setSavingTopics] = useState(false)
  const [topicsError, setTopicsError] = useState(null)

  function handleSave() {
    localStorage.setItem('home_who_title', whoTitle)
    localStorage.setItem('home_who_paragraph', whoParagraph)
    localStorage.setItem('home_research_boxes', researchBoxesJSON)
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  function handleReset() {
    setWhoTitle(defaultWhoTitle)
    setWhoParagraph(defaultWhoParagraph)
    setResearchBoxesJSON(JSON.stringify(defaultResearchBoxes, null, 2))
    localStorage.removeItem('home_who_title')
    localStorage.removeItem('home_who_paragraph')
    localStorage.removeItem('home_research_boxes')
  }

  // --- Background videos management ---
  async function loadVideos() {
    setLoadingVideos(true)
    setVideoError(null)
    try {
      const { data, error } = await supabase.storage.from('assets').list('Videos')
      if (error) throw error
      // data is array of { name, id, ... }
      // get public urls
      const withUrls = data.map((f) => ({ name: f.name, url: supabase.storage.from('assets').getPublicUrl(`Videos/${f.name}`).data.publicUrl }))
      setVideos(withUrls)
    } catch (err) {
      setVideoError(err.message || String(err))
    } finally {
      setLoadingVideos(false)
    }
  }

  async function handleDeleteVideo(name) {
    if (!confirm(`Delete video ${name}? This will remove the file from the storage bucket.`)) return
    setVideoError(null)
    try {
      const { error } = await supabase.storage.from('assets').remove([`Videos/${name}`])
      if (error) throw error
      await loadVideos()
    } catch (err) {
      setVideoError(err.message || String(err))
    }
  }

  async function handleUploadFiles(files) {
    if (!files || files.length === 0) return
    setUploading(true)
    setVideoError(null)
    try {
      for (const file of Array.from(files)) {
        const path = `Videos/${file.name}`
        const { error } = await supabase.storage.from('assets').upload(path, file, { upsert: true })
        if (error) throw error
      }
      await loadVideos()
    } catch (err) {
      setVideoError(err.message || String(err))
    } finally {
      setUploading(false)
    }
  }

  // --- Logos management ---
  async function loadLogos() {
    setLoadingLogos(true)
    setLogosError(null)
    try {
      const { data, error } = await supabase.storage.from('assets').list('Logos')
      if (error) throw error
      const withUrls = data.map((f) => ({ name: f.name, url: supabase.storage.from('assets').getPublicUrl(`Logos/${f.name}`).data.publicUrl }))
      setLogos(withUrls)
    } catch (err) {
      setLogosError(err.message || String(err))
    } finally {
      setLoadingLogos(false)
    }
  }

  async function handleDeleteLogo(name) {
    if (!confirm(`Delete logo ${name}? This will remove the file from the storage bucket.`)) return
    setLogosError(null)
    try {
      const { error } = await supabase.storage.from('assets').remove([`Logos/${name}`])
      if (error) throw error
      await loadLogos()
    } catch (err) {
      setLogosError(err.message || String(err))
    }
  }

  async function handleUploadLogos(files) {
    if (!files || files.length === 0) return
    setUploadingLogos(true)
    setLogosError(null)
    try {
      for (const file of Array.from(files)) {
        const path = `Logos/${file.name}`
        const { error } = await supabase.storage.from('assets').upload(path, file, { upsert: true })
        if (error) throw error
      }
      await loadLogos()
    } catch (err) {
      setLogosError(err.message || String(err))
    } finally {
      setUploadingLogos(false)
    }
  }

  // load videos on mount
  useEffect(() => {
    loadVideos()
    loadLogos()
    loadTopicsFromDB()
  }, [])

  // --- Topics (DB) management ---
  async function loadTopicsFromDB() {
    setLoadingTopics(true)
    setTopicsError(null)
    try {
      const { data, error } = await supabase.from('topics').select('*').order('id', { ascending: true })
      console.log(data)
      if (error) throw error
      // ensure array
      setTopics(Array.isArray(data) ? data : [])
    } catch (err) {
      setTopicsError(err.message || String(err))
    } finally {
      setLoadingTopics(false)
    }
  }

  async function handleUploadTopicImage(file, index) {
    if (!file) return
    try {
      const path = `Topics/${file.name}`
      const { error } = await supabase.storage.from('assets').upload(path, file, { upsert: true })
      if (error) throw error
      // set the topic image path so frontend resolver can turn it into a public URL
      setTopics((prev) => {
        const copy = [...prev]
        copy[index] = { ...copy[index], image: path }
        return copy
      })
    } catch (err) {
      setTopicsError(err.message || String(err))
    }
  }

  function addTopic() {
    setTopics((t) => [...t, { title: '', description: '', image: '' }])
  }

  function updateTopicField(index, field, value) {
    setTopics((prev) => {
      const copy = [...prev]
      copy[index] = { ...copy[index], [field]: value }
      return copy
    })
  }

  async function deleteTopic(index) {
    const t = topics[index]
    if (!t) return
    if (t.id) {
      if (!confirm(`Delete topic "${t.title || t.id}" from database?`)) return
      try {
        const { error } = await supabase.from('topics').delete().eq('id', t.id)
        if (error) throw error
        await loadTopicsFromDB()
      } catch (err) {
        setTopicsError(err.message || String(err))
      }
    } else {
      // local only, remove
      setTopics((prev) => prev.filter((_, i) => i !== index))
    }
  }

  async function saveTopicsToDB() {
    setSavingTopics(true)
    setTopicsError(null)
    try {
      // upsert all topics. New records without id will be inserted.
      const { data, error } = await supabase.from('topics').upsert(topics).select()
      if (error) throw error
      // refresh from DB to get assigned ids and normalized rows
      await loadTopicsFromDB()
    } catch (err) {
      setTopicsError(err.message || String(err))
    } finally {
      setSavingTopics(false)
    }
  }

  let previewBoxes = []
  try {
    previewBoxes = JSON.parse(researchBoxesJSON)
  } catch {
    previewBoxes = []
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '1rem' }}>
      <section style={{ padding: '1rem', borderRadius: 8, background: '#fff' }}>
        <h2 style={{ marginTop: 0 }}>{whoTitle}</h2>
        <p style={{ whiteSpace: 'pre-wrap' }}>{whoParagraph}</p>

        <h3 style={{ marginTop: 24 }}>Research & Teaching Summary (preview)</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          {previewBoxes.map((b, i) => (
            <div key={i} style={{ padding: 10, border: '1px solid #eee', borderRadius: 6 }}>
              <h4 style={{ margin: '0 0 6px 0' }}>{b.title}</h4>
              <p style={{ margin: 0 }}>{b.body}</p>
            </div>
          ))}
        </div>
        
        <h3 style={{ marginTop: 24 }}>Background Videos (from storage)</h3>
        <div style={{ marginBottom: 12 }}>
        </div>
        <div>
          {loadingVideos ? (
            <p>Loading videos...</p>
          ) : videoError ? (
            <p style={{ color: 'red' }}>{videoError}</p>
          ) : videos.length === 0 ? (
            <p style={{ color: '#666' }}>No videos found in <code>assets/Videos/</code>.</p>
          ) : (
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {videos.map((v) => (
                <div key={v.name} style={{ width: 220, border: '1px solid #eee', padding: 8, borderRadius: 6 }}>
                  <video src={v.url} controls style={{ width: '100%', height: '120px', objectFit: 'cover' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                    <small style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{v.name}</small>
                    <button onClick={() => handleDeleteVideo(v.name)} style={{ border: 'none', background: '#ef4444', color: 'white', padding: '4px 8px', borderRadius: 6, cursor: 'pointer' }}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section style={{ padding: '1rem', borderRadius: 8, background: '#fff', marginTop: 12 }}>
        <h3 style={{ marginTop: 0 }}>Collaborator Logos (from storage)</h3>
        {loadingLogos ? (
          <p>Loading logos...</p>
        ) : logosError ? (
          <p style={{ color: 'red' }}>{logosError}</p>
        ) : logos.length === 0 ? (
          <p style={{ color: '#666' }}>No logos found in <code>assets/Logos/</code>.</p>
        ) : (
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {logos.map((v) => (
              <div key={v.name} style={{ width: 120, border: '1px solid #eee', padding: 8, borderRadius: 6, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <img src={v.url} alt={v.name} style={{ maxWidth: '100%', maxHeight: 70, objectFit: 'contain' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginTop: 8 }}>
                  <small style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{v.name}</small>
                  <button onClick={() => handleDeleteLogo(v.name)} style={{ border: 'none', background: '#ef4444', color: 'white', padding: '4px 8px', borderRadius: 6, cursor: 'pointer' }}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <aside style={{ padding: '1rem', borderRadius: 8, background: '#f8fafc' }}>
        <h4 style={{ marginTop: 0 }}>Edit Home Content</h4>
        <label style={{ fontSize: 13, color: '#333' }}>Who we are title</label>
        <input value={whoTitle} onChange={(e) => setWhoTitle(e.target.value)} style={{ width: '100%', padding: '8px', margin: '6px 0 12px 0' }} />

        <label style={{ fontSize: 13, color: '#333' }}>Who we are paragraph</label>
        <textarea value={whoParagraph} onChange={(e) => setWhoParagraph(e.target.value)} rows={8} style={{ width: '100%', padding: '8px', margin: '6px 0 12px 0' }} />

        <label style={{ fontSize: 13, color: '#333' }}>Research boxes (JSON)</label>
        <textarea value={researchBoxesJSON} onChange={(e) => setResearchBoxesJSON(e.target.value)} rows={8} style={{ width: '100%', padding: '8px', margin: '6px 0 12px 0', fontFamily: 'monospace', fontSize: 13 }} />

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={handleSave} style={{ padding: '8px 12px', background: '#2563eb', color: 'white', border: 'none', borderRadius: 6 }}>Save</button>
          <button onClick={handleReset} style={{ padding: '8px 12px', background: '#fff', border: '1px solid #d1d5db', borderRadius: 6 }}>Reset</button>
          {saved && <span style={{ marginLeft: 8, color: 'green' }}>Saved</span>}
        </div>
        <hr style={{ margin: '12px 0' }} />
        <h4 style={{ marginTop: 0 }}>Manage Background Videos</h4>
        <input type="file" accept="video/*" multiple onChange={(e) => handleUploadFiles(e.target.files)} />
        <div style={{ marginTop: 8 }}>
          {uploading ? <small>Uploading...</small> : <small style={{ color: '#666' }}>You can upload multiple videos. Existing files with the same name will be replaced.</small>}
        </div>
        <div style={{ marginTop: 8 }}>
          <button onClick={loadVideos} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #d1d5db', background: '#fff' }}>Refresh Videos</button>
        </div>
        <hr style={{ margin: '12px 0' }} />
        <h4 style={{ marginTop: 0 }}>Manage Collaborator Logos</h4>
        <input type="file" accept="image/*" multiple onChange={(e) => handleUploadLogos(e.target.files)} />
        <div style={{ marginTop: 8 }}>{uploadingLogos ? <small>Uploading logos...</small> : <small style={{ color: '#666' }}>You can upload multiple logos. Existing files with the same name will be replaced.</small>}</div>
        <div style={{ marginTop: 8 }}>
          <button onClick={loadLogos} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #d1d5db', background: '#fff' }}>Refresh Logos</button>
        </div>
        <hr style={{ margin: '12px 0' }} />
        <h4 style={{ marginTop: 0 }}>Edit Topics (DB)</h4>
        {loadingTopics ? <small>Loading topics...</small> : topicsError ? <small style={{ color: 'red' }}>{topicsError}</small> : null}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
          {topics.map((t, i) => (
            <div key={i} style={{ border: '1px solid #e5e7eb', padding: 8, borderRadius: 6 }}>
              <input value={t.title || ''} onChange={(e) => updateTopicField(i, 'title', e.target.value)} placeholder="Title" style={{ width: '100%', padding: 6 }} />
              <textarea value={t.description || ''} onChange={(e) => updateTopicField(i, 'description', e.target.value)} rows={2} style={{ width: '100%', padding: 6, marginTop: 6 }} placeholder="Description" />
              <div style={{ display: 'flex', gap: 8, marginTop: 6, alignItems: 'center' }}>
                <input type="file" accept="image/*" onChange={(e) => handleUploadTopicImage(e.target.files?.[0], i)} />
                <input value={t.image || ''} onChange={(e) => updateTopicField(i, 'image', e.target.value)} placeholder="image path or url" style={{ flex: 1, padding: 6 }} />
                <button onClick={() => deleteTopic(i)} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '6px 8px', borderRadius: 6 }}>Delete</button>
              </div>
            </div>
          ))}
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={addTopic} style={{ padding: '6px 8px', borderRadius: 6, border: '1px solid #d1d5db', background: '#fff' }}>Add Topic</button>
            <button onClick={saveTopicsToDB} style={{ padding: '6px 8px', borderRadius: 6, background: '#2563eb', color: '#fff', border: 'none' }}>{savingTopics ? 'Saving...' : 'Save to DB'}</button>
            <button onClick={loadTopicsFromDB} style={{ padding: '6px 8px', borderRadius: 6, border: '1px solid #d1d5db', background: '#fff' }}>Refresh from DB</button>
          </div>
        </div>
      </aside>
    </div>
  )
}