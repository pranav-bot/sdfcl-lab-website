import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY)

function ResearchEditor() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [row, setRow] = useState(null) // research_summary row
  const [sections, setSections] = useState([]) // { key, value (string: newline-separated) }
  const [saving, setSaving] = useState(false)

  const [teaching, setTeaching] = useState([])
  const [loadingTeaching, setLoadingTeaching] = useState(false)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      setError(null)
      setLoading(true)
      setLoadingTeaching(true)
      try {
        const [resSummary, resTeaching] = await Promise.all([
          supabase.from('research_summary').select('*').order('id', { ascending: false }).limit(1),
          supabase.from('teaching').select('*').order('year', { ascending: false })
        ])

        if (!mounted) return
        if (resSummary.error) throw resSummary.error
        if (resTeaching.error) throw resTeaching.error

        const r = Array.isArray(resSummary.data) && resSummary.data.length > 0 ? resSummary.data[0] : null
        setRow(r)
        const summaryObj = r ? (r.research_and_training_summary || r) : null
        const filtered = summaryObj ? Object.entries(summaryObj).filter(([k]) => !['id','created_at','createdAt'].includes(k)) : []
        setSections(filtered.map(([k,v]) => ({ key: k, value: Array.isArray(v) ? v.join('\n') : String(v) })))

        setTeaching(Array.isArray(resTeaching.data) ? resTeaching.data : [])
      } catch (err) {
        console.error('ResearchEditor load', err)
        if (mounted) setError(String(err))
      } finally {
        if (mounted) {
          setLoading(false)
          setLoadingTeaching(false)
        }
      }
    })()
    return () => { mounted = false }
  }, [])

  function setSectionKey(i, key) {
    setSections(prev => prev.map((s, idx) => idx === i ? { ...s, key } : s))
  }

  function setSectionValue(i, value) {
    setSections(prev => prev.map((s, idx) => idx === i ? { ...s, value } : s))
  }

  function addSection() {
    setSections(prev => [...prev, { key: `section_${prev.length+1}`, value: '' }])
  }

  function removeSection(i) {
    setSections(prev => prev.filter((_, idx) => idx !== i))
  }

  async function saveSummary() {
    setSaving(true)
    setError(null)
    try {
      const payloadObj = sections.reduce((acc, s) => {
        const raw = s.value || ''
        const arr = raw.split('\n').map(l => l.trim()).filter(Boolean)
        acc[s.key] = arr.length > 1 ? arr : (arr.length === 1 ? arr[0] : [])
        return acc
      }, {})

      const payload = { research_and_training_summary: payloadObj }
      if (row && row.id) payload.id = row.id

      const { data, error } = await supabase.from('research_summary').upsert(payload).select()
      if (error) throw error
      const newRow = Array.isArray(data) && data.length > 0 ? data[0] : null
      setRow(newRow)
      const summaryObj = newRow ? (newRow.research_and_training_summary || newRow) : null
      setSections(summaryObj ? Object.entries(summaryObj).filter(([k]) => !['id','created_at','createdAt'].includes(k)).map(([k,v]) => ({ key:k, value: Array.isArray(v) ? v.join('\n') : String(v) })) : [])
    } catch (err) {
      console.error('saveSummary', err)
      setError(String(err))
    } finally {
      setSaving(false)
    }
  }

  async function saveTeachingRow(r) {
    setError(null)
    try {
      const payload = { ...r }
      delete payload.imageUrl
      const { data, error } = await supabase.from('teaching').upsert(payload).select()
      if (error) throw error
      if (data && data.length > 0) {
        const updated = data[0]
        setTeaching(prev => prev.map(p => p.id === updated.id ? { ...p, ...updated } : p))
      }
    } catch (err) {
      console.error('saveTeachingRow', err)
      setError(String(err))
    }
  }

  async function deleteTeachingRow(r) {
    setError(null)
    try {
      if (!r.id) {
        setTeaching(prev => prev.filter(x => x !== r))
        return
      }
      const { error } = await supabase.from('teaching').delete().eq('id', r.id)
      if (error) throw error
      setTeaching(prev => prev.filter(x => x.id !== r.id))
    } catch (err) {
      console.error('deleteTeachingRow', err)
      setError(String(err))
    }
  }

  function addTeachingRow() {
    setTeaching(prev => [...prev, { role: '', course_title: '', year: new Date().getFullYear() }])
  }

  if (loading) return <div style={{ color: '#fff' }}><h3>Research Editor</h3><p>Loading...</p></div>

  return (
    <div style={{ color: '#fff' }}>
      <h3>Research Editor</h3>
      {error && <p style={{ color: 'salmon' }}>{error}</p>}

      <section style={{ background: '#fff', color: '#000', padding: 12, borderRadius: 8, marginBottom: 12 }}>
        <h4>Research & Teaching Summary</h4>
        {sections.map((s, i) => (
          <div key={i} style={{ marginBottom: 8 }}>
            <input value={s.key} onChange={e => setSectionKey(i, e.target.value)} style={{ width: '40%', padding: 6, marginRight: 8 }} />
            <button onClick={() => removeSection(i)} style={{ padding: '6px 8px' }}>Remove</button>
            <div style={{ marginTop: 6 }}>
              <textarea placeholder="Enter each item on a new line (or plain text)" value={s.value} onChange={e => setSectionValue(i, e.target.value)} style={{ width: '100%', minHeight: 80, padding: 8 }} />
            </div>
          </div>
        ))}
        <div style={{ marginTop: 8 }}>
          <button onClick={addSection} style={{ marginRight: 8, padding: '6px 10px' }}>Add Section</button>
          <button onClick={saveSummary} disabled={saving} style={{ padding: '6px 10px' }}>{saving ? 'Saving...' : 'Save Summary'}</button>
        </div>
      </section>

      <section style={{ background: '#fff', color: '#000', padding: 12, borderRadius: 8 }}>
        <h4>Teaching</h4>
        {loadingTeaching ? <p>Loading...</p> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {teaching.map((r, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', background: '#f6f6f6', padding: 8 }}>
                <div style={{ flex: 1 }}>
                  <input placeholder="Role" value={r.role || ''} onChange={e => setTeaching(prev => prev.map((p, idx) => idx === i ? { ...p, role: e.target.value } : p))} style={{ width: '100%', padding: 6 }} />
                  <input placeholder="Course" value={r.course_title || ''} onChange={e => setTeaching(prev => prev.map((p, idx) => idx === i ? { ...p, course_title: e.target.value } : p))} style={{ width: '100%', padding: 6, marginTop: 6 }} />
                  <input placeholder="Year" value={r.year || ''} onChange={e => setTeaching(prev => prev.map((p, idx) => idx === i ? { ...p, year: e.target.value } : p))} style={{ width: 120, padding: 6, marginTop: 6 }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <button onClick={() => saveTeachingRow(r)} style={{ padding: '6px 10px' }}>Save</button>
                  <button onClick={() => deleteTeachingRow(r)} style={{ padding: '6px 10px' }}>Delete</button>
                </div>
              </div>
            ))}
            <div>
              <button onClick={addTeachingRow} style={{ padding: '6px 10px' }}>Add Teaching Row</button>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}

export default ResearchEditor
