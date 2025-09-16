import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createClient } from '@supabase/supabase-js'
import './EditPage.css'
import HomeEditor from './edits/HomeEditor'
import ProjectsEditor from './edits/ProjectsEditor'
import GalleryEditor from './edits/GalleryEditor'
import TeamEditor from './edits/TeamEditor'
import ResearchEditor from './edits/ResearchEditor'
import PublicationsEditor from './edits/PublicationsEditor'
import CitationsEditor from './edits/CitationsEditor'
import AboutEditor from './edits/AboutEditor'
import TeachingEditor from './edits/TeachingEditor'
import CollaboratorsEditor from './edits/CollaboratorsEditor'

// Supabase client (matches LoginPage usage)
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

export default function EditPage() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const [selectedPage, setSelectedPage] = useState(null)

  useEffect(() => {
    // check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
      if (!session) navigate('/sdfcl-lab-website/login')
    })

    // listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setLoading(false)
      if (!session) navigate('/sdfcl-lab-website/login')
    })

    return () => subscription.unsubscribe()
  }, [navigate])

  if (loading) return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <p>Checking authentication...</p>
    </div>
  )

  if (!session) return null // redirecting to login

  return (
    <div className="editpage-container" style={{ padding: '2rem' }}>
      <h1>Edit Page</h1>

      {/* Navigation buttons same as Navbar (improved UI/UX) */}
      <div className="editpage-nav" style={{ marginTop: '1rem' }}>
        {[
          // keep Home so the in-place Home editor stays available, then mirror the site navbar
          'Home',
          'Group',
          'Teaching',
          'Publications',
          'Projects',
          'Gallery',
          'Citations',
          'Collaborators',
        ].map((item) => {
          const path =
            item === 'Home'
              ? '/sdfcl-lab-website/'
              : `/sdfcl-lab-website/${item.toLowerCase().replace(/\s/g, '')}`

          const keyMap = {
            Home: 'home',
            Group: 'group',
            Teaching: 'teaching',
            Research: 'research',
            Publications: 'publications',
            Projects: 'projects',
            Gallery: 'gallery',
            Citations: 'citations',
            Collaborators: 'collaborators',
            'About Us': 'about'
          }

          const itemKey = keyMap[item] ?? null
          const isActive = itemKey ? selectedPage === itemKey : false

          return (
            <button
              key={item}
              className={`editpage-nav-button${isActive ? ' active' : ''}`}
              onClick={() => {
                if (itemKey) {
                  // open editor in-place
                  setSelectedPage(itemKey)
                } else {
                  // external/navigation items
                  navigate(path)
                  setSelectedPage(null)
                }
              }}
              aria-pressed={isActive}
            >
              {item}
            </button>
          )
        })}
      </div>

      {/* Home editor: when Home clicked, show editable preview and controls */}
      <div style={{ marginTop: '1.5rem' }}>
        {selectedPage === 'home' ? (
          <HomeEditor />
        ) : selectedPage === 'teaching' ? (
          <TeachingEditor />
        ) : selectedPage === 'projects' ? (
          <ProjectsEditor />
        ) : selectedPage === 'group' ? (
          <TeamEditor />
        ) : selectedPage === 'research' ? (
          <ResearchEditor />
        ) : selectedPage === 'publications' ? (
          <PublicationsEditor />
        ) : selectedPage === 'citations' ? (
          <CitationsEditor />
        ) : selectedPage === 'gallery' ? (
          <GalleryEditor />
        ) : selectedPage === 'collaborators' ? (
          <CollaboratorsEditor />
        ) : selectedPage === 'about' ? (
          <AboutEditor />
        ) : (
          <p style={{ color: 'white' }}>Select a page button above to edit its content.</p>
        )}
      </div>
    </div>
  )
}