import { Container, Row, Col, Card, Button } from "react-bootstrap";
import { motion } from "framer-motion";
import "./OpeningsPage.css";

function OpeningsPage() {
  const headingFont = {
    fontFamily: "Space Mono",
    fontWeight: 800,
  };

  const contentFont = {
    fontFamily: "Poppins",
    fontWeight: 200,
  };

  const pageVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0 },
  };

  const openings = [
    {
      title: "Research Intern",
      description:
        "Join our lab as a research intern to work on cutting-edge projects in AI and machine learning.",
      requirements: [
        "Currently pursuing or completed a degree in Computer Science, AI, or related fields.",
        "Experience with Python, TensorFlow, or PyTorch.",
        "Strong analytical and problem-solving skills.",
      ],
    },
    {
      title: "Postdoctoral Researcher",
      description:
        "We are looking for a postdoctoral researcher with expertise in robotics and control systems.",
      requirements: [
        "Ph.D. in Robotics, Control Systems, or a related field.",
        "Strong publication record.",
        "Experience with ROS and C++ is a plus.",
      ],
    },
  ];

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={pageVariants}
      transition={{ duration: 0.6 }}
    >
      <Container fluid style={{ color: "white" }} className="openings-page">
        <Row>
          <Col className="text-center">
            <h1 style={headingFont} className="page-title">
              Openings
            </h1>
            <p style={contentFont} className="page-description">
              We are looking for motivated and hardworking students who have
              already proven themselves in research. If you are interested in
              our research area, please send an email to dkgiri@iitk.ac.in.
              Students who completed their Ph.D. in the field of Dynamics and
              Control of dynamical systems are welcome to join the group
              through NPDF and Institutional Postdoctoral Fellowship.
            </p>
          </Col>
        </Row>

        <Row>
          {openings.map((opening, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: index * 0.2 }}
              className="col-md-6 mb-4"
            >
              <Card
                style={{
                  backgroundColor: "#2e2c29",
                  color: "white",
                  ...contentFont,
                }}
                className="opening-card"
              >
                <Card.Body>
                  <Card.Title style={headingFont} className="opening-title">
                    {opening.title}
                  </Card.Title>
                  <Card.Text style={contentFont} className="opening-description">
                    {opening.description}
                  </Card.Text>
                  <Card.Subtitle
                    style={headingFont}
                    className="mt-3"
                  >
                    Requirements:
                  </Card.Subtitle>
                  <ul style={contentFont}>
                    {opening.requirements.map((req, idx) => (
                      <li key={idx}>{req}</li>
                    ))}
                  </ul>
                  <Button variant="primary" className="apply-button">
                    Apply Now
                  </Button>
                </Card.Body>
              </Card>
            </motion.div>
          ))}
        </Row>
      </Container>
    </motion.div>
  );
}

export default OpeningsPage;
