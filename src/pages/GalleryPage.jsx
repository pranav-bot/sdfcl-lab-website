import { useState, useEffect } from 'react';
import './GalleryPage.css';
import { createClient } from '@supabase/supabase-js'

// supabase client
const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY)

// 1) Define heading and content fonts
const headingfont = {
  fontFamily: 'Space Mono',
  fontWeight: 800,
};

const contentFont = {
  fontFamily: 'Poppins',
  fontWeight: 200,
};



// 2) Define categories (plus “All”) - categories are derived from DB rows


function GalleryPage() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [activeCategory, setActiveCategory] = useState('All');
  const [images, setImages] = useState([])
  const [filteredImages, setFilteredImages] = useState([])
  const [categories, setCategories] = useState(['All'])
  const [loading, setLoading] = useState(false)

  // load gallery rows from DB on mount
  useEffect(() => {
    let mounted = true
    ;(async () => {
      setLoading(true)
      try {
        const { data, error } = await supabase.from('gallery').select('*').order('created_at', { ascending: false })
        if (error) throw error
        const mapped = (data || []).map((r) => {
          const isUrl = r.src?.startsWith('http')
          return {
            id: r.id,
            src: isUrl ? r.src : supabase.storage.from('assets').getPublicUrl(r.src).data.publicUrl,
            caption: r.caption || '',
            category: r.category || 'Uncategorized'
          }
        })
        if (!mounted) return
        setImages(mapped)
        setFilteredImages(mapped)
        // derive categories from rows
        const derived = Array.from(new Set(['All', ...mapped.map((m) => m.category)]))
        setCategories(derived)
      } catch (err) {
        console.error('Gallery load error', err)
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  // filter when activeCategory changes
  useEffect(() => {
    if (activeCategory === 'All') setFilteredImages(images)
    else setFilteredImages(images.filter((img) => img.category === activeCategory))
  }, [activeCategory, images])

  // 4) Modal open/close
  const handleImageClick = (image) => {
    setSelectedImage(image);
  };
  const handleCloseModal = () => {
    setSelectedImage(null);
  };

  // 5) Next/Prev slider logic
  const handleNext = (e) => {
    e.stopPropagation();
    if (!selectedImage) return;
    const currentIndex = filteredImages.findIndex((img) => img.id === selectedImage.id);
    const nextIndex = (currentIndex + 1) % filteredImages.length;
    setSelectedImage(filteredImages[nextIndex]);
  };

  const handlePrev = (e) => {
    e.stopPropagation();
    if (!selectedImage) return;
    const currentIndex = filteredImages.findIndex((img) => img.id === selectedImage.id);
    const prevIndex = (currentIndex - 1 + filteredImages.length) % filteredImages.length;
    setSelectedImage(filteredImages[prevIndex]);
  };

  return (
    <div className="page-container fade-in-up" style={contentFont}>
      <div className="gallery-container fade-in-up">
        {/* Page Heading */}
        <h1 style={{ ...headingfont, marginBottom: '0.5rem' }}>Gallery</h1>
        <p style={{ marginBottom: '2rem' }}>
          Hover over an image to see its caption; click to enlarge and navigate.
        </p>

        {/* Filter Buttons */}
        <div className="filter-buttons fade-in-up">
          {categories.map((cat) => (
            <button
              key={cat}
              style={contentFont}
              className={activeCategory === cat ? 'active' : ''}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Image Gallery Grid */}
        {loading ? (
          <p>Loading gallery...</p>
        ) : (
          <div className="gallery-grid fade-in-up">
            {filteredImages.map((img) => {
              const isVideo = img.src && img.src.match(/\.(mp4|webm|ogg|mov|m4v)$/i)
              return (
                <div
                  key={img.id}
                  className="gallery-item fade-in-up"
                  onClick={() => handleImageClick(img)}
                >
                  {isVideo ? (
                    <video src={img.src} className="gallery-image" style={contentFont} muted playsInline />
                  ) : (
                    <img src={img.src} alt={img.caption} className="gallery-image" style={contentFont} />
                  )}
                  <div className="caption-overlay" style={contentFont}>
                    <div className="caption-text">{img.caption}</div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal (shown only if selectedImage != null) */}
      {selectedImage && (
        <div className="modal-overlay fade-in-up" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            {/* Close Button */}
            <button className="close-button" onClick={handleCloseModal}>
              ✕
            </button>

            {/* Prev Button */}
            <button className="prev-button" onClick={handlePrev}>
              ‹
            </button>

            {/* Next Button */}
            <button className="next-button" onClick={handleNext}>
              ›
            </button>

            {selectedImage.src && selectedImage.src.match(/\.(mp4|webm|ogg|mov|m4v)$/i) ? (
              <video src={selectedImage.src} className="modal-image" controls />
            ) : (
              <img src={selectedImage.src} alt={selectedImage.caption} className="modal-image" />
            )}
            <p className="modal-caption" style={contentFont}>
              {selectedImage.caption}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default GalleryPage;