import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

function parseYearsInput(value) {
  const tokens = String(value || '')
    .split(/[\s,]+/)
    .map(v => v.trim())
    .filter(Boolean)

  if (tokens.length === 0) {
    return { years: [], error: 'At least one year is required' }
  }

  const parsed = tokens.map(Number)
  if (parsed.some(v => !Number.isInteger(v) || v <= 0)) {
    return { years: [], error: 'Years must be positive integers separated by commas' }
  }

  const years = [...new Set(parsed)].sort((a, b) => b - a)
  return { years, error: null }
}

function formatYearsInput(years) {
  if (!Array.isArray(years)) return ''
  return [...new Set(years.map(Number).filter(Number.isInteger))].sort((a, b) => b - a).join(', ')
}

function getYearsPreview(value) {
  const tokens = String(value || '')
    .split(/[\s,]+/)
    .map(v => v.trim())
    .filter(Boolean)

  const parsed = tokens
    .map(Number)
    .filter(v => Number.isInteger(v) && v > 0)

  return [...new Set(parsed)].sort((a, b) => b - a)
}

export default function TeachingEditor() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [newRow, setNewRow] = useState({ course_name: '', description: '', yearsInput: '' })

  async function loadRows() {
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase.from('teaching').select('*').order('created_at', { ascending: false }).limit(50)
      if (error) throw error
      const normalized = Array.isArray(data)
        ? data.map(r => ({ ...r, yearsInput: formatYearsInput(r.years) }))
        : []
      setRows(normalized)
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
    const { years, error: yearsError } = parseYearsInput(r.yearsInput)
    if (yearsError) { setError(yearsError); return }
    setSaving(true)
    try {
      const payload = { course_name: r.course_name.trim(), description: r.description, years }
      if (r.id) {
        const { error } = await supabase.from('teaching').update(payload).eq('id', r.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('teaching').insert(payload)
        if (error) throw error
      }
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
    const { years, error: yearsError } = parseYearsInput(newRow.yearsInput)
    if (yearsError) { setError(yearsError); return }
    setSaving(true)
    try {
      const payload = { course_name: newRow.course_name.trim(), description: newRow.description, years }
      const { error } = await supabase.from('teaching').insert(payload)
      if (error) throw error
      setNewRow({ course_name: '', description: '', yearsInput: '' })
      await loadRows()
    } catch (err) {
      setError(err.message || String(err))
    } finally {
      setSaving(false)
    }
  }

  const newYearsPreview = getYearsPreview(newRow.yearsInput)

  return (
    <div style={{ color: '#000' }}>
      <h3>Teaching Editor</h3>
      {error && <div style={{ color: 'red' }}>{error}</div>}

      <div style={{ margin: '8px 0 16px 0', padding: 12, background: '#f8fafc', borderRadius: 8 }}>
        <label style={{ fontWeight: 600 }}>Add New Course</label>
        <input placeholder="Course name" value={newRow.course_name} onChange={e => setNewRow(s => ({ ...s, course_name: e.target.value }))} style={{ width: '100%', padding: 8, margin: '6px 0' }} />
        <textarea placeholder="Description" value={newRow.description} onChange={e => setNewRow(s => ({ ...s, description: e.target.value }))} rows={2} style={{ width: '100%', padding: 8, margin: '6px 0' }} />
        <input placeholder="Years (e.g. 2026, 2025)" value={newRow.yearsInput} onChange={e => setNewRow(s => ({ ...s, yearsInput: e.target.value }))} style={{ width: '100%', padding: 8, margin: '6px 0' }} />
        <div style={{ marginTop: 2, marginBottom: 8, color: '#475569', fontSize: 12 }}>Use comma or space separated years. Example: 2026, 2025</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
          {newYearsPreview.length > 0 ? newYearsPreview.map(year => (
            <span key={`new-${year}`} style={{ background: '#e0f2fe', color: '#075985', border: '1px solid #bae6fd', borderRadius: 999, padding: '3px 10px', fontSize: 12, fontWeight: 700 }}>{year}</span>
          )) : <span style={{ color: '#64748b', fontSize: 12 }}>Parsed years preview will appear here.</span>}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={addRow} disabled={saving} style={{ padding: '6px 10px', background: '#2563eb', color: 'white', borderRadius: 6 }}>Add</button>
          <button onClick={() => setNewRow({ course_name: '', description: '', yearsInput: '' })} disabled={saving} style={{ padding: '6px 10px', background: '#fff', border: '1px solid #d1d5db', borderRadius: 6 }}>Clear</button>
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
                <input value={r.yearsInput || ''} onChange={e => updateField(idx, 'yearsInput', e.target.value)} placeholder="Years (e.g. 2026, 2025)" style={{ width: '100%', padding: 6, marginBottom: 6 }} />
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                  {getYearsPreview(r.yearsInput).length > 0 ? getYearsPreview(r.yearsInput).map(year => (
                    <span key={`${r.id || idx}-${year}`} style={{ background: '#eef2ff', color: '#3730a3', border: '1px solid #c7d2fe', borderRadius: 999, padding: '2px 9px', fontSize: 12, fontWeight: 700 }}>{year}</span>
                  )) : <span style={{ color: '#94a3b8', fontSize: 12 }}>No valid years parsed yet.</span>}
                </div>
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
