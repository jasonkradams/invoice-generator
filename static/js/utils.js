// Utility functions for common operations

// Date formatting utilities
const DateUtils = {
    formatDate(dateString) {
        if (!dateString) return '';
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
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
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
        alert(`${title}: ${message}`);
    },

    showSuccess(message, title = 'Success') {
        console.log(`${title}: ${message}`);
        alert(`${title}: ${message}`);
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
