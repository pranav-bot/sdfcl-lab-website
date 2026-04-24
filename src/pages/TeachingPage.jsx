import { useState, useEffect } from 'react'
import './TeachingPage.css'
import { createClient } from '@supabase/supabase-js'

// supabase client (same pattern as other pages)
const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY)

const headingfont = { fontFamily: 'Space Mono', fontWeight: 800 }

function normalizeYears(years) {
  if (!Array.isArray(years)) return []
  return [...new Set(years.map(Number).filter(Number.isInteger))].sort((a, b) => b - a)
}

export default function TeachingPage() {
  const [teaching, setTeaching] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const { data, error } = await supabase
          .from('teaching')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) throw error
        if (mounted) setTeaching(Array.isArray(data) ? data : [])
      } catch (err) {
        if (mounted) setError(err.message || String(err))
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  return (
    <div className="teaching-page-container" style={{ padding: 20, backgroundColor: '#011317', minHeight: '70vh' }}>
      <h2 style={{ ...headingfont, color: 'white', textAlign: 'center' }}>Teaching</h2>

      <div style={{ maxWidth: 760, margin: '0 auto 18px' }}>
      </div>

      {loading ? (
        <p style={{ color: 'white', textAlign: 'center' }}>Loading teaching data...</p>
      ) : error ? (
        <p style={{ color: 'salmon', textAlign: 'center' }}>Error loading teaching data: {error}</p>
      ) : teaching.length === 0 ? (
        <p style={{ color: '#c7efe7', textAlign: 'center' }}>No teaching records found.</p>
      ) : (
        <div className="teaching-list">
          {teaching.map((t) => (
            <div key={t.id} className="teaching-card">
              <div className="teaching-card-left">
                <div className="teaching-years-box">
                  <div className="teaching-years-label">Years</div>
                  <div className="teaching-years-list">
                    {normalizeYears(t.years).length > 0 ? (
                      normalizeYears(t.years).map((year) => (
                        <span key={`${t.id}-${year}`} className="teaching-year-chip">{year}</span>
                      ))
                    ) : (
                      <span className="teaching-year-empty">N/A</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="teaching-card-right">
                <h3 className="teaching-course">{t.course_name}</h3>
                {t.description && <p className="teaching-desc">{t.description}</p>}
                {/* No links: simplified card UI */}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
