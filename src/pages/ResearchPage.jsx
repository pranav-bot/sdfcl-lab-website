import { useState } from "react";
import SimpleCard from "../components/SimpleCard";
import { Link } from "react-router-dom";
import { FaSearch } from "react-icons/fa";
import "./ResearchPage.css";
import ONGOING_PROJECTS from "../data/OngoingProjects";
import COMPLETED_PROJECTS from "../data/CompletedProjects";




// Define heading + content fonts
const headingfont = {
  fontFamily: "Space Mono",
  fontWeight: 800,
};

const contentFont = {
  fontFamily: "Poppins",
  fontWeight: 200,
};

function ResearchPage() {
  const [searchTerm, setSearchTerm] = useState("");

  // Filter logic
  const filteredOngoing = ONGOING_PROJECTS.filter((project) => {
    const lowerSearch = searchTerm.toLowerCase();
    return (
      project.name.toLowerCase().includes(lowerSearch) ||
      project.content.toLowerCase().includes(lowerSearch)
    );
  });

  const filteredCompleted = COMPLETED_PROJECTS.filter((project) => {
    const lowerSearch = searchTerm.toLowerCase();
    return (
      project.name.toLowerCase().includes(lowerSearch) ||
      project.content.toLowerCase().includes(lowerSearch)
    );
  });

  return (
    <div
      className="research-page-container fade-in-up"
      style={{
        backgroundColor: "#011317",
        padding: "20px",
        paddingBottom: "500px",
      }}
    >
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
          placeholder="Search projects..."
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

      {/* Completed Projects */}
      {filteredCompleted.length > 0 && (
        <>
          <h1
            className="fade-in-up"
            style={{ ...headingfont, color: "white", marginTop: "40px", paddingBottom:'50px' }}
          >
            Completed Projects
          </h1>
          <div className="d-flex flex-wrap justify-content-center gap-5 fade-in-up">
            {filteredCompleted.map((project) => (
              <div key={project.id} className="card-wrapper fade-in-up">
                <Link
                  to={`/project${project.id}`}
                  style={{ textDecoration: "none" }}
                >
                  <SimpleCard
                    name={project.name}
                    content={project.content}
                    image={project.image}
                    color="#011317"
                    
                    // Pass your font styles here:
                    headingStyle={headingfont}
                    contentStyle={contentFont}
                  />
                </Link>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Ongoing Projects */}
      {filteredOngoing.length > 0 && (
        <>
          <h1
            className="fade-in-up"
            style={{ ...headingfont, color: "white", marginTop: "40px", paddingBottom:'50px' }}
          >
            Ongoing Projects
          </h1>
          <div className="d-flex flex-wrap justify-content-center gap-5 fade-in-up">
            {filteredOngoing.map((project) => (
              <div key={project.id} className="card-wrapper fade-in-up">
                <Link
                  to={`/sdfcl-lab-website/${project.name}`}
                  style={{ textDecoration: "none" }}
                >
                  <SimpleCard
                    name={project.name}
                    content={project.content}
                    image={project.image}
                    color="#011317"
                    
                    // Pass your font styles here:
                    headingStyle={headingfont}
                    contentStyle={contentFont}
                  />
                </Link>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default ResearchPage;