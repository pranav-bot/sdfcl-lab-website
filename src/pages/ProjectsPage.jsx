import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
// completed projects will be loaded from DB
import './ProjectsPage.css'
import { createClient } from '@supabase/supabase-js'

// supabase client
const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY)

const headingfont = { fontFamily: 'Space Mono', fontWeight: 800 }

export default function ProjectsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState('ongoing') // 'ongoing' or 'completed'

  const lowerSearch = searchTerm.toLowerCase()

  // ongoing projects loaded from DB
  const [ongoingProjects, setOngoingProjects] = useState([])
  const [loadingOngoing, setLoadingOngoing] = useState(false)
  const [ongoingError, setOngoingError] = useState(null)
  // No modal/expanded state: projects render inline as rows (image+title left, description right)

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

  // Modal/slider logic removed — projects now render inline as rows

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

  // per-project students (small tags)
  const [projectStudents, setProjectStudents] = useState({}) // { [projectId]: [{id,name,designation,image}] }
  const [loadingProjectStudents, setLoadingProjectStudents] = useState({})

  // Prefetch students for visible projects (completed + ongoing)
  useEffect(() => {
    const allVisible = [...filteredCompleted, ...filteredOngoing]
    allVisible.forEach(p => {
      const id = p?.id
      if (!id) return
      if (projectStudents[id] || loadingProjectStudents[id]) return
      // fetch students for this project
      fetchProjectStudents(id)
    })
    // Run whenever visible project lists change
  }, [filteredCompleted, filteredOngoing, projectStudents, loadingProjectStudents])

  async function fetchProjectStudents(projectId) {
  setLoadingProjectStudents(prev => ({ ...prev, [projectId]: true }))
    try {
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
        if (img.startsWith && (img.startsWith('http') || img.startsWith('/'))) return img
        try { const res = supabase.storage.from('assets').getPublicUrl(img); return res?.data?.publicUrl || '' } catch { return '' }
      }

      const phdStudents = (phdRes.data || []).map(s => ({ id: s.id, name: s.name || s.full_name || s.email || 'PhD', designation: 'PhD', image: mapImage(s.image || s.image_path || '') }))
      const mastersStudents = (mastersRes.data || []).map(s => ({ id: s.id, name: s.name || s.full_name || s.email || 'Masters', designation: 'Masters', image: mapImage(s.image || s.image_path || '') }))
      const internsStudents = (internsRes.data || []).map(s => ({ id: s.id, name: s.name || s.full_name || s.email || 'Intern', designation: 'Intern', image: mapImage(s.image || s.image_path || '') }))

      const combined = [...phdStudents, ...mastersStudents, ...internsStudents]
      setProjectStudents(prev => ({ ...prev, [projectId]: combined }))
    } catch {
      setProjectStudents(prev => ({ ...prev, [projectId]: [] }))
    } finally {
      setLoadingProjectStudents(prev => ({ ...prev, [projectId]: false }))
    }
  }

  function renderFunding(project) {
    if (!project) return null
    const list = (arr) => (
      <div className="funding-list">
        <strong>Funding:</strong>
        <ul>
          {arr.map((f, idx) => <li key={idx} style={{ color: '#c7efe7' }}>{f}</li>)}
        </ul>
      </div>
    )

    if (project.fundingSources && Array.isArray(project.fundingSources) && project.fundingSources.length) return list(project.fundingSources)
    if (project.funding && Array.isArray(project.funding) && project.funding.length) return list(project.funding)
    // fallback: comma-separated string
    if (project.fundingSources && typeof project.fundingSources === 'string' && project.fundingSources.trim()) {
      const parts = project.fundingSources.split(',').map(s => s.trim()).filter(Boolean)
      if (parts.length) return list(parts)
    }
    if (project.funding && typeof project.funding === 'string' && project.funding.trim()) {
      const parts = project.funding.split(',').map(s => s.trim()).filter(Boolean)
      if (parts.length) return list(parts)
    }
    return null
  }

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

      {/* Tabs to switch between ongoing and completed */}
      <div className="projects-tabs" style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 12 }}>
        <button className={`tab ${activeTab === 'ongoing' ? 'active' : ''}`} onClick={() => setActiveTab('ongoing')}>Ongoing</button>
        <button className={`tab ${activeTab === 'completed' ? 'active' : ''}`} onClick={() => setActiveTab('completed')}>Completed</button>
      </div>

      {activeTab === 'completed' && (
        loadingCompleted ? (
          <p style={{ color: 'white' }}>Loading completed projects...</p>
        ) : completedError ? (
          <p style={{ color: 'salmon' }}>Error loading completed projects: {completedError}</p>
        ) : (
          filteredCompleted.length > 0 ? (
            <>
              <h2 style={{ ...headingfont, color: 'white' }}>Completed Projects</h2>
              <div className="projects-list">
                {filteredCompleted.map((project) => (
                  <div key={project.id} className="project-row">
                    <div className="project-left">
                      <img src={project.image} alt={project.name} className="project-image" />
                    </div>
                    <div className="project-right">
                      <h3 className="project-title">{project.name}</h3>
                      <p className="project-desc">{project.content}</p>
                      {renderFunding(project)}
                      <div className="project-meta">
                        <Link to={`/project${project.id}`} className="read-more">Read details</Link>
                      </div>
                      <div className="project-members">
                        {(projectStudents[project.id] || []).slice(0, 8).map(m => (
                          <span key={m.id || m.name} className="member-tag" title={m.designation || ''}>{m.name}</span>
                        ))}
                        {loadingProjectStudents[project.id] && <span style={{ color: '#c7efe7' }}>Loading...</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p style={{ color: '#c7efe7' }}>No completed projects found.</p>
          )
        )
      )}

      {activeTab === 'ongoing' && (
        loadingOngoing ? (
          <p style={{ color: 'white' }}>Loading ongoing projects...</p>
        ) : ongoingError ? (
          <p style={{ color: 'salmon' }}>Error loading ongoing projects: {ongoingError}</p>
        ) : (
          filteredOngoing.length > 0 ? (
            <>
              <h2 style={{ ...headingfont, color: 'white', marginTop: 32 }}>Ongoing Projects</h2>
              <div className="projects-list">
                {filteredOngoing.map((project) => (
                  <div key={project.id} className="project-row">
                    <div className="project-left">
                      <img src={project.image} alt={project.name} className="project-image" />
                    </div>
                    <div className="project-right">
                      <h3 className="project-title">{project.name}</h3>
                      <p className="project-desc">{project.content}</p>
                      {renderFunding(project)}
                      {/* <div className="project-members">
                        {(projectStudents[project.id] || []).slice(0, 8).map(m => (
                          <span key={m.id || m.name} className="member-tag" title={m.designation || ''}>{m.name}</span>
                        ))}
                        {loadingProjectStudents[project.id] && <span style={{ color: '#c7efe7' }}>Loading...</span>}
                      </div> */}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p style={{ color: '#c7efe7' }}>No ongoing projects found.</p>
          )
        )
      )}
      {/* Modal removed — projects are shown inline */}
    </div>
  )
}
