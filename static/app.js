// Invoice Generator App JavaScript

let invoices = [];
let customers = [];

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    loadInvoices();
    loadCustomers();
    
    // Ensure customers are loaded for the dropdown
    setTimeout(() => {
        updateCustomerSelect();
    }, 1000);
});

function initializeApp() {
    // Set default dates
    const today = new Date().toISOString().split('T')[0];
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);
    
    document.getElementById('date').value = today;
    document.getElementById('dueDate').value = dueDate.toISOString().split('T')[0];

    // Add event listeners
    document.getElementById('addItem').addEventListener('click', addInvoiceItem);
    document.getElementById('createInvoice').addEventListener('click', createInvoice);
    document.getElementById('previewInvoice').addEventListener('click', previewInvoice);
    document.getElementById('tax').addEventListener('input', calculateTotals);
    document.getElementById('saveCustomer').addEventListener('click', saveCustomer);

    // Add listeners for item calculations
    updateItemListeners();
}

function addInvoiceItem() {
    const container = document.getElementById('itemsContainer');
    const itemRow = document.createElement('div');
    itemRow.className = 'item-row';
    itemRow.innerHTML = `
        <div class="item-field">
            <label>Description:</label>
            <input type="text" class="item-description" required>
        </div>
        <div class="item-field">
            <label>Quantity:</label>
            <input type="number" class="item-quantity" min="1" value="1" required>
        </div>
        <div class="item-field">
            <label>Rate ($):</label>
            <input type="number" class="item-rate" min="0" step="0.01" required>
        </div>
        <div class="item-field">
            <label>Amount:</label>
            <input type="text" class="item-amount" readonly>
        </div>
        <button type="button" class="remove-item" onclick="removeItem(this)">×</button>
    `;
    container.appendChild(itemRow);
    updateItemListeners();
}

function removeItem(button) {
    const itemRow = button.parentElement;
    itemRow.remove();
    calculateTotals();
}

function updateItemListeners() {
    const quantities = document.querySelectorAll('.item-quantity');
    const rates = document.querySelectorAll('.item-rate');
    
    quantities.forEach(input => {
        input.removeEventListener('input', calculateItemAmount);
        input.addEventListener('input', calculateItemAmount);
    });
    
    rates.forEach(input => {
        input.removeEventListener('input', calculateItemAmount);
        input.addEventListener('input', calculateItemAmount);
    });
}

function calculateItemAmount(event) {
    const itemRow = event.target.closest('.item-row');
    const quantity = parseFloat(itemRow.querySelector('.item-quantity').value) || 0;
    const rate = parseFloat(itemRow.querySelector('.item-rate').value) || 0;
    const amount = quantity * rate;
    
    itemRow.querySelector('.item-amount').value = `$${amount.toFixed(2)}`;
    calculateTotals();
}

function calculateTotals() {
    const amounts = document.querySelectorAll('.item-amount');
    let subtotal = 0;
    
    amounts.forEach(amountInput => {
        const value = amountInput.value.replace('$', '');
        subtotal += parseFloat(value) || 0;
    });
    
    const tax = parseFloat(document.getElementById('tax').value) || 0;
    const total = subtotal + tax;
    
    document.getElementById('subtotal').textContent = `$${subtotal.toFixed(2)}`;
    document.getElementById('total').textContent = `$${total.toFixed(2)}`;
}

function createInvoice() {
    const invoiceData = collectInvoiceData();
    
    if (!validateInvoiceData(invoiceData)) {
        alert('Please fill in all required fields.');
        return;
    }

    fetch('/api/invoices', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(invoiceData)
    })
    .then(response => response.json())
    .then(data => {
        alert(`Invoice ${data.invoiceNum} created successfully!`);
        clearForm();
        loadInvoices();
    })
    .catch(error => {
        console.error('Error creating invoice:', error);
        alert('Error creating invoice. Please try again.');
    });
}

function collectInvoiceData() {
    const items = [];
    const itemRows = document.querySelectorAll('.item-row');
    
    itemRows.forEach(row => {
        const description = row.querySelector('.item-description').value;
        const quantity = parseInt(row.querySelector('.item-quantity').value) || 0;
        const rate = parseFloat(row.querySelector('.item-rate').value) || 0;
        
        if (description && quantity > 0 && rate >= 0) {
            items.push({
                description: description,
                quantity: quantity,
                rate: rate,
                amount: quantity * rate
            });
        }
    });

    const invoiceData = {
        date: document.getElementById('date').value,
        dueDate: document.getElementById('dueDate').value,
        client: {
            name: document.getElementById('clientName').value,
            email: document.getElementById('clientEmail').value,
            address: document.getElementById('clientAddress').value,
            phone: document.getElementById('clientPhone').value
        },
        items: items,
        tax: parseFloat(document.getElementById('tax').value) || 0,
        notes: document.getElementById('notes').value
    };

    // Add customer ID if a customer is selected
    const customerSelect = document.getElementById('customerSelect');
    if (customerSelect.value) {
        invoiceData.customerId = parseInt(customerSelect.value);
    }

    return invoiceData;
}

