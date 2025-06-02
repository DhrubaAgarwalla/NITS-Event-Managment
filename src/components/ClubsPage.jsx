import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import clubService from '../services/clubService';
import { navigateTo } from '../utils/navigation';

import logger from '../utils/logger';
const ClubsPage = ({ setCurrentPage, setSelectedClubId }) => {
  const [searchTerm, setSearchTerm] = useState('');
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
        logger.error('Error fetching clubs:', err);
        setError('Failed to load clubs. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchClubs();
  }, []);

  // Filter clubs based on search term only
  const filteredClubs = clubs.filter(club => {
    const matchesSearch =
      club.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (club.description && club.description.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesSearch;
  });

  return (
    <section className="section clubs-page" id="clubs-page">
      <div className="container">
        <motion.h2
          className="section-title"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          All <span className="gradient-text">Clubs</span>
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          style={{ marginBottom: '2rem' }}
        >
          <div className="search-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div className="search-input-container" style={{ position: 'relative', width: '100%', maxWidth: '500px' }}>
              <div className="search-icon" style={{
                position: 'absolute',
                left: '1rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'rgba(255, 255, 255, 0.5)',
                fontSize: '1.1rem',
                pointerEvents: 'none',
                zIndex: 1
              }}>
                🔍
              </div>
              <input
                className="search-input"
                type="text"
                placeholder="Search clubs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '1rem 3rem 1rem 3rem',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  border: '2px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  color: 'var(--text-primary)',
                  fontSize: '1rem',
                  transition: 'all 0.3s ease',
                  outline: 'none'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--primary)';
                  e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.12)';
                  e.target.style.boxShadow = '0 0 0 3px rgba(110, 68, 255, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                  e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                  e.target.style.boxShadow = 'none';
                }}
              />
              {searchTerm && (
                <button
                  className="clear-button"
                  onClick={() => setSearchTerm('')}
                  style={{
                    position: 'absolute',
                    right: '1rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'rgba(255, 255, 255, 0.5)',
                    fontSize: '1.2rem',
                    cursor: 'pointer',
                    padding: '0.2rem',
                    borderRadius: '50%',
                    transition: 'all 0.2s ease',
                    zIndex: 1
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.color = 'var(--primary)';
                    e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.color = 'rgba(255, 255, 255, 0.5)';
                    e.target.style.backgroundColor = 'transparent';
                  }}
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <p>Loading clubs...</p>
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--error)' }}>
            <p>{error}</p>
          </div>
        ) : (
          <div className="clubs-list content" style={{ marginTop: '2rem' }}>
            {filteredClubs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', backgroundColor: 'var(--dark-surface)', borderRadius: '8px', gridColumn: '1 / -1' }}>
                <p>No clubs found matching your criteria.</p>
              </div>
            ) : (
              filteredClubs.map((club, index) => {
                // Extract category from club data or social links
                let category = 'other';
                if (club.social_links && club.social_links.category) {
                  category = club.social_links.category;
                }

                return (
                  <motion.div
                    key={club.id}
                    className="club-item"
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
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
                    {category && category !== 'other' && (
                      <div style={{
                        marginBottom: '1rem',
                        fontSize: '0.8rem',
                        padding: '0.2rem 0.5rem',
                        backgroundColor: 'rgba(110, 68, 255, 0.2)',
                        borderRadius: '4px',
                        color: 'var(--primary)',
                        textTransform: 'capitalize',
                        alignSelf: 'flex-start'
                      }}>
                        {category}
                      </div>
                    )}
                    <button
                      onClick={() => {
                        setSelectedClubId(club.id);
                        navigateTo(setCurrentPage, 'club-details', { clubId: club.id });
                      }}
                      className="btn"
                    >
                      View Club
                    </button>
                  </motion.div>
                );
              })
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default ClubsPage;
