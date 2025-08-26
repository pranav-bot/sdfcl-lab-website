import { useState, useEffect } from "react";
import { createClient } from '@supabase/supabase-js'
import "./CitationsPage.css";

const headingfont = {
  fontFamily: "Space Mono",
  fontWeight: 800,
};

const contentFont = {
  fontFamily: "Poppins",
  fontWeight: 200,
};

function CitationsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [citations, setCitations] = useState({});
  const [external, setExternal] = useState([])
  const [talks, setTalks] = useState({})
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCitations, setShowCitations] = useState(true)
  const [showTalks, setShowTalks] = useState(true)
  const [showExternal, setShowExternal] = useState(true)

  useEffect(() => {
    let mounted = true;
    const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY)
    ;(async () => {
      setLoading(true)
      try {
        const [citRes, extRes, talkRes] = await Promise.all([
          supabase.from('academic_citations').select('*').order('year', { ascending: false }),
          supabase.from('external_reviewer_assignments').select('*'),
          supabase.from('assignments_invited_talks').select('*').order('year', { ascending: false })
        ])

        if (!mounted) return

        if (citRes.error) throw citRes.error
        if (extRes.error) throw extRes.error
        if (talkRes.error) throw talkRes.error

        const groupByYear = (rows) => (rows || []).reduce((acc, r) => {
          const y = String(r.year || new Date().getFullYear())
          acc[y] = acc[y] || []
          acc[y].push(r)
          return acc
        }, {})

        if (mounted) {
          setCitations(groupByYear(citRes.data || []))
          setExternal(extRes.data || [])
          setTalks(groupByYear(talkRes.data || []))
        }
      } catch (err) {
        console.error('Failed to load citations/external/talks', err)
        if (mounted) setError(String(err))
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  const matchesSearch = (c) => {
    if (!searchTerm) return true
    const s = searchTerm.toLowerCase()
    return (
      (c.title && c.title.toLowerCase().includes(s)) ||
      (c.organization && c.organization.toLowerCase().includes(s)) ||
      (c.description && c.description.toLowerCase().includes(s))
    )
  }

  const matchesTalkSearch = (t) => {
    if (!searchTerm) return true
    const s = searchTerm.toLowerCase()
    return (
      (t.title && t.title.toLowerCase().includes(s)) ||
      (t.event && t.event.toLowerCase().includes(s)) ||
      (t.location && t.location.toLowerCase().includes(s)) ||
      (t.type && t.type.toLowerCase().includes(s)) ||
      (t.role && t.role.toLowerCase().includes(s))
    )
  }

  const matchesExternalSearch = (e) => {
    if (!searchTerm) return true
    const s = searchTerm.toLowerCase()
    return (e.journal_name && e.journal_name.toLowerCase().includes(s))
  }

  const totalCitations = Object.values(citations).flat().length
  const totalTalks = Object.values(talks).flat().length
  const totalExternal = external.length

  return (
    <div className="citations-page fade-in-up">
      <h1 style={{ ...headingfont, textAlign: 'center', marginBottom: 12 }}>Academic Citations</h1>

      <div className="summary-row">
        <div className="summary-card">
          <div className="summary-number">{totalCitations}</div>
          <div className="summary-label">Citations</div>
        </div>
        <div className="summary-card">
          <div className="summary-number">{totalTalks}</div>
          <div className="summary-label">Talks / Assignments</div>
        </div>
        <div className="summary-card">
          <div className="summary-number">{totalExternal}</div>
          <div className="summary-label">External Reviewers</div>
        </div>
      </div>

      <div className="search-container">
        <input
          type="text"
          placeholder="Search (title, org, event, journal...)"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="section-content" style={contentFont}>
        {loading ? (
          <div style={{ color: '#999', padding: 12 }}>Loading citations...</div>
        ) : error ? (
          <div style={{ color: 'salmon', padding: 12 }}>{error}</div>
        ) : (
          <div>
            {/* Academic citations grouped by year (collapsible) */}
            <div className="panel">
              <div className="panel-header">
                <div>
                  <h2 style={headingfont} className="panel-title">Citations</h2>
                  <div className="panel-sub">Grouped by year — {totalCitations} total</div>
                </div>
                <div>
                  <button className="toggle-button" onClick={() => setShowCitations(s => !s)}>{showCitations ? 'Hide' : 'Show'}</button>
                </div>
              </div>
              {showCitations && (
                <div className="panel-body">
                  {Object.keys(citations).sort((a,b) => b - a).map(year => {
                    const list = (citations[year] || []).filter(matchesSearch)
                    if (list.length === 0) return null
                    return (
                      <div key={year} className="year-section">
                        <h3 style={headingfont} className="year-title">{year}</h3>
                        <div className="cards-grid">
                          {list.map((c, idx) => (
                            <div key={idx} className="citation-card">
                              <div className="citation-title">{c.title}</div>
                              {c.organization && <div className="citation-org">{c.organization}</div>}
                              {c.description && <div className="citation-desc">{c.description}</div>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Invited talks / assignments (come before external) */}
            <div className="panel">
              <div className="panel-header">
                <div>
                  <h2 style={headingfont} className="panel-title">Assignments & Invited Talks</h2>
                  <div className="panel-sub">{totalTalks} records — grouped by year</div>
                </div>
                <div>
                  <button className="toggle-button" onClick={() => setShowTalks(s => !s)}>{showTalks ? 'Hide' : 'Show'}</button>
                </div>
              </div>
              {showTalks && (
                <div className="panel-body">
                  {Object.keys(talks).sort((a,b) => b - a).map(year => {
                    const list = (talks[year] || []).filter(matchesTalkSearch)
                    if (list.length === 0) return null
                    return (
                      <div key={year} className="year-section">
                        <h3 style={headingfont} className="year-title">{year}</h3>
                        <div className="cards-grid">
                          {list.map((t, idx) => (
                            <div key={idx} className="citation-card">
                              <div className="citation-title">{t.title}</div>
                              <div className="citation-org">{t.event || t.location}</div>
                              <div className="citation-desc">{t.type}{t.role ? ` — ${t.role}` : ''}{t.date ? ` • ${t.date}` : ''}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* External reviewer assignments (now after talks) */}
            <div className="panel">
              <div className="panel-header">
                <div>
                  <h2 style={headingfont} className="panel-title">External Reviewer Assignments</h2>
                  <div className="panel-sub">{totalExternal} journals</div>
                </div>
                <div>
                  <button className="toggle-button" onClick={() => setShowExternal(s => !s)}>{showExternal ? 'Hide' : 'Show'}</button>
                </div>
              </div>
              {showExternal && (
                <div className="panel-body">
                  {external && external.length > 0 ? (
                    <div className="cards-grid">
                      {external.filter(matchesExternalSearch).map((e) => (
                        <div key={e.id} className="citation-card small-card">{e.journal_name}</div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ color: '#999' }}>No external reviewer assignments found.</div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CitationsPage;
