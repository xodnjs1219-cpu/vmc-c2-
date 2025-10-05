// Validation utilities for common input validation

// Email validation
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const isValidEmail = (email: string): boolean => EMAIL_REGEX.test(email);

// Password policy (minimum 8 characters)
export const PASSWORD_MIN_LENGTH = 8;
export const isValidPassword = (password: string): boolean =>
  password.length >= PASSWORD_MIN_LENGTH;

// Korean phone number validation (010-XXXX-XXXX or 01012345678)
export const PHONE_REGEX = /^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/;
export const isValidPhone = (phone: string): boolean => PHONE_REGEX.test(phone);

// Normalize phone number (remove hyphens)
export const normalizePhone = (phone: string): string => phone.replace(/-/g, '');

// URL validation
export const URL_REGEX = /^https?:\/\/.+/;
export const isValidUrl = (url: string): boolean => URL_REGEX.test(url);
