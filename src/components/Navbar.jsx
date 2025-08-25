import { useEffect } from "react";
import { Container, Navbar, Nav } from "react-bootstrap";
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
    "Group",
    "Research",
    "Publications",
    "Projects",
    "Gallery",
    "Citations",
    "Collaborators",
    "About Us",
  ];

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
            {navItems.map((item, index) => (
              <motion.button
                key={index}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="nav-button"
              >
                <Link
                  to={`/sdfcl-lab-website/${item.toLowerCase().replace(/\s/g, "")}`}
                  className="nav-link-custom"
                >
                  {item}
                </Link>
              </motion.button>
            ))}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default Nbar;