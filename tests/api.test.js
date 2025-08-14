// Tests for API client (api.js)
const { ApiClient } = require('../static/js/api.js');

describe('ApiClient', () => {
  let apiClient;

  beforeEach(() => {
    apiClient = new ApiClient();
    fetch.mockClear();
  });

  describe('constructor', () => {
    test('should set default base URL', () => {
      expect(apiClient.baseUrl).toBe('/api');
    });

    test('should accept custom base URL', () => {
      const customClient = new ApiClient('http://localhost:3000/api');
      expect(customClient.baseUrl).toBe('http://localhost:3000/api');
    });
  });

  describe('request method', () => {
    test('should make GET request with correct headers', async () => {
      const mockResponse = { data: 'test' };
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await apiClient.request('/test');

      expect(fetch).toHaveBeenCalledWith('/api/test', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      expect(result).toEqual(mockResponse);
    });

    test('should make POST request with body', async () => {
      const mockResponse = { id: 1 };
      const requestBody = { name: 'test' };
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await apiClient.request('/test', 'POST', requestBody);

      expect(fetch).toHaveBeenCalledWith('/api/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      expect(result).toEqual(mockResponse);
    });

    test('should throw error for non-ok response', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      await expect(apiClient.request('/test')).rejects.toThrow('HTTP error! status: 404');
    });

    test('should throw error for network failure', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(apiClient.request('/test')).rejects.toThrow('Network error');
    });
  });

  describe('invoice methods', () => {
    test('getInvoices should fetch all invoices', async () => {
      const mockInvoices = [{ id: 1, invoiceNum: 'INV-001' }];
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockInvoices,
      });

      const result = await apiClient.getInvoices();

      expect(fetch).toHaveBeenCalledWith('/api/invoices', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      expect(result).toEqual(mockInvoices);
    });

    test('getInvoice should fetch single invoice by ID', async () => {
      const mockInvoice = { id: 1, invoiceNum: 'INV-001' };
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockInvoice,
      });

      const result = await apiClient.getInvoice(1);

      expect(fetch).toHaveBeenCalledWith('/api/invoices/1', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      expect(result).toEqual(mockInvoice);
    });

    test('createInvoice should post new invoice', async () => {
      const invoiceData = { invoiceNum: 'INV-001', client: { name: 'Test' } };
      const mockResponse = { id: 1, ...invoiceData };
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await apiClient.createInvoice(invoiceData);

      expect(fetch).toHaveBeenCalledWith('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invoiceData),
      });
      expect(result).toEqual(mockResponse);
    });

    test('toggleTemplate should toggle invoice template status', async () => {
      const mockResponse = { message: 'Template status updated', template: true };
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await apiClient.toggleTemplate(1);

      expect(fetch).toHaveBeenCalledWith('/api/invoices/1/toggle-template', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('customer methods', () => {
    test('getCustomers should fetch all customers', async () => {
      const mockCustomers = [{ id: 1, name: 'Test Customer' }];
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCustomers,
      });

      const result = await apiClient.getCustomers();

      expect(fetch).toHaveBeenCalledWith('/api/customers', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      expect(result).toEqual(mockCustomers);
    });

    test('createCustomer should post new customer', async () => {
      const customerData = { name: 'Test Customer', email: 'test@example.com' };
      const mockResponse = { id: 1, ...customerData };
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await apiClient.createCustomer(customerData);

      expect(fetch).toHaveBeenCalledWith('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customerData),
      });
      expect(result).toEqual(mockResponse);
    });

    test('updateCustomer should put updated customer', async () => {
      const customerData = { name: 'Updated Customer', email: 'updated@example.com' };
      const mockResponse = { id: 1, ...customerData };
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await apiClient.updateCustomer(1, customerData);

      expect(fetch).toHaveBeenCalledWith('/api/customers/1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customerData),
      });
      expect(result).toEqual(mockResponse);
    });

    test('deleteCustomer should delete customer by ID', async () => {
      const mockResponse = { message: 'Customer deleted' };
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await apiClient.deleteCustomer(1);

      expect(fetch).toHaveBeenCalledWith('/api/customers/1', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      expect(result).toEqual(mockResponse);
    });
  });
});
