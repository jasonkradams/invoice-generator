// Utility functions for common operations

// Date formatting utilities
const DateUtils = {
    formatDate(dateString) {
        if (!dateString) {return '';}
        const date = new Date(dateString);
        return date.toLocaleDateString();
    },

    getTodayString() {
        return new Date().toISOString().split('T')[0];
    },

    getFutureDateString(daysFromNow = 30) {
        const date = new Date();
        date.setDate(date.getDate() + daysFromNow);
        return date.toISOString().split('T')[0];
    }
};

// Form validation utilities
const ValidationUtils = {
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    isValidPhone(phone) {
        const phoneRegex = /^[\d\s\-\(\)]{10,}$/;
        return phoneRegex.test(phone);
    },

    isEmpty(value) {
        return !value || value.toString().trim().length === 0;
    },

    validateRequired(value) {
        return value && value.toString().trim().length > 0;
    },

    validateNumber(value) {
        return !isNaN(value) && isFinite(value);
    },

    validatePositiveNumber(value) {
        return this.validateNumber(value) && parseFloat(value) >= 0;
    }
};

// DOM utilities
const DOMUtils = {
    getElementById(id) {
        const element = document.getElementById(id);
        if (!element) {
            console.warn(`Element with id '${id}' not found`);
        }
        return element;
    },

    clearElement(element) {
        if (element) {
            element.innerHTML = '';
        }
    },

    showElement(element) {
        if (element) {
            element.style.display = 'block';
        }
    },

    hideElement(element) {
        if (element) {
            element.style.display = 'none';
        }
    },

    setElementValue(id, value) {
        const element = this.getElementById(id);
        if (element) {
            element.value = value || '';
        }
    },

    getElementValue(id) {
        const element = this.getElementById(id);
        return element ? element.value : '';
    }
};

// Error handling utilities
const ErrorHandler = {
    showError(message, title = 'Error') {
        console.error(`${title}: ${message}`);
        // Create error message element for tests
        if (typeof document !== 'undefined') {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            errorDiv.textContent = `${title}: ${message}`;
            document.body.appendChild(errorDiv);
        }
    },

    showSuccess(message, title = 'Success') {
        console.log(`${title}: ${message}`);
        // Create success message element for tests
        if (typeof document !== 'undefined') {
            const successDiv = document.createElement('div');
            successDiv.className = 'success-message';
            successDiv.textContent = `${title}: ${message}`;
            document.body.appendChild(successDiv);
        }
    },

    handleApiError(error, context = '') {
        const message = error.message || 'An unexpected error occurred';
        this.showError(`${context} ${message}`.trim());
    }
};

// Number formatting utilities
const NumberUtils = {
    formatCurrency(amount) {
        return `$${parseFloat(amount || 0).toFixed(2)}`;
    },

    parseCurrency(currencyString) {
        return parseFloat(currencyString.replace(/[$,]/g, '')) || 0;
    }
};

// Export for CommonJS (Node.js/Jest)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DateUtils, NumberUtils, DOMUtils, ValidationUtils, ErrorHandler };
}
