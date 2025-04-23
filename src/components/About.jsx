import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import './About.css';
import './MobileTabs.css';

const About = ({ setCurrentPage }) => {
  const [activeMobileTab, setActiveMobileTab] = useState('nit');
  const [isMobileView, setIsMobileView] = useState(false);

  // Set initial mobile view state after component mounts to avoid hydration issues
  useEffect(() => {
    setIsMobileView(window.innerWidth <= 992);
  }, []);

  // Handle window resize to detect mobile view
  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth <= 992);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return (
    <section className="about-section" id="about">
      <div className="about-container">
        <div className="back-button-container">
          <button
            className="back-button"
            onClick={() => setCurrentPage('home')}
          >
            ← Back to Home
          </button>
        </div>
        <motion.h2
          className="about-title"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          About <span className="gradient-text">NIT Silchar</span>
        </motion.h2>

        {/* Mobile Tabs - Only visible on mobile */}
        {isMobileView && (
          <div className="mobile-tabs">
            <button
              className={`mobile-tab ${activeMobileTab === 'nit' ? 'active' : ''}`}
              onClick={() => setActiveMobileTab('nit')}
            >
              NIT Silchar
            </button>
            <button
              className={`mobile-tab ${activeMobileTab === 'website' ? 'active' : ''}`}
              onClick={() => setActiveMobileTab('website')}
            >
              Website
            </button>
            <button
              className={`mobile-tab ${activeMobileTab === 'creator' ? 'active' : ''}`}
              onClick={() => setActiveMobileTab('creator')}
            >
              Creator
            </button>
            <button
              className={`mobile-tab ${activeMobileTab === 'contact' ? 'active' : ''}`}
              onClick={() => setActiveMobileTab('contact')}
            >
              Contact
            </button>
          </div>
        )}

        {/* Mobile Tab Content - Only visible on mobile */}
        {isMobileView && (
          <div className="mobile-tab-contents">
            {/* NIT Silchar Tab Content */}
            <div className={`mobile-tab-content ${activeMobileTab === 'nit' ? 'active' : ''}`}>
              <div className="tab-content-nit">
                <h3>A Premier Institute of National Importance</h3>
                <div style={{ marginBottom: '1.5rem' }}>
                  <img
                    src="/about.jpg"
                    alt="NIT Silchar Campus"
                    style={{ width: '100%', height: 'auto', borderRadius: '8px', marginBottom: '1.5rem' }}
                  />
                </div>
                <p>
                  National Institute of Technology Silchar (NIT Silchar) is one of the 31 NITs of India and was established in 1967 as a Regional Engineering College (REC).
                  In 2002, it was upgraded to the status of National Institute of Technology with the passage of the National Institutes of Technology Act.
                </p>
                <p>
                  The institute has emerged as one of the most prestigious institutions in the North-Eastern region of India, offering high-quality education in engineering, science, and technology. With a sprawling campus of 600 acres, NIT Silchar provides a conducive environment for academic excellence and holistic development.
                </p>
                <p>
                  NIT Silchar hosts numerous events throughout the academic year, ranging from technical festivals to cultural celebrations, providing students with opportunities to showcase their talents and skills. The institute's vibrant campus life is characterized by a diverse range of clubs and societies that cater to various interests and passions.
                </p>

                <div className="about-facts" style={{ marginTop: '2rem' }}>
                  <h4>Quick Facts</h4>
                  <ul>
                    <li><span>📍</span> Location: Silchar, Assam, India</li>
                    <li><span>🏫</span> Established: 1967</li>
                    <li><span>👨‍🎓</span> Students: 5000+</li>
                    <li><span>🌐</span> Website: www.nits.ac.in</li>
                  </ul>
                </div>

                <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                  <a href="https://www.nits.ac.in" target="_blank" rel="noopener noreferrer" className="about-btn">
                    Visit Official Website
                  </a>
                </div>
              </div>
            </div>

            {/* Website Tab Content */}
            <div className={`mobile-tab-content ${activeMobileTab === 'website' ? 'active' : ''}`}>
              <div className="tab-content-website">
                <h3>Your Gateway to Campus Events</h3>
                <p>
                  The NIT Silchar Event Manager is a comprehensive platform designed to streamline the process of discovering, organizing, and participating in campus events. Our mission is to create a vibrant and connected campus community by making event information accessible to all students, faculty, and staff.
                </p>
                <p>
                  Whether you're looking to attend technical workshops, cultural performances, sports competitions, or traditional celebrations, our platform provides all the information you need in one place. For club administrators, we offer powerful tools to create and manage events, track registrations, and engage with participants.
                </p>

                <div className="features-list" style={{ marginTop: '2rem' }}>
                  <h4>Key Features</h4>
                  <ul>
                    <li>
                      <div className="feature-icon">🔍</div>
                      <div className="feature-text">
                        <h5>Discover Events</h5>
                        <p>Browse upcoming events by category, date, or organizing club</p>
                      </div>
                    </li>
                    <li>
                      <div className="feature-icon">📝</div>
                      <div className="feature-text">
                        <h5>Easy Registration</h5>
                        <p>Register for events with just a few clicks</p>
                      </div>
                    </li>
                    <li>
                      <div className="feature-icon">👥</div>
                      <div className="feature-text">
                        <h5>Club Management</h5>
                        <p>Dedicated dashboard for clubs to create and manage events</p>
                      </div>
                    </li>
                    <li>
                      <div className="feature-icon">🔔</div>
                      <div className="feature-text">
                        <h5>Real-time Updates</h5>
                        <p>Stay informed about event changes and announcements</p>
                      </div>
                    </li>
                  </ul>
                </div>

                <div style={{ marginTop: '2rem' }}>
                  <div className="showcase-card">
                    <div className="card-header">
                      <h4>Why Use Event Manager?</h4>
                    </div>
                    <div className="card-body">
                      <ul>
                        <li><strong>Centralized Information:</strong> All campus events in one place</li>
                        <li><strong>User-Friendly Interface:</strong> Intuitive design for seamless navigation</li>
                        <li><strong>Mobile Responsive:</strong> Access from any device, anywhere</li>
                        <li><strong>Secure Registration:</strong> Safe and reliable event sign-up process</li>
                        <li><strong>Detailed Analytics:</strong> For event organizers to track participation</li>
                        <li><strong>Immersive Experience:</strong> Visually appealing event presentations</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Creator Tab Content */}
            <div className={`mobile-tab-content ${activeMobileTab === 'creator' ? 'active' : ''}`}>
              <div className="tab-content-creator">
                <h3>Meet the Creator</h3>
                <div className="profile-card" style={{ marginBottom: '2rem' }}>
                  <div className="profile-image">
                    <img src="/Dhrub.jpg" alt="Dhruba Kr Agarwalla" />
                  </div>
                  <h3>Dhruba Kr Agarwalla</h3>
                  <p className="profile-role">Lead Developer</p>
                  <p className="profile-id">Scholar ID: 2411100</p>
                </div>

                <p>
                  The Event Manager platform was designed and developed to provide a seamless experience for organizing and participating in campus events at NIT Silchar.
                </p>
                <p>
                  Our mission is to create a vibrant and connected campus community by making event information accessible to all students, faculty, and staff.
                </p>
                <p>
                  This platform serves as a centralized hub for all campus activities, helping clubs and organizations reach a wider audience while providing students with opportunities to engage in diverse experiences.
                </p>
              </div>
            </div>

            {/* Contact Tab Content */}
            <div className={`mobile-tab-content ${activeMobileTab === 'contact' ? 'active' : ''}`}>
              <div className="tab-content-contact">
                <h3>Get in Touch</h3>
                <p className="contact-intro">
                  Have questions, suggestions, or feedback about the Event Manager platform? We'd love to hear from you! Reach out to our team using any of the methods below.
                </p>

                <div style={{ marginTop: '2rem' }}>
                  <div className="contact-method" style={{ marginBottom: '2rem' }}>
                    <div className="contact-icon">✉️</div>
                    <h4>Email</h4>
                    <p>dhrubagarwala67@gmail.com</p>
                  </div>

                  <div className="contact-method" style={{ marginBottom: '2rem' }}>
                    <div className="contact-icon">📱</div>
                    <h4>Phone</h4>
                    <p>+91 9395386870</p>
                  </div>
                </div>

                <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                  <a
                    href="https://wa.me/919395386870"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="contact-btn"
                    style={{ display: 'inline-block', textDecoration: 'none' }}
                  >
                    <span style={{ marginRight: '8px' }}>💬</span> Send Message on WhatsApp
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Desktop Content - Hidden on mobile when tabs are active */}
        {!isMobileView && (
          <>
            {/* Institute Info */}
            <div className="about-content">
          <motion.div
            className="about-text"
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <h3>A Premier Institute of National Importance</h3>
            <p>
              National Institute of Technology Silchar (NIT Silchar) is one of the 31 NITs of India and was established in 1967 as a Regional Engineering College (REC).
              In 2002, it was upgraded to the status of National Institute of Technology with the passage of the National Institutes of Technology Act.
            </p>
            <p>
              The institute has emerged as one of the most prestigious institutions in the North-Eastern region of India, offering high-quality education in engineering, science, and technology. With a sprawling campus of 600 acres, NIT Silchar provides a conducive environment for academic excellence and holistic development.
            </p>
            <p>
              NIT Silchar hosts numerous events throughout the academic year, ranging from technical festivals to cultural celebrations, providing students with opportunities to showcase their talents and skills. The institute's vibrant campus life is characterized by a diverse range of clubs and societies that cater to various interests and passions.
            </p>

            <a href="https://www.nits.ac.in" target="_blank" rel="noopener noreferrer" className="about-btn">
              Visit Official Website
            </a>
          </motion.div>

          <motion.div
            className="about-image"
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            viewport={{ once: true }}
          >
            <img
              src="/about.jpg"
              alt="NIT Silchar Campus"
              style={{ width: '100%', height: 'auto', borderRadius: '8px' }}
            />

            <div className="about-facts">
              <h4>Quick Facts</h4>
              <ul>
                <li><span>📍</span> Location: Silchar, Assam, India</li>
                <li><span>🏫</span> Established: 1967</li>
                <li><span>👨‍🎓</span> Students: 5000+</li>
                <li><span>🌐</span> Website: www.nits.ac.in</li>
              </ul>
            </div>
          </motion.div>
        </div>

        {/* Event Manager Info */}
        <motion.div
          className="event-manager-section"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2>About <span className="gradient-text">Event Manager</span></h2>

          <div className="event-manager-content">
            <motion.div
              className="event-manager-text"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <h3>Your Gateway to Campus Events</h3>
              <p>
                The NIT Silchar Event Manager is a comprehensive platform designed to streamline the process of discovering, organizing, and participating in campus events. Our mission is to create a vibrant and connected campus community by making event information accessible to all students, faculty, and staff.
              </p>
              <p>
                Whether you're looking to attend technical workshops, cultural performances, sports competitions, or traditional celebrations, our platform provides all the information you need in one place. For club administrators, we offer powerful tools to create and manage events, track registrations, and engage with participants.
              </p>

              <div className="features-list">
                <h4>Key Features</h4>
                <ul>
                  <li>
                    <div className="feature-icon">🔍</div>
                    <div className="feature-text">
                      <h5>Discover Events</h5>
                      <p>Browse upcoming events by category, date, or organizing club</p>
                    </div>
                  </li>
                  <li>
                    <div className="feature-icon">📝</div>
                    <div className="feature-text">
                      <h5>Easy Registration</h5>
                      <p>Register for events with just a few clicks</p>
                    </div>
                  </li>
                  <li>
                    <div className="feature-icon">👥</div>
                    <div className="feature-text">
                      <h5>Club Management</h5>
                      <p>Dedicated dashboard for clubs to create and manage events</p>
                    </div>
                  </li>
                  <li>
                    <div className="feature-icon">🔔</div>
                    <div className="feature-text">
                      <h5>Real-time Updates</h5>
                      <p>Stay informed about event changes and announcements</p>
                    </div>
                  </li>
                </ul>
              </div>
            </motion.div>

            <motion.div
              className="event-manager-showcase"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              viewport={{ once: true }}
            >
              <div className="showcase-card">
                <div className="card-header">
                  <h4>Why Use Event Manager?</h4>
                </div>
                <div className="card-body">
                  <ul>
                    <li><strong>Centralized Information:</strong> All campus events in one place</li>
                    <li><strong>User-Friendly Interface:</strong> Intuitive design for seamless navigation</li>
                    <li><strong>Mobile Responsive:</strong> Access from any device, anywhere</li>
                    <li><strong>Secure Registration:</strong> Safe and reliable event sign-up process</li>
                    <li><strong>Detailed Analytics:</strong> For event organizers to track participation</li>
                    <li><strong>Immersive Experience:</strong> Visually appealing event presentations</li>
                  </ul>
                </div>
              </div>

              <div className="showcase-card">
                <div className="card-header">
                  <h4>Latest Updates</h4>
                </div>
                <div className="card-body">
                  <div className="update-item">
                    <h5>3D Immersive Interface</h5>
                    <p>Experience events in a whole new way with our interactive 3D environment</p>
                    <span className="update-date">June 2023</span>
                  </div>
                  <div className="update-item">
                    <h5>Club Dashboard Enhancements</h5>
                    <p>New tools for clubs to better manage their events and track registrations</p>
                    <span className="update-date">May 2023</span>
                  </div>
                  <div className="update-item">
                    <h5>Mobile App Launch</h5>
                    <p>Get event notifications and updates on the go with our new mobile application</p>
                    <span className="update-date">April 2023</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Team Section */}
        <motion.div
          className="team-section"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2>Our <span className="gradient-text">Team</span></h2>

          <div className="team-content">
            <motion.div
              className="team-text"
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <h3>Meet the Creator</h3>
              <p>
                The Event Manager platform was designed and developed to provide a seamless experience for organizing and participating in campus events at NIT Silchar.
              </p>
              <p>
                Our mission is to create a vibrant and connected campus community by making event information accessible to all students, faculty, and staff.
              </p>
              <p>
                This platform serves as a centralized hub for all campus activities, helping clubs and organizations reach a wider audience while providing students with opportunities to engage in diverse experiences.
              </p>
            </motion.div>

            <motion.div
              className="team-profile"
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              viewport={{ once: true }}
            >
              <div className="profile-card">
                <div className="profile-image">
                  <img src="/Dhrub.jpg" alt="Dhruba Kr Agarwalla" />
                </div>
                <h3>Dhruba Kr Agarwalla</h3>
                <p className="profile-role">Lead Developer</p>
                <p className="profile-id">Scholar ID: 2411100</p>
              </div>
            </motion.div>
          </div>
        </motion.div>



        {/* Contact Section */}
        <motion.div
          className="contact-section"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2>Get in <span className="gradient-text">Touch</span></h2>
          <p className="contact-intro">
            Have questions, suggestions, or feedback about the Event Manager platform? We'd love to hear from you! Reach out to our team using any of the methods below.
          </p>

          <div className="contact-methods">
            <motion.div
              className="contact-method"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
            >
              <div className="contact-icon">✉️</div>
              <h4>Email</h4>
              <p>dhrubagarwala67@gmail.com</p>
            </motion.div>

            <motion.div
              className="contact-method"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <div className="contact-icon">📱</div>
              <h4>Phone</h4>
              <p>+91 9395386870</p>
            </motion.div>
          </div>

          <motion.a
            href="https://wa.me/919395386870"
            target="_blank"
            rel="noopener noreferrer"
            className="contact-btn"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            viewport={{ once: true }}
            style={{ display: 'inline-block', textDecoration: 'none' }}
          >
            <span style={{ marginRight: '8px' }}>💬</span> Send Message on WhatsApp
          </motion.a>
        </motion.div>
          </>
        )}
      </div>
    </section>
  );
};

export default About;
