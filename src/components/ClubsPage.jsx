import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import clubService from '../services/clubService';
import { navigateTo } from '../utils/navigation';

const ClubsPage = ({ setCurrentPage, setSelectedClubId }) => {
  const [filter, setFilter] = useState('all');
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
        console.error('Error fetching clubs:', err);
        setError('Failed to load clubs. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchClubs();
  }, []);

  // Group clubs by category for filtering
  const clubCategories = clubs.reduce((categories, club) => {
    // Extract category from club data or social links
    let category = 'other';
    if (club.social_links && club.social_links.category) {
      category = club.social_links.category.toLowerCase();
    }

    if (!categories.includes(category)) {
      categories.push(category);
    }
    return categories;
  }, []);

  // Filter clubs based on category and search term
  const filteredClubs = clubs.filter(club => {
    // Extract category from club data or social links
    let category = 'other';
    if (club.social_links && club.social_links.category) {
      category = club.social_links.category.toLowerCase();
    }

    const matchesFilter = filter === 'all' || category === filter;
    const matchesSearch =
      club.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (club.description && club.description.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesFilter && matchesSearch;
  });

  return (
    <section className="section" id="clubs-page">
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <button
                className={`btn ${filter === 'all' ? 'btn-primary' : ''}`}
                onClick={() => setFilter('all')}
              >
                All
              </button>
              {clubCategories.map(category => (
                <button
                  key={category}
                  className={`btn ${filter === category ? 'btn-primary' : ''}`}
                  onClick={() => setFilter(category)}
                >
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </button>
              ))}
            </div>

            <div>
              <input
                type="text"
                placeholder="Search clubs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '4px',
                  color: 'var(--text-primary)'
                }}
              />
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
