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
      // new schema: research_summary is a table of rows { id, title, items[] }
      const [homeRes, teachRes] = await Promise.all([
        supabase.from('research_summary').select('*').order('id', { ascending: false }),
        supabase.from('teaching').select('*').order('year', { ascending: false })
      ])

      if (homeRes.error) throw homeRes.error
      if (teachRes.error) throw teachRes.error

      // homeRes.data now is an array of section rows
      const rows = Array.isArray(homeRes.data) ? homeRes.data : []
      setHomeData(rows)
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
            ) : homeData && Array.isArray(homeData) && homeData.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 20, backgroundColor: '#0c0c0f', padding: 8, borderRadius: 8 }}>
                {homeData.map((row, i) => {
                  const title = row.title || row.name || `Section ${i + 1}`
                  const items = Array.isArray(row.items) ? row.items : (row.items ? [String(row.items)] : [])
                  return (
                    <div key={i} style={{ backgroundColor: '#0b3d2e', border: '1px solid #ddd', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', borderRadius: 8, padding: 20, width: 300, textAlign: 'left', color: 'white' }}>
                      <h3 style={{ ...headingfont, color: 'white', marginTop: 0 }}>{title}</h3>
                      {items.length > 0 ? (
                        <ul style={{ paddingLeft: 20, marginTop: 8 }}>
                          {items.map((item, idx) => (
                            <li key={idx} style={{ marginBottom: 8 }}><p style={{ ...contentFont, color: 'white', margin: 0 }}>{item}</p></li>
                          ))}
                        </ul>
                      ) : (
                        <p style={{ ...contentFont, color: 'white', marginTop: 8 }}>No items</p>
                      )}
                    </div>
                  )
                })}
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