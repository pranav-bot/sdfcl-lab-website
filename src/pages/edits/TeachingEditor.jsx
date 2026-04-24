import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

function parseYearsFields(values) {
  const sanitized = (Array.isArray(values) ? values : [])
    .map(v => String(v ?? '').trim())
    .filter(Boolean)

  if (sanitized.length === 0) {
    return { years: [], error: 'At least one year is required' }
  }

  const parsed = sanitized.map(Number)
  if (parsed.some(v => !Number.isInteger(v) || v <= 0)) {
    return { years: [], error: 'Each year must be a positive integer' }
  }

  return { years: [...new Set(parsed)].sort((a, b) => b - a), error: null }
}

function toYearFields(years) {
  if (!Array.isArray(years) || years.length === 0) return ['']
  return [...new Set(years.map(Number).filter(Number.isInteger))].sort((a, b) => b - a).map(String)
}

export default function TeachingEditor() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [newRow, setNewRow] = useState({ course_name: '', description: '', yearsFields: [''] })

  async function loadRows() {
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase.from('teaching').select('*').order('created_at', { ascending: false }).limit(50)
      if (error) throw error
      const normalized = Array.isArray(data)
        ? data.map(r => ({ ...r, yearsFields: toYearFields(r.years) }))
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

  function updateRowYearField(rowIdx, yearIdx, value) {
    setRows(prev => {
      const copy = [...prev]
      const row = copy[rowIdx]
      if (!row) return prev
      const yearsFields = Array.isArray(row.yearsFields) ? [...row.yearsFields] : ['']
      yearsFields[yearIdx] = value
      copy[rowIdx] = { ...row, yearsFields }
      return copy
    })
  }

  function addRowYearField(rowIdx) {
    setRows(prev => {
      const copy = [...prev]
      const row = copy[rowIdx]
      if (!row) return prev
      const yearsFields = Array.isArray(row.yearsFields) ? [...row.yearsFields, ''] : ['']
      copy[rowIdx] = { ...row, yearsFields }
      return copy
    })
  }

  function removeRowYearField(rowIdx, yearIdx) {
    setRows(prev => {
      const copy = [...prev]
      const row = copy[rowIdx]
      if (!row) return prev
      const yearsFields = Array.isArray(row.yearsFields) ? [...row.yearsFields] : ['']
      if (yearsFields.length <= 1) return prev
      yearsFields.splice(yearIdx, 1)
      copy[rowIdx] = { ...row, yearsFields }
      return copy
    })
  }

  function updateNewRowYearField(yearIdx, value) {
    setNewRow(prev => {
      const yearsFields = Array.isArray(prev.yearsFields) ? [...prev.yearsFields] : ['']
      yearsFields[yearIdx] = value
      return { ...prev, yearsFields }
    })
  }

  function addNewRowYearField() {
    setNewRow(prev => ({
      ...prev,
      yearsFields: Array.isArray(prev.yearsFields) ? [...prev.yearsFields, ''] : ['']
    }))
  }

  function removeNewRowYearField(yearIdx) {
    setNewRow(prev => {
      const yearsFields = Array.isArray(prev.yearsFields) ? [...prev.yearsFields] : ['']
      if (yearsFields.length <= 1) return prev
      yearsFields.splice(yearIdx, 1)
      return { ...prev, yearsFields }
    })
  }

  async function saveRow(idx) {
    const r = rows[idx]
    if (!r) return
    if (!r.course_name?.trim()) { setError('Course name required'); return }
    const { years, error: yearsError } = parseYearsFields(r.yearsFields)
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
    const { years, error: yearsError } = parseYearsFields(newRow.yearsFields)
    if (yearsError) { setError(yearsError); return }
    setSaving(true)
    try {
      const payload = { course_name: newRow.course_name.trim(), description: newRow.description, years }
      const { error } = await supabase.from('teaching').insert(payload)
      if (error) throw error
      setNewRow({ course_name: '', description: '', yearsFields: [''] })
      await loadRows()
    } catch (err) {
      setError(err.message || String(err))
    } finally {
      setSaving(false)
    }
  }

  const newYearsPreview = parseYearsFields(newRow.yearsFields).years

  return (
    <div style={{ color: '#000' }}>
      <h3>Teaching Editor</h3>
      {error && <div style={{ color: 'red' }}>{error}</div>}

      <div style={{ margin: '8px 0 16px 0', padding: 12, background: '#f8fafc', borderRadius: 8 }}>
        <label style={{ fontWeight: 600 }}>Add New Course</label>
        <input placeholder="Course name" value={newRow.course_name} onChange={e => setNewRow(s => ({ ...s, course_name: e.target.value }))} style={{ width: '100%', padding: 8, margin: '6px 0' }} />
        <textarea placeholder="Description" value={newRow.description} onChange={e => setNewRow(s => ({ ...s, description: e.target.value }))} rows={2} style={{ width: '100%', padding: 8, margin: '6px 0' }} />
        <div style={{ marginTop: 4, marginBottom: 4, color: '#475569', fontSize: 12 }}>Add one input per year</div>
        <div style={{ display: 'grid', gap: 6, margin: '6px 0' }}>
          {newRow.yearsFields.map((yearValue, yearIdx) => (
            <div key={`new-year-${yearIdx}`} style={{ display: 'flex', gap: 8 }}>
              <input placeholder="Year (e.g. 2026)" value={yearValue} onChange={e => updateNewRowYearField(yearIdx, e.target.value)} style={{ width: '100%', padding: 8 }} />
              <button onClick={() => removeNewRowYearField(yearIdx)} disabled={saving || newRow.yearsFields.length <= 1} style={{ padding: '6px 10px', background: '#fff', border: '1px solid #d1d5db', borderRadius: 6 }}>Remove</button>
            </div>
          ))}
        </div>
        <div style={{ marginBottom: 8 }}>
          <button onClick={addNewRowYearField} disabled={saving} style={{ padding: '6px 10px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: 6 }}>+ Add Year Field</button>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
          {newYearsPreview.length > 0 ? newYearsPreview.map(year => (
            <span key={`new-${year}`} style={{ background: '#e0f2fe', color: '#075985', border: '1px solid #bae6fd', borderRadius: 999, padding: '3px 10px', fontSize: 12, fontWeight: 700 }}>{year}</span>
          )) : <span style={{ color: '#64748b', fontSize: 12 }}>Parsed years preview will appear here.</span>}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={addRow} disabled={saving} style={{ padding: '6px 10px', background: '#2563eb', color: 'white', borderRadius: 6 }}>Add</button>
          <button onClick={() => setNewRow({ course_name: '', description: '', yearsFields: [''] })} disabled={saving} style={{ padding: '6px 10px', background: '#fff', border: '1px solid #d1d5db', borderRadius: 6 }}>Clear</button>
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
                <div style={{ marginTop: 2, marginBottom: 4, color: '#475569', fontSize: 12 }}>One field per year</div>
                <div style={{ display: 'grid', gap: 6, marginBottom: 8 }}>
                  {(r.yearsFields || ['']).map((yearValue, yearIdx) => (
                    <div key={`${r.id || idx}-year-${yearIdx}`} style={{ display: 'flex', gap: 8 }}>
                      <input value={yearValue} onChange={e => updateRowYearField(idx, yearIdx, e.target.value)} placeholder="Year (e.g. 2026)" style={{ width: '100%', padding: 6 }} />
                      <button onClick={() => removeRowYearField(idx, yearIdx)} disabled={saving || (r.yearsFields || []).length <= 1} style={{ padding: '6px 10px', background: '#fff', border: '1px solid #d1d5db', borderRadius: 6 }}>Remove</button>
                    </div>
                  ))}
                </div>
                <div style={{ marginBottom: 8 }}>
                  <button onClick={() => addRowYearField(idx)} disabled={saving} style={{ padding: '6px 10px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: 6 }}>+ Add Year Field</button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                  {parseYearsFields(r.yearsFields).years.length > 0 ? parseYearsFields(r.yearsFields).years.map(year => (
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
