import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'
// import './EditPage.css'

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY)

export default function ProjectsEditor() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [currentTable, setCurrentTable] = useState('ongoing_projects')
  const [phdOptions, setPhdOptions] = useState([])
  const [mastersOptions, setMastersOptions] = useState([])
  const [internsOptions, setInternsOptions] = useState([])

  // helper to parse detailed_description as plain text (we no longer store students here)
  function parseStudentsFromDetailed(r) {
    return { phd: [], masters: [], interns: [], detailedText: String(r?.detailed_description || '') }
  }

  const loadProjects = useCallback(async (table) => {
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase.from(table).select('*').order('created_at', { ascending: false })
      if (error) throw error
      const mapped = (data || []).map((r) => {
        // map main image
        const mainImageUrl = r.main_image_path ? supabase.storage.from('assets').getPublicUrl(r.main_image_path).data.publicUrl : ''
        // map multiple image paths
        const imagePaths = Array.isArray(r.image_paths) ? r.image_paths : (r.image_paths ? [r.image_paths] : [])
        const imageUrls = imagePaths.map((p) => ({ path: p, url: supabase.storage.from('assets').getPublicUrl(p).data.publicUrl }))
        // funding sources: store as simple array of text
        // support both new column `funding_sources` and legacy `fundingsources`
        const rawFunding = r.funding_sources ?? r.fundingsources
        const fundings = Array.isArray(rawFunding) ? rawFunding.map((f) => {
          try {
            const parsed = JSON.parse(f)
            return (parsed && typeof parsed === 'object' && 'name' in parsed) ? String(parsed.name || '') : String(f)
          } catch {
            return String(f)
          }
        }) : []
        const students = parseStudentsFromDetailed(r)
        // initialize students as id/name arrays; will be populated from join tables below
        const studentsObj = { phd: [], masters: [], interns: [], detailedText: students.detailedText }
        return { ...r, mainImageUrl, imagePaths, imageUrls, fundings, students: studentsObj }
      })
      // if no projects, finish early
      if (!Array.isArray(mapped) || mapped.length === 0) {
        setProjects([])
        return
      }

      // fetch join-table mappings for all loaded projects
      const projectIds = mapped.map(p => p.id).filter(Boolean)
      if (projectIds.length === 0) {
        setProjects(mapped)
        return
      }

      // fetch join rows
      const [phdLinksResp, mastersLinksResp, internsLinksResp] = await Promise.all([
        supabase.from('project_phd_students').select('*').in('project_id', projectIds),
        supabase.from('project_masters_students').select('*').in('project_id', projectIds),
        supabase.from('project_research_interns').select('*').in('project_id', projectIds)
      ])
      if (phdLinksResp.error) throw phdLinksResp.error
      if (mastersLinksResp.error) throw mastersLinksResp.error
      if (internsLinksResp.error) throw internsLinksResp.error

      const phdLinks = phdLinksResp.data || []
      const mastersLinks = mastersLinksResp.data || []
      const internsLinks = internsLinksResp.data || []

      // collect unique student ids per type
      const phdIds = [...new Set(phdLinks.map(l => l.student_id).filter(Boolean))]
      const mastersIds = [...new Set(mastersLinks.map(l => l.student_id).filter(Boolean))]
      const internsIds = [...new Set(internsLinks.map(l => l.intern_id || l.student_id).filter(Boolean))]

      // fetch student names for the ids
      const [phdStudentsResp, mastersStudentsResp, internsStudentsResp] = await Promise.all([
        phdIds.length ? supabase.from('phd_students').select('*').in('id', phdIds) : { data: [], error: null },
        mastersIds.length ? supabase.from('masters_students').select('*').in('id', mastersIds) : { data: [], error: null },
        internsIds.length ? supabase.from('research_interns').select('*').in('id', internsIds) : { data: [], error: null }
      ])
      if (phdStudentsResp && phdStudentsResp.error) throw phdStudentsResp.error
      if (mastersStudentsResp && mastersStudentsResp.error) throw mastersStudentsResp.error
      if (internsStudentsResp && internsStudentsResp.error) throw internsStudentsResp.error

      const phdStudentsMap = new Map((phdStudentsResp.data || []).map(s => [s.id, s.name || '']))
      const mastersStudentsMap = new Map((mastersStudentsResp.data || []).map(s => [s.id, s.name || '']))
      const internsStudentsMap = new Map((internsStudentsResp.data || []).map(s => [s.id, s.name || '']))

      // attach students to projects
      const mappedWithStudents = mapped.map(p => {
        const id = p.id
        const phdFor = phdLinks.filter(l => l.project_id === id).map(l => ({ id: l.student_id, name: phdStudentsMap.get(l.student_id) || String(l.student_id) }))
        const mastersFor = mastersLinks.filter(l => l.project_id === id).map(l => ({ id: l.student_id, name: mastersStudentsMap.get(l.student_id) || String(l.student_id) }))
        const internsFor = internsLinks.filter(l => l.project_id === id).map(l => ({ id: l.intern_id || l.student_id, name: internsStudentsMap.get(l.intern_id || l.student_id) || String(l.intern_id || l.student_id) }))
        return { ...p, students: { phd: phdFor, masters: mastersFor, interns: internsFor, detailedText: p.students?.detailedText || '' } }
      })

      setProjects(mappedWithStudents)
    } catch (err) {
      setError(err.message || String(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadProjects(currentTable)
  }, [currentTable, loadProjects])

  // load student lists (current + alumni) for dropdowns
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const [phdRes, mastersRes, internsRes, alumniPhdRes, alumniMastersRes, alumniInternsRes] = await Promise.all([
          supabase.from('phd_students').select('*').order('id', { ascending: true }),
          supabase.from('masters_students').select('*').order('id', { ascending: true }),
          supabase.from('research_interns').select('*').order('id', { ascending: true }),
          supabase.from('alumini_phd_students').select('*').order('id', { ascending: true }),
          supabase.from('alumini_masters_students').select('*').order('id', { ascending: true }),
          supabase.from('alumini_research_interns').select('*').order('id', { ascending: true })
        ])
        if (!mounted) return
        const mapObj = (r) => ({ id: r.id, name: r.name || '' })
        const phdList = [...(phdRes.data || []).map(mapObj), ...(alumniPhdRes.data || []).map(mapObj)]
        const mastersList = [...(mastersRes.data || []).map(mapObj), ...(alumniMastersRes.data || []).map(mapObj)]
        const internsList = [...(internsRes.data || []).map(mapObj), ...(alumniInternsRes.data || []).map(mapObj)]
        setPhdOptions(phdList)
        setMastersOptions(mastersList)
        setInternsOptions(internsList)
      } catch {
        // ignore load errors for options
      }
    })()
    return () => { mounted = false }
  }, [])

  function addEmpty() {
  setProjects((p) => [{ name: '', content: '', main_image_path: '', mainImageUrl: '', image_paths: [], imagePaths: [], imageUrls: [], fundingsources: [], fundings: [], students: { phd: [], masters: [], interns: [], detailedText: '' }, _new: true }, ...p])
  }

  function updateField(idx, field, value) {
    setProjects((prev) => {
      const copy = [...prev]
      copy[idx] = { ...copy[idx], [field]: value }
      return copy
    })
  }

  function updateFunding(idx, fundIdx, value) {
    setProjects((prev) => {
      const copy = [...prev]
      copy[idx].fundings = copy[idx].fundings || []
      copy[idx].fundings[fundIdx] = value
      return copy
    })
  }

  function addFunding(idx) {
    setProjects((prev) => {
      const copy = [...prev]
      copy[idx].fundings = copy[idx].fundings || []
      copy[idx].fundings.unshift('')
      return copy
    })
  }

  function removeFunding(idx, fundIdx) {
    setProjects((prev) => {
      const copy = [...prev]
      copy[idx].fundings = (copy[idx].fundings || []).filter((_, i) => i !== fundIdx)
      return copy
    })
  }

  

  

  function addStudentChoice(idx, group, name) {
    if (!name) return
    // here `name` is actually the id string from the select; convert to number
    const id = Number(name)
    const opts = group === 'phd' ? phdOptions : group === 'masters' ? mastersOptions : internsOptions
    const found = opts.find(o => Number(o.id) === id)
    const entry = { id, name: found ? found.name : String(name) }
    setProjects((prev) => {
      const copy = [...prev]
      copy[idx].students = copy[idx].students || { phd: [], masters: [], interns: [], detailedText: '' }
      const list = Array.isArray(copy[idx].students[group]) ? copy[idx].students[group].slice() : []
      if (!list.find(l => Number(l.id) === id)) list.push(entry)
      copy[idx].students[group] = list
      return copy
    })
  }

  function removeStudentChoice(idx, group, name) {
    // `name` is actually an id (or value) here; remove by id
    const idToRemove = Number(name)
    setProjects((prev) => {
      const copy = [...prev]
      copy[idx].students = copy[idx].students || { phd: [], masters: [], interns: [], detailedText: '' }
      copy[idx].students[group] = (copy[idx].students[group] || []).filter(s => Number(s.id) !== idToRemove)
      return copy
    })
  }

  function updateDetailedText(idx, text) {
    setProjects((prev) => {
      const copy = [...prev]
      copy[idx].students = copy[idx].students || { phd: [], masters: [], interns: [], detailedText: '' }
      copy[idx].students.detailedText = text
      return copy
    })
  }

  async function uploadImage(file, idx) {
    if (!file) return
    setError(null)
    try {
      const path = `ProjectPhotos/${Date.now()}_${file.name}`
      const { error } = await supabase.storage.from('assets').upload(path, file, { upsert: true })
      if (error) throw error
      // update project row locally: add to image_paths
      setProjects((prev) => {
        const copy = [...prev]
        copy[idx] = copy[idx] || {}
        const prevPaths = Array.isArray(copy[idx].imagePaths) ? copy[idx].imagePaths.slice() : []
        prevPaths.unshift(path)
        copy[idx].imagePaths = prevPaths
        copy[idx].image_paths = prevPaths
        copy[idx].imageUrls = prevPaths.map((p) => ({ path: p, url: supabase.storage.from('assets').getPublicUrl(p).data.publicUrl }))
        // if no main image set, set this as main
        if (!copy[idx].main_image_path) {
          copy[idx].main_image_path = path
          copy[idx].mainImageUrl = supabase.storage.from('assets').getPublicUrl(path).data.publicUrl
        }
        return copy
      })
    } catch (err) {
      setError(err.message || String(err))
    }
  }

  async function uploadMultipleImages(files, idx) {
    if (!files || files.length === 0) return
    for (const f of Array.from(files)) await uploadImage(f, idx)
  }

  async function removeImageAt(idx, imagePath) {
    // remove from local project's imagePaths and image_urls; do not delete from storage by default
    setProjects((prev) => {
      const copy = [...prev]
      copy[idx] = copy[idx] || {}
      copy[idx].imagePaths = (copy[idx].imagePaths || []).filter(p => p !== imagePath)
      copy[idx].image_paths = copy[idx].imagePaths
      copy[idx].imageUrls = (copy[idx].imageUrls || []).filter(i => i.path !== imagePath)
      if (copy[idx].main_image_path === imagePath) {
        const next = copy[idx].imagePaths?.[0] || ''
        copy[idx].main_image_path = next
        copy[idx].mainImageUrl = next ? supabase.storage.from('assets').getPublicUrl(next).data.publicUrl : ''
      }
      return copy
    })
  }

  async function removeProject(idx) {
    const p = projects[idx]
    if (!p) return
    if (p.id) {
      if (!confirm(`Delete project "${p.name}" from database?`)) return
      try {
  const { error } = await supabase.from(currentTable).delete().eq('id', p.id)
        if (error) throw error
        await loadProjects()
      } catch (err) {
        setError(err.message || String(err))
      }
    } else {
      // just remove local
      setProjects((prev) => prev.filter((_, i) => i !== idx))
    }
  }

  async function saveProject(idx) {
    const p = projects[idx]
    if (!p) return
    setSaving(true)
    setError(null)
    try {
      // prepare image_paths and fundingsources
  const image_paths = Array.isArray(p.imagePaths) ? p.imagePaths : (Array.isArray(p.image_paths) ? p.image_paths : (p.image_path ? [p.image_path] : []))
  // funding_sources should be simple array of strings
  const fundingsources = Array.isArray(p.fundings) ? p.fundings.map(f => String(f || '')) : (Array.isArray(p.fundingsources) ? p.fundingsources : [])

      // students are stored in join tables; detailed_description is plain text
      const students = p.students || { phd: [], masters: [], interns: [], detailedText: '' }
      const detailed_payload = students.detailedText || ''

      const payload = {
        name: p.name || '',
        content: p.content || '',
        main_image_path: p.main_image_path || (image_paths[0] || ''),
        image_paths: image_paths,
  funding_sources: fundingsources,
        detailed_description: detailed_payload
      }
      if (p.id) payload.id = p.id
      // upsert project row and obtain id
      const { data: upsertedData, error: upsertErr } = await supabase.from(currentTable).upsert(payload).select()
      if (upsertErr) throw upsertErr
      const projectId = (upsertedData && upsertedData[0] && upsertedData[0].id) || p.id
      if (!projectId) throw new Error('Could not determine project id after upsert')

      // sync join tables: replace existing links with selected student ids
      // PhD links
      const phdRows = (students.phd || []).map(s => ({ project_id: projectId, student_id: Number(s.id) }))
      const mastersRows = (students.masters || []).map(s => ({ project_id: projectId, student_id: Number(s.id) }))
      const internsRows = (students.interns || []).map(s => ({ project_id: projectId, intern_id: Number(s.id) }))

      // perform transactional-like cleanup: delete existing then insert new
      // PhD
      await supabase.from('project_phd_students').delete().eq('project_id', projectId)
      if (phdRows.length) await supabase.from('project_phd_students').insert(phdRows)
      // Masters
      await supabase.from('project_masters_students').delete().eq('project_id', projectId)
      if (mastersRows.length) await supabase.from('project_masters_students').insert(mastersRows)
      // Interns
      await supabase.from('project_research_interns').delete().eq('project_id', projectId)
      if (internsRows.length) await supabase.from('project_research_interns').insert(internsRows)

      // refresh list
      await loadProjects(currentTable)
    } catch (err) {
      setError(err.message || String(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ display: 'flex', gap: 12 }}>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>Projects Editor</h3>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div>
              <button onClick={() => setCurrentTable('ongoing_projects')} style={{ marginRight: 6, background: currentTable === 'ongoing_projects' ? '#2563eb' : undefined, color: currentTable === 'ongoing_projects' ? '#fff' : undefined }}>Ongoing</button>
              <button onClick={() => setCurrentTable('completed_projects')} style={{ marginRight: 8, background: currentTable === 'completed_projects' ? '#2563eb' : undefined, color: currentTable === 'completed_projects' ? '#fff' : undefined }}>Completed</button>
            </div>
            <button onClick={addEmpty} style={{ marginRight: 8 }}>+ New</button>
            <button onClick={() => loadProjects(currentTable)}>Refresh</button>
          </div>
        </div>
        {loading ? <p>Loading projects...</p> : error ? <p style={{ color: 'red' }}>{error}</p> : projects.length === 0 ? (
          <div style={{ padding: 12, background: '#fff', borderRadius: 8 }}>
            {currentTable === 'completed_projects' ? (
              <p style={{ color: '#666' }}>No completed projects found.</p>
            ) : (
              <p style={{ color: '#666' }}>No ongoing projects found.</p>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {projects.map((proj, i) => (
              <div key={proj.id ?? `new-${i}`} style={{ border: '1px solid #e5e7eb', padding: 12, borderRadius: 8, background: '#fff' }}>
                <div style={{ display: 'flex', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <input value={proj.name || ''} onChange={(e) => updateField(i, 'name', e.target.value)} placeholder="Name" style={{ width: '100%', padding: 8 }} />
                    <textarea value={proj.content || ''} onChange={(e) => updateField(i, 'content', e.target.value)} placeholder="Short description" rows={4} style={{ width: '100%', padding: 8, marginTop: 8 }} />
                    <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center' }}>
                      {/* Main image preview & selector */}
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        {proj.mainImageUrl ? (
                          <img src={proj.mainImageUrl} alt="main" style={{ width: 96, height: 64, objectFit: 'cover', borderRadius: 6, border: '1px solid #e5e7eb' }} />
                        ) : (
                          <div style={{ width: 96, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6', color: '#666', borderRadius: 6 }}>No main</div>
                        )}
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <label style={{ fontSize: 12, marginBottom: 4 }}>Main image</label>
                          <select value={proj.main_image_path || ''} onChange={(e) => {
                            const val = e.target.value
                            setProjects(prev => { const copy = [...prev]; copy[i] = { ...copy[i], main_image_path: val, mainImageUrl: val ? supabase.storage.from('assets').getPublicUrl(val).data.publicUrl : '' }; return copy })
                          }} style={{ padding: 6 }}>
                            <option value="">(select from uploaded images)</option>
                            {(proj.imagePaths || []).map((p) => <option key={p} value={p}>{p.split('/').pop()}</option>)}
                          </select>
                        </div>
                        <button onClick={() => setProjects(prev => { const copy = [...prev]; copy[i] = { ...copy[i], main_image_path: '', mainImageUrl: '' }; return copy })} style={{ padding: '6px 8px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 6 }}>Clear</button>
                      </div>
                      <div style={{ display: 'flex', gap: 8, marginLeft: 12, alignItems: 'center' }}>
                        <input type="file" accept="image/*" onChange={(e) => uploadImage(e.target.files?.[0], i)} />
                        <button onClick={() => saveProject(i)} disabled={saving} style={{ padding: '6px 10px' }}>{saving ? 'Saving...' : 'Save'}</button>
                        <button onClick={() => removeProject(i)} style={{ background: '#ef4444', color: '#fff', padding: '6px 10px' }}>Delete</button>
                      </div>
                    </div>
                  </div>
                  <div style={{ width: 220, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {proj.imageUrls && proj.imageUrls.length > 0 ? proj.imageUrls.map((img) => (
                        <div key={img.path} style={{ width: 88, height: 66, position: 'relative', border: proj.main_image_path === img.path ? '2px solid #2563eb' : '1px solid #e5e7eb' }}>
                          <img src={img.url} alt={proj.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <button onClick={() => { setProjects(prev => { const copy = [...prev]; const item = copy[i]; item.main_image_path = img.path; item.mainImageUrl = img.url; return copy }) }} style={{ position: 'absolute', bottom: 2, left: 2, padding: '2px 6px', fontSize: 11 }}>Set main</button>
                          <button onClick={() => removeImageAt(i, img.path)} style={{ position: 'absolute', bottom: 2, right: 2, padding: '2px 6px', fontSize: 11, background: '#ef4444', color: '#fff' }}>X</button>
                        </div>
                      )) : <div style={{ color: '#666' }}>No images</div>}
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <input type="file" multiple accept="image/*" onChange={(e) => uploadMultipleImages(e.target.files, i)} />
                    </div>
                  </div>
                </div>
                <div style={{ marginTop: 8 }}>
                  <strong>Funding sources</strong>
                  {(proj.fundings || []).map((f, fi) => (
                    <div key={fi} style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                      <input value={f || ''} onChange={(e) => updateFunding(i, fi, e.target.value)} placeholder="Source name" style={{ flex: 1, padding: 6 }} />
                      <button onClick={() => removeFunding(i, fi)} style={{ background: '#ef4444', color: '#fff' }}>Remove</button>
                    </div>
                  ))}
                  <div style={{ marginTop: 8 }}>
                    <button onClick={() => addFunding(i)}>+ Add funding source</button>
                  </div>
                </div>

                <div style={{ marginTop: 8 }}>
                  <strong>Students</strong>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 6 }}>
                    <div>
                      <label>PhD students</label>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <select onChange={(e) => { addStudentChoice(i, 'phd', e.target.value); e.target.value = '' }} defaultValue="" style={{ padding: 6 }}>
                          <option value="">Add PhD student...</option>
                          {phdOptions.filter(opt => !(proj.students?.phd || []).some(s => Number(s.id) === Number(opt.id))).map((opt) => <option key={opt.id} value={opt.id}>{opt.name}</option>)}
                        </select>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {(proj.students?.phd || []).map((stu) => (
                            <div key={stu.id} style={{ background: '#e5e7eb', padding: '4px 8px', borderRadius: 16, display: 'flex', gap: 6, alignItems: 'center' }}>
                              <span>{stu.name}</span>
                              <button onClick={() => removeStudentChoice(i, 'phd', stu.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>x</button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div>
                      <label>Masters students</label>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <select onChange={(e) => { addStudentChoice(i, 'masters', e.target.value); e.target.value = '' }} defaultValue="" style={{ padding: 6 }}>
                          <option value="">Add Masters student...</option>
                          {mastersOptions.filter(opt => !(proj.students?.masters || []).some(s => Number(s.id) === Number(opt.id))).map((opt) => <option key={opt.id} value={opt.id}>{opt.name}</option>)}
                        </select>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {(proj.students?.masters || []).map((stu) => (
                            <div key={stu.id} style={{ background: '#e5e7eb', padding: '4px 8px', borderRadius: 16, display: 'flex', gap: 6, alignItems: 'center' }}>
                              <span>{stu.name}</span>
                              <button onClick={() => removeStudentChoice(i, 'masters', stu.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>x</button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div>
                      <label>Research interns</label>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <select onChange={(e) => { addStudentChoice(i, 'interns', e.target.value); e.target.value = '' }} defaultValue="" style={{ padding: 6 }}>
                          <option value="">Add intern...</option>
                          {internsOptions.filter(opt => !(proj.students?.interns || []).some(s => Number(s.id) === Number(opt.id))).map((opt) => <option key={opt.id} value={opt.id}>{opt.name}</option>)}
                        </select>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {(proj.students?.interns || []).map((stu) => (
                            <div key={stu.id} style={{ background: '#e5e7eb', padding: '4px 8px', borderRadius: 16, display: 'flex', gap: 6, alignItems: 'center' }}>
                              <span>{stu.name}</span>
                              <button onClick={() => removeStudentChoice(i, 'interns', stu.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>x</button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div>
                      <label>Detailed description (optional)</label>
                      <textarea value={proj.students?.detailedText || ''} onChange={(e) => updateDetailedText(i, e.target.value)} rows={3} style={{ width: '100%', padding: 6 }} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
