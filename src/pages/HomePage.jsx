import { useState, useEffect } from 'react';
import './HomePage.css';
import { createClient } from '@supabase/supabase-js'

// no hardcoded fallbacks; data is loaded from the DB/storage

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

// logos will be loaded from storage

// dynamic logos will be loaded inside the component (useState/hooks must be inside the component)


function HomePage() {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [backgroundVideos, setBackgroundVideos] = useState([])
  const [videoError, setVideoError] = useState(null)
  const [loadingVideos, setLoadingVideos] = useState(false)

  // Home title/content from DB
  const [homeTitle, setHomeTitle] = useState('')
  const [homeContent, setHomeContent] = useState('')
  const [homeLoading, setHomeLoading] = useState(true)

  // logos state and loader
  // collaborator logos are managed elsewhere; not used on this page

  // topics state + loader (new)
  const [topics, setTopics] = useState([])
  const [topicsError, setTopicsError] = useState(null)
  const [loadingTopics, setLoadingTopics] = useState(false)
  // announcements
  const [announcements, setAnnouncements] = useState([])
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(false)
  const [announcementsError, setAnnouncementsError] = useState(null)
  // home page data from DB



  async function loadBackgroundVideos() {
  setVideoError(null)
  setLoadingVideos(true)
  try {
      // try manifest first
      const manifestRes = await supabase.storage.from('assets').download('Videos/index.json')
      if (!manifestRes.error && manifestRes.data) {
        const txt = await manifestRes.data.text()
        try {
          const names = JSON.parse(txt)
          const urls = names.map((n) => supabase.storage.from('assets').getPublicUrl(`Videos/${n}`).data.publicUrl)
          setBackgroundVideos(urls)
          return
        } catch {
          setVideoError('Videos/index.json invalid; falling back to listing')
        }
      }

      // fallback: try listing
      const res = await supabase.storage.from('assets').list('Videos', { limit: 200 })
      if (!res.error && res.data && res.data.length > 0) {
        const urls = res.data.map((f) => supabase.storage.from('assets').getPublicUrl(`Videos/${f.name}`).data.publicUrl)
        setBackgroundVideos(urls)
        return
      }

      // last resort: keep existing fallbackBackgroundVideos
    } catch (err) {
      setVideoError(String(err))
    } finally {
      setLoadingVideos(false)
    }
  }

  async function loadTopics() {
    setTopicsError(null)
    setLoadingTopics(true)
    try {
      const { data, error } = await supabase.from('topics').select('*')
      if (error) {
        setTopicsError(error.message || String(error))
        return
      }
      if (!data || data.length === 0) {
        // no topics, leave topics empty
        return
      }

      // Resolve storage public URLs (if image_path is a storage path)
      const resolved = await Promise.all(
        data.map(async (t) => {
          // decide property names based on your table schema
          const title = t.title || t.name || t.topic || ''
          const description = t.description || t.content || ''
          let image = t.image || t.image_path || t.image_url || ''

          if (image && !image.startsWith('http')) {
            // assume storage path like 'Topics/t1.jpg'
            try {
              const { data: urlData } = await supabase.storage.from('assets').getPublicUrl(image)
              image = urlData?.publicUrl || image
            } catch {
              // keep original string
            }
          }

          return {
            title,
            description,
            image,
            // keep any other fields if needed
            ...t,
          }
        })
      )

      setTopics(resolved)
    } catch (err) {
      setTopicsError(String(err))
    } finally {
      setLoadingTopics(false)
    }
  }

  async function loadAnnouncements() {
    setAnnouncementsError(null)
    setLoadingAnnouncements(true)
    try {
  const { data, error } = await supabase.from('announcements').select('*').order('created_at', { ascending: false }).limit(5)
      if (error) {
        setAnnouncementsError(error.message || String(error))
        return
      }
  // ensure descending by created_at and limit to 5 on client as safety
  const sorted = Array.isArray(data) ? data.slice().sort((a,b) => new Date(b.created_at) - new Date(a.created_at)).slice(0,5) : []
  setAnnouncements(sorted)
    } catch (err) {
      setAnnouncementsError(String(err))
    } finally {
      setLoadingAnnouncements(false)
    }
  }

  // load home page data from DB


  const Separator = () => (
    <div
      className="fade-in-up"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        margin: "20px 0",
      }}
    >
      <div
        style={{
          backgroundColor: "yellow",
          height: "2px",
          width: "30px",
          margin: "0 5px",
        }}
      ></div>
      <div
        style={{
          width: "8px",
          height: "8px",
          backgroundColor: "yellow",
          transform: "rotate(45deg)",
          margin: "0 5px",
        }}
      ></div>
      <div
        style={{
          backgroundColor: "yellow",
          height: "2px",
          width: "30px",
          margin: "0 5px",
        }}
      ></div>
    </div>
  );

  // load videos & logos & topics once on mount
  useEffect(() => {
  loadBackgroundVideos()
  loadTopics() // <-- added
  loadAnnouncements()
  loadHomeFromDB()
  }, [])

  async function loadHomeFromDB() {
    setHomeLoading(true)
    try {
      const res = await supabase.from('home_page').select('*').order('created_at', { ascending: false }).limit(1)
      if (res.error) {
        console.error(res.error)
      } else if (Array.isArray(res.data) && res.data.length > 0) {
        const row = res.data[0]
        setHomeTitle(row.title ?? row.who_title ?? '')
        setHomeContent(row.content ?? row.who_paragraph ?? '')
      } else {
        setHomeTitle('')
        setHomeContent('')
      }
    } catch (err) {
      console.error('loadHomeFromDB error', err)
    } finally {
      setHomeLoading(false)
    }
  }

  // rotate videos whenever the list length changes
  useEffect(() => {
    if (!backgroundVideos || backgroundVideos.length === 0) return
    const interval = setInterval(() => {
      setCurrentVideoIndex((prevIndex) => (prevIndex + 1) % backgroundVideos.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [backgroundVideos]);

  return (
    <>
      {/* Parallax Container for Background Videos & Parallax Sections */}
      <div className="parallax-container">
        <div className="video-container">
          {loadingVideos ? (
            <div style={{ textAlign: 'center', width: '100%', padding: 20 }}>Loading background videos...</div>
          ) : backgroundVideos && backgroundVideos.length > 0 ? (
            backgroundVideos.map((videoSrc, index) => (
              <video
                key={index}
                src={videoSrc}
                autoPlay
                muted
                loop
                className={`background-video ${index === currentVideoIndex ? 'active' : ''}`}
              />
            ))
          ) : (
            <div style={{ textAlign: 'center', width: '100%', padding: 20 }}>No background videos available.</div>
          )}
        </div>
        {videoError && (
          <div style={{ color: 'red', padding: '8px 0', textAlign: 'center' }}>{videoError}</div>
        )}

        <div className="parallax-section who-we-are fade-in-up">
          <div className="parallax-content fade-in-up">
            <h1 style={headingfont}>{homeLoading ? 'Loading...' : homeTitle || 'Who We Are'}</h1>
            <Separator></Separator>
            <p style={contentFont}>{homeLoading ? 'Loading content...' : (homeContent || '')}</p>
          </div>
        </div>

        {/* Announcements block: appears just under Who We Are */}
        {(loadingAnnouncements || announcements.length > 0) && (
          <div className="parallax-section announcements fade-in-up" style={{ backgroundColor: '#011317' }}>
            <h1 style={headingfont}>Announcements</h1>
            <Separator />

            {announcementsError && <div style={{ color: 'red', textAlign: 'center' }}>{announcementsError}</div>}

            <div className="announcements-list" style={{ width: '100%', maxWidth: 900, margin: '0 auto' }}>
              {loadingAnnouncements ? (
                <div style={{ textAlign: 'center', padding: 12 }}>Loading announcements...</div>
              ) : announcements && announcements.length > 0 ? (
                announcements.map((a) => {
                  const created = a.created_at ? new Date(a.created_at) : null
                  const isNew = created ? ((Date.now() - created.getTime()) <= 7 * 24 * 60 * 60 * 1000) : false
                  return (
                  <div key={a.id} className="announcement-item">
                    <div className="announcement-header">
                      <strong style={{ fontSize: '1.05rem' }}>{a.title || 'Untitled'}</strong>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        {a.link ? (
                          <a href={a.link} target="_blank" rel="noreferrer" style={{ color: '#9bd8cf', fontSize: '0.95rem' }}>Link</a>
                        ) : null}
                        <span className="announcement-date">{a.created_at ? new Date(a.created_at).toLocaleDateString() : ''}</span>
                        {isNew && <span className="announcement-new">NEW</span>}
                      </div>
                    </div>
                    {a.content ? <p className="announcement-content">{a.content}</p> : null}
                  </div>
                  )
                })
              ) : (
                <div style={{ textAlign: 'center', padding: 12, color: '#c7efe7' }}>No announcements at the moment.</div>
              )}
            </div>
          </div>
        )}

              {/* Separate Section for Research & Teaching Summary */}
      {/* <div className="research-teaching-summary"> */}
      {/* <h1 style={{ ...headingfont, textAlign: "center", marginBottom: 20 }}>
        Collaborators
      </h1> */}
      {/* <Separator></Separator> */}
              {/* Slider */}
      {/* <div className="slider-container fade-in-up">
        <div className="slider">
          {logosError && <div style={{ color: 'red', textAlign: 'center' }}>{logosError}</div>}
          {loadingLogos ? (
            <div style={{ textAlign: 'center', width: '100%' }}>Loading collaborators...</div>
          ) : logosList && logosList.length > 0 ? (
            logosList.concat(logosList).map((image, index) => (
              <div key={index} className="slider-placeholder">
                <img src={image} alt="" />
              </div>
            ))
          ) : (
            <div style={{ textAlign: 'center', width: '100%' }}>No collaborators to display.</div>
          )}
        </div>
      </div> */}
  {/* Research & Teaching Summary moved to the Research page */}
      {/* </div> */}

        {/* {(loadingTopics || (topics && topics.length > 0)) && (
          // <div className="parallax-section topics fade-in-up" style={{ backgroundColor: '#011317' }}>
          //   <h1 style={headingfont}>Topics That Fascinate Us</h1>
          //   <Separator></Separator>

          //   {topicsError && <div style={{ color: 'red', textAlign: 'center' }}>{topicsError}</div>}

          //   <div className="topics-scroll-container fade-in-up">
          //     <div className="topics-container">
          //       {loadingTopics ? (
          //         <div style={{ textAlign: 'center', width: '100%' }}>Loading topics...</div>
          //       ) : topics && topics.length > 0 ? (
          //         topics.map((topic, index) => (
          //           <div key={index} className={`topic-item fade-in-up ${index % 2 === 1 ? 'reverse' : ''}`}>
          //             <div className="topic-image fade-in-up">
          //               <img src={topic.image || topic.image_url || topic.image_path} alt={topic.title || topic.name} />
          //             </div>
          //             <div className="topic-content fade-in-up">
          //               <h2 style={subHeadingFont}>{topic.title || topic.name}</h2>
          //               <p style={subContentFont}>{topic.description || topic.content}</p>
          //             </div>
          //           </div>
          //         ))
          //       ) : null}
          //     </div>
          //   </div>
          // </div>
        )} */}
      </div>
    </>
  );
}

export default HomePage;

const headingfont = {
  fontFamily: 'Space Mono',
  fontWeight: 800,
};

const contentFont = {
  fontFamily: 'Roboto Mono',
  fontWeight: 200,
};

const subHeadingFont = {
  fontFamily: 'Poppins',
  fontWeight: 800,
};

const subContentFont = {
  fontFamily: 'Ubuntu',
  fontWeight: 200,
};
