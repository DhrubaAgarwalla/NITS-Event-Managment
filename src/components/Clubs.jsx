import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { gsap } from 'gsap';
import clubService from '../services/clubService';

const Clubs = ({ setCurrentPage, setSelectedClubId }) => {
  const sectionRef = useRef(null);
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch clubs from Supabase
  useEffect(() => {
    const fetchClubs = async () => {
      try {
        setLoading(true);
        const clubsData = await clubService.getAllClubs();
        setClubs(clubsData);
        setError(null);
      } catch (err) {
        console.error('Error fetching clubs:', err);
        setError('Failed to load clubs. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchClubs();
  }, []);

  useEffect(() => {
    if (sectionRef.current) {
      // Animate club items on scroll
      const clubItems = sectionRef.current.querySelectorAll('.club-item');

      gsap.fromTo(
        clubItems,
        { y: 100, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          stagger: 0.1,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 70%',
            end: 'center center',
            scrub: 1,
          },
        }
      );
    }
  }, []);

  return (
    <section className="section" id="clubs" ref={sectionRef}>
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <motion.h2
            className="section-title"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            style={{ margin: 0 }}
          >
            Campus <span className="gradient-text">Clubs</span>
          </motion.h2>

          <motion.button
            className="btn btn-primary"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            onClick={() => setCurrentPage('clubs-page')}
          >
            View All Clubs
          </motion.button>
        </div>

        <motion.p
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
          style={{ maxWidth: '700px', margin: '0 auto 3rem' }}
        >
          Join one of our many clubs to explore your interests, develop new skills, and connect with like-minded students.
          Each club organizes various events and activities throughout the academic year.
        </motion.p>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <p>Loading clubs...</p>
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--error)' }}>
            <p>{error}</p>
          </div>
        ) : clubs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <p>No clubs found. Check back later!</p>
          </div>
        ) : (
          <div className="clubs-list content">
            {clubs.map((club, index) => (
              <motion.div
                key={club.id}
                className="club-item"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -10, transition: { duration: 0.3 } }}
              >
                <div className="club-icon">
                  {club.logo_url ? (
                    <img
                      src={club.logo_url}
                      alt={club.name}
                      style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover' }}
                    />
                  ) : (
                    '🏫'
                  )}
                </div>
                <h3 className="club-name">{club.name}</h3>
                <p className="club-description">{club.description}</p>
                <button
                  onClick={() => {
                    setSelectedClubId(club.id);
                    setCurrentPage('club-details');
                  }}
                  className="btn"
                >
                  View Club
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default Clubs;
