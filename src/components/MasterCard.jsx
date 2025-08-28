import { Button, Card, Row, Col } from 'react-bootstrap';
import PropTypes from 'prop-types';  
import { FaEnvelope, FaLinkedin } from 'react-icons/fa';  // For icon support
import { FaGoogleScholar } from "react-icons/fa6";
import './MasterCard.css'


function MasterCard(props) {
  return (
    <Card className='mastercard' style={{ width: '100%', color:'white', backgroundColor: '#011317', }}>
      <Row noGutters>
        <Col xs={4}>
          <Card.Img variant="top" src={props.image} style={imageStyle} />
        </Col>
        <Col xs={8}>
          <Card.Body>
            <Card.Title style={props.headingStyle}>{props.title}</Card.Title>
            <Card.Text style={{color: 'white', textAlign: 'left', ...props.contentStyle}}>{props.content}</Card.Text>
            <div className="d-flex flex-column">
              <Button 
                variant="light" 
                className="mb-2 card-btn"
                href={props.googleScholarLink} 
                target="_blank"
                rel="noopener noreferrer"
              >
                <FaGoogleScholar className="mr-2"  /> Google Scholar
              </Button>

              <Button 
                variant="light" 
                className="mb-2 card-btn"
                href={`mailto:${props.email}`} 
                target="_blank"
                rel="noopener noreferrer"
              >
                <FaEnvelope className="mr-2" /> Email
              </Button>

              <Button 
                variant="light" 
                className="card-btn"
                href={props.linkedinLink} 
                target="_blank"
                rel="noopener noreferrer"
              >
                <FaLinkedin className="mr-2" /> LinkedIn
              </Button>
            </div>
          </Card.Body>
        </Col>
      </Row>
    </Card>
  );
}

MasterCard.propTypes = {
  title: PropTypes.string.isRequired, 
  content: PropTypes.string.isRequired,
  image: PropTypes.string.isRequired,
  googleScholarLink: PropTypes.string.isRequired,
  email: PropTypes.string.isRequired,
  linkedinLink: PropTypes.string.isRequired,
  headingStyle: PropTypes.object,  // <--- added
  contentStyle: PropTypes.object,  // <--- added
};

const imageStyle = {
  width: '10  0%',       // Set the width to make the image responsive
  height: 'auto',      // Set height to auto to maintain aspect ratio
  borderRadius: '5rem',  // Rounded corners with a small radius
  objectFit: 'cover',
  paddingLeft : '20px',   // Ensure the image scales properly inside the rounded container
};

export default MasterCard;
