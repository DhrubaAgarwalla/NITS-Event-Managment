import logger from '../utils/logger.js';

class RazorpayService {
  constructor() {
    this.baseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
    this.keyId = import.meta.env.VITE_RAZORPAY_KEY_ID;
  }

  /**
   * Create a Razorpay order for payment
   */
  async createOrder(orderData) {
    try {
      logger.log('Creating Razorpay order:', orderData);

      const response = await fetch(`${this.baseUrl}/razorpay?action=create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create Razorpay order');
      }

      const result = await response.json();
      logger.log('Razorpay order created successfully:', result);
      return result;
    } catch (error) {
      logger.error('Error creating Razorpay order:', error);
      throw error;
    }
  }

  /**
   * Verify payment signature and capture payment
   */
  async verifyPayment(paymentData) {
    try {
      logger.log('Verifying Razorpay payment:', {
        orderId: paymentData.razorpay_order_id,
        paymentId: paymentData.razorpay_payment_id
      });

      const response = await fetch(`${this.baseUrl}/razorpay?action=verify-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Payment verification failed');
      }

      const result = await response.json();
      logger.log('Payment verified successfully:', result);
      return result;
    } catch (error) {
      logger.error('Error verifying payment:', error);
      throw error;
    }
  }

  /**
   * Initialize Razorpay checkout
   */
  initializeCheckout(options) {
    return new Promise((resolve, reject) => {
      if (!window.Razorpay) {
        reject(new Error('Razorpay SDK not loaded'));
        return;
      }

      const razorpayOptions = {
        key: this.keyId,
        amount: options.amount,
        currency: options.currency || 'INR',
        name: options.name || 'NIT Silchar Events',
        description: options.description,
        image: options.image,
        order_id: options.order_id,
        prefill: {
          name: options.prefill?.name || '',
          email: options.prefill?.email || '',
          contact: options.prefill?.contact || ''
        },
        notes: options.notes || {},
        theme: {
          color: options.theme?.color || '#6e44ff'
        },
        modal: {
          ondismiss: () => {
            reject(new Error('Payment cancelled by user'));
          }
        },
        handler: (response) => {
          logger.log('Payment successful:', response);
          resolve(response);
        }
      };

      const rzp = new window.Razorpay(razorpayOptions);
      rzp.open();
    });
  }

