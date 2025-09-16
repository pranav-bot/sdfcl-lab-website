import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import '../EditPage.css'

// Supabase client for editor
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

export default function HomeEditor() {
  // home content (DB-backed only; no hardcoded defaults)
  const [whoTitle, setWhoTitle] = useState('')
  const [whoParagraph, setWhoParagraph] = useState('')
  const [whoLoading, setWhoLoading] = useState(true)
  // research boxes removed from editor (migrated to Research page)
  // Announcements editor state
  const [announcements, setAnnouncements] = useState([])
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(false)
  const [announcementsError, setAnnouncementsError] = useState(null)
  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', content: '', link: '' })
  const [savingAnnouncement, setSavingAnnouncement] = useState(false)
  // Announcements CRUD
  async function loadAnnouncements() {
    setLoadingAnnouncements(true)
    setAnnouncementsError(null)
    try {
      const { data, error } = await supabase.from('announcements').select('*').order('created_at', { ascending: false }).limit(5)
      if (error) throw error
      setAnnouncements(Array.isArray(data) ? data : [])
    } catch (err) {
      setAnnouncementsError(err.message || String(err))
    } finally {
      setLoadingAnnouncements(false)
    }
  }

  async function saveAnnouncement(idx) {
    setSavingAnnouncement(true)
    try {
      const a = announcements[idx]
      if (!a.title?.trim()) throw new Error('Title required')
      const payload = {
        title: a.title,
        content: a.content,
        link: a.link,
        created_at: a.created_at || new Date().toISOString(),
      }
      if (a.id) {
        const { error } = await supabase.from('announcements').update(payload).eq('id', a.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('announcements').insert(payload)
        if (error) throw error
      }
      await loadAnnouncements()
    } catch (err) {
      setAnnouncementsError(err.message || String(err))
    } finally {
      setSavingAnnouncement(false)
    }
  }

  async function deleteAnnouncement(idx) {
    const a = announcements[idx]
    if (!a?.id) return
    if (!confirm(`Delete announcement "${a.title}"?`)) return
    setSavingAnnouncement(true)
    try {
      const { error } = await supabase.from('announcements').delete().eq('id', a.id)
      if (error) throw error
      await loadAnnouncements()
    } catch (err) {
      setAnnouncementsError(err.message || String(err))
    } finally {
      setSavingAnnouncement(false)
    }
  }

  async function addAnnouncement() {
    setSavingAnnouncement(true)
    try {
      if (!newAnnouncement.title?.trim()) throw new Error('Title required')
      const payload = {
        title: newAnnouncement.title,
        content: newAnnouncement.content,
        link: newAnnouncement.link,
        created_at: new Date().toISOString(),
      }
      const { error } = await supabase.from('announcements').insert(payload)
      if (error) throw error
      setNewAnnouncement({ title: '', content: '', link: '' })
      await loadAnnouncements()
    } catch (err) {
      setAnnouncementsError(err.message || String(err))
    } finally {
      setSavingAnnouncement(false)
    }
  }

  function updateAnnouncementField(idx, field, value) {
    setAnnouncements(prev => {
      const copy = [...prev]
      copy[idx] = { ...copy[idx], [field]: value }
      return copy
    })
  }
  const [homeRow, setHomeRow] = useState(null)
  const [saved, setSaved] = useState(false)
  const [whoSaving, setWhoSaving] = useState(false)
  const [whoError, setWhoError] = useState(null)
  const [videos, setVideos] = useState([])
  const [loadingVideos, setLoadingVideos] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [videoError, setVideoError] = useState(null)
  

  async function handleSave() {
    // save basic home fields
    try {
      setWhoError(null)
      setWhoSaving(true)
      const payload = {
        // write both common variants so whichever column exists will be updated
        title: whoTitle,
        content: whoParagraph,
        // preserve research summary column to avoid NOT NULL constraint errors
        research_and_training_summary: homeRow?.research_and_training_summary
      }
      if (homeRow && homeRow.id) payload.id = homeRow.id

      const { data, error } = await supabase.from('home_page').upsert(payload).select()
      if (error) throw error
      // upsert returns array; take the first row if present
      const row = Array.isArray(data) && data.length > 0 ? data[0] : null
      if (row) {
        setHomeRow(row)
        // reflect persisted values (prefer title/content if present)
        setWhoTitle(row.title ?? '')
        setWhoParagraph(row.content ?? '')
      }

      setSaved(true)
      setTimeout(() => setSaved(false), 1500)
    } catch (err) {
      console.error('handleSave error', err)
      setWhoError(err.message || String(err))
    }
    setWhoSaving(false)
  }

  async function handleReset() {
    // Reload latest values from DB and populate editor (do not clear inputs)
    try {
      setWhoLoading(true)
      const res = await supabase.from('home_page').select('*').order('created_at', { ascending: false }).limit(1)
      if (res.error) {
        console.error(res.error)
      } else if (Array.isArray(res.data) && res.data.length > 0) {
        const row = res.data[0]
        setHomeRow(row)
        setWhoTitle(row.title ?? '')
        setWhoParagraph(row.content ?? '')
      } else {
        // no DB row found — keep current input values (do not clear)
      }
    } catch (err) {
      console.error('handleReset error', err)
    } finally {
      setWhoLoading(false)
    }
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

  // load videos on mount
  useEffect(() => {
    loadVideos()
    loadAnnouncements()
    // inline loadHomeFromDB to avoid dependency warnings
    ;(async () => {
      try {
        setWhoLoading(true)
        const res = await supabase.from('home_page').select('*').order('created_at', { ascending: false }).limit(1)
        if (res.error) {
          console.error(res.error)
        } else if (Array.isArray(res.data) && res.data.length > 0) {
          const row = res.data[0]
          setHomeRow(row)
          // Populate editor fields strictly from DB values (prefer title/content, fallback to who_* names)
          setWhoTitle(row.title ?? '')
          setWhoParagraph(row.content ?? '')
        } else {
          // no row found -> clear fields
          setHomeRow(null)
          setWhoTitle('')
          setWhoParagraph('')
        }
        setWhoLoading(false)
      } catch (err) {
        console.error('loadHomeFromDB error', err)
      }
    })()
  }, [])

  // --- Home page DB loader ---
  // loadHomeFromDB removed (inline used in useEffect)

  // --- Topics (DB) management ---
  

  // research boxes preview removed

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '1rem' }}>
      <aside style={{ padding: '1rem', borderRadius: 8, background: '#f8fafc' }}>
        <h4 style={{ marginTop: 0, color: '#000' }}>Edit Home Content</h4>
        <label style={{ fontSize: 13, color: '#333' }}>Title</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input value={whoTitle} onChange={(e) => setWhoTitle(e.target.value)} disabled={whoLoading} style={{ width: '100%', padding: '8px', margin: '6px 0 12px 0' }} />
          {whoLoading && <small style={{ color: '#666' }}>Loading...</small>}
        </div>

        <label style={{ fontSize: 13, color: '#333' }}>Content</label>
        <textarea value={whoParagraph} onChange={(e) => setWhoParagraph(e.target.value)} rows={8} disabled={whoLoading} style={{ width: '100%', padding: '8px', margin: '6px 0 12px 0' }} />

        {/* Research boxes editor removed */}

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button onClick={handleSave} disabled={whoLoading || whoSaving} style={{ padding: '8px 12px', background: whoLoading || whoSaving ? '#93c5fd' : '#2563eb', color: 'white', border: 'none', borderRadius: 6 }}>{whoSaving ? 'Saving...' : 'Save'}</button>
          <button onClick={handleReset} disabled={whoLoading || whoSaving} style={{ padding: '8px 12px', background: '#fff', border: '1px solid #d1d5db', borderRadius: 6 }}>Reset</button>
          {saved && <span style={{ marginLeft: 8, color: 'green' }}>Saved</span>}
        </div>
        {whoError && <div style={{ color: 'red', marginTop: 8 }}>{whoError}</div>}
        <hr style={{ margin: '12px 0' }} />
        <h4 style={{ marginTop: 0, color: '#000' }}>Background Videos (from storage)</h4>
        <input type="file" accept="video/*" multiple onChange={(e) => handleUploadFiles(e.target.files)} />
        <div style={{ marginTop: 8 }}>
          {uploading ? <small>Uploading...</small> : <small style={{ color: '#666' }}>You can upload multiple videos. Existing files with the same name will be replaced.</small>}
        </div>
        <div style={{ marginTop: 8 }}>
          <button onClick={loadVideos} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #d1d5db', background: '#fff' }}>Refresh Videos</button>
        </div>
        <div style={{ marginTop: 12 }}>
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
        <hr style={{ margin: '18px 0' }} />
        <h4 style={{ marginTop: 0, color: '#000' }}>Edit Announcements</h4>
        {announcementsError && <div style={{ color: 'red', marginBottom: 8 }}>{announcementsError}</div>}
        <div style={{ marginBottom: 18 }}>
          <label style={{ fontWeight: 600 }}>Add New Announcement</label>
          <input
            value={newAnnouncement.title}
            onChange={e => setNewAnnouncement(a => ({ ...a, title: e.target.value }))}
            placeholder="Title"
            style={{ width: '100%', padding: 6, margin: '6px 0' }}
            disabled={savingAnnouncement}
          />
          <textarea
            value={newAnnouncement.content}
            onChange={e => setNewAnnouncement(a => ({ ...a, content: e.target.value }))}
            placeholder="Content"
            rows={2}
            style={{ width: '100%', padding: 6, margin: '6px 0' }}
            disabled={savingAnnouncement}
          />
          <input
            value={newAnnouncement.link}
            onChange={e => setNewAnnouncement(a => ({ ...a, link: e.target.value }))}
            placeholder="Link (optional)"
            style={{ width: '100%', padding: 6, margin: '6px 0' }}
            disabled={savingAnnouncement}
          />
          <button onClick={addAnnouncement} disabled={savingAnnouncement || !newAnnouncement.title.trim()} style={{ padding: '6px 12px', background: '#2563eb', color: 'white', border: 'none', borderRadius: 6, marginTop: 6 }}>Add Announcement</button>
        </div>
        <div>
          <label style={{ fontWeight: 600 }}>Recent Announcements</label>
          {loadingAnnouncements ? (
            <div style={{ color: '#666', margin: '8px 0' }}>Loading...</div>
          ) : announcements.length === 0 ? (
            <div style={{ color: '#666', margin: '8px 0' }}>No announcements found.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {announcements.map((a, idx) => (
                <div key={a.id || idx} style={{ border: '1px solid #e5e7eb', borderRadius: 6, padding: 10, background: '#f6f8fa' }}>
                  <input
                    value={a.title || ''}
                    onChange={e => updateAnnouncementField(idx, 'title', e.target.value)}
                    style={{ width: '100%', padding: 6, fontWeight: 600, marginBottom: 4 }}
                    disabled={savingAnnouncement}
                  />
                  <textarea
                    value={a.content || ''}
                    onChange={e => updateAnnouncementField(idx, 'content', e.target.value)}
                    rows={2}
                    style={{ width: '100%', padding: 6, marginBottom: 4 }}
                    disabled={savingAnnouncement}
                  />
                  <input
                    value={a.link || ''}
                    onChange={e => updateAnnouncementField(idx, 'link', e.target.value)}
                    placeholder="Link (optional)"
                    style={{ width: '100%', padding: 6, marginBottom: 4 }}
                    disabled={savingAnnouncement}
                  />
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <button onClick={() => saveAnnouncement(idx)} disabled={savingAnnouncement || !a.title.trim()} style={{ padding: '6px 10px', background: '#2563eb', color: 'white', border: 'none', borderRadius: 6 }}>Save</button>
                    <button onClick={() => deleteAnnouncement(idx)} disabled={savingAnnouncement} style={{ padding: '6px 10px', background: '#ef4444', color: 'white', border: 'none', borderRadius: 6 }}>Delete</button>
                    <span style={{ color: '#666', fontSize: 12 }}>{a.created_at ? new Date(a.created_at).toLocaleDateString() : ''}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </aside>
    </div>
  )
}
