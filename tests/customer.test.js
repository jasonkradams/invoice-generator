// Tests for customer management (customer.js)
const { CustomerManager } = require('../static/js/customer.js');

// Mock the API client
jest.mock('../static/js/api.js', () => ({
  ApiClient: jest.fn().mockImplementation(() => ({
    getCustomers: jest.fn(),
    createCustomer: jest.fn(),
    updateCustomer: jest.fn(),
    deleteCustomer: jest.fn(),
  }))
}));

describe('CustomerManager', () => {
  let customerManager;
  let mockApiClient;

  beforeEach(() => {
    document.body.innerHTML = `
      <div id="customerForm">
        <input id="customerName" type="text">
        <input id="customerEmail" type="email">
        <input id="customerAddress" type="text">
        <input id="customerPhone" type="tel">
        <button id="saveCustomerBtn">Save</button>
        <button id="cancelCustomerBtn">Cancel</button>
      </div>
      <div id="customersList"></div>
      <div id="newCustomerForm" style="display: none;"></div>
    `;

    const { ApiClient } = require('../static/js/api.js');
    mockApiClient = new ApiClient();
    customerManager = new CustomerManager(mockApiClient);
  });

  describe('constructor', () => {
    test('should initialize with empty customers array', () => {
      expect(customerManager.customers).toEqual([]);
    });

    test('should set api client', () => {
      expect(customerManager.api).toBe(mockApiClient);
    });
  });

  describe('loadCustomers', () => {
    test('should load customers from API', async () => {
      const mockCustomers = [
        { id: 1, name: 'Customer 1', email: 'customer1@example.com' },
        { id: 2, name: 'Customer 2', email: 'customer2@example.com' }
      ];

      mockApiClient.getCustomers.mockResolvedValue(mockCustomers);

      await customerManager.loadCustomers();

      expect(mockApiClient.getCustomers).toHaveBeenCalled();
      expect(customerManager.customers).toEqual(mockCustomers);
    });

    test('should handle API errors gracefully', async () => {
      mockApiClient.getCustomers.mockRejectedValue(new Error('API Error'));

      await customerManager.loadCustomers();

      expect(customerManager.customers).toEqual([]);
    });
  });

  describe('displayCustomers', () => {
    test('should display customers in the list', () => {
      customerManager.customers = [
        { id: 1, name: 'Customer 1', email: 'customer1@example.com', address: '123 Main St', phone: '555-1234' },
        { id: 2, name: 'Customer 2', email: 'customer2@example.com', address: '456 Oak Ave', phone: '555-5678' }
      ];

      customerManager.displayCustomers();

      const customersList = document.getElementById('customersList');
      expect(customersList.innerHTML).toContain('Customer 1');
      expect(customersList.innerHTML).toContain('Customer 2');
      expect(customersList.innerHTML).toContain('customer1@example.com');
      expect(customersList.innerHTML).toContain('customer2@example.com');
    });

    test('should show message when no customers exist', () => {
      customerManager.customers = [];

      customerManager.displayCustomers();

      const customersList = document.getElementById('customersList');
      expect(customersList.innerHTML).toContain('No customers found');
    });
  });

  describe('showNewCustomerForm', () => {
    test('should show the new customer form', () => {
      const form = document.getElementById('newCustomerForm');
      expect(form.style.display).toBe('none');

      customerManager.showNewCustomerForm();

      expect(form.style.display).toBe('block');
    });

    test('should clear form fields', () => {
      document.getElementById('customerName').value = 'Old Name';
      document.getElementById('customerEmail').value = 'old@example.com';

      customerManager.showNewCustomerForm();

      expect(document.getElementById('customerName').value).toBe('');
      expect(document.getElementById('customerEmail').value).toBe('');
    });
  });

  describe('hideNewCustomerForm', () => {
    test('should hide the new customer form', () => {
      const form = document.getElementById('newCustomerForm');
      form.style.display = 'block';

      customerManager.hideNewCustomerForm();

      expect(form.style.display).toBe('none');
    });
  });

  describe('saveCustomer', () => {
    test('should create new customer', async () => {
      const customerData = {
        name: 'New Customer',
        email: 'new@example.com',
        address: '789 Pine St',
        phone: '555-9999'
      };

      document.getElementById('customerName').value = customerData.name;
      document.getElementById('customerEmail').value = customerData.email;
      document.getElementById('customerAddress').value = customerData.address;
      document.getElementById('customerPhone').value = customerData.phone;

      const mockResponse = { id: 1, ...customerData };
      mockApiClient.createCustomer.mockResolvedValue(mockResponse);

      await customerManager.saveCustomer();

      expect(mockApiClient.createCustomer).toHaveBeenCalledWith(customerData);
      expect(customerManager.customers).toContain(mockResponse);
    });

    test('should update existing customer', async () => {
      customerManager.editingCustomerId = 1;
      customerManager.customers = [
        { id: 1, name: 'Old Name', email: 'old@example.com' }
      ];

      const updatedData = {
        name: 'Updated Name',
        email: 'updated@example.com',
        address: '123 Updated St',
        phone: '555-0000'
      };

      document.getElementById('customerName').value = updatedData.name;
      document.getElementById('customerEmail').value = updatedData.email;
      document.getElementById('customerAddress').value = updatedData.address;
      document.getElementById('customerPhone').value = updatedData.phone;

      const mockResponse = { id: 1, ...updatedData };
      mockApiClient.updateCustomer.mockResolvedValue(mockResponse);

      await customerManager.saveCustomer();

      expect(mockApiClient.updateCustomer).toHaveBeenCalledWith(1, updatedData);
      expect(customerManager.customers[0]).toEqual(mockResponse);
    });

    test('should validate required fields', async () => {
      document.getElementById('customerName').value = '';
      document.getElementById('customerEmail').value = 'invalid-email';

      await customerManager.saveCustomer();

      expect(mockApiClient.createCustomer).not.toHaveBeenCalled();
    });
  });

  describe('editCustomer', () => {
    test('should populate form with customer data', () => {
      const customer = {
        id: 1,
        name: 'Test Customer',
        email: 'test@example.com',
        address: '123 Test St',
        phone: '555-1234'
      };

      customerManager.customers = [customer];

      customerManager.editCustomer(1);

      expect(document.getElementById('customerName').value).toBe('Test Customer');
      expect(document.getElementById('customerEmail').value).toBe('test@example.com');
      expect(document.getElementById('customerAddress').value).toBe('123 Test St');
      expect(document.getElementById('customerPhone').value).toBe('555-1234');
      expect(customerManager.editingCustomerId).toBe(1);
    });
  });

  describe('deleteCustomer', () => {
    test('should delete customer after confirmation', async () => {
      // Mock window.confirm
      window.confirm = jest.fn(() => true);

      customerManager.customers = [
        { id: 1, name: 'Customer 1' },
        { id: 2, name: 'Customer 2' }
      ];

      mockApiClient.deleteCustomer.mockResolvedValue({ message: 'Customer deleted' });

      await customerManager.deleteCustomer(1);

      expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this customer?');
      expect(mockApiClient.deleteCustomer).toHaveBeenCalledWith(1);
      expect(customerManager.customers).toHaveLength(1);
      expect(customerManager.customers[0].id).toBe(2);
    });

    test('should not delete if user cancels', async () => {
      window.confirm = jest.fn(() => false);

      customerManager.customers = [{ id: 1, name: 'Customer 1' }];

      await customerManager.deleteCustomer(1);

      expect(mockApiClient.deleteCustomer).not.toHaveBeenCalled();
      expect(customerManager.customers).toHaveLength(1);
    });
  });

  describe('validateCustomerForm', () => {
    test('should validate required fields', () => {
      document.getElementById('customerName').value = '';
      document.getElementById('customerEmail').value = 'invalid-email';

      const isValid = customerManager.validateCustomerForm();

      expect(isValid).toBe(false);
    });

    test('should pass validation with valid data', () => {
      document.getElementById('customerName').value = 'Valid Customer';
      document.getElementById('customerEmail').value = 'valid@example.com';

      const isValid = customerManager.validateCustomerForm();

      expect(isValid).toBe(true);
    });
  });
});
