import { useState, useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from '@studio-freight/lenis'
import { motion, AnimatePresence } from 'framer-motion'
import './App.css'
import './styles/dropdown.css'
import './styles/mobile.css'
import './styles/clubDashboardDesktop.css'
import './styles/clubDashboardMobile.css'
import './styles/adminDashboardMobile.css'
import './styles/eventDetailsMobile.css'
import './styles/clubDetailsMobile.css'
import './styles/aboutMobile.css'
import './styles/modal.css'
import './styles/mobile3D.css'

// Connection Indicator (hidden)
// import ConnectionIndicator from './components/ConnectionIndicator'

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger);

// Suppress GSAP warnings in development and production
gsap.config({
  nullTargetWarn: false,
  trialWarn: false
});

// Auth Context
import { useAuth } from './contexts/AuthContext';

// Navigation utilities
import { navigateAfterLogin } from './utils/navigation';

// Components
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Events from './components/Events';
import Clubs from './components/Clubs';
import About from './components/About';
import Footer from './components/Footer';
import Cursor from './components/Cursor';
import Login from './components/Login';
import EventDetails from './components/EventDetails';
import { ClubDashboard, AdminDashboard } from './components/LazyComponents';
import ClubDetails from './components/ClubDetails';
import EventsPage from './components/EventsPage';
import ClubsPage from './components/ClubsPage';
import AdminCheck from './components/AdminCheck';
import ClubRequestForm from './components/ClubRequestForm';
import { EventCreationForm, AutoCreatedSheetsViewer } from './components/LazyComponents';
import ForgotPassword from './components/ForgotPassword';
import Mobile3DEffects from './components/Mobile3DEffects';
import PerformanceBoost from './components/PerformanceBoost';

// Automation services
import automationInitializer from './services/automationInitializer';
import performanceService from './services/performanceService';

