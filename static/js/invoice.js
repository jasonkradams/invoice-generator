// Invoice management functionality
class InvoiceManager {
    constructor() {
        this.invoices = [];
        this.customers = [];
        this.init();
    }

    async init() {
        await this.loadData();
        this.setupEventListeners();
        this.initializeForm();
    }

    async loadData() {
        try {
            [this.invoices, this.customers] = await Promise.all([
                api.getInvoices(),
                api.getCustomers()
            ]);
            
            this.updateDisplays();
        } catch (error) {
            ErrorHandler.handleApiError(error, 'Failed to load data:');
        }
    }

    updateDisplays() {
        this.displayInvoices();
        this.displayTemplates();
        this.updateCustomerSelect();
        this.updateInvoiceTemplateSelect();
    }

    initializeForm() {
        // Set default dates
        DOMUtils.setElementValue('date', DateUtils.getTodayString());
        DOMUtils.setElementValue('dueDate', DateUtils.getFutureDateString(30));
        
        // Add initial invoice item
        this.addInvoiceItem();
    }

    setupEventListeners() {
        // Form submission
        const createForm = DOMUtils.getElementById('invoiceForm');
        if (createForm) {
            createForm.addEventListener('submit', (e) => this.handleFormSubmit(e));
        }

        // Add item button
        const addItemBtn = DOMUtils.getElementById('addItem');
        if (addItemBtn) {
            addItemBtn.addEventListener('click', () => this.addInvoiceItem());
        }

        // Template dropdown
        const templateSelect = DOMUtils.getElementById('invoiceTemplateSelect');
        if (templateSelect) {
            templateSelect.addEventListener('change', () => this.loadInvoiceTemplate());
        }

        // Customer dropdown
        const customerSelect = DOMUtils.getElementById('customerSelect');
        if (customerSelect) {
            customerSelect.addEventListener('change', () => this.handleCustomerSelect());
        }
    }

    async handleFormSubmit(e) {
        e.preventDefault();
        
        try {
            const invoiceData = this.collectFormData();
            if (!this.validateInvoiceData(invoiceData)) {
                return;
            }

            const newInvoice = await api.createInvoice(invoiceData);
            this.invoices.push(newInvoice);
            
            this.updateDisplays();
            this.clearForm();
            ErrorHandler.showSuccess('Invoice created successfully!');
            
        } catch (error) {
            ErrorHandler.handleApiError(error, 'Failed to create invoice:');
        }
    }

    collectFormData() {
        const items = this.collectInvoiceItems();
        
        return {
            date: DOMUtils.getElementValue('date'),
            dueDate: DOMUtils.getElementValue('dueDate'),
            client: {
                name: DOMUtils.getElementValue('clientName'),
                email: DOMUtils.getElementValue('clientEmail'),
                address: DOMUtils.getElementValue('clientAddress'),
                phone: DOMUtils.getElementValue('clientPhone')
            },
            customerId: parseInt(DOMUtils.getElementValue('customerSelect')) || 0,
            items: items,
            tax: parseFloat(DOMUtils.getElementValue('tax')) || 0,
            notes: DOMUtils.getElementValue('notes')
        };
    }

    collectInvoiceItems() {
        const items = [];
        const itemRows = document.querySelectorAll('.item-row');
        
        itemRows.forEach(row => {
            const description = row.querySelector('.item-description')?.value || '';
            const quantity = parseInt(row.querySelector('.item-quantity')?.value) || 1;
            const rate = parseFloat(row.querySelector('.item-rate')?.value) || 0;
            
            if (description.trim()) {
                items.push({ description, quantity, rate });
            }
        });
        
        return items;
    }

    validateInvoiceData(data) {
        if (!ValidationUtils.validateRequired(data.client.name)) {
            ErrorHandler.showError('Client name is required');
            return false;
        }

        if (data.client.email && !ValidationUtils.validateEmail(data.client.email)) {
            ErrorHandler.showError('Please enter a valid email address');
            return false;
        }

        if (data.items.length === 0) {
            ErrorHandler.showError('At least one item is required');
            return false;
        }

        return true;
    }

    addInvoiceItem() {
        const container = DOMUtils.getElementById('itemsContainer');
        if (!container) return;

        const itemRow = document.createElement('div');
        itemRow.className = 'item-row';
        itemRow.innerHTML = `
            <div class="form-group">
                <input type="text" class="item-description" placeholder="Description" required>
            </div>
            <div class="form-group">
                <input type="number" class="item-quantity" placeholder="Qty" min="1" value="1" required>
            </div>
            <div class="form-group">
                <input type="number" class="item-rate" placeholder="Rate" min="0" step="0.01" required>
            </div>
            <div class="form-group">
                <input type="text" class="item-amount" placeholder="Amount" readonly>
            </div>
            <div class="form-group">
                <button type="button" class="btn-remove-item" onclick="this.parentElement.parentElement.remove(); invoiceManager.calculateTotals();">Remove</button>
            </div>
        `;

        container.appendChild(itemRow);
        this.updateItemListeners();
    }

