import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Nbar from "./components/Navbar";
import ResearchPage from "./pages/ResearchPage";
import PublicationsPage from "./pages/PublicationsPage";
import CitationsPage from "./pages/CitationsPage";
import OpeningsPage from "./pages/OpeningsPage";
import AboutPage from "./pages/AboutPage";
import HomePage from "./pages/HomePage";
import TeamPage from "./pages/TeamPage";
import GalleryPage from "./pages/GalleryPage";
import TeachingPage from "./pages/TeachingPage";
import CollaboratorsPage from "./pages/CollaboratorsPage";
import Project1 from "./pages/projectPages/project1";
import Project2 from "./pages/projectPages/project2";
import Project3 from "./pages/projectPages/project3";
import Project4 from "./pages/projectPages/project4";
import Project5 from "./pages/projectPages/project5";
import Project6 from "./pages/projectPages/project6";
import Footer from "./components/Footer";
import LoginPage from "./pages/LoginPage";
import EditPage from "./pages/EditPage";
import "./App.css";
import ProjectsPage from "./pages/ProjectsPage";

function App() {
  return (
    <Router>
      <div className="app-container">
        <Nbar />
        <div className="main-content">
          <Routes>
            <Route path="/sdfcl-lab-website/" element={<HomePage />} />
            <Route
              path="/sdfcl-lab-website/research"
              element={<ResearchPage />}
            />
            <Route
              path="/sdfcl-lab-website/research&projects"
              element={<ProjectsPage />}
            />
            <Route
              path="/sdfcl-lab-website/gallery"
              element={<GalleryPage />}
            />
            <Route
              path="/sdfcl-lab-website/publications"
              element={<PublicationsPage />}
            />
            <Route
              path="/sdfcl-lab-website/citations"
              element={<CitationsPage />}
            />
            <Route path="/sdfcl-lab-website/group" element={<TeamPage />} />
            <Route
              path="/sdfcl-lab-website/openings"
              element={<OpeningsPage />}
            />
            <Route path="/sdfcl-lab-website/aboutus" element={<AboutPage />} />
            <Route path="/sdfcl-lab-website/collaborators" element={<CollaboratorsPage />} />
            <Route path="/sdfcl-lab-website/login" element={<LoginPage />} />
            <Route path="/sdfcl-lab-website/edit" element={<EditPage />} />
            <Route
              path="/sdfcl-lab-website/Spacecraft Attitude Control Testbed for Testing and Validating Maneuvering Controls"
              element={<Project1 />}
            />
            <Route path="/sdfcl-lab-website/teaching" element={<TeachingPage />} />
            <Route
              path="/sdfcl-lab-website/Magneto-electric effects in the dynamics and motion control problems of telecommunication spacecraft"
              element={<Project2 />}
            />
            <Route
              path="/sdfcl-lab-website/6D Pose-estimation of Uncooperative Airborne Vehicle"
              element={<Project3 />}
            />
            <Route
              path="/sdfcl-lab-website/Slip Estimation, Slip Mitigation, and Path Planning Techniques of Planetary Exploration Rovers"
              element={<Project4 />}
            />
            <Route
              path="/sdfcl-lab-website/Design and Development of Ground Robots for Autonomous Navigation System in Collaboration with Armatirx"
              element={<Project5 />}
            />
            <Route
              path="/sdfcl-lab-website/MASCOT : Multiple Autonomous Spacecraft Close proximity Operations Test facility"
              element={<Project6 />}
            />
          </Routes>
        </div>
        <Footer></Footer>
      </div>
    </Router>
  );
}

export default App;
