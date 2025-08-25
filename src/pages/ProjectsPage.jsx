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

  useEffect(() => {
    let mounted = true
    ;(async () => {
      setLoadingOngoing(true)
      setOngoingError(null)
      try {
        const { data, error } = await supabase.from('ongoing_projects').select('*').order('created_at', { ascending: false })
        if (error) throw error
        const withUrls = data.map((row) => ({
          ...row,
          image: supabase.storage.from('assets').getPublicUrl(row.image_path).data.publicUrl
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
        const withUrls = data.map((row) => ({
          ...row,
          image: supabase.storage.from('assets').getPublicUrl(row.image_path).data.publicUrl
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
                <Link to={`/sdfcl-lab-website/${project.name}`} style={{ textDecoration: 'none' }}>
                  <SimpleCard name={project.name} content={project.content} image={project.image} color="#011317" headingStyle={headingfont} contentStyle={contentFont} />
                </Link>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