function validateInvoiceData(data) {
    return data.date && 
           data.dueDate && 
           data.client.name && 
           data.client.email && 
           data.items.length > 0;
}

function clearForm() {
    document.getElementById('date').value = new Date().toISOString().split('T')[0];
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);
    document.getElementById('dueDate').value = dueDate.toISOString().split('T')[0];
    
    document.getElementById('clientName').value = '';
    document.getElementById('clientEmail').value = '';
    document.getElementById('clientAddress').value = '';
    document.getElementById('clientPhone').value = '';
    document.getElementById('tax').value = '0';
    document.getElementById('notes').value = '';
    
    // Reset items to one empty row
    const container = document.getElementById('itemsContainer');
    container.innerHTML = `
        <div class="item-row">
            <div class="item-field">
                <label>Description:</label>
                <input type="text" class="item-description" required>
            </div>
            <div class="item-field">
                <label>Quantity:</label>
                <input type="number" class="item-quantity" min="1" value="1" required>
            </div>
            <div class="item-field">
                <label>Rate ($):</label>
                <input type="number" class="item-rate" min="0" step="0.01" required>
            </div>
            <div class="item-field">
                <label>Amount:</label>
                <input type="text" class="item-amount" readonly>
            </div>
            <button type="button" class="remove-item" onclick="removeItem(this)">×</button>
        </div>
    `;
    
    updateItemListeners();
    calculateTotals();
}

function loadInvoices() {
    fetch('/api/invoices')
        .then(response => response.json())
        .then(data => {
            invoices = data;
            displayInvoices();
        })
        .catch(error => {
            console.error('Error loading invoices:', error);
        });
}

function displayInvoices() {
    const container = document.getElementById('invoicesList');
    
    if (invoices.length === 0) {
        container.innerHTML = '<p class="no-invoices">No invoices created yet.</p>';
        return;
    }
    
    container.innerHTML = invoices.map(invoice => `
        <div class="invoice-item">
            <div class="invoice-header">
                <span class="invoice-number">${invoice.invoiceNum}</span>
                <span class="invoice-amount">$${invoice.total.toFixed(2)}</span>
            </div>
            <div class="invoice-client">${invoice.client.name}</div>
            <div class="invoice-date">Due: ${formatDate(invoice.dueDate)}</div>
            <div class="invoice-actions">
                <button class="btn-small btn-view" onclick="viewInvoice(${invoice.id})">View</button>
                <a href="/api/invoices/${invoice.id}/pdf" class="btn-small btn-pdf" target="_blank">PDF</a>
            </div>
        </div>
    `).join('');
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString();
}

function viewInvoice(id) {
    const invoice = invoices.find(inv => inv.id === id);
    if (invoice) {
        alert(`Invoice Details:\n\nNumber: ${invoice.invoiceNum}\nClient: ${invoice.client.name}\nTotal: $${invoice.total.toFixed(2)}\nDue: ${formatDate(invoice.dueDate)}`);
    }
}

function previewInvoice() {
    const invoiceData = collectInvoiceData();
    
    if (!validateInvoiceData(invoiceData)) {
        alert('Please fill in all required fields to preview.');
        return;
    }
    
    // Calculate totals for preview
    let subtotal = 0;
    invoiceData.items.forEach(item => {
        subtotal += item.amount;
    });
    const total = subtotal + invoiceData.tax;
    
    const previewText = `
INVOICE PREVIEW
===============

Date: ${invoiceData.date}
Due Date: ${invoiceData.dueDate}

Bill To:
${invoiceData.client.name}
${invoiceData.client.email}
${invoiceData.client.address}
${invoiceData.client.phone}

Items:
${invoiceData.items.map(item => 
    `${item.description} - Qty: ${item.quantity} x $${item.rate.toFixed(2)} = $${item.amount.toFixed(2)}`
).join('\n')}

Subtotal: $${subtotal.toFixed(2)}
Tax: $${invoiceData.tax.toFixed(2)}
Total: $${total.toFixed(2)}

${invoiceData.notes ? 'Notes:\n' + invoiceData.notes : ''}
    `;
    
    alert(previewText);
}

// Customer Management Functions
function showTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Show selected tab
    document.getElementById(tabName + '-tab').classList.add('active');
    event.target.classList.add('active');

    if (tabName === 'customers') {
        loadCustomers();
    }
}

function loadCustomers() {
    console.log('Loading customers from API...');
    fetch('/api/customers')
        .then(response => {
            console.log('Customer API response status:', response.status);
            return response.json();
        })
        .then(data => {
            console.log('Received customer data:', data);
            customers = data || [];
            displayCustomers();
            updateCustomerSelect();
        })
        .catch(error => {
            console.error('Error loading customers:', error);
            // Initialize with empty array if API fails
            customers = [];
            updateCustomerSelect();
        });
}

