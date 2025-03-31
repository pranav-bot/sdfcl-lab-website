import { useState, useEffect } from 'react';
import './HomePage.css';
import topicsData from '../data/Topics';

const backgroundVideos = [
  '/sdfcl-lab-website/assets/Videos/FourArms.mp4',
  '/sdfcl-lab-website/assets/Videos/KiranWorking2.mp4',
  '/sdfcl-lab-website/assets/Videos/Drone1.mp4',
  '/sdfcl-lab-website/assets/Videos/Simulation1.mp4',
  '/sdfcl-lab-website/assets/Videos/Coding.mp4',
  '/sdfcl-lab-website/assets/Videos/KiranWorking2.mp4',
  '/sdfcl-lab-website/assets/Videos/Drone2.mp4',
  '/sdfcl-lab-website/assets/Videos/FourArms2.mp4',
  '/sdfcl-lab-website/assets/Videos/LabVid.mp4',
  '/sdfcl-lab-website/assets/Videos/FourArms2.mp4',
  '/sdfcl-lab-website/assets/Videos/NitikaWorking.mp4'
];

const placeholders = ['/sdfcl-lab-website/assets/Logos/iitklogo2.jpg', '/sdfcl-lab-website/assets/Logos/drdo.png', '/sdfcl-lab-website/assets/Logos/isro.jpg', '/sdfcl-lab-website/assets/Logos/dhruva.png', '/sdfcl-lab-website/assets/Logos/armatrix2.jpg', '/sdfcl-lab-website/assets/Logos/mit.jpg', '/sdfcl-lab-website/assets/Logos/tih.jpg', '/sdfcl-lab-website/assets/Logos/unist.png', '/sdfcl-lab-website/assets/Logos/manastu_space_logo.jpg'];


function HomePage() {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);

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

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentVideoIndex((prevIndex) => (prevIndex + 1) % backgroundVideos.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {/* Parallax Container for Background Videos & Parallax Sections */}
      <div className="parallax-container">
        <div className="video-container">
          {backgroundVideos.map((videoSrc, index) => (
            <video
              key={index}
              src={videoSrc}
              autoPlay
              muted
              loop
              className={`background-video ${index === currentVideoIndex ? 'active' : ''}`}
            />
          ))}
        </div>

        <div className="parallax-section who-we-are fade-in-up">
          <div className="parallax-content fade-in-up">
            <h1 style={headingfont}>Who We Are</h1>
            <Separator></Separator>
            <p style={contentFont}>
            The Space Dynamics and Flight Control Laboratory (SDFCL) is a research and development laboratory of the Department of Aerospace Engineering at the Indian Institute of Technology, Kanpur. SDFCL carries out fundamental and applied research activities in the convergence of Astrodynamics and Control to enable future aggregated and disaggregated satellite missions. These include but are not limited to spacecraft attitude dynamics, combined attitude and orbit control, spacecraft formation flying, rendezvous – docking and berthing of cooperative and non-cooperative targets, as well as pose estimation of moving targets. The vision of SDFCL is to ensure that control algorithms are used as effectively as possible for small satellite on-orbit operations, which will advance robotic and human space exploration. SDFCL is responsible for designing, developing, validating, and embedding the necessary cutting-edge technologies for on-orbit servicing for future space missions. To achieve the same, a first-generation spacecraft simulator testbed at IIT Kanpur is under development that would be used to test and validate new maneuvering controls for rendezvous and docking, new mission concepts for on-orbit servicing, and new algorithms for GN&C.
            </p>
          </div>
        </div>

              {/* Separate Section for Research & Teaching Summary */}
      <div className="research-teaching-summary">
      <h1 style={{ ...headingfont, textAlign: "center", marginBottom: 20 }}>
        Collaborators
      </h1>
      <Separator></Separator>
              {/* Slider */}
      <div className="slider-container fade-in-up">
        <div className="slider">
          {placeholders.concat(placeholders).map((image, index) => (
            <div key={index} className="slider-placeholder">
              <img src={image} alt="" />
            </div>
          ))}
        </div>
      </div>
        <h1 style={headingfont}>Research & Teaching Summary</h1>
        <Separator></Separator>
        <div className="research-boxes">
          <div className="research-box">
            <h3 style={headingfont}>Lab Development</h3>
            <p style={contentFont}>Space Dynamics and Flight Control Lab.</p>
          </div>
          <div className="research-box">
            <h3>Total Funding</h3>
            <p>7.27 Cr (Including external and internal)</p>
          </div>
          <div className="research-box">
            <h3>Publications</h3>
            <p>27 Journals, 70 Conferences</p>
          </div>
          <div className="research-box">
            <h2>Patent</h2>
            <p>1</p>
          </div>
          <div className="research-box">
            <h2>Awards</h2>
            <ul>
              <li><p>Best Interactive Award in Indian Control Conference 2020</p></li>
              <li><p>Best Interactive Presentation in 74th International Astronautical Congress 2023</p></li>
            </ul>
          </div>
          <div className="research-box">
            <h3>Key Projects</h3>
            <ul>
              <li><p>Variable Speed Control Moment Gyros for Spacecraft Attitude Control</p></li>
              <li><p>Spacecraft Simulator Testbed Development</p></li>
              <li><p>Hyper Redundant Manipulator Design & Fabrication</p></li>
              <li><p>Hardware Setup for Detecting and Estimating Uncooperative Targets</p></li>
              <li><p>Air Bearing Setup for Levitation</p></li>
            </ul>
          </div>
          <div className="research-box">
            <h3>Courses Taught</h3>
            <p>Taught 10 different UG & PG courses</p>
            <p>Best Teaching Citation: 4 times</p>
          </div>
          <div className="research-box">
            <h3>New Courses Introduced</h3>
            <ul>
              <li><p>Spacecraft Attitude Dynamics and Control – AE642</p></li>
              <li><p>Structural Vibration and Control – AE632 (with Dr. Dutt)</p></li>
            </ul>
          </div>
          <div className="research-box">
            <h3>ITEC Course</h3>
            <p>Spacecraft Dynamics and Control (June 2024)</p>
          </div>
          <div className="research-box">
            <h3>NPTEL Courses</h3>
            <ul>
              <li><p>Introduction to Aircraft Control System (2024)</p></li>
              <li><p>Advanced Aircraft Control System (Matlab/Simulink) (2025)</p></li>
            </ul>
          </div>
          <div className="research-box">
            <h3>HAL Courses</h3>
            <p>Aircraft Stability and Control for HAL Trainee Engineers (2022, 2023, 2024)</p>
          </div>
        </div>
      </div>

        <div className="parallax-section topics fade-in-up" style={{ backgroundColor: '#011317' }}>
          <h1 style={headingfont}>Topics That Fascinate Us</h1>
          <Separator></Separator>
          <div className="topics-scroll-container fade-in-up">
            <div className="topics-container">
              {topicsData.map((topic, index) => (
                <div key={index} className={`topic-item fade-in-up ${index % 2 === 1 ? 'reverse' : ''}`}>
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
