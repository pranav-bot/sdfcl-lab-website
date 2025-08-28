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
    <div style={{ padding: '2rem' }}>
      <h1>Edit Page</h1>

      {/* Navigation buttons same as Navbar */}
      <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {[
          // keep Home so the in-place Home editor stays available, then mirror the site navbar
          'Home',
          'Group',
          'Research',
          'Publications',
          'Projects',
          'Gallery',
          'Citations',
          'Collaborators',
          'About Us',
        ].map((item) => {
          const path =
            item === 'Home'
              ? '/sdfcl-lab-website/'
              : `/sdfcl-lab-website/${item.toLowerCase().replace(/\s/g, '')}`
          return (
                <button
              key={item}
              onClick={() => {
                    if (item === 'Home') {
                      // open Home editor in-place
                      setSelectedPage('home')
                    } else if (item === 'Research') {
                      // open Research editor in-place
                      setSelectedPage('research')
                    } else if (item === 'Publications') {
                      setSelectedPage('publications')
                    } else if (item === 'Projects') {
                      // open Projects editor in-place
                      setSelectedPage('projects')
                    } else if (item === 'Group') {
                      // open Group (team) editor in-place
                      setSelectedPage('group')
                    } else if (item === 'Gallery') {
                      // open Gallery editor in-place
                      setSelectedPage('gallery')
                    } else if (item === 'Citations') {
                      // open Citations editor in-place
                      setSelectedPage('citations')
                    } else {
                      navigate(path)
                      setSelectedPage(null)
                    }
              }}
              style={{
                padding: '0.5rem 0.8rem',
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                background: 'white',
                cursor: 'pointer',
                boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
              }}
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
        ) : (
          <p style={{ color: '#666' }}>Select a page button above to edit its content.</p>
        )}
      </div>
    </div>
  )
}