(function() {
  'use strict';

  // OnionPay Widget for seamless integration
  class OnionPayWidget {
    constructor() {
      // Auto-detect API base from script source or use override
      const scriptSrc = document.currentScript ? document.currentScript.src : '';
      const defaultApiUrl = scriptSrc ? new URL(scriptSrc).origin : window.location.origin;
      
      this.config = {
        apiUrl: document.querySelector('[data-api-base]')?.getAttribute('data-api-base') || defaultApiUrl,
        debug: false
      };
      this.callbacks = {};
      this.init();
    }

    init() {
      // Auto-initialize when DOM is ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.autoInit());
      } else {
        this.autoInit();
      }
    }

    autoInit() {
      // Find all elements with data-onionpay attribute
      const elements = document.querySelectorAll('[data-onionpay]');
      elements.forEach(element => this.bindElement(element));
    }

    bindElement(element) {
      const action = element.getAttribute('data-onionpay');
      
      if (action === 'pay') {
        element.addEventListener('click', (e) => {
          e.preventDefault();
          this.initPayment(element);
        });
      }
    }

    async initPayment(element) {
      try {
        // Extract payment data from element attributes
        const paymentData = this.extractPaymentData(element);
        
        // Validate required fields
        if (!paymentData.amount && !paymentData.amountSelector) {
          throw new Error('Amount is required. Use data-amount or data-amount-selector');
        }

        if (!paymentData.description) {
          throw new Error('Description is required. Use data-desc attribute');
        }

        if (!paymentData.apiKey) {
          throw new Error('API key is required. Use data-key attribute');
        }

        // Auto-detect amount if selector provided
        if (paymentData.amountSelector && !paymentData.amount) {
          const amountElement = document.querySelector(paymentData.amountSelector);
          if (amountElement) {
            paymentData.amount = amountElement.textContent || amountElement.value;
          }
        }

        // Create checkout session
        const session = await this.createCheckoutSession(paymentData);
        
        // Open payment modal or redirect
        if (paymentData.redirect === 'true') {
          window.location.href = session.paymentUrl;
        } else {
          this.openPaymentModal(session);
        }

      } catch (error) {
        this.handleError(error);
      }
    }

    extractPaymentData(element) {
      return {
        amount: element.getAttribute('data-amount'),
        amountSelector: element.getAttribute('data-amount-selector'),
        description: element.getAttribute('data-desc'),
        itemName: element.getAttribute('data-item'),
        customerEmail: element.getAttribute('data-email'),
        apiKey: element.getAttribute('data-key'),
        apiBase: element.getAttribute('data-api-base') || this.config.apiUrl,
        redirect: element.getAttribute('data-redirect') || 'false',
        callback: element.getAttribute('data-callback')
      };
    }

    async createCheckoutSession(data) {
      const apiUrl = data.apiBase || this.config.apiUrl;
      const response = await fetch(`${apiUrl}/v1/checkout/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${data.apiKey}`
        },
        body: JSON.stringify({
          amount: data.amount,
          description: data.description,
          itemName: data.itemName,
          customerEmail: data.customerEmail
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create checkout session');
      }

      return await response.json();
    }

    openPaymentModal(session) {
      // Create modal overlay
      const overlay = document.createElement('div');
      overlay.className = 'onionpay-overlay';
      overlay.innerHTML = `
        <div class="onionpay-modal">
          <div class="onionpay-header">
            <h3>Complete Payment</h3>
            <button class="onionpay-close">&times;</button>
          </div>
          <div class="onionpay-content">
            <iframe src="${session.paymentUrl}" class="onionpay-iframe"></iframe>
          </div>
        </div>
      `;

      // Add styles
      this.addModalStyles();

      // Close modal functionality
      overlay.querySelector('.onionpay-close').addEventListener('click', () => {
        this.closeModal(overlay);
      });

      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          this.closeModal(overlay);
        }
      });

      document.body.appendChild(overlay);

      // Start polling for payment status
      this.pollPaymentStatus(session.orderId, overlay);
    }

    async pollPaymentStatus(orderId, modal) {
      const pollInterval = setInterval(async () => {
        try {
          const response = await fetch(`${this.config.apiUrl}/v1/checkout/status/${orderId}`);
          const status = await response.json();

          if (status.status === 'approved') {
            clearInterval(pollInterval);
            this.closeModal(modal);
            this.triggerCallback('success', status);
            this.showToast('Payment approved successfully!', 'success');
          } else if (status.status === 'failed') {
            clearInterval(pollInterval);
            this.closeModal(modal);
            this.triggerCallback('failed', status);
            this.showToast('Payment failed. Please try again.', 'error');
          } else if (status.status === 'expired') {
            clearInterval(pollInterval);
            this.closeModal(modal);
            this.triggerCallback('expired', status);
            this.showToast('Payment session expired.', 'warning');
          }
        } catch (error) {
          console.error('Error polling payment status:', error);
        }
      }, 2000); // Poll every 2 seconds

      // Clear interval after 10 minutes
      setTimeout(() => {
        clearInterval(pollInterval);
      }, 10 * 60 * 1000);
    }

    closeModal(modal) {
      if (modal && modal.parentNode) {
        modal.parentNode.removeChild(modal);
      }
    }

    addModalStyles() {
      if (document.getElementById('onionpay-styles')) return;

      const styles = document.createElement('style');
      styles.id = 'onionpay-styles';
      styles.textContent = `
        .onionpay-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
        }
        .onionpay-modal {
          background: white;
          border-radius: 12px;
          width: 90%;
          max-width: 500px;
          max-height: 90vh;
          overflow: hidden;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
        }
        .onionpay-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid #e5e7eb;
          background: #6A1B9A;
          color: white;
        }
        .onionpay-header h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
        }
        .onionpay-close {
          background: none;
          border: none;
          color: white;
          font-size: 24px;
          cursor: pointer;
          padding: 0;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .onionpay-close:hover {
          opacity: 0.8;
        }
        .onionpay-content {
          height: 600px;
        }
        .onionpay-iframe {
          width: 100%;
          height: 100%;
          border: none;
        }
        .onionpay-toast {
          position: fixed;
          top: 20px;
          right: 20px;
          padding: 16px 24px;
          border-radius: 8px;
          color: white;
          font-weight: 500;
          z-index: 10001;
          max-width: 300px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
        }
        .onionpay-toast.success {
          background: #10b981;
        }
        .onionpay-toast.error {
          background: #ef4444;
        }
        .onionpay-toast.warning {
          background: #f59e0b;
        }
      `;
      document.head.appendChild(styles);
    }

    showToast(message, type = 'info') {
      const toast = document.createElement('div');
      toast.className = `onionpay-toast ${type}`;
      toast.textContent = message;
      
      document.body.appendChild(toast);
      
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 5000);
    }

    triggerCallback(event, data) {
      if (this.callbacks[event]) {
        this.callbacks[event](data);
      }

      // Also trigger window event
      window.dispatchEvent(new CustomEvent(`onionpay:${event}`, { detail: data }));
    }

    handleError(error) {
      console.error('OnionPay Error:', error);
      this.showToast(error.message || 'Payment initialization failed', 'error');
      this.triggerCallback('error', { message: error.message });
    }

    // Public API
    on(event, callback) {
      this.callbacks[event] = callback;
    }

    off(event) {
      delete this.callbacks[event];
    }
  }

  // Initialize widget
  window.onionpay = new OnionPayWidget();

  // Expose widget class for advanced usage
  window.OnionPayWidget = OnionPayWidget;

})();