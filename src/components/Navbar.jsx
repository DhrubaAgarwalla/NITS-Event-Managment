import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { navigateToHome, logoutAndRedirect } from '../utils/navigation';

const Navbar = ({ setCurrentPage, isClubLoggedIn = false, currentPage = 'home' }) => {
  const { user, isAdmin, signOut } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      if (scrollTop > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  // Don't render navbar for logged-in club users on the dashboard page
  // But show it on other pages like create-event
  if (isClubLoggedIn && currentPage !== 'create-event') {
    return null;
  }

  return (
    <>
      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="container navbar-container">
          <motion.div
            className="navbar-logo"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            onClick={() => navigateToHome(setCurrentPage)}
            style={{ cursor: 'pointer' }}
          >
            NIT Silchar Events
          </motion.div>

          <motion.div
            className="navbar-links"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {user ? (
              // Logged in user
              <>
                {isAdmin ? (
                  // Admin user
                  <>
                    <a href="#admin" className="navbar-link" onClick={(e) => { e.preventDefault(); setCurrentPage('admin-dashboard'); }}>Admin Dashboard</a>
                    <a href="#logout" className="btn" onClick={(e) => {
                      e.preventDefault();
                      logoutAndRedirect(signOut);
                    }}>Logout</a>
                  </>
                ) : (
                  // Club user
                  <>
                    <a href="#dashboard" className="navbar-link" onClick={(e) => { e.preventDefault(); setCurrentPage('club-dashboard'); }}>Dashboard</a>
                    <a href="#create-event" className="navbar-link" onClick={(e) => { e.preventDefault(); setCurrentPage('create-event'); }}>Create Event</a>
                    <a href="#logout" className="btn" onClick={(e) => {
                      e.preventDefault();
                      logoutAndRedirect(signOut);
                    }}>Logout</a>
                  </>
                )}
              </>
            ) : (
              // Not logged in
              <>
                <a href="#" className="navbar-link active" onClick={(e) => { e.preventDefault(); navigateToHome(setCurrentPage); }}>Home</a>
                <a href="#events" className="navbar-link" onClick={(e) => { e.preventDefault(); setCurrentPage('events-page'); }}>Events</a>
                <a href="#clubs" className="navbar-link" onClick={(e) => { e.preventDefault(); setCurrentPage('clubs-page'); }}>Clubs</a>
                <a href="#about" className="navbar-link" onClick={(e) => { e.preventDefault(); setCurrentPage('about'); }}>About</a>
                <a href="#request" className="navbar-link" onClick={(e) => { e.preventDefault(); setCurrentPage('club-request'); }}>Request Club</a>
                <a href="#login" className="btn" onClick={(e) => { e.preventDefault(); setCurrentPage('login'); }}>Login</a>
              </>
            )}
          </motion.div>

          <button className="mobile-menu-btn" onClick={toggleMobileMenu}>
            <span>☰</span>
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div className={`menu-overlay ${mobileMenuOpen ? 'open' : ''}`} onClick={toggleMobileMenu}></div>
      <div className={`mobile-menu ${mobileMenuOpen ? 'open' : ''}`}>
        <button className="mobile-menu-close" onClick={toggleMobileMenu}>✕</button>
        <div className="mobile-menu-links">
          {user ? (
            // Logged in user
            <>
              {isAdmin ? (
                // Admin user
                <>
                  <a href="#admin" className="mobile-menu-link" onClick={(e) => { e.preventDefault(); setCurrentPage('admin-dashboard'); toggleMobileMenu(); }}>Admin Dashboard</a>
                  <a href="#logout" className="btn btn-primary" onClick={(e) => {
                    e.preventDefault();
                    toggleMobileMenu();
                    logoutAndRedirect(signOut);
                  }}>Logout</a>
                </>
              ) : (
                // Club user
                <>
                  <a href="#dashboard" className="mobile-menu-link" onClick={(e) => { e.preventDefault(); setCurrentPage('club-dashboard'); toggleMobileMenu(); }}>Dashboard</a>
                  <a href="#create-event" className="mobile-menu-link" onClick={(e) => { e.preventDefault(); setCurrentPage('create-event'); toggleMobileMenu(); }}>Create Event</a>
                  <a href="#logout" className="btn btn-primary" onClick={(e) => {
                    e.preventDefault();
                    toggleMobileMenu();
                    logoutAndRedirect(signOut);
                  }}>Logout</a>
                </>
              )}
            </>
          ) : (
            // Not logged in
            <>
              <a href="#" className="mobile-menu-link" onClick={(e) => { e.preventDefault(); toggleMobileMenu(); navigateToHome(setCurrentPage); }}>Home</a>
              <a href="#events" className="mobile-menu-link" onClick={(e) => { e.preventDefault(); setCurrentPage('events-page'); toggleMobileMenu(); }}>Events</a>
              <a href="#clubs" className="mobile-menu-link" onClick={(e) => { e.preventDefault(); setCurrentPage('clubs-page'); toggleMobileMenu(); }}>Clubs</a>
              <a href="#about" className="mobile-menu-link" onClick={(e) => { e.preventDefault(); setCurrentPage('about'); toggleMobileMenu(); }}>About</a>
              <a href="#request" className="mobile-menu-link" onClick={(e) => { e.preventDefault(); setCurrentPage('club-request'); toggleMobileMenu(); }}>Request Club</a>
              <a href="#login" className="btn btn-primary" onClick={(e) => { e.preventDefault(); setCurrentPage('login'); toggleMobileMenu(); }}>Login</a>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default Navbar;
