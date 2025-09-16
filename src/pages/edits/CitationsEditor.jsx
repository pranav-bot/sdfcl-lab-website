import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

// Supabase client for editor
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

export default function CitationsEditor() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [citations, setCitations] = useState([])
  const [talks, setTalks] = useState([])
  const [external, setExternal] = useState([])

  async function loadAll() {
    setLoading(true)
    setError(null)
    try {
      const [citRes, talkRes, extRes] = await Promise.all([
        supabase.from('academic_citations').select('*').order('year', { ascending: false }),
        supabase.from('assignments_invited_talks').select('*').order('year', { ascending: false }),
        supabase.from('external_reviewer_assignments').select('*')
      ])

      if (citRes.error) throw citRes.error
      if (talkRes.error) throw talkRes.error
      if (extRes.error) throw extRes.error

      setCitations(Array.isArray(citRes.data) ? citRes.data : [])
      setTalks(Array.isArray(talkRes.data) ? talkRes.data : [])
      setExternal(Array.isArray(extRes.data) ? extRes.data : [])
    } catch (err) {
      console.error('loadAll citations editor', err)
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadAll() }, [])

  async function saveRow(table, row) {
    setError(null)
    try {
      const payload = { ...row }
      delete payload.__local
      // ensure we don't attempt to insert explicit id values into identity column
      const hasId = !!payload.id
      if (hasId) delete payload.id
      if (hasId) {
        const res = await supabase.from(table).update(payload).eq('id', row.id).select()
        if (res.error) throw res.error
      } else {
        const res = await supabase.from(table).insert(payload).select()
        if (res.error) throw res.error
      }
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
        // local only
        if (table === 'academic_citations') setCitations(prev => prev.filter(r => r !== row))
        if (table === 'assignments_invited_talks') setTalks(prev => prev.filter(r => r !== row))
        if (table === 'external_reviewer_assignments') setExternal(prev => prev.filter(r => r !== row))
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
    if (table === 'academic_citations') setCitations(prev => [...prev, { title: '', organization: '', description: '', year: baseYear }])
    if (table === 'assignments_invited_talks') setTalks(prev => [...prev, { title: '', event: '', location: '', type: '', role: '', date: '', year: baseYear }])
    if (table === 'external_reviewer_assignments') setExternal(prev => [...prev, { journal_name: '', details: '' }])
  }

  if (loading) return <div style={{ padding: 12 }}>Loading citations editor...</div>

  return (
    <div style={{ padding: 12 }}>
      <h3 style={{ marginBottom: 8 }}>Citations Editor</h3>
      {error && <div style={{ color: 'salmon', marginBottom: 8 }}>{error}</div>}

      <section style={{ marginTop: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h4 style={{ margin: 0 }}>Academic Citations</h4>
          <button onClick={() => addRow('academic_citations')}>+ Add Citation</button>
        </div>

        <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {citations.map((r, i) => (
            <div key={r.id || i} style={{ border: '1px solid #e6edf0', borderRadius: 8, padding: 12, background: '#fff' }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ flex: 3 }}>
                  <input placeholder="Title" value={r.title || ''} onChange={e => setCitations(prev => prev.map((p,idx) => idx === i ? { ...p, title: e.target.value } : p))} style={{ width: '100%', padding: 8 }} />
                  <input placeholder="Organization" value={r.organization || ''} onChange={e => setCitations(prev => prev.map((p,idx) => idx === i ? { ...p, organization: e.target.value } : p))} style={{ width: '100%', padding: 8, marginTop: 8 }} />
                </div>

                <div style={{ width: 110 }}>
                  <input placeholder="Year" value={r.year || ''} onChange={e => setCitations(prev => prev.map((p,idx) => idx === i ? { ...p, year: e.target.value } : p))} style={{ width: '100%', padding: 8 }} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <button onClick={() => saveRow('academic_citations', r)} style={{ padding: '6px 10px' }}>Save</button>
                  <button onClick={() => deleteRow('academic_citations', r)} style={{ padding: '6px 10px', background: '#ef4444', color: '#fff' }}>Delete</button>
                </div>
              </div>
              <div style={{ marginTop: 8 }}>
                <textarea placeholder="Description" value={r.description || ''} onChange={e => setCitations(prev => prev.map((p,idx) => idx === i ? { ...p, description: e.target.value } : p))} style={{ width: '100%', padding: 8, minHeight: 64 }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ marginTop: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h4 style={{ margin: 0 }}>Assignments & Invited Talks</h4>
          <button onClick={() => addRow('assignments_invited_talks')}>+ Add Talk</button>
        </div>

        <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {talks.map((r, i) => (
            <div key={r.id || i} style={{ border: '1px solid #e6edf0', borderRadius: 8, padding: 12, background: '#fff' }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ flex: 3 }}>
                  <input placeholder="Title" value={r.title || ''} onChange={e => setTalks(prev => prev.map((p,idx) => idx === i ? { ...p, title: e.target.value } : p))} style={{ width: '100%', padding: 8 }} />
                  <input placeholder="Event" value={r.event || ''} onChange={e => setTalks(prev => prev.map((p,idx) => idx === i ? { ...p, event: e.target.value } : p))} style={{ width: '100%', padding: 8, marginTop: 8 }} />
                </div>

                <div style={{ width: 140 }}>
                  <input placeholder="Location" value={r.location || ''} onChange={e => setTalks(prev => prev.map((p,idx) => idx === i ? { ...p, location: e.target.value } : p))} style={{ width: '100%', padding: 8 }} />
                  <input placeholder="Year" value={r.year || ''} onChange={e => setTalks(prev => prev.map((p,idx) => idx === i ? { ...p, year: e.target.value } : p))} style={{ width: '100%', padding: 8, marginTop: 8 }} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <button onClick={() => saveRow('assignments_invited_talks', r)} style={{ padding: '6px 10px' }}>Save</button>
                  <button onClick={() => deleteRow('assignments_invited_talks', r)} style={{ padding: '6px 10px', background: '#ef4444', color: '#fff' }}>Delete</button>
                </div>
              </div>

              <div style={{ marginTop: 8 }}>
                <input placeholder="Type / Role / Date" value={`${r.type || ''}${r.role ? ` — ${r.role}` : ''}${r.date ? ` • ${r.date}` : ''}`} onChange={e => {
                  const val = e.target.value
                  setTalks(prev => prev.map((p,idx) => idx === i ? { ...p, type: val } : p))
                }} style={{ width: '100%', padding: 8 }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ marginTop: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h4 style={{ margin: 0 }}>External Reviewer Assignments</h4>
          <button onClick={() => addRow('external_reviewer_assignments')}>+ Add External Reviewer</button>
        </div>

        <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {external.map((r, i) => (
            <div key={r.id || i} style={{ border: '1px solid #e6edf0', borderRadius: 8, padding: 12, background: '#fff', display: 'flex', gap: 12, alignItems: 'center' }}>
              <input placeholder="Journal Name" value={r.journal_name || ''} onChange={e => setExternal(prev => prev.map((p,idx) => idx === i ? { ...p, journal_name: e.target.value } : p))} style={{ flex: 2, padding: 8 }} />
              <input placeholder="Details" value={r.details || ''} onChange={e => setExternal(prev => prev.map((p,idx) => idx === i ? { ...p, details: e.target.value } : p))} style={{ flex: 3, padding: 8 }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button onClick={() => saveRow('external_reviewer_assignments', r)} style={{ padding: '6px 10px' }}>Save</button>
                <button onClick={() => deleteRow('external_reviewer_assignments', r)} style={{ padding: '6px 10px', background: '#ef4444', color: '#fff' }}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
