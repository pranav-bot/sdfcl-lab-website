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

  // load home page data from DB
  async function loadHomePage() {
    setLoadingHome(true)
    setHomeError(null)
    try {
      const res = await supabase.from('home_page').select('*').order('id', { ascending: false }).limit(1)
      if (res.error) throw res.error
      const row = Array.isArray(res.data) && res.data.length > 0 ? res.data[0] : null
      setHomeData(row)
    } catch (err) {
      setHomeError(String(err))
    } finally {
      setLoadingHome(false)
    }
  }

  useEffect(() => {
    loadHomePage()
  }, [])

  return (
    <div
      className="research-page-container fade-in-up"
      style={{
        backgroundColor: "#011317",
        padding: "20px",
        paddingBottom: "500px",
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
              ) : homeData && homeData.research_and_training_summary ? (
                <div className="research-boxes">
                  {Object.entries(homeData.research_and_training_summary).map(([k, v], i) => (
                    <div className="research-box" key={i}>
                      <h3 style={headingfont}>{k}</h3>
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
    </div>
  );
}

export default ResearchPage;