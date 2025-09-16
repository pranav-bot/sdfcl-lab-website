import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

export default function TeachingEditor() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [newRow, setNewRow] = useState({ course_name: '', description: '', year: '' })

  async function loadRows() {
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase.from('teaching').select('*').order('year', { ascending: false }).limit(50)
      if (error) throw error
      setRows(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.message || String(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadRows() }, [])

  function updateField(idx, field, value) {
    setRows(prev => {
      const copy = [...prev]
      copy[idx] = { ...copy[idx], [field]: value }
      return copy
    })
  }

  async function saveRow(idx) {
    const r = rows[idx]
    if (!r) return
    if (!r.course_name?.trim()) { setError('Course name required'); return }
    setSaving(true)
    try {
      const payload = { course_name: r.course_name, description: r.description, year: r.year }
      if (r.id) payload.id = r.id
      const { error } = await supabase.from('teaching').upsert(payload)
      if (error) throw error
      await loadRows()
    } catch (err) {
      setError(err.message || String(err))
    } finally {
      setSaving(false)
    }
  }

  async function deleteRow(idx) {
    const r = rows[idx]
    if (!r?.id) return
    if (!confirm(`Delete course ${r.course_name}?`)) return
    setSaving(true)
    try {
      const { error } = await supabase.from('teaching').delete().eq('id', r.id)
      if (error) throw error
      await loadRows()
    } catch (err) {
      setError(err.message || String(err))
    } finally {
      setSaving(false)
    }
  }

  async function addRow() {
    if (!newRow.course_name?.trim()) { setError('Course name required'); return }
    setSaving(true)
    try {
      const payload = { course_name: newRow.course_name, description: newRow.description, year: newRow.year }
      const { error } = await supabase.from('teaching').insert(payload)
      if (error) throw error
      setNewRow({ course_name: '', description: '', year: '' })
      await loadRows()
    } catch (err) {
      setError(err.message || String(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ color: '#000' }}>
      <h3>Teaching Editor</h3>
      {error && <div style={{ color: 'red' }}>{error}</div>}

      <div style={{ margin: '8px 0 16px 0', padding: 12, background: '#f8fafc', borderRadius: 8 }}>
        <label style={{ fontWeight: 600 }}>Add New Course</label>
        <input placeholder="Course name" value={newRow.course_name} onChange={e => setNewRow(s => ({ ...s, course_name: e.target.value }))} style={{ width: '100%', padding: 8, margin: '6px 0' }} />
        <textarea placeholder="Description" value={newRow.description} onChange={e => setNewRow(s => ({ ...s, description: e.target.value }))} rows={2} style={{ width: '100%', padding: 8, margin: '6px 0' }} />
        <input placeholder="Year" value={newRow.year} onChange={e => setNewRow(s => ({ ...s, year: e.target.value }))} style={{ width: '100%', padding: 8, margin: '6px 0' }} />
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={addRow} disabled={saving} style={{ padding: '6px 10px', background: '#2563eb', color: 'white', borderRadius: 6 }}>Add</button>
          <button onClick={() => setNewRow({ course_name: '', description: '', year: '' })} disabled={saving} style={{ padding: '6px 10px', background: '#fff', border: '1px solid #d1d5db', borderRadius: 6 }}>Clear</button>
        </div>
      </div>

      <div>
        <h4>Existing Courses</h4>
        {loading ? <div>Loading...</div> : null}
        {rows.length === 0 ? <div style={{ color: '#666' }}>No records found.</div> : (
          <div style={{ display: 'grid', gap: 12 }}>
            {rows.map((r, idx) => (
              <div key={r.id || idx} style={{ padding: 10, borderRadius: 8, background: '#fff', border: '1px solid #eee' }}>
                <input value={r.course_name || ''} onChange={e => updateField(idx, 'course_name', e.target.value)} style={{ width: '100%', padding: 6, fontWeight: 700, marginBottom: 6 }} />
                <textarea value={r.description || ''} onChange={e => updateField(idx, 'description', e.target.value)} rows={2} style={{ width: '100%', padding: 6, marginBottom: 6 }} />
                <input value={r.year || ''} onChange={e => updateField(idx, 'year', e.target.value)} style={{ width: '100%', padding: 6, marginBottom: 6 }} />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => saveRow(idx)} disabled={saving} style={{ padding: '6px 10px', background: '#2563eb', color: 'white', borderRadius: 6 }}>Save</button>
                  <button onClick={() => deleteRow(idx)} disabled={saving} style={{ padding: '6px 10px', background: '#ef4444', color: 'white', borderRadius: 6 }}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
