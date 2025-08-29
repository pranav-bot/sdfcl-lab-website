import { useEffect } from "react";
import { Container, Navbar, Nav} from "react-bootstrap";
import { motion } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
//import labLogo from "/sdfcl-lab-website/assets/Picture1.png";
import './Navbar.css'; // Make sure you have your CSS here

function Nbar() {
  const location = useLocation();

  useEffect(() => {
    // Any route-based logic you want
  }, [location.pathname]);

  const navItems = [
    "Home",
    "Group",
    "Research & Projects",
    "Publications",
    "Teaching",
    "Citations",
    "Collaborators",
    "Outreach",
    "Gallery",
    // "About Us",
  ];

  // Get the current path for active tab highlighting
  const currentPath = location.pathname.replace(/\/$/, "");

  return (
    <Navbar expand="md" className="custom-navbar">
      <Container fluid>
        <Navbar.Brand as={Link} to="/sdfcl-lab-website/">
          <img
            src='/sdfcl-lab-website/assets/Picture1.png'
            alt="Lab Logo"
            className="navbar-logo img-fluid"
          />
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="navbar-nav" />
        <Navbar.Collapse id="navbar-nav" className="justify-content-end">
          <Nav>
            {navItems.map((item, index) => {
              const itemPath = `/sdfcl-lab-website/${item.toLowerCase() === 'home' ? '' : item.toLowerCase().replace(/\s/g, "")}`.replace(/\/$/, "");
              const isActive = currentPath === itemPath;
              return (
                <motion.div
                  key={index}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                  className="nav-item-wrapper"
                >
                  <Nav.Link
                    as={Link}
                    to={itemPath}
                    className={`nav-link-custom${isActive ? ' nav-link-active' : ''}`}
                  >
                    {item}
                  </Nav.Link>
                </motion.div>
              );
            })}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default Nbar;