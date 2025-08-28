import { useState, useEffect } from "react";
import { createClient } from '@supabase/supabase-js'
import "./PublicationsPage.css";
// data will be loaded from Supabase instead of local files
import { FaSearch } from "react-icons/fa";

// Font styles
const headingfont = {
  fontFamily: "Space Mono",
  fontWeight: 800,
};

const contentFont = {
  fontFamily: "Poppins",
  fontWeight: 200,
};

function PublicationsPage() {
  const [activeSection, setActiveSection] = useState("journals");

  // Search bar
  const [searchTerm, setSearchTerm] = useState("");

  // Supabase client (shared across pages in this app)
  // Supabase client (shared across pages in this app)
  const [logos, setLogos] = useState([])
  const [logosLoading, setLogosLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY)
    ;(async () => {
      setLogosLoading(true)
      try {
  const { data, error } = await supabase.storage.from('assets').list('Logos/Publications')
        if (error) throw error
        if (!mounted) return
  const urls = (data || []).map(f => supabase.storage.from('assets').getPublicUrl(`Logos/Publications/${f.name}`).data.publicUrl)
        if (mounted) setLogos(urls)
      } catch (err) {
        console.warn('Failed to load logos from storage', err)
        if (mounted) setLogos([])
      } finally {
        if (mounted) setLogosLoading(false)
      }
    })()
    return () => { mounted = false }
    // intentionally no deps: run once on mount
  }, [])

  // Helper to see if a publication matches the search term
  const matchesSearch = (pub) => {
    if (!searchTerm) return true; // no search => show all
    const lowerSearch = searchTerm.toLowerCase();
    return (
      (pub.authors && pub.authors.toLowerCase().includes(lowerSearch)) ||
      (pub.title && pub.title.toLowerCase().includes(lowerSearch)) ||
      (pub.journal && pub.journal.toLowerCase().includes(lowerSearch)) ||
      (pub.conference && pub.conference.toLowerCase().includes(lowerSearch)) ||
      (pub.event && pub.event.toLowerCase().includes(lowerSearch)) ||
      (pub.location && pub.location.toLowerCase().includes(lowerSearch)) ||
      (pub.status && pub.status.toLowerCase().includes(lowerSearch))
    );
  };

  // Data loaded from Supabase
  const [publications, setPublications] = useState({})
  const [conferences, setConferences] = useState({})
  const [congressPresentations, setCongressPresentations] = useState({})
  const [dataLoading, setDataLoading] = useState(true)
  const [dataError, setDataError] = useState(null)

  useEffect(() => {
    let mounted = true
    const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY)
    ;(async () => {
      setDataLoading(true)
      try {
        const [pubRes, confRes, iacRes] = await Promise.all([
          supabase.from('publications').select('*').order('year', { ascending: false }),
          supabase.from('conferences').select('*').order('year', { ascending: false }),
          supabase.from('congress_presentations').select('*').order('year', { ascending: false })
        ])

        if (!mounted) return
        if (pubRes.error) throw pubRes.error
        if (confRes.error) throw confRes.error
        if (iacRes.error) throw iacRes.error

        const groupByYear = (rows) => rows.reduce((acc, r) => {
          const y = String(r.year || new Date().getFullYear())
          acc[y] = acc[y] || []
          acc[y].push(r)
          return acc
        }, {})

        if (mounted) {
          setPublications(groupByYear(pubRes.data || []))
          setConferences(groupByYear(confRes.data || []))
          setCongressPresentations(groupByYear(iacRes.data || []))
        }
      } catch (err) {
        console.error('Failed to load publications data', err)
        if (mounted) setDataError(String(err))
      } finally {
        if (mounted) setDataLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  // Render Journals
  const renderJournals = () => (
    <div className="fade-in-up section-wrapper">
      <h2 style={headingfont}>Journals</h2>
      <div className="publications-container fade-in-up">
        {Object.keys(publications)
          .sort((a, b) => b - a) // Desc by year
          .map((year) => {
            const filteredPubs = publications[year].filter(matchesSearch);
            if (filteredPubs.length === 0) return null;
            return (
              <div key={year} className="year-section fade-in-up">
                <h2 style={headingfont}>{year}</h2>
                <ol>
                  {filteredPubs.map((pub, index) => (
                    <li key={index} style={contentFont}>
                      {`${pub.authors}, "${pub.title}," ${pub.journal}, ${pub.status}.`}
                    </li>
                  ))}
                </ol>
              </div>
            );
          })}
      </div>
    </div>
  );

  // Render IAC
  const renderIAC = () => (
    <div className="fade-in-up section-wrapper">
      <h2 style={headingfont}>International Astronautical Congress (IAC)</h2>
      <div className="publications-container fade-in-up">
        {Object.keys(congressPresentations)
          .sort((a, b) => b - a)
          .map((year) => {
            const filteredPubs = congressPresentations[year].filter(
              matchesSearch
            );
            if (filteredPubs.length === 0) return null;
            return (
              <div key={year} className="year-section fade-in-up">
                <h2 style={headingfont}>{year}</h2>
                <ol>
                  {filteredPubs.map((pub, index) => (
                    <li key={index} style={contentFont}>
                      {`${pub.authors}, "${pub.title}," ${pub.event}, ${pub.location}.`}
                    </li>
                  ))}
                </ol>
              </div>
            );
          })}
      </div>
    </div>
  );

  // Render Conferences
  const renderConferences = () => (
    <div className="fade-in-up section-wrapper">
      <h2 style={headingfont}>Conferences</h2>
      <div className="publications-container fade-in-up">
        {Object.keys(conferences)
          .sort((a, b) => b - a)
          .map((year) => {
            const filteredPubs = conferences[year].filter(matchesSearch);
            if (filteredPubs.length === 0) return null;
            return (
              <div key={year} className="year-section fade-in-up">
                <h2 style={headingfont}>{year}</h2>
                <ol>
                  {filteredPubs.map((pub, index) => (
                    <li key={index} style={contentFont}>
                      {`${pub.authors}, "${pub.title}," ${pub.conference}, ${pub.status}.`}
                    </li>
                  ))}
                </ol>
              </div>
            );
          })}
      </div>
    </div>
  );

  // Decide what to render
  const renderSection = () => {
    switch (activeSection) {
      case "journals":
        return renderJournals();
      case "iac":
        return renderIAC();
      case "conferences":
        return renderConferences();
      default:
        return null;
    }
  };

  return (
    <div className="publications-page fade-in-up">
      <h1 style={{ ...headingfont, textAlign: "center", marginBottom: 20 }}>
        Where we have been featured
      </h1>

      {/* Slider */}
      <div className="slider-container fade-in-up">
        <div className="slider">
          {logosLoading ? (
            <div style={{ color: '#999', padding: 20 }}>Loading logos...</div>
          ) : logos && logos.length > 0 ? (
            logos.concat(logos).map((image, index) => (
              <div key={index} className="slider-placeholder">
                <img src={image} alt="" />
              </div>
            ))
          ) : (
            <div style={{ color: '#999', padding: 20 }}>No logos found.</div>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div
        className="search-container fade-in-up"
        style={{
          position: "relative",
          maxWidth: "400px",
          margin: "20px auto",
        }}
      >
        <input
          type="text"
          placeholder="Search Publications..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            ...contentFont,
            width: "100%",
            padding: "10px 40px 10px 10px",
            borderRadius: "10px",
            border: "1px solid #ccc",
            outline: "none",
            backgroundColor: "#011317",
            color: "white",
          }}
        />
        <span
          style={{
            position: "absolute",
            top: "50%",
            right: "10px",
            transform: "translateY(-50%)",
            pointerEvents: "none",
            color: "#999",
          }}
        >
          <FaSearch />
        </span>
      </div>

      {/* Navigation Buttons */}
      <div className="nav-buttons fade-in-up">
        <button
          className={activeSection === "journals" ? "active" : ""}
          onClick={() => setActiveSection("journals")}
          style={contentFont}
        >
          Journals
        </button>
        <button
          className={activeSection === "iac" ? "active" : ""}
          onClick={() => setActiveSection("iac")}
          style={contentFont}
        >
          International Astronautical Congress (IAC)
        </button>
        <button
          className={activeSection === "conferences" ? "active" : ""}
          onClick={() => setActiveSection("conferences")}
          style={contentFont}
        >
          Conferences
        </button>
      </div>

      {/* Section Content */}
      <div className="section-content fade-in-up" style={contentFont}>
        {dataLoading ? (
          <div style={{ color: '#999', padding: 12 }}>Loading publications...</div>
        ) : dataError ? (
          <div style={{ color: 'salmon', padding: 12 }}>{dataError}</div>
        ) : (
          renderSection()
        )}
      </div>
    </div>
  );
}

export default PublicationsPage;