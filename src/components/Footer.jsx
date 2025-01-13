import { Link } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import {
  FaTwitter,
  FaFacebook,
  FaInstagram,
  FaLinkedin,
  FaMinus,
} from 'react-icons/fa'; // <-- React Icons
import './Footer.css';

// Define the font objects
const headingfont = {
  fontFamily: 'Space Mono',
  fontWeight: 800,
};

const contentFont = {
  fontFamily: 'Poppins',
  fontWeight: 200,
};

const Footer = () => {

  return (
    <footer id="footer" className="footer fade-in-up" style={contentFont}>
      <div className="footer-content fade-in-up" style={contentFont}>
        <div className="container">
          <div className="row gy-4 fade-in-up">
            {/* Footer Info */}
            <div className="col-lg-5 col-md-12 footer-info fade-in-up">
              <Link
                to="/"
                className="logo d-flex align-items-center"
                style={headingfont}
              >
                {/* Title uses headingfont */}
                <span style={headingfont}>Dipak Kumar Giri</span>
              </Link>
              <p style={{ textAlign: 'justify', ...contentFont }}>
                We are looking motivated and hardworking students who have
                already proven themselves in research. If you are interested
                in our research area, please send an email to dkgiri@iitk.ac.in.
                Students who completed their Ph.D. in the field of Dynamics and
                Control of dynamical systems are welcome to join the group
                through NPDF and Institutional Postdoctoral Fellowship.
              </p>
              <div className="social-links d-flex mt-3 fade-in-up">
                <a href="#" className="twitter">
                  <FaTwitter />
                </a>
                <a href="#" className="facebook">
                  <FaFacebook />
                </a>
                <a href="#" className="instagram">
                  <FaInstagram />
                </a>
                <a href="#" className="linkedin">
                  <FaLinkedin />
                </a>
              </div>
            </div>

            {/* Phone Section */}
            <div className="col-lg-2 col-6 footer-links fade-in-up">
              <h4 style={headingfont}>Phone:</h4>
              <ul>
                <li>
                  <FaMinus style={{ marginRight: '5px' }} />
                  <a href="tel:05122597107" style={contentFont}>
                    0512-259-7107
                  </a>
                </li>
              </ul>
            </div>

            {/* Email Section */}
            <div className="col-lg-2 col-6 footer-links fade-in-up">
              <h4 style={headingfont}>Email:</h4>
              <ul>
                <li>
                  <FaMinus style={{ marginRight: '5px' }} />
                  <a href="mailto:dkgiri@iitk.ac.in" style={contentFont}>
                    dkgiri@iitk.ac.in
                  </a>
                </li>
              </ul>
            </div>

            {/* Contact Section */}
            <div className="col-lg-3 col-md-12 footer-contact text-center text-md-start fade-in-up">
              <h4 style={headingfont}>Contact Us</h4>
              <p style={contentFont}>
                Room No.203
                <br />
                Helicopter Lab
                <br />
                Aerospace Department
                <br />
                IIT Kanpur, Uttar Pradesh
                <br />
                India - 208016
                <br />
                <br />
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Preloader (hidden by default) */}
      <div id="preloader"></div>
    </footer>
  );
};

export default Footer;