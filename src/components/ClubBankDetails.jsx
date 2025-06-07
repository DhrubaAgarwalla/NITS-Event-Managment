import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import clubService from '../services/clubService';
import logger from '../utils/logger';

const ClubBankDetails = ({ clubId, onClose }) => {
  const { user } = useAuth();
  const [bankDetails, setBankDetails] = useState({
    account_holder_name: '',
    account_number: '',
    ifsc_code: '',
    bank_name: '',
    branch_name: '',
    account_type: 'savings',
    upi_id: '',

    // Additional details for Razorpay Route
    business_type: 'individual',
    contact_name: '',
    contact_email: '',
    contact_phone: '',

    // Address details
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    pincode: '',

    // Verification status
    verification_status: 'pending',
    razorpay_account_id: null,
    created_at: null,
    updated_at: null
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('basic');

  useEffect(() => {
    loadBankDetails();
  }, [clubId]);

  const loadBankDetails = async () => {
    try {
      setLoading(true);
      const details = await clubService.getClubBankDetails(clubId);
      if (details) {
        setBankDetails(details);
      }
    } catch (error) {
      logger.error('Error loading bank details:', error);
      setError('Failed to load bank details');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setBankDetails(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateBankDetails = (includeContactDetails = false) => {
    const required = ['account_holder_name', 'account_number', 'ifsc_code', 'bank_name'];

    // Add contact and address fields for Razorpay setup
    if (includeContactDetails) {
      required.push('contact_name', 'contact_email', 'contact_phone', 'address_line1', 'city', 'state', 'pincode');
    }

    const missing = required.filter(field => !bankDetails[field]);

    if (missing.length > 0) {
      setError(`Please fill in: ${missing.join(', ').replace(/_/g, ' ')}`);
      return false;
    }

    // Validate IFSC code format
    const ifscPattern = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    if (!ifscPattern.test(bankDetails.ifsc_code)) {
      setError('Invalid IFSC code format');
      return false;
    }

    // Validate account number (basic check)
    if (bankDetails.account_number.length < 9 || bankDetails.account_number.length > 18) {
      setError('Account number should be between 9-18 digits');
      return false;
    }

    // Validate email format if contact details are required
    if (includeContactDetails && bankDetails.contact_email) {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(bankDetails.contact_email)) {
        setError('Invalid email format');
        return false;
      }
    }

    // Validate phone number if contact details are required
    if (includeContactDetails && bankDetails.contact_phone) {
      const phonePattern = /^[+]?[0-9\s\-()]{10,15}$/;
      if (!phonePattern.test(bankDetails.contact_phone)) {
        setError('Invalid phone number format');
        return false;
      }
    }

    return true;
  };

  const handleSave = async () => {
    try {
      setError('');
      setSuccess('');

      if (!validateBankDetails()) {
        return;
      }

      setSaving(true);

      const updatedDetails = {
        ...bankDetails,
        verification_status: bankDetails.razorpay_account_id ? bankDetails.verification_status : 'details_completed',
        updated_at: new Date().toISOString(),
        created_at: bankDetails.created_at || new Date().toISOString()
      };

      await clubService.updateClubBankDetails(clubId, updatedDetails);

      setSuccess('Bank details saved successfully!');
      setBankDetails(updatedDetails);

      // Auto-close success message
      setTimeout(() => setSuccess(''), 3000);

    } catch (error) {
      logger.error('Error saving bank details:', error);
      setError('Failed to save bank details. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateRazorpayAccount = async () => {
    try {
      setError('');
      setSaving(true);

      if (!validateBankDetails(true)) {
        return;
      }

      // This would call Razorpay Route API to create linked account
      const response = await fetch('/api/razorpay?action=create-linked-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          club_id: clubId,
          bank_details: bankDetails
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create Razorpay account');
      }

      const result = await response.json();

      setBankDetails(prev => ({
        ...prev,
        razorpay_account_id: result.account_id,
        verification_status: 'under_review'
      }));

      setSuccess('Razorpay account creation initiated! Verification may take 1-2 business days.');

    } catch (error) {
      logger.error('Error creating Razorpay account:', error);
      setError(error.message || 'Failed to create Razorpay account. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    try {
      setError('');
      setSaving(true);

      logger.log('Testing Razorpay connection...');
      const response = await fetch('/api/razorpay?action=test-connection');

      logger.log('Response status:', response.status);
      logger.log('Response headers:', response.headers);

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const textResponse = await response.text();
        logger.error('Non-JSON response received:', textResponse.substring(0, 200));
        setError('❌ API endpoint not found. Please check deployment.');
        return;
      }

      const result = await response.json();
      logger.log('API response:', result);

      if (response.ok) {
        setSuccess('✅ Razorpay connection successful! Ready to create accounts.');
      } else {
        setError(`❌ Connection failed: ${result.error || 'Unknown error'}`);
      }

    } catch (error) {
      logger.error('Error testing Razorpay connection:', error);
      setError(`❌ Failed to test connection: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '400px',
        backgroundColor: 'var(--dark-surface)',
        borderRadius: '10px'
      }}>
        <p>Loading bank details...</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      style={{
        backgroundColor: 'var(--dark-surface)',
        borderRadius: '10px',
        padding: '2rem',
        maxWidth: '800px',
        margin: '0 auto',
        maxHeight: '90vh',
        overflow: 'auto'
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        paddingBottom: '1rem'
      }}>
        <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>
          🏦 Bank Account Details
        </h2>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            fontSize: '1.5rem',
            cursor: 'pointer'
          }}
        >
          ×
        </button>
      </div>

      {/* Status Banner */}
      {bankDetails.verification_status && (
        <div style={{
          padding: '1rem',
          borderRadius: '8px',
          marginBottom: '1.5rem',
          backgroundColor:
            bankDetails.verification_status === 'verified' ? 'rgba(46, 204, 113, 0.1)' :
            bankDetails.verification_status === 'under_review' ? 'rgba(243, 156, 18, 0.1)' :
            bankDetails.verification_status === 'details_completed' ? 'rgba(52, 152, 219, 0.1)' :
            'rgba(231, 76, 60, 0.1)',
          border: `1px solid ${
            bankDetails.verification_status === 'verified' ? '#2ecc71' :
            bankDetails.verification_status === 'under_review' ? '#f39c12' :
            bankDetails.verification_status === 'details_completed' ? '#3498db' :
            '#e74c3c'
          }`,
          color:
            bankDetails.verification_status === 'verified' ? '#2ecc71' :
            bankDetails.verification_status === 'under_review' ? '#f39c12' :
            bankDetails.verification_status === 'details_completed' ? '#3498db' :
            '#e74c3c'
        }}>
          <strong>Status: </strong>
          {bankDetails.verification_status === 'verified' && '✅ Verified - Ready for direct payments'}
          {bankDetails.verification_status === 'under_review' && '🔄 Under Review - Verification in progress'}
          {bankDetails.verification_status === 'details_completed' && '📋 Details Completed - Ready for Razorpay setup'}
          {bankDetails.verification_status === 'pending' && '⏳ Pending - Please complete bank details'}
          {bankDetails.verification_status === 'rejected' && '❌ Rejected - Please contact support'}
        </div>
      )}

      {/* Error/Success Messages */}
      {error && (
        <div style={{
          padding: '1rem',
          backgroundColor: 'rgba(231, 76, 60, 0.1)',
          border: '1px solid #e74c3c',
          borderRadius: '8px',
          color: '#e74c3c',
          marginBottom: '1.5rem'
        }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{
          padding: '1rem',
          backgroundColor: 'rgba(46, 204, 113, 0.1)',
          border: '1px solid #2ecc71',
          borderRadius: '8px',
          color: '#2ecc71',
          marginBottom: '1.5rem'
        }}>
          {success}
        </div>
      )}

      {/* Tab Navigation */}
      <div style={{
        display: 'flex',
        marginBottom: '2rem',
        borderBottom: '1px solid rgba(255,255,255,0.1)'
      }}>
        <button
          onClick={() => setActiveTab('basic')}
          style={{
            padding: '1rem 1.5rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'basic' ? '2px solid var(--primary)' : 'none',
            color: activeTab === 'basic' ? 'var(--text-primary)' : 'var(--text-secondary)',
            cursor: 'pointer',
            fontWeight: activeTab === 'basic' ? '600' : '400'
          }}
        >
          Basic Details
        </button>
        <button
          onClick={() => setActiveTab('contact')}
          style={{
            padding: '1rem 1.5rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'contact' ? '2px solid var(--primary)' : 'none',
            color: activeTab === 'contact' ? 'var(--text-primary)' : 'var(--text-secondary)',
            cursor: 'pointer',
            fontWeight: activeTab === 'contact' ? '600' : '400'
          }}
        >
          Contact & Address
        </button>
        <button
          onClick={() => setActiveTab('razorpay')}
          style={{
            padding: '1rem 1.5rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'razorpay' ? '2px solid var(--primary)' : 'none',
            color: activeTab === 'razorpay' ? 'var(--text-primary)' : 'var(--text-secondary)',
            cursor: 'pointer',
            fontWeight: activeTab === 'razorpay' ? '600' : '400'
          }}
        >
          Razorpay Setup
        </button>
      </div>

      {/* Basic Details Tab */}
      {activeTab === 'basic' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
              Account Holder Name *
            </label>
            <input
              type="text"
              name="account_holder_name"
              value={bankDetails.account_holder_name}
              onChange={handleInputChange}
              placeholder="As per bank records"
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '4px',
                color: 'var(--text-primary)',
                fontSize: '1rem'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
              Account Number *
            </label>
            <input
              type="text"
              name="account_number"
              value={bankDetails.account_number}
              onChange={handleInputChange}
              placeholder="Bank account number"
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '4px',
                color: 'var(--text-primary)',
                fontSize: '1rem'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
              IFSC Code *
            </label>
            <input
              type="text"
              name="ifsc_code"
              value={bankDetails.ifsc_code}
              onChange={handleInputChange}
              placeholder="e.g., SBIN0001234"
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '4px',
                color: 'var(--text-primary)',
                fontSize: '1rem'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
              Bank Name *
            </label>
            <input
              type="text"
              name="bank_name"
              value={bankDetails.bank_name}
              onChange={handleInputChange}
              placeholder="e.g., State Bank of India"
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '4px',
                color: 'var(--text-primary)',
                fontSize: '1rem'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
              Branch Name
            </label>
            <input
              type="text"
              name="branch_name"
              value={bankDetails.branch_name}
              onChange={handleInputChange}
              placeholder="e.g., Main Branch, City Center"
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '4px',
                color: 'var(--text-primary)',
                fontSize: '1rem'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
              UPI ID (Optional)
            </label>
            <input
              type="text"
              name="upi_id"
              value={bankDetails.upi_id}
              onChange={handleInputChange}
              placeholder="e.g., club@paytm, club@gpay"
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '4px',
                color: 'var(--text-primary)',
                fontSize: '1rem'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
              Account Type
            </label>
            <select
              name="account_type"
              value={bankDetails.account_type}
              onChange={handleInputChange}
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '4px',
                color: 'var(--text-primary)',
                fontSize: '1rem'
              }}
            >
              <option value="savings">Savings</option>
              <option value="current">Current</option>
            </select>
          </div>
        </div>
      )}

      {/* Contact & Address Tab */}
      {activeTab === 'contact' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
              Contact Person Name *
            </label>
            <input
              type="text"
              name="contact_name"
              value={bankDetails.contact_name}
              onChange={handleInputChange}
              placeholder="Treasurer/Finance Head"
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '4px',
                color: 'var(--text-primary)',
                fontSize: '1rem'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
              Contact Email *
            </label>
            <input
              type="email"
              name="contact_email"
              value={bankDetails.contact_email}
              onChange={handleInputChange}
              placeholder="treasurer@club.com"
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '4px',
                color: 'var(--text-primary)',
                fontSize: '1rem'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
              Contact Phone *
            </label>
            <input
              type="tel"
              name="contact_phone"
              value={bankDetails.contact_phone}
              onChange={handleInputChange}
              placeholder="+91 9876543210"
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '4px',
                color: 'var(--text-primary)',
                fontSize: '1rem'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
              Business Type
            </label>
            <select
              name="business_type"
              value={bankDetails.business_type}
              onChange={handleInputChange}
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '4px',
                color: 'var(--text-primary)',
                fontSize: '1rem'
              }}
            >
              <option value="educational">Educational</option>
              <option value="non_profit">Non-Profit</option>
              <option value="society">Society</option>
            </select>
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
              Address Line 1 *
            </label>
            <input
              type="text"
              name="address_line1"
              value={bankDetails.address_line1}
              onChange={handleInputChange}
              placeholder="Building, Street"
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '4px',
                color: 'var(--text-primary)',
                fontSize: '1rem'
              }}
            />
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
              Address Line 2
            </label>
            <input
              type="text"
              name="address_line2"
              value={bankDetails.address_line2}
              onChange={handleInputChange}
              placeholder="Area, Landmark"
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '4px',
                color: 'var(--text-primary)',
                fontSize: '1rem'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
              City *
            </label>
            <input
              type="text"
              name="city"
              value={bankDetails.city}
              onChange={handleInputChange}
              placeholder="Silchar"
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '4px',
                color: 'var(--text-primary)',
                fontSize: '1rem'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
              State *
            </label>
            <input
              type="text"
              name="state"
              value={bankDetails.state}
              onChange={handleInputChange}
              placeholder="Assam"
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '4px',
                color: 'var(--text-primary)',
                fontSize: '1rem'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
              PIN Code *
            </label>
            <input
              type="text"
              name="pincode"
              value={bankDetails.pincode}
              onChange={handleInputChange}
              placeholder="788010"
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '4px',
                color: 'var(--text-primary)',
                fontSize: '1rem'
              }}
            />
          </div>
        </div>
      )}

      {/* Razorpay Setup Tab */}
      {activeTab === 'razorpay' && (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          {bankDetails.razorpay_account_id ? (
            <div>
              <div style={{
                padding: '2rem',
                backgroundColor: 'rgba(46, 204, 113, 0.1)',
                border: '1px solid #2ecc71',
                borderRadius: '8px',
                marginBottom: '2rem'
              }}>
                <h3 style={{ color: '#2ecc71', marginBottom: '1rem' }}>
                  ✅ Razorpay Account Created
                </h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                  Account ID: {bankDetails.razorpay_account_id}
                </p>
                <p style={{ color: 'var(--text-secondary)' }}>
                  Status: {bankDetails.verification_status || 'Under Review'}
                </p>
              </div>

              <div style={{
                padding: '1.5rem',
                backgroundColor: 'rgba(52, 152, 219, 0.1)',
                border: '1px solid #3498db',
                borderRadius: '8px',
                textAlign: 'left'
              }}>
                <h4 style={{ color: '#3498db', marginBottom: '1rem' }}>
                  🎉 Direct Payments Enabled!
                </h4>
                <ul style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                  <li>✅ Event payments will go directly to your bank account</li>
                  <li>✅ Money appears within 24 hours</li>
                  <li>✅ No manual transfers needed</li>
                  <li>✅ Real-time payment notifications</li>
                </ul>
              </div>
            </div>
          ) : (
            <div>
              <div style={{
                padding: '2rem',
                backgroundColor: 'rgba(243, 156, 18, 0.1)',
                border: '1px solid #f39c12',
                borderRadius: '8px',
                marginBottom: '2rem'
              }}>
                <h3 style={{ color: '#f39c12', marginBottom: '1rem' }}>
                  🏦 Create Razorpay Account
                </h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                  Enable direct payments to your bank account by creating a Razorpay linked account.
                </p>

                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <button
                    onClick={handleTestConnection}
                    disabled={saving}
                    style={{
                      padding: '0.75rem 1.5rem',
                      backgroundColor: '#3498db',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      cursor: saving ? 'not-allowed' : 'pointer',
                      opacity: saving ? 0.6 : 1
                    }}
                  >
                    Test Connection
                  </button>

                  <button
                    onClick={handleCreateRazorpayAccount}
                    disabled={saving}
                    style={{
                      padding: '1rem 2rem',
                      backgroundColor: '#f39c12',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '1rem',
                      fontWeight: '600',
                      cursor: saving ? 'not-allowed' : 'pointer',
                      opacity: saving ? 0.6 : 1
                    }}
                  >
                    {saving ? 'Creating Account...' : 'Create Razorpay Account'}
                  </button>
                </div>
              </div>

              <div style={{
                padding: '1.5rem',
                backgroundColor: 'rgba(155, 89, 182, 0.1)',
                border: '1px solid #9b59b6',
                borderRadius: '8px',
                textAlign: 'left'
              }}>
                <h4 style={{ color: '#9b59b6', marginBottom: '1rem' }}>
                  📋 Requirements:
                </h4>
                <ul style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                  <li>✅ Complete bank details (above)</li>
                  <li>✅ Valid contact information</li>
                  <li>✅ Verification may take 1-2 business days</li>
                  <li>✅ Account will be activated automatically</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: '2rem',
        paddingTop: '1.5rem',
        borderTop: '1px solid rgba(255,255,255,0.1)'
      }}>
        <button
          onClick={onClose}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: 'transparent',
            color: 'var(--text-secondary)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Cancel
        </button>

        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: '0.75rem 2rem',
            backgroundColor: 'var(--primary)',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: saving ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.6 : 1
          }}
        >
          {saving ? 'Saving...' : 'Save Bank Details'}
        </button>
      </div>
    </motion.div>
  );
};

export default ClubBankDetails;
