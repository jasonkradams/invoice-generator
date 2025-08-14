// Tests for utility functions (utils.js)
const { DateUtils, NumberUtils, DOMUtils, ValidationUtils, ErrorHandler } = require('../static/js/utils.js');

describe('DateUtils', () => {
  describe('formatDate', () => {
    test('should format date string correctly', () => {
      const result = DateUtils.formatDate('2024-01-15');
      expect(result).toBe('January 15, 2024');
    });

    test('should handle Date object', () => {
      const date = new Date('2024-01-15');
      const result = DateUtils.formatDate(date);
      expect(result).toBe('January 15, 2024');
    });

    test('should return empty string for invalid date', () => {
      const result = DateUtils.formatDate('invalid');
      expect(result).toBe('');
    });
  });

  describe('getTodayString', () => {
    test('should return today in YYYY-MM-DD format', () => {
      const today = new Date();
      const expected = today.toISOString().split('T')[0];
      expect(DateUtils.getTodayString()).toBe(expected);
    });
  });

  describe('getFutureDateString', () => {
    test('should return future date in YYYY-MM-DD format', () => {
      const today = new Date();
      const futureDate = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000));
      const expected = futureDate.toISOString().split('T')[0];
      expect(DateUtils.getFutureDateString(30)).toBe(expected);
    });
  });
});

describe('NumberUtils', () => {
  describe('formatCurrency', () => {
    test('should format positive numbers correctly', () => {
      expect(NumberUtils.formatCurrency(1234.56)).toBe('$1,234.56');
    });

    test('should format zero correctly', () => {
      expect(NumberUtils.formatCurrency(0)).toBe('$0.00');
    });

    test('should format negative numbers correctly', () => {
      expect(NumberUtils.formatCurrency(-1234.56)).toBe('-$1,234.56');
    });

    test('should handle string numbers', () => {
      expect(NumberUtils.formatCurrency('1234.56')).toBe('$1,234.56');
    });

    test('should handle invalid input', () => {
      expect(NumberUtils.formatCurrency('invalid')).toBe('$0.00');
    });
  });

  describe('parseNumber', () => {
    test('should parse valid number strings', () => {
      expect(NumberUtils.parseNumber('123.45')).toBe(123.45);
    });

    test('should return 0 for invalid input', () => {
      expect(NumberUtils.parseNumber('invalid')).toBe(0);
    });

    test('should handle empty string', () => {
      expect(NumberUtils.parseNumber('')).toBe(0);
    });
  });
});

describe('DOMUtils', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  describe('getElementById', () => {
    test('should return element if found', () => {
      document.body.innerHTML = '<div id="test">Test</div>';
      const element = DOMUtils.getElementById('test');
      expect(element).toBeTruthy();
      expect(element.id).toBe('test');
    });

    test('should return null if not found', () => {
      const element = DOMUtils.getElementById('nonexistent');
      expect(element).toBeNull();
    });
  });

  describe('setElementValue', () => {
    test('should set input value', () => {
      document.body.innerHTML = '<input id="test" type="text">';
      DOMUtils.setElementValue('test', 'new value');
      const element = document.getElementById('test');
      expect(element.value).toBe('new value');
    });

    test('should handle non-existent element gracefully', () => {
      expect(() => DOMUtils.setElementValue('nonexistent', 'value')).not.toThrow();
    });
  });

  describe('getElementValue', () => {
    test('should get input value', () => {
      document.body.innerHTML = '<input id="test" type="text" value="test value">';
      const value = DOMUtils.getElementValue('test');
      expect(value).toBe('test value');
    });

    test('should return empty string for non-existent element', () => {
      const value = DOMUtils.getElementValue('nonexistent');
      expect(value).toBe('');
    });
  });

  describe('clearElement', () => {
    test('should clear element innerHTML', () => {
      document.body.innerHTML = '<div id="test">Content</div>';
      DOMUtils.clearElement(document.getElementById('test'));
      const element = document.getElementById('test');
      expect(element.innerHTML).toBe('');
    });

    test('should handle null element gracefully', () => {
      expect(() => DOMUtils.clearElement(null)).not.toThrow();
    });
  });
});

describe('ValidationUtils', () => {
  describe('isValidEmail', () => {
    test('should validate correct email addresses', () => {
      expect(ValidationUtils.isValidEmail('test@example.com')).toBe(true);
      expect(ValidationUtils.isValidEmail('user.name@domain.co.uk')).toBe(true);
    });

    test('should reject invalid email addresses', () => {
      expect(ValidationUtils.isValidEmail('invalid')).toBe(false);
      expect(ValidationUtils.isValidEmail('test@')).toBe(false);
      expect(ValidationUtils.isValidEmail('@example.com')).toBe(false);
    });
  });

  describe('isValidPhone', () => {
    test('should validate phone numbers', () => {
      expect(ValidationUtils.isValidPhone('(555) 123-4567')).toBe(true);
      expect(ValidationUtils.isValidPhone('555-123-4567')).toBe(true);
      expect(ValidationUtils.isValidPhone('5551234567')).toBe(true);
    });

    test('should reject invalid phone numbers', () => {
      expect(ValidationUtils.isValidPhone('123')).toBe(false);
      expect(ValidationUtils.isValidPhone('abc-def-ghij')).toBe(false);
    });
  });

  describe('isEmpty', () => {
    test('should detect empty values', () => {
      expect(ValidationUtils.isEmpty('')).toBe(true);
      expect(ValidationUtils.isEmpty('   ')).toBe(true);
      expect(ValidationUtils.isEmpty(null)).toBe(true);
      expect(ValidationUtils.isEmpty(undefined)).toBe(true);
    });

    test('should detect non-empty values', () => {
      expect(ValidationUtils.isEmpty('test')).toBe(false);
      expect(ValidationUtils.isEmpty('0')).toBe(false);
    });
  });
});

describe('ErrorHandler', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  describe('showError', () => {
    test('should create error message element', () => {
      ErrorHandler.showError('Test error');
      const errorElement = document.querySelector('.error-message');
      expect(errorElement).toBeTruthy();
      expect(errorElement.textContent).toContain('Test error');
    });
  });

  describe('showSuccess', () => {
    test('should create success message element', () => {
      ErrorHandler.showSuccess('Test success');
      const successElement = document.querySelector('.success-message');
      expect(successElement).toBeTruthy();
      expect(successElement.textContent).toContain('Test success');
    });
  });

  describe('handleApiError', () => {
    test('should handle API error with custom message', () => {
      const error = new Error('API Error');
      ErrorHandler.handleApiError(error, 'Custom message:');
      const errorElement = document.querySelector('.error-message');
      expect(errorElement).toBeTruthy();
      expect(errorElement.textContent).toContain('Custom message: API Error');
    });
  });
});
