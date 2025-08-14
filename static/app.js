// Invoice Generator App JavaScript - Main Application File

// Global variables for backward compatibility
let invoices = [];
let customers = [];
let currentTab = 'invoice';

// Initialize application when page loads
document.addEventListener('DOMContentLoaded', async function() {
    // Initialize managers
    window.invoiceManager = new InvoiceManager();
    window.customerManager = new CustomerManager();
    
    // Make functions globally accessible for onclick handlers
    window.toggleTemplate = function(invoiceId) {
        if (window.invoiceManager) {
            window.invoiceManager.toggleTemplate(invoiceId);
        }
    };
    
    window.viewInvoice = function(invoiceId) {
        if (window.invoiceManager) {
            window.invoiceManager.viewInvoice(invoiceId);
        }
    };
    
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
        const targetBtn = document.querySelector(`[onclick=\"showTab('${tabName}')\"]`);
        
        if (targetTab) targetTab.classList.add('active');
        if (targetBtn) targetBtn.classList.add('active');
        
        // Load content when switching tabs
        if (tabName === 'templates' && window.invoiceManager) {
            window.invoiceManager.displayTemplates();
        }
    };
    
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