  /**
   * Load Razorpay checkout script
   */
  loadRazorpayScript() {
    return new Promise((resolve, reject) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => {
        logger.log('Razorpay script loaded successfully');
        resolve(true);
      };
      script.onerror = () => {
        logger.error('Failed to load Razorpay script');
        reject(new Error('Failed to load Razorpay script'));
      };
      document.body.appendChild(script);
    });
  }

  /**
   * Process complete payment flow
   */
  async processPayment(paymentDetails) {
    try {
      // Load Razorpay script if not already loaded
      await this.loadRazorpayScript();

      // Create order
      const orderData = {
        amount: paymentDetails.amount * 100, // Convert to paise
        currency: 'INR',
        receipt: `receipt_${Date.now()}`,
        notes: {
          event_id: paymentDetails.eventId,
          participant_email: paymentDetails.email,
          participant_name: paymentDetails.name
        }
      };

      const order = await this.createOrder(orderData);

      // Initialize checkout
      const checkoutOptions = {
        amount: order.amount,
        currency: order.currency,
        order_id: order.id,
        description: `Registration for ${paymentDetails.eventTitle}`,
        prefill: {
          name: paymentDetails.name,
          email: paymentDetails.email,
          contact: paymentDetails.phone
        },
        notes: orderData.notes
      };

      const paymentResponse = await this.initializeCheckout(checkoutOptions);

      // Verify payment
      const verificationData = {
        razorpay_order_id: paymentResponse.razorpay_order_id,
        razorpay_payment_id: paymentResponse.razorpay_payment_id,
        razorpay_signature: paymentResponse.razorpay_signature,
        event_id: paymentDetails.eventId,
        registration_data: paymentDetails.registrationData
      };

      const verificationResult = await this.verifyPayment(verificationData);

      return {
        success: true,
        payment_id: paymentResponse.razorpay_payment_id,
        order_id: paymentResponse.razorpay_order_id,
        registration_id: verificationResult.registration_id
      };

    } catch (error) {
      logger.error('Payment processing failed:', error);
      throw error;
    }
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(paymentId) {
    try {
      const response = await fetch(`${this.baseUrl}/razorpay/payment-status/${paymentId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch payment status');
      }

      return await response.json();
    } catch (error) {
      logger.error('Error fetching payment status:', error);
      throw error;
    }
  }

  /**
   * Create order with route (direct payment to club)
   */
  async createOrderWithRoute(orderData, clubAccountId, platformCommission = 0) {
    try {
      logger.log('Creating Razorpay order with route:', { orderData, clubAccountId, platformCommission });

      const totalAmount = orderData.amount;
      const clubAmount = Math.round(totalAmount * (1 - platformCommission / 100));
      const platformAmount = totalAmount - clubAmount;

      const routeOrderData = {
        ...orderData,
        transfers: [
          {
            account: clubAccountId,
            amount: clubAmount,
            currency: 'INR',
            notes: {
              club_payment: 'true',
              event_id: orderData.notes?.event_id,
              club_id: orderData.notes?.club_id
            },
            linked_account_notes: [
              `Event: ${orderData.notes?.event_title || 'Event Registration'}`,
              `Platform: NIT Silchar Events`
            ]
          }
        ]
      };

      // Add platform commission transfer if applicable
      if (platformAmount > 0) {
        routeOrderData.transfers.push({
          account: 'platform',
          amount: platformAmount,
          currency: 'INR',
          notes: {
            platform_commission: 'true',
            commission_percentage: platformCommission
          }
        });
      }

      const response = await fetch(`${this.baseUrl}/razorpay?action=create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(routeOrderData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create order with route');
      }

      const order = await response.json();
      logger.log('Order with route created successfully:', order);
      return order;
    } catch (error) {
      logger.error('Error creating order with route:', error);
      throw error;
    }
  }

  /**
   * Get club's Razorpay account status
   */
  async getClubAccountStatus(clubId) {
    try {
      const response = await fetch(`${this.baseUrl}/razorpay?action=club-account-status&club_id=${clubId}`);

      if (!response.ok) {
        throw new Error('Failed to get club account status');
      }

      return await response.json();
    } catch (error) {
      logger.error('Error getting club account status:', error);
      throw error;
    }
  }

  /**
   * Create linked account for club
   */
  async createLinkedAccount(clubId, bankDetails) {
    try {
      logger.log('Creating linked account for club:', clubId);

      const response = await fetch(`${this.baseUrl}/razorpay?action=create-linked-account`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          club_id: clubId,
          bank_details: bankDetails
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create linked account');
      }

      const result = await response.json();
      logger.log('Linked account created successfully:', result);
      return result;
    } catch (error) {
      logger.error('Error creating linked account:', error);
      throw error;
    }
  }

  /**
   * Process payment with direct club transfer
   */
  async processDirectPayment(paymentDetails, clubAccountId, platformCommission = 0) {
    try {
      // Load Razorpay script if not already loaded
      await this.loadRazorpayScript();

      // Create order with route
      const orderData = {
        amount: paymentDetails.amount * 100, // Convert to paise
        currency: 'INR',
        receipt: `receipt_${Date.now()}`,
        notes: {
          event_id: paymentDetails.eventId,
          club_id: paymentDetails.clubId,
          event_title: paymentDetails.eventTitle,
          participant_email: paymentDetails.email,
          participant_name: paymentDetails.name,
          payment_type: 'direct_club_payment'
        }
      };

      const order = await this.createOrderWithRoute(orderData, clubAccountId, platformCommission);

      // Initialize checkout
      const checkoutOptions = {
        amount: order.amount,
        currency: order.currency,
        order_id: order.id,
        description: `Registration for ${paymentDetails.eventTitle}`,
        prefill: {
          name: paymentDetails.name,
          email: paymentDetails.email,
          contact: paymentDetails.phone
        },
        notes: orderData.notes
      };

      const paymentResponse = await this.initializeCheckout(checkoutOptions);

      // Verify payment
      const verificationData = {
        razorpay_order_id: paymentResponse.razorpay_order_id,
        razorpay_payment_id: paymentResponse.razorpay_payment_id,
        razorpay_signature: paymentResponse.razorpay_signature,
        event_id: paymentDetails.eventId,
        registration_data: paymentDetails.registrationData,
        payment_type: 'direct_club_payment',
        club_account_id: clubAccountId
      };

      const verificationResult = await this.verifyPayment(verificationData);

      return {
        success: true,
        payment_id: paymentResponse.razorpay_payment_id,
        order_id: paymentResponse.razorpay_order_id,
        registration_id: verificationResult.registration_id,
        transfer_id: verificationResult.transfer_id
      };

    } catch (error) {
      logger.error('Direct payment processing failed:', error);
      throw error;
    }
  }
}

export default new RazorpayService();
