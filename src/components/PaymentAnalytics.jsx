import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const PaymentAnalytics = ({ registrations }) => {
  const analytics = useMemo(() => {
    if (!registrations || registrations.length === 0) {
      return {
        totalRevenue: 0,
        paymentMethods: [],
        paymentStatus: [],
        dailyRevenue: [],
        summary: {
          totalRegistrations: 0,
          paidRegistrations: 0,
          pendingPayments: 0,
          failedPayments: 0,
          razorpayPayments: 0,
          upiPayments: 0
        }
      };
    }

    const paidRegistrations = registrations.filter(reg => 
      reg.payment_status === 'verified' || reg.payment_status === 'captured'
    );

    const totalRevenue = paidRegistrations.reduce((sum, reg) => 
      sum + (parseFloat(reg.payment_amount) || 0), 0
    );

    // Payment methods distribution
    const methodCounts = registrations.reduce((acc, reg) => {
      const method = reg.payment_method || 'unknown';
      acc[method] = (acc[method] || 0) + 1;
      return acc;
    }, {});

    const paymentMethods = Object.entries(methodCounts).map(([method, count]) => ({
      name: method.toUpperCase(),
      value: count,
      percentage: ((count / registrations.length) * 100).toFixed(1)
    }));

    // Payment status distribution
    const statusCounts = registrations.reduce((acc, reg) => {
      const status = reg.payment_status || 'unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    const paymentStatus = Object.entries(statusCounts).map(([status, count]) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: count,
      percentage: ((count / registrations.length) * 100).toFixed(1)
    }));

    // Daily revenue (last 7 days)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    }).reverse();

    const dailyRevenue = last7Days.map(date => {
      const dayRevenue = paidRegistrations
        .filter(reg => reg.payment_captured_at?.startsWith(date) || reg.updated_at?.startsWith(date))
        .reduce((sum, reg) => sum + (parseFloat(reg.payment_amount) || 0), 0);
      
      return {
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        revenue: dayRevenue,
        count: paidRegistrations.filter(reg => 
          reg.payment_captured_at?.startsWith(date) || reg.updated_at?.startsWith(date)
        ).length
      };
    });

    const summary = {
      totalRegistrations: registrations.length,
      paidRegistrations: paidRegistrations.length,
      pendingPayments: registrations.filter(reg => reg.payment_status === 'pending').length,
      failedPayments: registrations.filter(reg => reg.payment_status === 'failed').length,
      razorpayPayments: registrations.filter(reg => reg.payment_method === 'razorpay').length,
      upiPayments: registrations.filter(reg => reg.payment_method === 'upi').length
    };

    return {
      totalRevenue,
      paymentMethods,
      paymentStatus,
      dailyRevenue,
      summary
    };
  }, [registrations]);

  const COLORS = {
    razorpay: '#6e44ff',
    upi: '#2ecc71',
    verified: '#2ecc71',
    captured: '#27ae60',
    pending: '#f39c12',
    failed: '#e74c3c',
    unknown: '#95a5a6'
  };

  const getColor = (name) => {
    const key = name.toLowerCase();
    return COLORS[key] || '#95a5a6';
  };

  if (!registrations || registrations.length === 0) {
    return (
      <div style={{
        padding: '2rem',
        textAlign: 'center',
        color: 'var(--text-secondary)'
      }}>
        <p>No payment data available</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '1.5rem' }}>
      <h2 style={{ 
        margin: '0 0 2rem', 
        color: 'var(--text-primary)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        <span>💰</span> Payment Analytics
      </h2>

      {/* Summary Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          style={{
            padding: '1.5rem',
            backgroundColor: 'rgba(46, 204, 113, 0.1)',
            borderRadius: '8px',
            border: '1px solid rgba(46, 204, 113, 0.2)'
          }}
        >
          <h3 style={{ margin: '0 0 0.5rem', color: '#2ecc71', fontSize: '1rem' }}>Total Revenue</h3>
          <p style={{ margin: 0, fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
            ₹{analytics.totalRevenue.toFixed(2)}
          </p>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            From {analytics.summary.paidRegistrations} payments
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          style={{
            padding: '1.5rem',
            backgroundColor: 'rgba(110, 68, 255, 0.1)',
            borderRadius: '8px',
            border: '1px solid rgba(110, 68, 255, 0.2)'
          }}
        >
          <h3 style={{ margin: '0 0 0.5rem', color: '#6e44ff', fontSize: '1rem' }}>Razorpay Payments</h3>
          <p style={{ margin: 0, fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
            {analytics.summary.razorpayPayments}
          </p>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            {((analytics.summary.razorpayPayments / analytics.summary.totalRegistrations) * 100).toFixed(1)}% of total
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          style={{
            padding: '1.5rem',
            backgroundColor: 'rgba(243, 156, 18, 0.1)',
            borderRadius: '8px',
            border: '1px solid rgba(243, 156, 18, 0.2)'
          }}
        >
          <h3 style={{ margin: '0 0 0.5rem', color: '#f39c12', fontSize: '1rem' }}>Pending Payments</h3>
          <p style={{ margin: 0, fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
            {analytics.summary.pendingPayments}
          </p>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Require verification
          </p>
        </motion.div>
      </div>

      {/* Charts */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: '2rem'
      }}>
        {/* Payment Methods Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          style={{
            padding: '1.5rem',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          <h3 style={{ margin: '0 0 1rem', color: 'var(--text-primary)' }}>Payment Methods</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={analytics.paymentMethods}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                label={({ name, percentage }) => `${name} (${percentage}%)`}
              >
                {analytics.paymentMethods.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getColor(entry.name)} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Payment Status Chart */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          style={{
            padding: '1.5rem',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          <h3 style={{ margin: '0 0 1rem', color: 'var(--text-primary)' }}>Payment Status</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={analytics.paymentStatus}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                label={({ name, percentage }) => `${name} (${percentage}%)`}
              >
                {analytics.paymentStatus.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getColor(entry.name)} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Daily Revenue Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        style={{
          padding: '1.5rem',
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          marginTop: '2rem'
        }}
      >
        <h3 style={{ margin: '0 0 1rem', color: 'var(--text-primary)' }}>Daily Revenue (Last 7 Days)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={analytics.dailyRevenue}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="date" stroke="var(--text-secondary)" />
            <YAxis stroke="var(--text-secondary)" />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'rgba(0,0,0,0.8)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '4px'
              }}
              formatter={(value, name) => [
                name === 'revenue' ? `₹${value}` : value,
                name === 'revenue' ? 'Revenue' : 'Payments'
              ]}
            />
            <Bar dataKey="revenue" fill="#2ecc71" />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
};

export default PaymentAnalytics;
