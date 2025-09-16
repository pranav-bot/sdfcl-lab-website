import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import './ProjectsPage.css'
import './CollaboratorsPage.css'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

export default function CollaboratorsPage() {
  const [collaborators, setCollaborators] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase.from('collaborators').select('*').order('name', { ascending: true })
      if (error) throw error

      // Resolve storage paths to public URLs when needed
      const resolved = await Promise.all((data || []).map(async (c) => {
        let photo = c.photo || ''
        if (photo && !photo.startsWith('http')) {
          try {
            const { data: urlData } = await supabase.storage.from('assets').getPublicUrl(photo)
            photo = urlData?.publicUrl || photo
          } catch {
            // keep original
          }
        }
        return { ...c, photo }
      }))

      setCollaborators(resolved)
    } catch (err) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  return (
    <div className="collaborators-page-container">
      <h1>Collaborators</h1>
      {loading && <p>Loading collaborators...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <div className="collaborators-grid">
        {collaborators.map((c) => (
          <div key={c.id || c.name} className="collab-card">
            {c.photo ? (
              <img src={c.photo} alt={c.name} className="collab-photo" />
            ) : (
              <div className="collab-photo" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#072121' }}>No image</div>
            )}
            <h3 className="collab-name">{c.name}</h3>
            <div className="collab-title">{c.title}</div>
            <p className="collab-content">{c.content}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
