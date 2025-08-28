import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import PropTypes from 'prop-types';
import { FaEnvelope, FaLinkedin, FaGithub, FaGlobe } from 'react-icons/fa'; 
import { FaGoogleScholar } from "react-icons/fa6";
import './SimpleCard.css'

function SimpleCard(props) {
  return (
    <Card
      className='card'
      style={{
  width: props.cardWidth || '18rem',
        backgroundColor: props.color,
        border: '0'
      }}
    >
      {/* Image */}
      <Card.Img variant="top" src={props.image} style={imageStyle} />

      <Card.Body>
        {/* Title (apply headingStyle + your own styling) */}
        <Card.Title
          style={{
            ...props.headingStyle, // Spread heading style
            color: 'white',
          }}
        >
          {props.name}
        </Card.Title>

        {/* Text (apply contentStyle + your own styling) */}
        <Card.Text
          style={{
            ...props.contentStyle, // Spread content style
            color: 'white',
            textAlign: 'left',
          }}
        >
          {props.content}
        </Card.Text>

        {/* Buttons */}
        <div className="d-flex flex-column">
          {/* Google Scholar Button */}
          {props.googleScholarLink && (
            <Button
              variant="outline-light"
              className="mb-2"
              href={props.googleScholarLink}
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaGoogleScholar className="mr-2" /> Google Scholar
            </Button>
          )}

          {/* Email Button */}
          {props.email && (
            <Button
              variant="outline-light"
              className="mb-2"
              href={`mailto:${props.email}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaEnvelope className="mr-2" /> Email
            </Button>
          )}

          {/* LinkedIn Button */}
          {props.linkedinLink && (
            <Button
              variant="outline-light"
              className="mb-2"
              href={props.linkedinLink}
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaLinkedin className="mr-2" /> LinkedIn
            </Button>
          )}

          {/* GitHub Button */}
          {props.githubLink && (
            <Button
              variant="outline-light"
              className="mb-2"
              href={props.githubLink}
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaGithub className="mr-2" /> GitHub
            </Button>
          )}

          {/* Website Button */}
          {props.websiteLink && (
            <Button
              variant="outline-light"
              className="mb-2"
              href={props.websiteLink}
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaGlobe className="mr-2" /> Website
            </Button>
          )}
        </div>
      </Card.Body>
    </Card>
  );
}

// PropTypes validation
SimpleCard.propTypes = {
  name: PropTypes.string.isRequired,
  content: PropTypes.string.isRequired,
  image: PropTypes.string.isRequired,
  color: PropTypes.string.isRequired,
  cardWidth: PropTypes.string,
  
  googleScholarLink: PropTypes.string,
  email: PropTypes.string,
  linkedinLink: PropTypes.string,
  githubLink: PropTypes.string,
  websiteLink: PropTypes.string,

  // Font props
  headingStyle: PropTypes.object,  // <--- added
  contentStyle: PropTypes.object,  // <--- added
};

// Image style (to ensure it's responsive and rounded)
const imageStyle = {
  width: '100%',
  height: 'auto',
  borderRadius: '1rem',
  objectFit: 'cover',
};

export default SimpleCard;