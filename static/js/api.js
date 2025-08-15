// API Client for handling HTTP requests
class ApiClient {
    constructor(baseUrl = '') {
        this.baseUrl = baseUrl;
    }

    async request(url, options = {}) {
        try {
            const response = await fetch(this.baseUrl + url, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    async updateSettings(settings) {
        const response = await fetch('/api/settings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(settings)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    }

    // Invoice API methods
    async getInvoices() {
        return this.request('/api/invoices');
    }

    async createInvoice(invoiceData) {
        return this.request('/api/invoices', {
            method: 'POST',
            body: JSON.stringify(invoiceData)
        });
    }

    async getInvoice(id) {
        return this.request(`/api/invoices/${id}`);
    }

    async deleteInvoice(id) {
        return this.request(`/api/invoices/${id}`, {
            method: 'DELETE'
        });
    }

    async toggleTemplate(id) {
        return this.request(`/api/invoices/${id}/template`, {
            method: 'PUT'
        });
    }

    // Customer API methods
    async getCustomers() {
        return this.request('/api/customers');
    }

    async createCustomer(customerData) {
        return this.request('/api/customers', {
            method: 'POST',
            body: JSON.stringify(customerData)
        });
    }

    async getCustomer(id) {
        return this.request(`/api/customers/${id}`);
    }

    async updateCustomer(id, customerData) {
        return this.request(`/api/customers/${id}`, {
            method: 'PUT',
            body: JSON.stringify(customerData)
        });
    }

    async deleteCustomer(id) {
        return this.request(`/api/customers/${id}`, {
            method: 'DELETE'
        });
    }

    // Settings API methods
    async getSettings() {
        return this.request('/api/settings');
    }

    async updateSettings(settingsData) {
        return this.request('/api/settings', {
            method: 'POST',
            body: JSON.stringify(settingsData)
        });
    }
}

// Create API alias for backward compatibility
const API = ApiClient;

// Global API client instance
const api = new ApiClient();

// Export for CommonJS (Node.js/Jest)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ApiClient };
}
