// Tests for invoice management (invoice.js)
const { InvoiceManager } = require('../static/js/invoice.js');

// Mock the API client
jest.mock('../static/js/api.js', () => ({
  ApiClient: jest.fn().mockImplementation(() => ({
    getInvoices: jest.fn(),
    getInvoice: jest.fn(),
    createInvoice: jest.fn(),
    toggleTemplate: jest.fn(),
    getCustomers: jest.fn(),
  }))
}));

describe('InvoiceManager', () => {
  let invoiceManager;
  let mockApiClient;

  beforeEach(() => {
    document.body.innerHTML = `
      <div id="invoiceForm">
        <input id="date" type="date">
        <input id="dueDate" type="date">
        <select id="invoiceTemplateSelect"></select>
        <select id="customerSelect"></select>
        <input id="clientName" type="text">
        <input id="clientEmail" type="email">
        <input id="clientAddress" type="text">
        <input id="clientPhone" type="tel">
        <input id="tax" type="number">
        <textarea id="notes"></textarea>
        <div id="itemsContainer"></div>
        <div id="subtotal">$0.00</div>
        <div id="taxAmount">$0.00</div>
        <div id="total">$0.00</div>
      </div>
      <div id="invoicesList"></div>
      <div id="templatesList"></div>
    `;

    const { ApiClient } = require('../static/js/api.js');
    mockApiClient = new ApiClient();
    invoiceManager = new InvoiceManager(mockApiClient);
  });

  describe('constructor', () => {
    test('should initialize with empty arrays', () => {
      expect(invoiceManager.invoices).toEqual([]);
      expect(invoiceManager.customers).toEqual([]);
    });

    test('should set api client', () => {
      expect(invoiceManager.api).toBe(mockApiClient);
    });
  });

  describe('loadData', () => {
    test('should load invoices and customers', async () => {
      const mockInvoices = [{ id: 1, invoiceNum: 'INV-001' }];
      const mockCustomers = [{ id: 1, name: 'Test Customer' }];

      mockApiClient.getInvoices.mockResolvedValue(mockInvoices);
      mockApiClient.getCustomers.mockResolvedValue(mockCustomers);

      await invoiceManager.loadData();

      expect(mockApiClient.getInvoices).toHaveBeenCalled();
      expect(mockApiClient.getCustomers).toHaveBeenCalled();
      expect(invoiceManager.invoices).toEqual(mockInvoices);
      expect(invoiceManager.customers).toEqual(mockCustomers);
    });

    test('should handle API errors gracefully', async () => {
      mockApiClient.getInvoices.mockRejectedValue(new Error('API Error'));
      mockApiClient.getCustomers.mockResolvedValue([]);

      await invoiceManager.loadData();

      expect(invoiceManager.invoices).toEqual([]);
      expect(invoiceManager.customers).toEqual([]);
    });
  });

  describe('calculateTotals', () => {
    test('should calculate totals correctly', () => {
      document.body.innerHTML += `
        <div class="invoice-item">
          <input class="item-quantity" value="2">
          <input class="item-rate" value="100">
        </div>
        <div class="invoice-item">
          <input class="item-quantity" value="1">
          <input class="item-rate" value="50">
        </div>
      `;
      document.getElementById('tax').value = '10';

      invoiceManager.calculateTotals();

      expect(document.getElementById('subtotal').textContent).toBe('$250.00');
      expect(document.getElementById('taxAmount').textContent).toBe('$25.00');
      expect(document.getElementById('total').textContent).toBe('$275.00');
    });

    test('should handle zero items', () => {
      document.getElementById('tax').value = '0';

      invoiceManager.calculateTotals();

      expect(document.getElementById('subtotal').textContent).toBe('$0.00');
      expect(document.getElementById('taxAmount').textContent).toBe('$0.00');
      expect(document.getElementById('total').textContent).toBe('$0.00');
    });
  });

  describe('addInvoiceItem', () => {
    test('should add new invoice item row', () => {
      const itemsContainer = document.getElementById('itemsContainer');
      expect(itemsContainer.children.length).toBe(0);

      invoiceManager.addInvoiceItem();

      expect(itemsContainer.children.length).toBe(1);
      expect(itemsContainer.innerHTML).toContain('invoice-item');
    });
  });

  describe('removeInvoiceItem', () => {
    test('should remove invoice item', () => {
      const itemsContainer = document.getElementById('itemsContainer');
      itemsContainer.innerHTML = `
        <div class="invoice-item" id="item-1">Item 1</div>
        <div class="invoice-item" id="item-2">Item 2</div>
      `;

      const itemToRemove = document.getElementById('item-1');
      invoiceManager.removeInvoiceItem(itemToRemove);

      expect(itemsContainer.children.length).toBe(1);
      expect(document.getElementById('item-1')).toBeNull();
    });

    test('should not remove last item', () => {
      const itemsContainer = document.getElementById('itemsContainer');
      itemsContainer.innerHTML = '<div class="invoice-item" id="item-1">Item 1</div>';

      const itemToRemove = document.getElementById('item-1');
      invoiceManager.removeInvoiceItem(itemToRemove);

      expect(itemsContainer.children.length).toBe(1);
    });
  });

  describe('toggleTemplate', () => {
    test('should toggle template status', async () => {
      const mockResponse = { template: true };
      mockApiClient.toggleTemplate.mockResolvedValue(mockResponse);
      
      invoiceManager.invoices = [{ id: 1, template: false }];

      await invoiceManager.toggleTemplate(1);

      expect(mockApiClient.toggleTemplate).toHaveBeenCalledWith(1);
      expect(invoiceManager.invoices[0].template).toBe(true);
    });

    test('should handle toggle error', async () => {
      mockApiClient.toggleTemplate.mockRejectedValue(new Error('Toggle failed'));
      
      await invoiceManager.toggleTemplate(1);

      expect(mockApiClient.toggleTemplate).toHaveBeenCalledWith(1);
    });
  });

  describe('clearForm', () => {
    test('should reset all form fields', () => {
      // Set some values
      document.getElementById('clientName').value = 'Test Client';
      document.getElementById('clientEmail').value = 'test@example.com';
      document.getElementById('tax').value = '10';
      document.getElementById('notes').value = 'Test notes';

      invoiceManager.clearForm();

      expect(document.getElementById('clientName').value).toBe('');
      expect(document.getElementById('clientEmail').value).toBe('');
      expect(document.getElementById('tax').value).toBe('0');
      expect(document.getElementById('notes').value).toBe('');
    });

    test('should reset dropdowns', () => {
      document.getElementById('invoiceTemplateSelect').value = '1';
      document.getElementById('customerSelect').value = '1';

      invoiceManager.clearForm();

      expect(document.getElementById('invoiceTemplateSelect').value).toBe('');
      expect(document.getElementById('customerSelect').value).toBe('');
    });
  });

  describe('populateFormFromInvoice', () => {
    test('should populate form with invoice data', () => {
      const invoice = {
        date: '2024-01-15',
        dueDate: '2024-02-15',
        client: {
          name: 'Test Client',
          email: 'test@example.com',
          address: '123 Test St',
          phone: '555-1234'
        },
        tax: 10,
        notes: 'Test notes',
        items: [
          { description: 'Item 1', quantity: 2, rate: 100 }
        ]
      };

      invoiceManager.populateFormFromInvoice(invoice);

      expect(document.getElementById('date').value).toBe('2024-01-15');
      expect(document.getElementById('dueDate').value).toBe('2024-02-15');
      expect(document.getElementById('clientName').value).toBe('Test Client');
      expect(document.getElementById('clientEmail').value).toBe('test@example.com');
      expect(document.getElementById('tax').value).toBe('10');
      expect(document.getElementById('notes').value).toBe('Test notes');
    });
  });

  describe('validateForm', () => {
    test('should validate required fields', () => {
      document.getElementById('clientName').value = '';
      document.getElementById('clientEmail').value = 'invalid-email';

      const isValid = invoiceManager.validateForm();

      expect(isValid).toBe(false);
    });

    test('should pass validation with valid data', () => {
      document.getElementById('clientName').value = 'Test Client';
      document.getElementById('clientEmail').value = 'test@example.com';
      document.getElementById('itemsContainer').innerHTML = `
        <div class="invoice-item">
          <input class="item-description" value="Test Item">
          <input class="item-quantity" value="1">
          <input class="item-rate" value="100">
        </div>
      `;

      const isValid = invoiceManager.validateForm();

      expect(isValid).toBe(true);
    });
  });
});
