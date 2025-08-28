import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY)

function ResearchEditor() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // treat research_summary as multiple rows: { id, title, items: [] }
  const [row, setRow] = useState(null)
  const [sections, setSections] = useState([]) // { id?, title, value (newline-separated string) }
  const [saving, setSaving] = useState(false)

  const [teaching, setTeaching] = useState([])
  const [loadingTeaching, setLoadingTeaching] = useState(false)
  if(row!=null){
    console.log(row.id)
  }

  useEffect(() => {
    let mounted = true
    ;(async () => {
      setError(null)
      setLoading(true)
      setLoadingTeaching(true)
      try {
        const [resSummary, resTeaching] = await Promise.all([
          supabase.from('research_summary').select('*').order('id', { ascending: false }),
          supabase.from('teaching').select('*').order('year', { ascending: false })
        ])

        if (!mounted) return
        if (resSummary.error) throw resSummary.error
        if (resTeaching.error) throw resTeaching.error

  // resSummary.data is now an array of rows
  const rows = Array.isArray(resSummary.data) ? resSummary.data : []
  setRow(rows.length > 0 ? rows[0] : null)
  setSections(rows.map(r => ({ id: r.id, title: r.title || '', value: Array.isArray(r.items) ? r.items.join('\n') : (r.items ? String(r.items) : '') })))

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
  // sections now store `title` instead of `key`
  setSections(prev => prev.map((s, idx) => idx === i ? { ...s, title: key } : s))
  }

  

  // helper to set a single item within a section (sections store value as newline-separated string)
  function setSectionItem(sectionIndex, itemIndex, newValue) {
    setSections(prev => {
      const copy = [...prev]
      const s = { ...copy[sectionIndex] }
      const arr = (s.value || '').split('\n')
      arr[itemIndex] = newValue
      s.value = arr.join('\n')
      copy[sectionIndex] = s
      return copy
    })
  }

  function addSectionItem(sectionIndex) {
    setSections(prev => {
      const copy = [...prev]
      const s = { ...copy[sectionIndex] }
      const arr = (s.value || '').split('\n')
      arr.push('')
      s.value = arr.join('\n')
      copy[sectionIndex] = s
      return copy
    })
  }

  function removeSectionItem(sectionIndex, itemIndex) {
    setSections(prev => {
      const copy = [...prev]
      const s = { ...copy[sectionIndex] }
      const arr = (s.value || '').split('\n')
      arr.splice(itemIndex, 1)
      s.value = arr.join('\n')
      copy[sectionIndex] = s
      return copy
    })
  }

  function addSection() {
    const newSection = { title: `Section ${sections.length + 1}`, value: '' }
    setSections(prev => {
      const next = [...prev, newSection]
      // persist the new row to DB
      saveSectionsToDB(next)
      return next
    })
  }

  // Persist a given sections array into the research_summary table as the
  // research_and_training_summary payload. This only updates the JSON column,
  // not the DB schema.
  // Persist each section as its own DB row: { id?, title, items: string[] }
  async function saveSectionsToDB(secs) {
    try {
      const toCreate = []
      const toUpdate = []
      for (const s of secs) {
        const arr = (s.value || '').split('\n').map(l => l.trim()).filter(Boolean)
        if (s.id) {
          toUpdate.push({ id: s.id, title: s.title || (s.key || ''), items: arr })
        } else {
          toCreate.push({ title: s.title || (s.key || ''), items: arr })
        }
      }

      // Insert new rows (no id property)
      if (toCreate.length > 0) {
        const res = await supabase.from('research_summary').insert(toCreate).select()
        if (res.error) throw res.error
      }

      // Upsert existing rows (include id so they update)
      if (toUpdate.length > 0) {
        const res2 = await supabase.from('research_summary').upsert(toUpdate).select()
        if (res2.error) throw res2.error
      }

      // Refresh from DB to get current state
      const { data, error } = await supabase.from('research_summary').select('*').order('id', { ascending: false })
      if (error) throw error
      const rows = Array.isArray(data) ? data : []
      setRow(rows.length > 0 ? rows[0] : null)
      setSections(rows.map(r => ({ id: r.id, title: r.title || '', value: Array.isArray(r.items) ? r.items.join('\n') : (r.items ? String(r.items) : '') })))
    } catch (err) {
      console.error('saveSectionsToDB', err)
      setError(String(err))
    }
  }

  function removeSection(i) {
    const toRemove = sections[i]
    setSections(prev => prev.filter((_, idx) => idx !== i))
    // if the removed section exists in DB, delete it
    if (toRemove && toRemove.id) {
      ;(async () => {
        try {
          const { error } = await supabase.from('research_summary').delete().eq('id', toRemove.id)
          if (error) throw error
        } catch (err) {
          console.error('removeSection delete', err)
        }
      })()
    }
  }

  async function saveSummary() {
    setSaving(true)
    setError(null)
    try {
  // Upsert rows for sections
  await saveSectionsToDB(sections)
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
        <h4 style={{color:'black'}}>Research & Teaching Summary</h4>
        {sections.map((s, i) => {
          const items = (s.value || '').split('\n').filter(() => true)
          return (
            <div key={i} style={{ marginBottom: 12, background: '#f3f4f6', padding: 12, borderRadius: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  value={s.title}
                  onChange={e => setSectionKey(i, e.target.value)}
                  placeholder="Section title"
                  style={{
                    width: '60%',
                    padding: 8,
                    fontWeight: 700,
                    color: '#000',
                    background: '#fff',
                    border: '1px solid #d1d5db',
                    borderRadius: 6
                  }}
                />
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                  <button onClick={() => removeSection(i)} style={{ padding: '6px 10px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 6 }}>Remove</button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                {items.length === 0 ? (
                  <div style={{ padding: 8, background: '#fff', borderRadius: 6, color: '#6b7280' }}>No items</div>
                ) : items.map((it, idx) => (
                  <div key={idx} style={{ background: '#fff', border: '1px solid #e5e7eb', padding: 8, borderRadius: 6, minWidth: 200, display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input value={it} onChange={e => setSectionItem(i, idx, e.target.value)} placeholder="Item text" style={{ flex: 1, padding: 8, border: '1px solid #e6edf0', borderRadius: 6 }} />
                    <button onClick={() => removeSectionItem(i, idx)} style={{ padding: '6px 10px', background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: 6 }}>Remove</button>
                  </div>
                ))}
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <button onClick={() => addSectionItem(i)} style={{ padding: '6px 10px', background: '#10b981', color: '#fff', border: 'none', borderRadius: 6 }}>+ Add Item</button>
                </div>
              </div>
            </div>
          )
        })}
        <div style={{ marginTop: 8 }}>
          <button onClick={addSection} style={{ marginRight: 8, padding: '8px 12px', background: '#2563eb', color: '#fff', borderRadius: 6, border: 'none' }}>Add Section</button>
          <button onClick={saveSummary} disabled={saving} style={{ padding: '8px 12px', background: '#0ea5a4', color: '#fff', borderRadius: 6, border: 'none' }}>{saving ? 'Saving...' : 'Save Summary'}</button>
        </div>
      </section>

      <section style={{ background: '#fff', color: '#000', padding: 12, borderRadius: 8 }}>
        <h4 style={{color: 'black'}}>Teaching</h4>
        {loadingTeaching ? <p>Loading...</p> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {teaching.map((r, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', background: '#f6f6f6', padding: 12, borderRadius: 8 }}>
                <div style={{ flex: 1 }}>
                  <input
                    placeholder="Role (e.g. Instructor)"
                    value={r.role || ''}
                    onChange={e => setTeaching(prev => prev.map((p, idx) => idx === i ? { ...p, role: e.target.value } : p))}
                    style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e5e7eb', background: '#fff', color: '#000', fontWeight: 600 }}
                  />
                  <input
                    placeholder="Course title"
                    value={r.course_title || ''}
                    onChange={e => setTeaching(prev => prev.map((p, idx) => idx === i ? { ...p, course_title: e.target.value } : p))}
                    style={{ width: '100%', padding: 8, marginTop: 8, borderRadius: 6, border: '1px solid #e5e7eb', background: '#fff', color: '#000', fontWeight: 600 }}
                  />
                  <input
                    placeholder="Year"
                    value={r.year || ''}
                    onChange={e => setTeaching(prev => prev.map((p, idx) => idx === i ? { ...p, year: e.target.value } : p))}
                    style={{ width: 140, padding: 8, marginTop: 8, borderRadius: 6, border: '1px solid #e5e7eb', background: '#fff', color: '#000' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}> 
                  <button onClick={() => saveTeachingRow(r)} style={{ padding: '8px 12px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6 }}>Save</button>
                  <button onClick={() => deleteTeachingRow(r)} style={{ padding: '8px 12px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 6 }}>Delete</button>
                </div>
              </div>
            ))}
            <div>
              <button onClick={addTeachingRow} style={{ padding: '8px 12px', background: '#fff', border: '1px solid #d1d5db', borderRadius: 6 }}>Add Teaching Row</button>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}

export default ResearchEditor