import logger from './utils/logger';
function App() {
  const { user, club, isAdmin, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const scrollContainerRef = useRef(null);
  const [currentPage, setCurrentPage] = useState('home'); // 'home', 'event-details', 'login', 'club-dashboard', etc.
  const [selectedEventId, setSelectedEventId] = useState(1); // Default to first event
  const [selectedClubId, setSelectedClubId] = useState(1); // Default to first club
  const [isClubLoggedIn, setIsClubLoggedIn] = useState(false); // Track if a club is logged in (legacy - will be replaced by auth context)

  // Check URL for direct navigation and special routes
  useEffect(() => {
    // Parse the current URL path
    const path = window.location.pathname;
    const hash = window.location.hash;
    const query = window.location.search;

    logger.log('App.jsx - URL check:', { path, hash, query, currentPage });

    // Handle direct event URLs: /event/:id
    const eventMatch = path.match(/\/event\/([\w-]+)/);
    if (eventMatch && eventMatch[1]) {
      const eventId = eventMatch[1];
      logger.log('Direct event URL detected:', eventId);
      setSelectedEventId(eventId);
      setCurrentPage('event-details');
      return;
    }

    // Handle direct club URLs: /club/:id
    const clubMatch = path.match(/\/club\/([\w-]+)/);
    if (clubMatch && clubMatch[1]) {
      const clubId = clubMatch[1];
      logger.log('Direct club URL detected:', clubId);
      setSelectedClubId(clubId);
      setCurrentPage('club-details');
      return;
    }



    // Handle other direct routes
    if (path === '/events') {
      setCurrentPage('events-page');
    } else if (path === '/clubs') {
      setCurrentPage('clubs-page');
    } else if (path === '/about') {
      setCurrentPage('about');
    } else if (path === '/login') {
      setCurrentPage('login');
    } else if (path === '/request') {
      setCurrentPage('club-request');
    } else if (path === '/sheets') {
      setCurrentPage('sheets');
    }
  }, []);

  // Update isClubLoggedIn based on auth context and handle redirects
  useEffect(() => {
    logger.log('Auth state changed:', { user, club, isAdmin, authLoading });

    if (user && club) {
      logger.log('Setting isClubLoggedIn to true');
      setIsClubLoggedIn(true);

      // If user is on login page and already logged in, redirect to appropriate dashboard
      if (currentPage === 'login') {
        navigateAfterLogin(setCurrentPage, user, isAdmin, true);
      }
    } else {
      logger.log('Setting isClubLoggedIn to false');
      setIsClubLoggedIn(false);

      // If user is on a protected page but not logged in, redirect to login
      if (['club-dashboard', 'create-event'].includes(currentPage) && !authLoading) {
        setCurrentPage('login');
      }
    }

    // If user is admin and on admin-check page, redirect to admin dashboard
    if (isAdmin && currentPage === 'admin-check' && !authLoading) {
      setCurrentPage('admin-dashboard');
    }
  }, [user, club, isAdmin, currentPage, authLoading]);

  // Initialize smooth scrolling with Lenis
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      direction: 'vertical',
      gestureOrientation: 'vertical',
      smooth: true,
      smoothTouch: false,
      touchMultiplier: 2,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    // Clean up
    return () => {
      lenis.destroy();
    };
  }, []);

  // Loading animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  // Initialize automation system and performance monitoring
  useEffect(() => {
    if (!loading && !authLoading) {
      // Initialize automation after app loads with better error handling
      setTimeout(() => {
        try {
          automationInitializer.initialize().catch(error => {
            console.warn('Automation system initialization failed (non-critical):', error);
          });
        } catch (error) {
          console.warn('Automation system initialization error (non-critical):', error);
        }
      }, 1000);

      // Log performance summary after app loads
      setTimeout(() => {
        try {
          performanceService.logPerformanceSummary();
        } catch (error) {
          console.warn('Performance service error (non-critical):', error);
        }
      }, 3000);
    }
  }, [loading, authLoading]);

  // Initialize scroll animations
  useEffect(() => {
    if (!loading) {
      // Animate sections on scroll
      const sections = document.querySelectorAll('.section');

      sections.forEach((section) => {
        const heading = section.querySelector('h2');
        const content = section.querySelector('.content');

        if (heading && content) {
          gsap.fromTo(
            heading,
            { opacity: 0, y: 50 },
            {
              opacity: 1,
              y: 0,
              duration: 1,
              scrollTrigger: {
                trigger: section,
                start: 'top 80%',
                end: 'top 50%',
                scrub: 1,
              },
            }
          );

          gsap.fromTo(
            content,
            { opacity: 0, y: 30 },
            {
              opacity: 1,
              y: 0,
              duration: 1,
              scrollTrigger: {
                trigger: section,
                start: 'top 70%',
                end: 'top 40%',
                scrub: 1,
              },
            }
          );
        }
      });
    }
  }, [loading]);

  return (
    <>
      <AnimatePresence>
        {loading ? (
          <motion.div
            className="loader"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
            >
              NIT Silchar
            </motion.h1>
            <motion.div
              className="loader-bar"
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
            />
          </motion.div>
        ) : (
          <div className="app">
            <PerformanceBoost />
            <Cursor />
            <Mobile3DEffects />
            <Navbar setCurrentPage={setCurrentPage} isClubLoggedIn={isClubLoggedIn} currentPage={currentPage} />

            {currentPage === 'home' && (
              <div className="smooth-scroll" ref={scrollContainerRef}>
                <div className="scroll-container">
                  <Hero setCurrentPage={setCurrentPage} />
                  <Events setCurrentPage={setCurrentPage} setSelectedEventId={setSelectedEventId} />
                  <Clubs setCurrentPage={setCurrentPage} setSelectedClubId={setSelectedClubId} />
                  <Footer setCurrentPage={setCurrentPage} />
                </div>
              </div>
            )}

            {currentPage === 'about' && <About setCurrentPage={setCurrentPage} />}

            {currentPage === 'event-details' && <EventDetails setCurrentPage={setCurrentPage} eventId={selectedEventId} />}
            {currentPage === 'club-details' && <ClubDetails setCurrentPage={setCurrentPage} clubId={selectedClubId} setSelectedEventId={setSelectedEventId} />}
            {currentPage === 'events-page' && <EventsPage setCurrentPage={setCurrentPage} setSelectedEventId={setSelectedEventId} />}
            {currentPage === 'clubs-page' && <ClubsPage setCurrentPage={setCurrentPage} setSelectedClubId={setSelectedClubId} />}
            {currentPage === 'login' && <Login setCurrentPage={setCurrentPage} setIsClubLoggedIn={setIsClubLoggedIn} />}
            {currentPage === 'club-dashboard' && <ClubDashboard setCurrentPage={setCurrentPage} setIsClubLoggedIn={setIsClubLoggedIn} />}
            {currentPage === 'admin-dashboard' && <AdminDashboard setCurrentPage={setCurrentPage} />}
            {currentPage === 'admin-check' && <AdminCheck setCurrentPage={setCurrentPage} />}
            {currentPage === 'club-request' && <ClubRequestForm setCurrentPage={setCurrentPage} />}
            {currentPage === 'create-event' && <EventCreationForm setCurrentPage={setCurrentPage} />}
            {currentPage === 'forgot-password' && <ForgotPassword setCurrentPage={setCurrentPage} />}
            {currentPage === 'sheets' && <AutoCreatedSheetsViewer />}
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

export default App
