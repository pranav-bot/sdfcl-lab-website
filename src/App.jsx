import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Nbar from './components/Navbar';
import ResearchPage from './pages/ResearchPage';  
import PublicationsPage from './pages/PublicationsPage';
import OpeningsPage from './pages/OpeningsPage';
import AboutPage from './pages/AboutPage';
import HomePage from './pages/HomePage';
import TeamPage from './pages/TeamPage';
import GalleryPage from './pages/GalleryPage';
import Project1 from './pages/projectPages/project1';
import Project2 from './pages/projectPages/project2';
import Project3 from './pages/projectPages/project3';
import Project4 from './pages/projectPages/project4';
import Project5 from './pages/projectPages/project5';
import Project6 from './pages/projectPages/project6';
import Project7 from './pages/projectPages/project7';
import Project8 from './pages/projectPages/project8';
import Project9 from './pages/projectPages/project9';
import Project10 from './pages/projectPages/project10';
import Project11 from './pages/projectPages/project11';
import Project12 from './pages/projectPages/project12';
import Project13 from './pages/projectPages/project13';
import Project14 from './pages/projectPages/project14';
import Project15 from './pages/projectPages/project15';
import Footer from './components/Footer';
import './App.css'

function App() {
  return (
    <Router>
      <div className='app-container'>
      <Nbar />
      <div className="main-content">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/research" element={<ResearchPage />} />
        <Route path="/gallery" element={<GalleryPage />} />
        <Route path="/publications" element={<PublicationsPage />} />
        <Route path="/ourteam" element={<TeamPage />} />
        <Route path="/openings" element={<OpeningsPage />} />
        <Route path="/aboutus" element={<AboutPage />} />
        <Route path="/project1" element={<Project1 />} />
      <Route path="/project2" element={<Project2 />} />
      <Route path="/project3" element={<Project3 />} />
      <Route path="/project4" element={<Project4 />} />
      <Route path="/project5" element={<Project5 />} />
      <Route path="/project6" element={<Project6 />} />
      <Route path="/project7" element={<Project7 />} />
      <Route path="/project8" element={<Project8 />} />
      <Route path="/project9" element={<Project9 />} />
      <Route path="/project10" element={<Project10 />} />
      <Route path="/project11" element={<Project11 />} />
      <Route path="/project12" element={<Project12 />} />
      <Route path="/project13" element={<Project13 />} />
      <Route path="/project14" element={<Project14 />} />
      <Route path="/project15" element={<Project15 />} />
      </Routes>
      </div>
      <Footer></Footer>
      </div>
    </Router>
  );
}

export default App;