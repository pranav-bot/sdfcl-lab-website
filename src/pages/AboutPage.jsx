import { useState, useEffect } from 'react';
import emailjs from '@emailjs/browser';
import 'bootstrap/dist/css/bootstrap.min.css';
import './AboutPage.css';

// Define the heading and content fonts
const headingfont = {
  fontFamily: 'Space Mono',
  fontWeight: 800,
  color: 'white'
};

const contentFont = {
  fontFamily: 'Poppins',
  fontWeight: 200,
  color: 'white'
};

function AboutPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  // Change background color on mount
  useEffect(() => {
    document.body.style.backgroundColor = '#011317';
    return () => {
      // Optionally reset background color
      // document.body.style.backgroundColor = '';
    };
  }, []);

  // Handle form submission using EmailJS
  const handleSubmit = (e) => {
    e.preventDefault();
    setSending(true);

    // EmailJS configuration - replace these with your actual EmailJS values.
    const serviceID = 'service_clkyt9s';
    const templateID = 'template_oxl2e2s';
    const userID = '-V6-uGEZ533Aj9mUY';

    const templateParams = {
      to_email: 'pranav23advani@gmail.com', // Recipient email
      from_name: name,
      from_email: email,
      message: message,
    };

    emailjs.send(serviceID, templateID, templateParams, userID)
      .then((response) => {
        console.log('SUCCESS!', response.status, response.text);
        alert('Your message has been sent!');
        // Reset form fields
        setName('');
        setEmail('');
        setMessage('');
        setSending(false);
      }, (err) => {
        console.error('FAILED...', err);
        alert('Failed to send your message. Please try again later.');
        setSending(false);
      });
  };

  return (
    <div className="container py-5 fade-in-up" style={contentFont}>
      {/* Main Heading */}
      <h1 className="text-center mb-4 fade-in-up" style={headingfont}>
        About Us
      </h1>

      <p className="text-center fade-in-up">
        Welcome to the Helicopter Lab at the Aerospace Department, IIT Kanpur.
        Feel free to reach out to us using the contact details or the form below.
      </p>

      <div className="row mt-5 fade-in-up">
        {/* Contact Info */}
        <div className="col-md-6 fade-in-up" style={contentFont}>
          <h2 style={headingfont}>Contact Information</h2>
          <p style={{ textAlign: 'left' }}>
            <strong>Location:</strong> Room No. 203, Helicopter Lab, Aerospace
            Department, IIT Kanpur, Uttar Pradesh, India, 208016
          </p>
          <p style={{ textAlign: 'left' }}>
            <strong>Email:</strong>{' '}
            <a href="mailto:dkgiri@iitk.ac.in" style={{ color: 'white' }}>
              dkgiri@iitk.ac.in
            </a>
          </p>
          <p style={{ textAlign: 'left' }}>
            <strong>Call:</strong>{' '}
            <a href="tel:+915122597107" style={{ color: 'white' }}>
              0512-259-7107
            </a>
          </p>

          {/* Map */}
          <iframe
            title="IIT Kanpur Location"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3558.456423051955!2d80.2290093!3d26.5123388!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x399c3822e3128535%3A0x55159d314cb2a6d5!2sIIT%20Kanpur%20Helicopter%20Lab!5e0!3m2!1sen!2sin!4v1693245780000"
            className="w-100 rounded mb-4 fade-in-up"
            height="400"
            style={{ border: '0' }}
            allowFullScreen=""
            loading="lazy"
          ></iframe>
        </div>

        {/* Contact Form */}
        <div className="col-md-6 fade-in-up" style={contentFont}>
          <h2 style={headingfont}>Send Us a Message</h2>
          <form onSubmit={handleSubmit} className="needs-validation" noValidate>
            <div className="mb-3">
              <label htmlFor="name" className="form-label" style={contentFont}>
                Name
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="form-control"
                required
                style={{color: 'black'}}
              />
            </div>

            <div className="mb-3">
              <label htmlFor="email" className="form-label" style={contentFont}>
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-control"
                required
                style={{color: 'black'}}
              />
            </div>

            <div className="mb-3">
              <label htmlFor="message" className="form-label" style={contentFont}>
                Message
              </label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="form-control"
                rows="4"
                required
                style={{color: 'black'}}
              ></textarea>
            </div>

            <button type="submit" className="btn btn-primary w-100 fade-in-up" disabled={sending}>
              {sending ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AboutPage;
