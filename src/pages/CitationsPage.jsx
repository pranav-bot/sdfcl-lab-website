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
  const [activeTab, setActiveTab] = useState('citations')
  const [sortDirection, setSortDirection] = useState('desc')
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // simplified layout: no collapsible sections

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

  // flatten grouped objects into arrays for simple grids
  const flatCitations = Object.values(citations).flat()
  const flatTalks = Object.values(talks).flat()
  const totalCitations = flatCitations.length
  const totalTalks = flatTalks.length
  const totalExternal = external.length

  const filteredCitations = flatCitations.filter(matchesSearch)
  const filteredTalks = flatTalks.filter(matchesTalkSearch)
  const filteredExternal = external.filter(matchesExternalSearch)

  const sortRowsByYear = (rows) => {
    const dir = sortDirection === 'asc' ? 1 : -1
    return [...rows].sort((a, b) => {
      const ay = Number.parseInt(a?.year, 10)
      const by = Number.parseInt(b?.year, 10)
      const aYear = Number.isFinite(ay) ? ay : 0
      const bYear = Number.isFinite(by) ? by : 0
      return (aYear - bYear) * dir
    })
  }

  const sortedCitations = sortRowsByYear(filteredCitations)
  const sortedTalks = sortRowsByYear(filteredTalks)

  const renderCitationItems = () => {
    if (sortedCitations.length === 0) {
      return <div className="tab-empty">No citations match your search.</div>
    }

    return sortedCitations.map((c, idx) => (
      <div key={c.id || `citation-${idx}`} className="teaching-like-card">
        <div className="teaching-like-card-left">
          <div className="teaching-like-year">{c.year || '-'}</div>
        </div>
        <div className="teaching-like-card-right">
          <h3 className="teaching-like-title">{c.title}</h3>
          {c.organization && <p className="teaching-like-subtitle">{c.organization}</p>}
          {c.description && <p className="teaching-like-desc">{c.description}</p>}
        </div>
      </div>
    ))
  }

  const renderTalkItems = () => {
    if (sortedTalks.length === 0) {
      return <div className="tab-empty">No talks match your search.</div>
    }

    return sortedTalks.map((t, idx) => (
      <div key={t.id || `talk-${idx}`} className="teaching-like-card">
        <div className="teaching-like-card-left">
          <div className="teaching-like-year">{t.year || '-'}</div>
        </div>
        <div className="teaching-like-card-right">
          <h3 className="teaching-like-title">{t.title || t.event || 'Assignment / Talk'}</h3>
          {(t.event || t.location) && <p className="teaching-like-subtitle">{t.event || t.location}</p>}
          {(t.type || t.role || t.date) && (
            <p className="teaching-like-desc">
              {t.type || 'Talk'}{t.role ? ` - ${t.role}` : ''}{t.date ? ` | ${t.date}` : ''}
            </p>
          )}
        </div>
      </div>
    ))
  }

  const renderExternalItems = () => {
    if (filteredExternal.length === 0) {
      return <div className="tab-empty">No external reviewer assignments found.</div>
    }

    return filteredExternal.map((e, idx) => (
      <div key={e.id || `external-${idx}`} className="teaching-like-card">
        <div className="teaching-like-card-right">
          <h3 className="teaching-like-title">{e.journal_name}</h3>
          <p className="teaching-like-subtitle">External Reviewer Assignment</p>
        </div>
      </div>
    ))
  }

  return (
    <div className="citations-page fade-in-up">
      <h1 style={{ ...headingfont, textAlign: 'center', marginBottom: 12 }}>Citations</h1>

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

      <div className="sort-row">
        <button
          type="button"
          className="sort-button"
          onClick={() => setSortDirection((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
        >
          Sort by year: {sortDirection === 'desc' ? 'Newest First' : 'Oldest First'}
        </button>
      </div>

      <div className="mini-tabs" role="tablist" aria-label="Citation categories">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'citations'}
          className={`mini-tab ${activeTab === 'citations' ? 'active' : ''}`}
          onClick={() => setActiveTab('citations')}
        >
          Citations ({filteredCitations.length})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'talks'}
          className={`mini-tab ${activeTab === 'talks' ? 'active' : ''}`}
          onClick={() => setActiveTab('talks')}
        >
          Talks / Assignments ({filteredTalks.length})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'external'}
          className={`mini-tab ${activeTab === 'external' ? 'active' : ''}`}
          onClick={() => setActiveTab('external')}
        >
          External Reviewers ({filteredExternal.length})
        </button>
      </div>

      <div className="section-content" style={contentFont}>
        {loading ? (
          <div style={{ color: '#999', padding: 12 }}>Loading citations...</div>
        ) : error ? (
          <div style={{ color: 'salmon', padding: 12 }}>{error}</div>
        ) : (
          <div className="teaching-like-list" role="tabpanel" aria-live="polite">
            {activeTab === 'citations' && renderCitationItems()}
            {activeTab === 'talks' && renderTalkItems()}
            {activeTab === 'external' && renderExternalItems()}
          </div>
        )}
      </div>
    </div>
  )
}

export default CitationsPage;
