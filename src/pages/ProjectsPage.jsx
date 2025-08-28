import { useState, useEffect } from 'react'
import SimpleCard from '../components/SimpleCard'
import { Link } from 'react-router-dom'
// completed projects will be loaded from DB
import './ProjectsPage.css'
import { createClient } from '@supabase/supabase-js'

// supabase client
const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY)

const headingfont = { fontFamily: 'Space Mono', fontWeight: 800 }
const contentFont = { fontFamily: 'Poppins', fontWeight: 200 }

export default function ProjectsPage() {
  const [searchTerm, setSearchTerm] = useState("")

  const lowerSearch = searchTerm.toLowerCase()

  // ongoing projects loaded from DB
  const [ongoingProjects, setOngoingProjects] = useState([])
  const [loadingOngoing, setLoadingOngoing] = useState(false)
  const [ongoingError, setOngoingError] = useState(null)
  const [expandedProjectId, setExpandedProjectId] = useState(null)
  const [expandedStudents, setExpandedStudents] = useState({ phd: [], masters: [], interns: [] })
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [studentsError, setStudentsError] = useState(null)
  const [modalSlideIndex, setModalSlideIndex] = useState(0)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      setLoadingOngoing(true)
      setOngoingError(null)
      try {
        const { data, error } = await supabase.from('ongoing_projects').select('*').order('created_at', { ascending: false })
        if (error) throw error
        const mapImage = (img) => {
          if (!img) return ''
          if (typeof img !== 'string') return ''
          if (img.startsWith('http') || img.startsWith('/')) return img
          return supabase.storage.from('assets').getPublicUrl(img).data.publicUrl
        }
        const withUrls = (data || []).map((row) => ({
          ...row,
          image: mapImage(row.image_path ?? row.main_image_path ?? row.image ?? '')
        }))
        if (mounted) setOngoingProjects(Array.isArray(withUrls) ? withUrls : [])
      } catch (err) {
        if (mounted) setOngoingError(err.message || String(err))
      } finally {
        if (mounted) setLoadingOngoing(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  // helper: load students linked to a project via join tables
  async function loadProjectStudents(projectId) {
    setLoadingStudents(true)
    setStudentsError(null)
    try {
      // fetch join rows for the project
      const [phdLinksRes, mastersLinksRes, internsLinksRes] = await Promise.all([
        supabase.from('project_phd_students').select('*').eq('project_id', projectId),
        supabase.from('project_masters_students').select('*').eq('project_id', projectId),
        supabase.from('project_research_interns').select('*').eq('project_id', projectId)
      ])
      if (phdLinksRes.error) throw phdLinksRes.error
      if (mastersLinksRes.error) throw mastersLinksRes.error
      if (internsLinksRes.error) throw internsLinksRes.error

      const phdIds = (phdLinksRes.data || []).map(r => r.student_id).filter(Boolean)
      const mastersIds = (mastersLinksRes.data || []).map(r => r.student_id).filter(Boolean)
      const internsIds = (internsLinksRes.data || []).map(r => r.intern_id || r.student_id).filter(Boolean)

      const [phdRes, mastersRes, internsRes] = await Promise.all([
        phdIds.length ? supabase.from('phd_students').select('*').in('id', phdIds) : { data: [], error: null },
        mastersIds.length ? supabase.from('masters_students').select('*').in('id', mastersIds) : { data: [], error: null },
        internsIds.length ? supabase.from('research_interns').select('*').in('id', internsIds) : { data: [], error: null }
      ])
      if (phdRes && phdRes.error) throw phdRes.error
      if (mastersRes && mastersRes.error) throw mastersRes.error
      if (internsRes && internsRes.error) throw internsRes.error

      const mapImage = (img) => {
        if (!img) return ''
        if (img.startsWith('http') || img.startsWith('/')) return img
        return supabase.storage.from('assets').getPublicUrl(img).data.publicUrl
      }

  const phdStudents = (phdRes.data || []).map(s => ({ ...s, image: mapImage(s.image || s.image_path || ''), designation: 'PhD' }))
  const mastersStudents = (mastersRes.data || []).map(s => ({ ...s, image: mapImage(s.image || s.image_path || ''), designation: 'Masters' }))
  const internsStudents = (internsRes.data || []).map(s => ({ ...s, image: mapImage(s.image || s.image_path || ''), designation: 'Research Intern' }))

  setExpandedStudents({ phd: phdStudents, masters: mastersStudents, interns: internsStudents })
    } catch (err) {
      setStudentsError(err.message || String(err))
      setExpandedStudents({ phd: [], masters: [], interns: [] })
    } finally {
      setLoadingStudents(false)
    }
  }

  function toggleExpand(projectId) {
    if (expandedProjectId === projectId) {
      setExpandedProjectId(null)
      setExpandedStudents({ phd: [], masters: [], interns: [] })
      setStudentsError(null)
      return
    }
    setExpandedProjectId(projectId)
    setModalSlideIndex(0)
    loadProjectStudents(projectId)
  }

  // helper to build array of image URLs for slider
  const getProjectImages = (project) => {
    const mapImage = (img) => {
      if (!img) return ''
      if (typeof img !== 'string') return ''
      const trimmed = img.trim()
      if (!trimmed) return ''
      if (trimmed.startsWith('http') || trimmed.startsWith('/')) return trimmed
      // treat as storage path (e.g. "ProjectPhotos/1756_ANS.png")
      const res = supabase.storage.from('assets').getPublicUrl(trimmed)
      return (res && res.data && res.data.publicUrl) ? res.data.publicUrl : ''
    }

    if (!project) return []

    // possible fields that may contain arrays or JSON strings
    const candidates = [project.images, project.image_paths, project.image_path, project.main_image_path, project.image, project.main_image]

    for (const c of candidates) {
      if (!c) continue
      // if already an array
      if (Array.isArray(c) && c.length) return c.map(mapImage).filter(Boolean)
      // if JSON string representing array
      if (typeof c === 'string') {
        const trimmed = c.trim()
        if (!trimmed) continue
        if (trimmed.startsWith('[')) {
          try {
            const parsed = JSON.parse(trimmed)
            if (Array.isArray(parsed) && parsed.length) return parsed.map(mapImage).filter(Boolean)
          } catch {
            // fallthrough to treat as single path
          }
        }
        // comma-separated list?
        if (trimmed.includes(',')) {
          const parts = trimmed.split(',').map(s => s.trim()).filter(Boolean)
          if (parts.length) return parts.map(mapImage).filter(Boolean)
        }
        // otherwise treat as single path
        return [mapImage(trimmed)].filter(Boolean)
      }
    }

    return []
  }

  const handlePrevSlide = (total) => (e) => {
    e.stopPropagation && e.stopPropagation()
    if (total === 0) return
    setModalSlideIndex((i) => (i - 1 + total) % total)
  }

  const handleNextSlide = (total) => (e) => {
    e.stopPropagation && e.stopPropagation()
    if (total === 0) return
    setModalSlideIndex((i) => (i + 1) % total)
  }

  const filteredOngoing = ongoingProjects.filter((p) =>
    p.name.toLowerCase().includes(lowerSearch) || p.content.toLowerCase().includes(lowerSearch)
  )

  // completed projects loaded from DB
  const [completedProjects, setCompletedProjects] = useState([])
  const [loadingCompleted, setLoadingCompleted] = useState(false)
  const [completedError, setCompletedError] = useState(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      setLoadingCompleted(true)
      setCompletedError(null)
      try {
        const { data, error } = await supabase.from('completed_projects').select('*').order('created_at', { ascending: false })
        if (error) throw error
        const mapImage = (img) => {
          if (!img) return ''
          if (typeof img !== 'string') return ''
          if (img.startsWith('http') || img.startsWith('/')) return img
          return supabase.storage.from('assets').getPublicUrl(img).data.publicUrl
        }
        const withUrls = (data || []).map((row) => ({
          ...row,
          image: mapImage(row.image_path ?? row.main_image_path ?? row.image ?? '')
        }))
        if (mounted) setCompletedProjects(Array.isArray(withUrls) ? withUrls : [])
      } catch (err) {
        if (mounted) setCompletedError(err.message || String(err))
      } finally {
        if (mounted) setLoadingCompleted(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  const filteredCompleted = completedProjects.filter((p) =>
    p.name.toLowerCase().includes(lowerSearch) || p.content.toLowerCase().includes(lowerSearch)
  )

  return (
    <div className="projects-page-container" style={{ padding: 20, backgroundColor: '#011317', minHeight: '80vh' }}>
      <div style={{ maxWidth: 600, margin: '0 auto 24px' }}>
        <input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search projects..."
          style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #ccc', background: '#011317', color: 'white' }}
        />
      </div>

      {loadingCompleted ? (
        <p style={{ color: 'white' }}>Loading completed projects...</p>
      ) : completedError ? (
        <p style={{ color: 'salmon' }}>Error loading completed projects: {completedError}</p>
      ) : filteredCompleted.length > 0 && (
        <>
          <h2 style={{ ...headingfont, color: 'white' }}>Completed Projects</h2>
          <div className="d-flex flex-wrap justify-content-center gap-4">
            {filteredCompleted.map((project) => (
              <div key={project.id} className="card-wrapper">
                <Link to={`/project${project.id}`} style={{ textDecoration: 'none' }}>
                  <SimpleCard name={project.name} content={project.content} image={project.image} color="#011317" headingStyle={headingfont} contentStyle={contentFont} />
                </Link>
              </div>
            ))}
          </div>
        </>
      )}

      {loadingOngoing ? (
        <p style={{ color: 'white' }}>Loading ongoing projects...</p>
      ) : ongoingError ? (
        <p style={{ color: 'salmon' }}>Error loading ongoing projects: {ongoingError}</p>
      ) : filteredOngoing.length > 0 && (
        <>
          <h2 style={{ ...headingfont, color: 'white', marginTop: 32 }}>Ongoing Projects</h2>
          <div className="d-flex flex-wrap justify-content-center gap-4">
            {filteredOngoing.map((project) => (
              <div key={project.id} className="card-wrapper">
                <div onClick={() => toggleExpand(project.id)} style={{ cursor: 'pointer' }}>
                  <SimpleCard name={project.name} content={project.content} image={project.image} color="#011317" headingStyle={headingfont} contentStyle={contentFont} />
                </div>
                {/* previously an inline modal here; moved to top-level to avoid overlap */}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Top-level modal for expanded project (prevents overlaying card layout) */}
      {expandedProjectId && (() => {
        const allProjects = [...ongoingProjects, ...completedProjects]
        const modalProject = allProjects.find(p => p.id === expandedProjectId)
        if (!modalProject) return null
        const imgs = getProjectImages(modalProject)
        const total = imgs.length
        return (
          <div
            className="modal-overlay"
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60 }}
            onClick={() => { setExpandedProjectId(null); setExpandedStudents({ phd: [], masters: [], interns: [] }); setStudentsError(null) }}
          >
            <div
              className="modal-window"
              style={{ width: '92%', maxWidth: 1100, background: '#031515', borderRadius: 10, padding: 20, color: 'white', position: 'relative', maxHeight: '90vh', overflow: 'auto' }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => { setExpandedProjectId(null); setExpandedStudents({ phd: [], masters: [], interns: [] }); setStudentsError(null) }}
                style={{ position: 'absolute', right: 12, top: 12, background: 'transparent', border: 'none', color: 'white', fontSize: 20, cursor: 'pointer' }}
              >
                ✕
              </button>

              <div style={{ display: 'flex', gap: 20, flexDirection: 'row', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 360px', minWidth: 320 }}>
                  <div style={{ position: 'relative', background: '#061919', borderRadius: 8, overflow: 'hidden' }}>
                    {total > 0 ? (
                      <>
                        <img src={imgs[modalSlideIndex]} alt={`${modalProject.name} ${modalSlideIndex + 1}`} style={{ width: '100%', height: 420, objectFit: 'cover' }} />
                        <button onClick={handlePrevSlide(total)} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.4)', border: 'none', color: 'white', fontSize: 28, padding: '6px 10px', borderRadius: 6, cursor: 'pointer' }}>‹</button>
                        <button onClick={handleNextSlide(total)} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.4)', border: 'none', color: 'white', fontSize: 28, padding: '6px 10px', borderRadius: 6, cursor: 'pointer' }}>›</button>
                        <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', bottom: 8, background: 'rgba(0,0,0,0.35)', padding: '4px 8px', borderRadius: 12, fontSize: 12 }}>{modalSlideIndex + 1} / {total}</div>
                      </>
                    ) : (
                      <div style={{ width: '100%', height: 420, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccc' }}>No images</div>
                    )}
                  </div>
                </div>

                <div style={{ flex: '1 1 420px', minWidth: 320, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <h2 style={{ margin: 0 }}>{modalProject.name}</h2>

                  <div style={{ background: '#062727', padding: 12, borderRadius: 8, maxHeight: 180, overflow: 'auto' }}>
                    <h4 style={{ marginTop: 0 }}>Detailed description</h4>
                    <p style={{ whiteSpace: 'pre-wrap', color: '#e6f8f3', margin: 0 }}>{modalProject.detailed_description || modalProject.long_description || modalProject.description || 'No detailed description available.'}</p>
                  </div>

                  <div style={{ background: '#062727', padding: 12, borderRadius: 8 }}>
                    <h4 style={{ marginTop: 0 }}>Funding sources</h4>
                    {modalProject.fundingSources && Array.isArray(modalProject.fundingSources) && modalProject.fundingSources.length ? (
                      <ul style={{ margin: 0 }}>
                        {modalProject.fundingSources.map((f, idx) => <li key={idx} style={{ color: '#e6f8f3' }}>{f}</li>)}
                      </ul>
                    ) : modalProject.funding && Array.isArray(modalProject.funding) && modalProject.funding.length ? (
                      <ul style={{ margin: 0 }}>
                        {modalProject.funding.map((f, idx) => <li key={idx} style={{ color: '#e6f8f3' }}>{f}</li>)}
                      </ul>
                    ) : (
                      <p style={{ color: '#c7efe7', margin: 0 }}>No funding information.</p>
                    )}
                  </div>

                  <div style={{ background: '#062727', padding: 12, borderRadius: 8 }}>
                    <strong>Students on this project</strong>
                    {loadingStudents ? (
                      <p>Loading students...</p>
                    ) : studentsError ? (
                      <p style={{ color: 'salmon' }}>{studentsError}</p>
                    ) : (
                      (() => {
                        const combined = [
                          ...(expandedStudents.phd || []),
                          ...(expandedStudents.masters || []),
                          ...(expandedStudents.interns || [])
                        ]
                        if (!combined.length) return <p style={{ color: '#c7efe7', marginTop: 8 }}>No students listed for this project.</p>
                        return (
                          <div className="d-flex flex-wrap justify-content-center gap-3">
                            {combined.map((s) => (
                              <SimpleCard
                                key={`${s.id || s.email || s.name}`}
                                name={s.name}
                                // content should be the designation (phd, masters, research intern)
                                content={s.designation || s.content || ''}
                                email={s.email}
                                image={s.image || ''}
                                color="#2e2c29"
                                headingStyle={headingfont}
                                contentStyle={contentFont}
                                cardWidth="12rem"
                              />
                            ))}
                          </div>
                        )
                      })()
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