function displayCustomers() {
    const container = document.getElementById('customersList');
    
    if (customers.length === 0) {
        container.innerHTML = '<p class="no-customers">No customers added yet.</p>';
        return;
    }
    
    container.innerHTML = customers.map(customer => `
        <div class="customer-item">
            <div class="customer-header">
                <span class="customer-name">${customer.name}</span>
                <span class="customer-company">${customer.company || ''}</span>
            </div>
            <div class="customer-contact">${customer.email}</div>
            <div class="customer-phone">${customer.phone || ''}</div>
            <div class="customer-actions">
                <button class="btn-small btn-edit" onclick="editCustomer(${customer.id})">Edit</button>
                <button class="btn-small btn-delete" onclick="deleteCustomer(${customer.id})">Delete</button>
            </div>
        </div>
    `).join('');
}

function updateCustomerSelect() {
    const select = document.getElementById('customerSelect');
    if (!select) {
        console.log('Customer select element not found');
        return;
    }
    
    select.innerHTML = '<option value="">-- Select existing customer or enter manually --</option>';
    
    console.log('Updating customer select with', customers.length, 'customers');
    
    customers.forEach(customer => {
        const option = document.createElement('option');
        option.value = customer.id;
        option.textContent = `${customer.name} ${customer.company ? '(' + customer.company + ')' : ''}`;
        select.appendChild(option);
        console.log('Added customer option:', customer.name, 'ID:', customer.id);
    });
}

function loadCustomerInfo() {
    const select = document.getElementById('customerSelect');
    const customerId = parseInt(select.value);
    
    console.log('Loading customer info for ID:', customerId);
    console.log('Available customers:', customers);
    
    if (!customerId) {
        // Clear form if no customer selected
        document.getElementById('clientName').value = '';
        document.getElementById('clientEmail').value = '';
        document.getElementById('clientAddress').value = '';
        document.getElementById('clientPhone').value = '';
        return;
    }
    
    const customer = customers.find(c => c.id === customerId);
    console.log('Found customer:', customer);
    
    if (customer) {
        const clientName = document.getElementById('clientName');
        const clientEmail = document.getElementById('clientEmail');
        const clientAddress = document.getElementById('clientAddress');
        const clientPhone = document.getElementById('clientPhone');
        
        if (clientName) clientName.value = customer.name || '';
        if (clientEmail) clientEmail.value = customer.email || '';
        if (clientAddress) clientAddress.value = customer.address || '';
        if (clientPhone) clientPhone.value = customer.phone || '';
        
        console.log('Populated fields with:', {
            name: customer.name,
            email: customer.email,
            address: customer.address,
            phone: customer.phone
        });
    } else {
        console.log('Customer not found for ID:', customerId);
    }
}

function showNewCustomerForm() {
    showTab('customers');
    clearCustomerForm();
}

function saveCustomer() {
    const customerData = {
        name: document.getElementById('customerName').value,
        email: document.getElementById('customerEmail').value,
        company: document.getElementById('customerCompany').value,
        phone: document.getElementById('customerPhone').value,
        address: document.getElementById('customerAddress').value
    };

    if (!customerData.name || !customerData.email) {
        alert('Please fill in name and email fields.');
        return;
    }

    const customerId = document.getElementById('customerId').value;
    const method = customerId ? 'PUT' : 'POST';
    const url = customerId ? `/api/customers/${customerId}` : '/api/customers';

    fetch(url, {
        method: method,
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(customerData)
    })
    .then(response => response.json())
    .then(data => {
        alert(`Customer ${customerId ? 'updated' : 'created'} successfully!`);
        clearCustomerForm();
        loadCustomers();
    })
    .catch(error => {
        console.error('Error saving customer:', error);
        alert('Error saving customer. Please try again.');
    });
}

function editCustomer(id) {
    const customer = customers.find(c => c.id === id);
    if (customer) {
        document.getElementById('customerId').value = customer.id;
        document.getElementById('customerName').value = customer.name;
        document.getElementById('customerEmail').value = customer.email;
        document.getElementById('customerCompany').value = customer.company || '';
        document.getElementById('customerPhone').value = customer.phone || '';
        document.getElementById('customerAddress').value = customer.address || '';
    }
}

function deleteCustomer(id) {
    if (!confirm('Are you sure you want to delete this customer?')) {
        return;
    }

    fetch(`/api/customers/${id}`, {
        method: 'DELETE'
    })
    .then(() => {
        alert('Customer deleted successfully!');
        loadCustomers();
    })
    .catch(error => {
        console.error('Error deleting customer:', error);
        alert('Error deleting customer. Please try again.');
    });
}

function clearCustomerForm() {
    document.getElementById('customerId').value = '';
    document.getElementById('customerName').value = '';
    document.getElementById('customerEmail').value = '';
    document.getElementById('customerCompany').value = '';
    document.getElementById('customerPhone').value = '';
    document.getElementById('customerAddress').value = '';
}
