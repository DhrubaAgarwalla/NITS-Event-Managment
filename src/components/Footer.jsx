import { motion } from 'framer-motion';
import { navigateToHome } from '../utils/navigation';

const Footer = ({ setCurrentPage }) => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <div className="footer-logo">NIT Silchar Events</div>
            <p className="footer-description">
              Your gateway to all events and activities happening at NIT Silchar.
              Stay updated, register, and participate in various technical, cultural, and traditional events.
            </p>
            <div className="footer-social">
              <a href="#" className="footer-social-link">
                <span>FB</span>
              </a>
              <a href="#" className="footer-social-link">
                <span>IG</span>
              </a>
              <a href="#" className="footer-social-link">
                <span>TW</span>
              </a>
              <a href="#" className="footer-social-link">
                <span>LI</span>
              </a>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <h3 className="footer-heading">Quick Links</h3>
            <div className="footer-links">
              <a href="#" className="footer-link" onClick={(e) => { e.preventDefault(); navigateToHome(setCurrentPage); }}>Home</a>
              <a href="#events" className="footer-link" onClick={(e) => { e.preventDefault(); setCurrentPage('events-page'); }}>Events</a>
              <a href="#clubs" className="footer-link" onClick={(e) => { e.preventDefault(); setCurrentPage('clubs-page'); }}>Clubs</a>
              <a href="#about" className="footer-link" onClick={(e) => { e.preventDefault(); setCurrentPage('about'); }}>About</a>
              <a href="#login" className="footer-link" onClick={(e) => { e.preventDefault(); setCurrentPage('login'); }}>Login</a>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            viewport={{ once: true }}
          >
            <h3 className="footer-heading">Events</h3>
            <div className="footer-links">
              <a href="#" className="footer-link">Technical Events</a>
              <a href="#" className="footer-link">Cultural Events</a>
              <a href="#" className="footer-link">Traditional Events</a>
              <a href="#" className="footer-link">Sports Events</a>
              <a href="#" className="footer-link">Workshops</a>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            viewport={{ once: true }}
          >
            <h3 className="footer-heading">Contact</h3>
            <div className="footer-links">
              <p className="footer-link">NIT Silchar, Silchar, Assam, India - 788010</p>
              <p className="footer-link">Email: events@nits.ac.in</p>
              <p className="footer-link">Phone: +91 1234567890</p>
            </div>
          </motion.div>
        </div>

        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} NIT Silchar Events. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
