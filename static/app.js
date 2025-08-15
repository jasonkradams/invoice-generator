// Invoice Generator App JavaScript - Main Application File

// Global variables for backward compatibility
let invoices = [];
let customers = [];
let currentTab = 'invoice';

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    const apiClient = new ApiClient();
    
    // Initialize managers with API dependency
    window.invoiceManager = new InvoiceManager(apiClient);
    window.customerManager = new CustomerManager(apiClient);
    window.settingsManager = new SettingsManager(apiClient);
    
    // Load initial data - managers handle their own loading in init()
    // No need to call loadInvoices/loadCustomers as they're called in init()
    
    // Set up tab switching
    setupTabSwitching();
});

function setupTabSwitching() {
    // Tab switching functionality
    window.showTab = function(tabName) {
        currentTab = tabName;
        
        // Hide all tabs
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // Show selected tab
        const targetTab = document.getElementById(`${tabName}-tab`);
        const targetBtn = document.getElementById(`${tabName}-tab-btn`);
        
        if (targetTab) targetTab.classList.add('active');
        if (targetBtn) targetBtn.classList.add('active');
        
        // Load content when switching tabs
        if (tabName === 'templates' && window.invoiceManager) {
            window.invoiceManager.displayTemplates();
        }
    };

    // Add click event listeners to tab buttons
    document.getElementById('invoice-tab-btn')?.addEventListener('click', () => showTab('invoice'));
    document.getElementById('customers-tab-btn')?.addEventListener('click', () => showTab('customers'));
    document.getElementById('templates-tab-btn')?.addEventListener('click', () => showTab('templates'));
    document.getElementById('settings-tab-btn')?.addEventListener('click', () => showTab('settings'));
    
    // Show default tab
    showTab('invoice');
}

// Legacy compatibility functions - these delegate to the new modular classes
function useAsTemplate(invoiceId) {
    if (window.invoiceManager) {
        window.invoiceManager.useAsTemplate(invoiceId);
    }
}

// Legacy functions for template dropdown
function loadInvoiceTemplate() {
    if (window.invoiceManager) {
        window.invoiceManager.loadInvoiceTemplate();
    }
}

function clearForm() {
    if (window.invoiceManager) {
        window.invoiceManager.clearForm();
    }
}

function showNewCustomerForm() {
    if (window.customerManager) {
        window.customerManager.showNewCustomerForm();
    }
}

function removeItem(button) {
    button.parentElement.remove();
    if (window.invoiceManager) {
        window.invoiceManager.calculateTotals();
    }
}

function editCustomer(id) {
    if (window.customerManager) {
        window.customerManager.editCustomer(id);
    }
}

function deleteCustomer(id) {
    if (window.customerManager) {
        window.customerManager.deleteCustomer(id);
    }
}