    updateItemListeners() {
        const quantityInputs = document.querySelectorAll('.item-quantity');
        const rateInputs = document.querySelectorAll('.item-rate');
        
        [...quantityInputs, ...rateInputs].forEach(input => {
            input.removeEventListener('input', this.calculateTotals.bind(this));
            input.addEventListener('input', this.calculateTotals.bind(this));
        });
    }

    calculateTotals() {
        let subtotal = 0;
        const itemRows = document.querySelectorAll('.item-row');
        
        itemRows.forEach(row => {
            const quantity = parseFloat(row.querySelector('.item-quantity')?.value) || 0;
            const rate = parseFloat(row.querySelector('.item-rate')?.value) || 0;
            const amount = quantity * rate;
            
            const amountField = row.querySelector('.item-amount');
            if (amountField) {
                amountField.value = NumberUtils.formatCurrency(amount);
            }
            
            subtotal += amount;
        });

        const tax = parseFloat(DOMUtils.getElementValue('tax')) || 0;
        const total = subtotal + tax;

        DOMUtils.setElementValue('subtotal', NumberUtils.formatCurrency(subtotal));
        DOMUtils.setElementValue('total', NumberUtils.formatCurrency(total));
    }

    displayInvoices() {
        const container = DOMUtils.getElementById('invoicesList');
        if (!container) return;

        if (this.invoices.length === 0) {
            container.innerHTML = '<p class="no-invoices">No invoices created yet.</p>';
            return;
        }

        container.innerHTML = this.invoices.map(invoice => `
            <div class="invoice-item">
                <div class="invoice-header">
                    <span class="invoice-number">${invoice.invoiceNum}</span>
                    <span class="invoice-amount">${NumberUtils.formatCurrency(invoice.total)}</span>
                </div>
                <div class="invoice-client">${invoice.client.name}</div>
                <div class="invoice-date">Due: ${DateUtils.formatDate(invoice.dueDate)}</div>
                <div class="invoice-actions">
                    <button class="btn-small btn-view" onclick="viewInvoice(${invoice.id})">View</button>
                    <button class="btn-small ${invoice.template ? 'btn-remove' : 'btn-add'}" onclick="toggleTemplate(${invoice.id})">
                        ${invoice.template ? 'Remove Template' : 'Use as Template'}
                    </button>
                    <a href="/api/invoices/${invoice.id}/pdf" class="btn-small btn-pdf" target="_blank">PDF</a>
                </div>
            </div>
        `).join('');
    }

    displayTemplates() {
        const container = DOMUtils.getElementById('templatesList');
        if (!container) return;

        if (this.invoices.length === 0) {
            container.innerHTML = '<p class="no-templates">No invoices loaded yet.</p>';
            return;
        }

        container.innerHTML = this.invoices.map(invoice => `
            <div class="template-item">
                <div class="template-header">
                    <span class="template-number">${invoice.invoiceNum}</span>
                    <span class="template-amount">${NumberUtils.formatCurrency(invoice.total)}</span>
                </div>
                <div class="template-client">${invoice.client.name}</div>
                <div class="template-date">Created: ${DateUtils.formatDate(invoice.date)}</div>
                <div class="template-actions">
                    <button class="btn-small btn-view" onclick="viewInvoice(${invoice.id})">View</button>
                    <button class="btn-small ${invoice.template ? 'btn-remove' : 'btn-add'}" onclick="toggleTemplate(${invoice.id})">
                        ${invoice.template ? 'Remove Template' : 'Use as Template'}
                    </button>
                    <a href="/api/invoices/${invoice.id}/pdf" class="btn-small btn-pdf" target="_blank">PDF</a>
                </div>
            </div>
        `).join('');
    }

    updateCustomerSelect() {
        const select = DOMUtils.getElementById('customerSelect');
        if (!select) return;

        select.innerHTML = '<option value="">-- Select customer --</option>';
        
        this.customers.forEach(customer => {
            const option = document.createElement('option');
            option.value = customer.id;
            option.textContent = customer.name;
            select.appendChild(option);
        });
    }

    updateInvoiceTemplateSelect() {
        const select = DOMUtils.getElementById('invoiceTemplateSelect');
        if (!select) return;

        select.innerHTML = '<option value="">-- Select invoice to use as template --</option>';
        
        // Show only invoices marked as templates
        const templates = this.invoices.filter(invoice => invoice.template === true);
        
        templates.forEach(invoice => {
            const option = document.createElement('option');
            option.value = invoice.id;
            option.textContent = `${invoice.invoiceNum} - ${invoice.client.name} (${NumberUtils.formatCurrency(invoice.total)})`;
            select.appendChild(option);
        });
    }

    async toggleTemplate(invoiceId) {
        try {
            const response = await api.toggleTemplate(invoiceId);
            const invoice = this.invoices.find(inv => inv.id === invoiceId);
            if (invoice) {
                invoice.template = response.template;
                this.updateDisplays();
            }
        } catch (error) {
            ErrorHandler.handleApiError(error, 'Failed to update template status:');
        }
    }

    useAsTemplate(invoiceId) {
        const invoice = this.invoices.find(inv => inv.id === invoiceId);
        if (invoice) {
            this.populateFormFromInvoice(invoice);
            this.showTab('invoice');
        }
    }

