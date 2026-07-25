import {
  isValidEmail,
  getEmailError,
  isValidPhone,
  getPhoneError,
  getProductNameError,
  getPriceError,
  getQuantityError,
  getStockError,
  getExpiryDateError,
  validateForm,
} from '../utils/validation';

describe('Validation Utils', () => {
  describe('Email', () => {
    it('validates correct emails', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user+tag@domain.co.in')).toBe(true);
    });

    it('rejects invalid emails', () => {
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
    });

    it('returns appropriate errors', () => {
      expect(getEmailError('')).toBe('Email is required');
      expect(getEmailError('bad')).toBe('Please enter a valid email address');
      expect(getEmailError('good@example.com')).toBeNull();
    });
  });

  describe('Phone', () => {
    it('validates Indian phone numbers', () => {
      expect(isValidPhone('9876543210')).toBe(true);
      expect(isValidPhone('+91 9876543210')).toBe(true);
      expect(isValidPhone('1234567890')).toBe(false);
      expect(isValidPhone('987654321')).toBe(false);
    });
  });

  describe('Product Name', () => {
    it('validates product names', () => {
      expect(getProductNameError('')).toBe('Product name is required');
      expect(getProductNameError('A')).toBe('Name too short (min 2 chars)');
      expect(getProductNameError('Apple')).toBeNull();
    });
  });

  describe('Price', () => {
    it('validates prices', () => {
      expect(getPriceError('', 'Market Price')).toBe('Market Price is required');
      expect(getPriceError(-5)).toContain('positive number');
      expect(getPriceError(1000000)).toContain('too high');
      expect(getPriceError(50)).toBeNull();
    });
  });

  describe('Expiry Date', () => {
    it('rejects past dates', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const dateStr = yesterday.toISOString().split('T')[0];
      expect(getExpiryDateError(dateStr)).toContain('cannot be in the past');
    });

    it('accepts future dates', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().split('T')[0];
      expect(getExpiryDateError(dateStr)).toBeNull();
    });
  });

  describe('validateForm', () => {
    it('returns valid for no errors', () => {
      const result = validateForm({ name: null, email: null });
      expect(result.isValid).toBe(true);
    });

    it('returns invalid when errors exist', () => {
      const result = validateForm({ name: 'Required', email: null });
      expect(result.isValid).toBe(false);
      expect(result.errors.name).toBe('Required');
    });
  });
});