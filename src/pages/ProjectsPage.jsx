import { useState } from 'react'
import SimpleCard from '../components/SimpleCard'
import { Link } from 'react-router-dom'
import ONGOING_PROJECTS from '../data/OngoingProjects'
import COMPLETED_PROJECTS from '../data/CompletedProjects'
import './ProjectsPage.css'

const headingfont = { fontFamily: 'Space Mono', fontWeight: 800 }
const contentFont = { fontFamily: 'Poppins', fontWeight: 200 }

export default function ProjectsPage() {
  const [searchTerm, setSearchTerm] = useState("")

  const lowerSearch = searchTerm.toLowerCase()

  const filteredOngoing = ONGOING_PROJECTS.filter((p) =>
    p.name.toLowerCase().includes(lowerSearch) || p.content.toLowerCase().includes(lowerSearch)
  )

  const filteredCompleted = COMPLETED_PROJECTS.filter((p) =>
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

      {filteredCompleted.length > 0 && (
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

      {filteredOngoing.length > 0 && (
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
