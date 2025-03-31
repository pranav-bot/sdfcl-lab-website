import { useEffect, useState } from 'react';
import Pose from '../../data/projectData/Pose';
import './Project1.css'; // Import the CSS file for animations

// Font styles
const headingfont = {
  fontFamily: "Space Mono",
  fontWeight: 800,
  color: 'white'
};

const contentFont = {
  fontFamily: "Poppins",
  fontWeight: 200,
  color: "white"
};

const Project3 = () => {
  const [projectData, setProjectData] = useState(null);

  useEffect(() => {
    // Simulate data fetching by setting testbed data
    setProjectData(Pose);
  }, []);

  if (!projectData) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container my-5 fade-in">
      <h1 className="text-center mb-4" style={headingfont}>
        {projectData.projectTitle}
      </h1>
      <div className="row">
        {/* Carousel Column */}
        <div className="col-md-6 fade-in">
          <div
            id="projectCarousel"
            className="carousel slide"
            data-bs-ride="carousel"
            data-bs-interval="3000" // Adjust the interval as needed (3000ms = 3s)
          >
            <div className="carousel-inner">
              {projectData.images && projectData.images.length > 0 ? (
                projectData.images.map((image, index) => (
                  <div
                    className={`carousel-item ${index === 0 ? 'active' : ''}`}
                    key={index}
                  >
                    <img
                      src={image}
                      className="d-block w-100"
                      alt={`Project Photo ${index + 1}`}
                    />
                  </div>
                ))
              ) : (
                <div className="carousel-item active">
                  <p>No images available.</p>
                </div>
              )}
            </div>
            <button
              className="carousel-control-prev"
              type="button"
              data-bs-target="#projectCarousel"
              data-bs-slide="prev"
            >
              <span
                className="carousel-control-prev-icon"
                aria-hidden="true"
              ></span>
              <span className="visually-hidden">Previous</span>
            </button>
            <button
              className="carousel-control-next"
              type="button"
              data-bs-target="#projectCarousel"
              data-bs-slide="next"
            >
              <span
                className="carousel-control-next-icon"
                aria-hidden="true"
              ></span>
              <span className="visually-hidden">Next</span>
            </button>
          </div>
        </div>
        {/* Content Column */}
        <div className="col-md-6 fade-in" style={contentFont}>
          <p>{projectData.description}</p>
          <h4 style={headingfont}>Funding Sources</h4>
          <ul>
            {projectData.fundingSources && projectData.fundingSources.length > 0 ? (
              projectData.fundingSources.map((source, index) => (
                <li key={index}>{source}</li>
              ))
            ) : (
              <li>No funding sources available.</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Project3;
