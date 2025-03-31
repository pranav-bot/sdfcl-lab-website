import MasterCard from "../components/MasterCard";
import SimpleCard from "../components/SimpleCard";
import "./TeamPage.css";
import researchInterns from "../data/ResearchInterns";
import mastersStudents from "../data/MastersStudents";
import phdStudents from "../data/PHDStudents";
import {
  VerticalTimeline,
  VerticalTimelineElement,
} from "react-vertical-timeline-component";
import "react-vertical-timeline-component/style.min.css";
import { PiBooks } from "react-icons/pi";
import { PiChalkboardTeacherFill } from "react-icons/pi";
import { MdEngineering } from "react-icons/md";
import { HiAcademicCap } from "react-icons/hi2";

const headingfont = {
  fontFamily: "Space Mono",
  fontWeight: 800,
};

const contentFont = {
  fontFamily: "Poppins",
  fontWeight: 200,
};

function TeamPage() {
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

  const renderCards = (data) => (
    <div className="d-flex flex-wrap justify-content-center gap-3 fade-in-up">
      {data.map((person, index) => (
        <SimpleCard
          key={index}
          name={person.name}
          content={person.content}
          image={person.image}
          googleScholarLink={person.googleScholarLink}
          email={person.email}
          linkedinLink={person.linkedinLink}
          githubLink={person.githubLink}
          websiteLink={person.websiteLink}
          color="#2e2c29"
          headingStyle={headingfont}
          contentStyle={contentFont}
        />
      ))}
    </div>
  );

  function AcademicTimeline() {
    const timelineElements = [
      {
        date: "2003-2016",
        title: "BE (2003-07) - University of Burdwan",
        title2: "Mtech (2007-09)- Jadavpur University",
        title3: "PhD (2011-16)- IIT Kharagpur",
        icon: <PiBooks />
      },
      {
        date: "2009-2011",
        title: "Erasmundus Fellowship by European Union",
        icon: <HiAcademicCap />
      },
      {
        date: "2015-2016",
        title: "Research Engineer IIT Kharagpur",
        icon: <MdEngineering />
      },
      {
        date: "2016-2017",
        title: "Postdoctoral Fellow UNIST, South Korea",
        icon: <HiAcademicCap />
      },
      {
        date: "2017-2018",
        title:
          "Postdoctoral Fellow Singapore-Massachusetts Institute Alliance for Research and Technology",
          icon: <HiAcademicCap />
      },
      {
        date: "2018-2020",
        title:
          "DST INSPIRE Fellow Department of Aerospace Engineering, IIT Kanpur",
          icon: <HiAcademicCap />
      },
      {
        date: "2020-Present",
        title:
          "Assistant Professor Department of Aerospace Engineering, IIT Kanpur",
          icon: <PiChalkboardTeacherFill />
      },
    ];

    return (
      <div style={{ padding: "20px 0", backgroundColor: "#011317" }}>
        <h2 style={{ ...headingfont, color: "white", textAlign: "center" }}>
          Academic Journey
        </h2>
        <VerticalTimeline>
          {timelineElements.map((element, index) => (
            <VerticalTimelineElement
              key={index}
              date={element.date}
              contentStyle={{ background: "#2e2c29", color: "#fff" }}
              contentArrowStyle={{ borderRight: "7px solid  #2e2c29" }}
              iconStyle={{ background: "#2e2c29", color: "#fff" }}
              icon={element.icon}
            >
              <ul>
                <li>
                  <p style={headingfont}>{element.title}</p>{" "}
                </li>
                {element.title2 && (
                  <li>
                    <p style={headingfont}>{element.title2}</p>
                  </li>
                )}
                {element.title3 && (
                  <li>
                    <p style={headingfont}>{element.title3}</p>
                  </li>
                )}
              </ul>
            </VerticalTimelineElement>
          ))}
        </VerticalTimeline>
      </div>
    );
  }

  return (
    <div
      className="team-page fade-in-up"
      style={{ backgroundColor: "#011317" }}
    >
      {/* Spacing at the top */}
      <div style={{ height: "50px" }}></div>

      {/* Principal Investigator */}
      <div className="fade-in-up" style={{ padding: "0 20px" }}>
        <MasterCard
          googleScholarLink="https://scholar.google.com/citations?user=example"
          email="john.doe@example.com"
          linkedinLink="https://www.linkedin.com/in/johndoe/"
          title="Dipak Kumar Giri"
          image="/sdfcl-lab-website/assets/LabMembers/GiriSir.jpg"
          content={
            "I am working as an Assistant Professor in the Department of Aerospace Engineering since November 2020. Previously, I was DST INSPIRE Faculty at the Department of Aerospace Engineering, IIT Kanpur (2018-2020). Before this, I was a postdoctoral research associate (2017-2018) at Singapore-Massachusetts Institute of Technology (MIT) Alliance for Research and Technology (SMART) and worked in the field of space systems with Prof. Daniel E. Hastings, Aerospace and Astronautics, MIT, USA. Before this, I was a postdoc fellow (2016-2017) at Ulsan National Institute of Science and Technology, South Korea, and worked on nonlinear control of quadrotor UAVs with Prof. Hungsun Son, MANE, UNIST. Prior to this, I was a research engineer at the Department of Aerospace Engineering, IIT Kharagpur. I have my Ph.D. from Department of Aerospace Engineering, IIT Kharagpur. Before Ph.D., I was in the Department of Electrical and Electronics Engineering at Middle East Technical University, Ankara through Erasmus Mundus Fellowship by the European Union (2009-2011). My current research work involves studying the control synthesis of nonlinear dynamical systems. I am using linear and nonlinear control algorithms for aerospace dynamical systems- spacecraft attitude control, orbit control for space flights, and on-orbit servicing for future aerospace systems. "
          }
          headingStyle={headingfont}
          contentStyle={contentFont}
        />
      </div>

      {/* Academic Timeline */}
      <AcademicTimeline />

      {/* Lab Members */}
      <div style={{ backgroundColor: "#2e2c29" }} className="fade-in-up">
        <div style={{ color: "white" }} className="wavy-border fade-in-up" />

        <h1
          className="fade-in-up text-center"
          style={{
            ...headingfont,
            fontSize: "60px",
            paddingTop: "50px",
            color: "white",
          }}
        >
          Lab Members
        </h1>
        <Separator />

        {/* PhD Students */}
        <h2
          className="fade-in-up text-center"
          style={{
            ...headingfont,
            color: "white",
            paddingTop: "50px",
            paddingBottom: "50px",
          }}
        >
          PhD Students
        </h2>
        {renderCards(phdStudents)}

        <Separator />

        {/* Masters Students */}
        <h2
          className="fade-in-up text-center"
          style={{ ...headingfont, color: "white", paddingBottom: "50px" }}
        >
          Masters Students
        </h2>
        {renderCards(mastersStudents)}

        <Separator />

        {/* Research Interns */}
        <h2
          className="fade-in-up text-center"
          style={{ ...headingfont, color: "white", paddingBottom: "50px" }}
        >
          Research Interns
        </h2>
        {renderCards(researchInterns)}
        <div style={{ height: "50px" }}></div>
      </div>
    </div>
  );
}

export default TeamPage;
