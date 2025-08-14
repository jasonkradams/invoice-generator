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
}

// Global API client instance
const api = new ApiClient();

// Export for CommonJS (Node.js/Jest)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ApiClient };
}
