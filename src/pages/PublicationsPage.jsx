import { useState } from "react";
import "./PublicationsPage.css";
import publications from "../data/Publications"; // Adjust the path as necessary
import conferences from "../data/Conferences";
import congressPresentations from "../data/IAC";
import { FaSearch } from "react-icons/fa";

// Font styles
const headingfont = {
  fontFamily: "Space Mono",
  fontWeight: 800,
};

const contentFont = {
  fontFamily: "Poppins",
  fontWeight: 200,
};

function PublicationsPage() {
  const [activeSection, setActiveSection] = useState("journals");

  // Search bar
  const [searchTerm, setSearchTerm] = useState("");

  const placeholders = ['/sdfcl-lab-website/assets/Logos/acta.jpg', '/sdfcl-lab-website/assets/Logos/aess.jpg', '/sdfcl-lab-website/assets/Logos/asjc.jpg', '/sdfcl-lab-website/assets/Logos/ast.jpg', '/sdfcl-lab-website/assets/Logos/ifac.gif', '/sdfcl-lab-website/assets/Logos/jae.jpg', '/sdfcl-lab-website/assets/Logos/jgcd.jpg', '/sdfcl-lab-website/assets/Logos/jsr.jpg', '/sdfcl-lab-website/assets/Logos/seriesc.jpg'];

  // Helper to see if a publication matches the search term
  const matchesSearch = (pub) => {
    if (!searchTerm) return true; // no search => show all
    const lowerSearch = searchTerm.toLowerCase();
    return (
      (pub.authors && pub.authors.toLowerCase().includes(lowerSearch)) ||
      (pub.title && pub.title.toLowerCase().includes(lowerSearch)) ||
      (pub.journal && pub.journal.toLowerCase().includes(lowerSearch)) ||
      (pub.conference && pub.conference.toLowerCase().includes(lowerSearch)) ||
      (pub.event && pub.event.toLowerCase().includes(lowerSearch)) ||
      (pub.location && pub.location.toLowerCase().includes(lowerSearch)) ||
      (pub.status && pub.status.toLowerCase().includes(lowerSearch))
    );
  };

  // Render Journals
  const renderJournals = () => (
    <div className="fade-in-up section-wrapper">
      <h2 style={headingfont}>Journals</h2>
      <div className="publications-container fade-in-up">
        {Object.keys(publications)
          .sort((a, b) => b - a) // Desc by year
          .map((year) => {
            const filteredPubs = publications[year].filter(matchesSearch);
            if (filteredPubs.length === 0) return null;
            return (
              <div key={year} className="year-section fade-in-up">
                <h2 style={headingfont}>{year}</h2>
                <ol>
                  {filteredPubs.map((pub, index) => (
                    <li key={index} style={contentFont}>
                      {`${pub.authors}, "${pub.title}," ${pub.journal}, ${pub.status}.`}
                    </li>
                  ))}
                </ol>
              </div>
            );
          })}
      </div>
    </div>
  );

  // Render IAC
  const renderIAC = () => (
    <div className="fade-in-up section-wrapper">
      <h2 style={headingfont}>International Astronautical Congress (IAC)</h2>
      <div className="publications-container fade-in-up">
        {Object.keys(congressPresentations)
          .sort((a, b) => b - a)
          .map((year) => {
            const filteredPubs = congressPresentations[year].filter(
              matchesSearch
            );
            if (filteredPubs.length === 0) return null;
            return (
              <div key={year} className="year-section fade-in-up">
                <h2 style={headingfont}>{year}</h2>
                <ol>
                  {filteredPubs.map((pub, index) => (
                    <li key={index} style={contentFont}>
                      {`${pub.authors}, "${pub.title}," ${pub.event}, ${pub.location}.`}
                    </li>
                  ))}
                </ol>
              </div>
            );
          })}
      </div>
    </div>
  );

  // Render Conferences
  const renderConferences = () => (
    <div className="fade-in-up section-wrapper">
      <h2 style={headingfont}>Conferences</h2>
      <div className="publications-container fade-in-up">
        {Object.keys(conferences)
          .sort((a, b) => b - a)
          .map((year) => {
            const filteredPubs = conferences[year].filter(matchesSearch);
            if (filteredPubs.length === 0) return null;
            return (
              <div key={year} className="year-section fade-in-up">
                <h2 style={headingfont}>{year}</h2>
                <ol>
                  {filteredPubs.map((pub, index) => (
                    <li key={index} style={contentFont}>
                      {`${pub.authors}, "${pub.title}," ${pub.conference}, ${pub.status}.`}
                    </li>
                  ))}
                </ol>
              </div>
            );
          })}
      </div>
    </div>
  );

  // Decide what to render
  const renderSection = () => {
    switch (activeSection) {
      case "journals":
        return renderJournals();
      case "iac":
        return renderIAC();
      case "conferences":
        return renderConferences();
      default:
        return null;
    }
  };

  return (
    <div className="publications-page fade-in-up">
      <h1 style={{ ...headingfont, textAlign: "center", marginBottom: 20 }}>
        Where we have been featured
      </h1>

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

      {/* Search Bar */}
      <div
        className="search-container fade-in-up"
        style={{
          position: "relative",
          maxWidth: "400px",
          margin: "20px auto",
        }}
      >
        <input
          type="text"
          placeholder="Search Publications..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            ...contentFont,
            width: "100%",
            padding: "10px 40px 10px 10px",
            borderRadius: "10px",
            border: "1px solid #ccc",
            outline: "none",
            backgroundColor: "#011317",
            color: "white",
          }}
        />
        <span
          style={{
            position: "absolute",
            top: "50%",
            right: "10px",
            transform: "translateY(-50%)",
            pointerEvents: "none",
            color: "#999",
          }}
        >
          <FaSearch />
        </span>
      </div>

      {/* Navigation Buttons */}
      <div className="nav-buttons fade-in-up">
        <button
          className={activeSection === "journals" ? "active" : ""}
          onClick={() => setActiveSection("journals")}
          style={contentFont}
        >
          Journals
        </button>
        <button
          className={activeSection === "iac" ? "active" : ""}
          onClick={() => setActiveSection("iac")}
          style={contentFont}
        >
          International Astronautical Congress (IAC)
        </button>
        <button
          className={activeSection === "conferences" ? "active" : ""}
          onClick={() => setActiveSection("conferences")}
          style={contentFont}
        >
          Conferences
        </button>
      </div>

      {/* Section Content */}
      <div className="section-content fade-in-up" style={contentFont}>
        {renderSection()}
      </div>
    </div>
  );
}

export default PublicationsPage;