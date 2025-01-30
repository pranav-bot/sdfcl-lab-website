//TODO: add animations

import { useState, useEffect } from 'react';
import './HomePage.css';
import topicsData from '../data/Topics';

// List of background videos
const backgroundVideos = [
  '/sdfcl-lab-website/src/assets/Videos/FourArms.MOV',
  '/sdfcl-lab-website/src/assets/Videos/KiranWorking2.MOV', 
  '/sdfcl-lab-website/src/assets/Videos/Drone1.MOV', 
  '/sdfcl-lab-website/src/assets/Videos/Simulation1.MOV',
  '/sdfcl-lab-website/src/assets/Videos/Coding.MOV',
  '/sdfcl-lab-website/src/assets/Videos/KiranWorking2.MOV',
  '/sdfcl-lab-website/src/assets/Videos/Drone2.MOV',
  '/sdfcl-lab-website/src/assets/Videos/FourArms2.MOV',
  '/sdfcl-lab-website/src/assets/Videos/LabVid.MOV',
  '/sdfcl-lab-website/src/assets/Videos/FourArms2.MOV',
  '/sdfcl-lab-website/src/assets/Videos/NitikaWorking.MOV'
];

function HomePage() {
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
  // State to track current video index
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);

  useEffect(() => {
    // Cycle through videos every 5 seconds
    const interval = setInterval(() => {
      setCurrentVideoIndex((prevIndex) => (prevIndex + 1) % backgroundVideos.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="parallax-container">
      {/* Background video slideshow */}
      <div className="video-container">
        {backgroundVideos.map((videoSrc, index) => (
          <video
            key={index}
            src={videoSrc}
            autoPlay
            muted
            loop={true} 
            preload='auto'
            // If you prefer to not let each video loop internally, set loop={false}
            className={`background-video ${index === currentVideoIndex ? 'active' : ''}`}
          />
        ))}
      </div>

      {/* Who We Are Section */}
      <div className="parallax-section who-we-are fade-in-up">
        <div className="parallax-content fade-in-up">
          <h1 style={headingfont}>Who We Are</h1>
          <p style={contentFont}>
            The Space Dynamics and Flight Control Laboratory (SDFCL) is a research and development laboratory 
            of the Department of Aerospace Engineering at the Indian Institute of Technology, Kanpur. 
            SDFCL carries out fundamental and applied research activities in the convergence of Astrodynamics 
            and Control to enable future aggregated and disaggregated satellite missions. These include but 
            are not limited to spacecraft attitude dynamics, combined attitude and orbit control, spacecraft 
            formation flying, rendezvous – docking and berthing of cooperative and non-cooperative targets, 
            as well as pose estimation of moving targets. The vision of SDFCL is to ensure that control 
            algorithms are used as effectively as possible for small satellite on-orbit operations, which 
            will advance robotic and human space exploration. SDFCL is responsible for designing, developing, 
            validating, and embedding the necessary cutting-edge technologies for on-orbit servicing for 
            future space missions. To achieve the same, a first-generation spacecraft simulator testbed at 
            IIT Kanpur is under development that would be used to test and validate new maneuvering controls 
            for rendezvous and docking, new mission concepts for on-orbit servicing, and new algorithms for GN&C.
          </p>
        </div>
      </div>

      {/* Topics That Fascinate Us Section */}
      <div className="parallax-section topics fade-in-up" style={{ backgroundColor: '#011317' }}>
        <h1 style={headingfont}>Topics That Fascinate Us</h1>
        <Separator></Separator>
        <div className="topics-scroll-container fade-in-up">
          <div className="topics-container">
            {topicsData.map((topic, index) => (
              <div
                key={index}
                className={`topic-item fade-in-up ${index % 2 === 1 ? 'reverse' : ''}`}
              >
                <div className="topic-image fade-in-up">
                  <img src={topic.image} alt={topic.title} />
                </div>
                <div className="topic-content fade-in-up">
                  <h2 style={subHeadingFont}>{topic.title}</h2>
                  <p style={subContentFont}>{topic.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;

// Font styles
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