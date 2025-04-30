import { useState } from 'react';
import { motion } from 'framer-motion';
import FirebaseTest from '../components/FirebaseTest';
import CloudinaryTest from '../components/CloudinaryTest';

export default function TestPage() {
  const [activeTab, setActiveTab] = useState('firebase');

  return (
    <section className="section" style={{ minHeight: '100vh', background: 'var(--dark-bg)' }}>
      <motion.div
        className="container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{
          maxWidth: '900px',
          margin: '0 auto',
          padding: '40px 20px',
          color: 'var(--text-primary)'
        }}
      >
        <motion.h1
          className="gradient-text"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          style={{
            fontSize: '3rem',
            textAlign: 'center',
            marginBottom: '2rem',
            background: 'linear-gradient(90deg, #9c27b0, #3f51b5)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}
        >
          Firebase and Cloudinary Test Page
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          style={{
            marginBottom: '30px',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '10px',
            overflow: 'hidden',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)'
          }}
        >
          <div style={{
            display: 'flex',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <button
              style={{
                padding: '15px 25px',
                background: activeTab === 'firebase'
                  ? 'rgba(156, 39, 176, 0.2)'
                  : 'transparent',
                border: 'none',
                borderBottom: activeTab === 'firebase'
                  ? '2px solid #9c27b0'
                  : 'none',
                cursor: 'pointer',
                color: activeTab === 'firebase'
                  ? '#9c27b0'
                  : 'var(--text-secondary)',
                fontWeight: activeTab === 'firebase' ? '600' : '400',
                fontSize: '1rem',
                flex: 1,
                transition: 'all 0.3s ease'
              }}
              onClick={() => setActiveTab('firebase')}
            >
              Firebase Test
            </button>
            <button
              style={{
                padding: '15px 25px',
                background: activeTab === 'cloudinary'
                  ? 'rgba(63, 81, 181, 0.2)'
                  : 'transparent',
                border: 'none',
                borderBottom: activeTab === 'cloudinary'
                  ? '2px solid #3f51b5'
                  : 'none',
                cursor: 'pointer',
                color: activeTab === 'cloudinary'
                  ? '#3f51b5'
                  : 'var(--text-secondary)',
                fontWeight: activeTab === 'cloudinary' ? '600' : '400',
                fontSize: '1rem',
                flex: 1,
                transition: 'all 0.3s ease'
              }}
              onClick={() => setActiveTab('cloudinary')}
            >
              Cloudinary Test
            </button>
          </div>

          <div style={{ padding: '20px' }}>
            {activeTab === 'firebase' && <FirebaseTest />}
            {activeTab === 'cloudinary' && <CloudinaryTest />}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          style={{
            marginTop: '40px',
            padding: '25px',
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
            borderRadius: '10px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)'
          }}
        >
          <h3 style={{
            color: 'var(--primary)',
            marginBottom: '15px',
            fontSize: '1.5rem'
          }}>
            Setup Instructions
          </h3>
          <p style={{
            lineHeight: '1.6',
            color: 'var(--text-secondary)',
            marginBottom: '15px'
          }}>
            Make sure you have set up your Firebase and Cloudinary credentials in the .env file.
            See the FIREBASE_SETUP.md file for detailed instructions.
          </p>
          <p style={{
            lineHeight: '1.6',
            color: 'var(--text-secondary)'
          }}>
            This test page allows you to verify that your Firebase and Cloudinary integrations are working correctly.
          </p>
        </motion.div>
      </motion.div>
    </section>
  );
}
