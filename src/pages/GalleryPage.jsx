import { useState, useEffect } from 'react';
import allImages from '../data/Gallery';
import './GalleryPage.css';

// 1) Define heading and content fonts
const headingfont = {
  fontFamily: 'Space Mono',
  fontWeight: 800,
};

const contentFont = {
  fontFamily: 'Poppins',
  fontWeight: 200,
};



// 2) Define categories (plus “All”)
const categories = ['All', 'Events', 'Lab', 'Projects'];

function GalleryPage() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [activeCategory, setActiveCategory] = useState('All');
  const [filteredImages, setFilteredImages] = useState(allImages);

  // 3) Filter images when category changes
  useEffect(() => {
    if (activeCategory === 'All') {
      setFilteredImages(allImages);
    } else {
      setFilteredImages(
        allImages.filter((img) => img.category === activeCategory)
      );
    }
  }, [activeCategory]);

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
        <div className="gallery-grid fade-in-up">
          {filteredImages.map((img) => (
            <div
              key={img.id}
              className="gallery-item fade-in-up"
              onClick={() => handleImageClick(img)}
            >
              <img
                src={img.src}
                alt={img.caption}
                className="gallery-image"
                style={contentFont}
              />
              <div className="caption-overlay" style={contentFont}>
                <div className="caption-text">{img.caption}</div>
              </div>
            </div>
          ))}
        </div>
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

            <img
              src={selectedImage.src}
              alt={selectedImage.caption}
              className="modal-image"
            />
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