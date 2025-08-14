// Customer management functionality
class CustomerManager {
    constructor() {
        this.customers = [];
        this.editingCustomerId = null;
        this.init();
    }

    async init() {
        await this.loadCustomers();
        this.setupEventListeners();
    }

    async loadCustomers() {
        try {
            this.customers = await api.getCustomers();
            this.displayCustomers();
        } catch (error) {
            ErrorHandler.handleApiError(error, 'Failed to load customers:');
        }
    }

    setupEventListeners() {
        const saveBtn = DOMUtils.getElementById('saveCustomer');
        const cancelBtn = DOMUtils.getElementById('cancelCustomer');

        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.handleSaveCustomer());
        }

        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.clearCustomerForm());
        }
    }

    async handleSaveCustomer() {
        try {
            const customerData = this.collectCustomerFormData();
            
            if (!this.validateCustomerData(customerData)) {
                return;
            }

            let savedCustomer;
            if (this.editingCustomerId) {
                savedCustomer = await api.updateCustomer(this.editingCustomerId, customerData);
                const index = this.customers.findIndex(c => c.id === this.editingCustomerId);
                if (index !== -1) {
                    this.customers[index] = savedCustomer;
                }
                ErrorHandler.showSuccess('Customer updated successfully!');
            } else {
                savedCustomer = await api.createCustomer(customerData);
                this.customers.push(savedCustomer);
                ErrorHandler.showSuccess('Customer created successfully!');
            }

            this.displayCustomers();
            this.clearCustomerForm();
            
            // Update invoice manager if it exists
            if (window.invoiceManager) {
                window.invoiceManager.customers = this.customers;
                window.invoiceManager.updateCustomerSelect();
            }

        } catch (error) {
            ErrorHandler.handleApiError(error, 'Failed to save customer:');
        }
    }

    collectCustomerFormData() {
        return {
            name: DOMUtils.getElementValue('customerName'),
            email: DOMUtils.getElementValue('customerEmail'),
            phone: DOMUtils.getElementValue('customerPhone'),
            company: DOMUtils.getElementValue('customerCompany'),
            address: DOMUtils.getElementValue('customerAddress')
        };
    }

    validateCustomerData(data) {
        if (!ValidationUtils.validateRequired(data.name)) {
            ErrorHandler.showError('Customer name is required');
            return false;
        }

        if (data.email && !ValidationUtils.validateEmail(data.email)) {
            ErrorHandler.showError('Please enter a valid email address');
            return false;
        }

        return true;
    }

    displayCustomers() {
        const container = DOMUtils.getElementById('customersList');
        if (!container) return;

        if (this.customers.length === 0) {
            container.innerHTML = '<p class="no-customers">No customers added yet.</p>';
            return;
        }

        container.innerHTML = this.customers.map(customer => `
            <div class="customer-item">
                <div class="customer-header">
                    <span class="customer-name">${customer.name}</span>
                    ${customer.company ? `<span class="customer-company">${customer.company}</span>` : ''}
                </div>
                <div class="customer-details">
                    ${customer.email ? `<div class="customer-email">${customer.email}</div>` : ''}
                    ${customer.phone ? `<div class="customer-phone">${customer.phone}</div>` : ''}
                    ${customer.address ? `<div class="customer-address">${customer.address}</div>` : ''}
                </div>
                <div class="customer-actions">
                    <button class="btn-small btn-edit" onclick="customerManager.editCustomer(${customer.id})">Edit</button>
                    <button class="btn-small btn-delete" onclick="customerManager.deleteCustomer(${customer.id})">Delete</button>
                </div>
            </div>
        `).join('');
    }

    editCustomer(customerId) {
        const customer = this.customers.find(c => c.id === customerId);
        if (!customer) return;

        this.editingCustomerId = customerId;
        
        // Populate form with customer data
        DOMUtils.setElementValue('customerName', customer.name);
        DOMUtils.setElementValue('customerEmail', customer.email);
        DOMUtils.setElementValue('customerPhone', customer.phone);
        DOMUtils.setElementValue('customerCompany', customer.company);
        DOMUtils.setElementValue('customerAddress', customer.address);

        // Update button text
        const saveBtn = DOMUtils.getElementById('saveCustomer');
        if (saveBtn) {
            saveBtn.textContent = 'Update Customer';
        }
    }

    async deleteCustomer(customerId) {
        const customer = this.customers.find(c => c.id === customerId);
        if (!customer) return;

        if (confirm(`Are you sure you want to delete customer "${customer.name}"?`)) {
            try {
                await api.deleteCustomer(customerId);
                this.customers = this.customers.filter(c => c.id !== customerId);
                this.displayCustomers();
                
                // Update invoice manager if it exists
                if (window.invoiceManager) {
                    window.invoiceManager.customers = this.customers;
                    window.invoiceManager.updateCustomerSelect();
                }
                
                ErrorHandler.showSuccess('Customer deleted successfully!');
            } catch (error) {
                ErrorHandler.handleApiError(error, 'Failed to delete customer:');
            }
        }
    }

    clearCustomerForm() {
        this.editingCustomerId = null;
        
        // Clear form fields
        ['customerName', 'customerEmail', 'customerPhone', 'customerCompany', 'customerAddress']
            .forEach(id => DOMUtils.setElementValue(id, ''));

        // Reset button text
        const saveBtn = DOMUtils.getElementById('saveCustomer');
        if (saveBtn) {
            saveBtn.textContent = 'Save Customer';
        }
    }
}

// Global customer manager instance
let customerManager;