    populateFormFromInvoice(invoice) {
        // Set new dates
        DOMUtils.setElementValue('date', DateUtils.getTodayString());
        DOMUtils.setElementValue('dueDate', DateUtils.getFutureDateString(30));
        
        // Populate client information
        DOMUtils.setElementValue('clientName', invoice.client.name);
        DOMUtils.setElementValue('clientEmail', invoice.client.email);
        DOMUtils.setElementValue('clientAddress', invoice.client.address);
        DOMUtils.setElementValue('clientPhone', invoice.client.phone);
        
        // Set customer dropdown
        if (invoice.customerId) {
            DOMUtils.setElementValue('customerSelect', invoice.customerId);
        }
        
        // Clear and populate items
        const itemsContainer = DOMUtils.getElementById('itemsContainer');
        if (itemsContainer) {
            DOMUtils.clearElement(itemsContainer);
            
            invoice.items.forEach(() => this.addInvoiceItem());
            
            const itemRows = document.querySelectorAll('.item-row');
            invoice.items.forEach((item, index) => {
                if (itemRows[index]) {
                    const row = itemRows[index];
                    row.querySelector('.item-description').value = item.description || '';
                    row.querySelector('.item-quantity').value = item.quantity || 1;
                    row.querySelector('.item-rate').value = item.rate || 0;
                }
            });
        }
        
        // Set tax and notes
        DOMUtils.setElementValue('tax', invoice.tax || 0);
        DOMUtils.setElementValue('notes', invoice.notes || '');
        
        // Update calculations
        this.updateItemListeners();
        this.calculateTotals();
    }

    viewInvoice(invoiceId) {
        const invoice = this.invoices.find(inv => inv.id === invoiceId);
        if (!invoice) return;

        const items = invoice.items.map(item => 
            `${item.description} - Qty: ${item.quantity} x ${NumberUtils.formatCurrency(item.rate)} = ${NumberUtils.formatCurrency(item.amount)}`
        ).join('\n');

        const previewText = `Invoice: ${invoice.invoiceNum}
Date: ${invoice.date}
Due Date: ${invoice.dueDate}

Client: ${invoice.client.name}
Email: ${invoice.client.email}
Address: ${invoice.client.address}
Phone: ${invoice.client.phone}

Items:
${items}

Subtotal: ${NumberUtils.formatCurrency(invoice.subtotal)}
Tax: ${NumberUtils.formatCurrency(invoice.tax)}
Total: ${NumberUtils.formatCurrency(invoice.total)}

${invoice.notes ? 'Notes:\n' + invoice.notes : ''}`;

        alert(previewText);
    }

    handleCustomerSelect() {
        const customerId = parseInt(DOMUtils.getElementValue('customerSelect'));
        if (!customerId) return;

        const customer = this.customers.find(c => c.id === customerId);
        if (customer) {
            DOMUtils.setElementValue('clientName', customer.name);
            DOMUtils.setElementValue('clientEmail', customer.email);
            DOMUtils.setElementValue('clientAddress', customer.address);
            DOMUtils.setElementValue('clientPhone', customer.phone);
        }
    }

    loadInvoiceTemplate() {
        const invoiceId = parseInt(DOMUtils.getElementValue('invoiceTemplateSelect'));
        if (!invoiceId) return;

        const invoice = this.invoices.find(inv => inv.id === invoiceId);
        if (invoice) {
            this.populateFormFromInvoice(invoice);
        }
    }

    clearForm() {
        // Reset all form fields to default values
        DOMUtils.setElementValue('date', DateUtils.getTodayString());
        DOMUtils.setElementValue('dueDate', DateUtils.getFutureDateString(30));
        
        // Reset dropdowns to default options
        DOMUtils.setElementValue('invoiceTemplateSelect', '');
        DOMUtils.setElementValue('customerSelect', '');
        
        // Clear client information
        DOMUtils.setElementValue('clientName', '');
        DOMUtils.setElementValue('clientEmail', '');
        DOMUtils.setElementValue('clientAddress', '');
        DOMUtils.setElementValue('clientPhone', '');
        
        // Clear tax and notes
        DOMUtils.setElementValue('tax', '0');
        DOMUtils.setElementValue('notes', '');
        
        // Reset items to one empty row
        const itemsContainer = DOMUtils.getElementById('itemsContainer');
        if (itemsContainer) {
            DOMUtils.clearElement(itemsContainer);
            this.addInvoiceItem();
        }
        
        // Update calculations
        this.calculateTotals();
    }

    showTab(tabName) {
        // Hide all tabs
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // Show selected tab
        const targetTab = DOMUtils.getElementById(`${tabName}-tab`);
        const targetBtn = document.querySelector(`[onclick="showTab('${tabName}')"]`);
        
        if (targetTab) targetTab.classList.add('active');
        if (targetBtn) targetBtn.classList.add('active');
        
        // Load content when switching tabs
        if (tabName === 'templates') {
            this.displayTemplates();
        }
    }
}

// Global invoice manager instance
let invoiceManager;
