import { useState, useEffect } from "react";
import "./ResearchPage.css";
import { createClient } from '@supabase/supabase-js'

// Define heading + content fonts
const headingfont = {
  fontFamily: "Space Mono",
  fontWeight: 800,
};

const contentFont = {
  fontFamily: "Poppins",
  fontWeight: 200,
};

// supabase client for loading home page content
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)


function ResearchPage() {
  // home page data (research & teaching summary) loaded from DB
  const [homeData, setHomeData] = useState(null)
  const [loadingHome, setLoadingHome] = useState(false)
  const [homeError, setHomeError] = useState(null)
  // teaching table
  const [teachingData, setTeachingData] = useState([])
  const [loadingTeaching, setLoadingTeaching] = useState(false)
  const [teachingError, setTeachingError] = useState(null)

  // load home page data and teaching table from DB
  async function loadContent() {
    setLoadingHome(true)
    setHomeError(null)
    setLoadingTeaching(true)
    setTeachingError(null)
    try {
      const [homeRes, teachRes] = await Promise.all([
        supabase.from('research_summary').select('*').order('id', { ascending: false }).limit(1),
        supabase.from('teaching').select('*').order('year', { ascending: false })
      ])

      if (homeRes.error) throw homeRes.error
      if (teachRes.error) throw teachRes.error

  const row = Array.isArray(homeRes.data) && homeRes.data.length > 0 ? homeRes.data[0] : null
  // some installs keep the summary nested under `research_and_training_summary`; prefer that if present
  const summaryObj = row ? (row.research_and_training_summary || row) : null
  setHomeData(summaryObj)
      setTeachingData(Array.isArray(teachRes.data) ? teachRes.data : [])
    } catch (err) {
      const s = String(err)
      // attribute errors to appropriate state
      setHomeError(s)
      setTeachingError(s)
    } finally {
      setLoadingHome(false)
      setLoadingTeaching(false)
    }
  }

  useEffect(() => {
    loadContent()
  }, [])

  return (
    <div
      className="research-page-container fade-in-up"
      style={{
        backgroundColor: "#011317",
        padding: "",
        paddingBottom: "50px",
      }}
    >
      {/* Research & Teaching Summary (moved from HomePage) */}
      <div className="research-teaching-summary" style={{ paddingTop: 40 }}>
        <h1 style={{ ...headingfont, textAlign: "center", marginBottom: 20 }}>
          Research & Teaching Summary
        </h1>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: '90%' }}>
            {loadingHome ? (
              <div style={{ textAlign: 'center', width: '100%' }}>Loading summary...</div>
            ) : homeError ? (
              <div style={{ color: 'red', textAlign: 'center' }}>{homeError}</div>
            ) : homeData ? (
              <div className="research-boxes">
                  {Object.entries(homeData)
                    .filter(([k]) => !['id', 'created_at', 'createdAt'].includes(k))
                    .map(([k, v], i) => (
                  <div className="research-box" key={i}>
                    <h3 style={headingfont}>{k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</h3>
                    {Array.isArray(v) ? (
                      <ul>
                        {v.map((item, idx) => (
                          <li key={idx}><p style={contentFont}>{item}</p></li>
                        ))}
                      </ul>
                    ) : (
                      <p style={contentFont}>{v}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', width: '100%' }}>No research summary available.</div>
            )}
          </div>
        </div>
      </div>

      {/* Teaching table below the summary */}
      <div style={{ marginTop: 30 }}>
        <h2 style={{ ...headingfont, textAlign: 'center', marginBottom: 12, color: 'white' }}>Teaching</h2>
        {loadingTeaching ? (
          <div style={{ textAlign: 'center', color: 'white' }}>Loading teaching records...</div>
        ) : teachingError ? (
          <div style={{ color: 'salmon', textAlign: 'center' }}>{teachingError}</div>
        ) : teachingData && teachingData.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <div style={{ background: '#021617', padding: 12, borderRadius: 8 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', color: '#fff' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: 10, background: 'rgba(255,255,255,0.03)', color: '#fff' }}>Role</th>
                    <th style={{ textAlign: 'left', padding: 10, background: 'rgba(255,255,255,0.03)', color: '#fff' }}>Course</th>
                    <th style={{ textAlign: 'left', padding: 10, background: 'rgba(255,255,255,0.03)', color: '#fff' }}>Year</th>
                  </tr>
                </thead>
                <tbody>
                  {teachingData.map((t, idx) => (
                    <tr key={idx} style={{ borderTop: '1px solid rgba(255,255,255,0.03)', background: idx % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent', transition: 'background 0.15s' }}>
                      <td style={{ padding: 10 }}>{t.role}</td>
                      <td style={{ padding: 10 }}>{t.course_title}</td>
                      <td style={{ padding: 10 }}>{t.year}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', color: 'white' }}>No teaching records found.</div>
        )}
      </div>
    </div>
  );
}

export default ResearchPage;