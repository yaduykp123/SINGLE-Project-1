// src/utils/validation.js
// Beginner-friendly validation helpers for expireOff
import { useState } from "react";


// EMAIL VALIDATION

export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const getEmailError = (email) => {
  if (!email) return "Email is required";
  if (!isValidEmail(email)) return "Please enter a valid email address";
  return null;
};

// PHONE VALIDATION (Indian format)

export const isValidPhone = (phone) => {
  if (!phone) return false;
  // Accepts: 9876543210, +91 9876543210, +91-9876543210, +919876543210, 919876543210
  const cleanPhone = String(phone).replace(/[\s-]/g, "");
  const phoneRegex = /^(\+91|91)?[6-9]\d{9}$/;
  return phoneRegex.test(cleanPhone);
};

export const getPhoneError = (phone) => {
  if (!phone || !String(phone).trim()) return "Phone number is required";
  const cleanPhone = String(phone).replace(/[\s-]/g, "");
  
  // Check if contains non-digits after optional +
  const digitsOnly = cleanPhone.startsWith("+") ? cleanPhone.slice(1) : cleanPhone;
  if (!/^\d+$/.test(digitsOnly)) {
    return "Phone number must only contain digits";
  }

  // Check 10-digit standard Indian format
  if (!isValidPhone(phone)) {
    if (digitsOnly.length < 10) return "Phone number must be at least 10 digits";
    if (digitsOnly.length > 12) return "Phone number exceeds maximum length (10 digits)";
    return "Enter valid 10-digit Indian mobile number (starts with 6, 7, 8, or 9)";
  }
  return null;
};


// PASSWORD VALIDATION

export const getPasswordStrength = (password) => {
  let strength = 0;
  if (password.length >= 8) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[a-z]/.test(password)) strength++;
  if (/\d/.test(password)) strength++;
  if (/[^A-Za-z0-9]/.test(password)) strength++;
  return strength; // 0-5
};

export const getPasswordError = (password) => {
  if (!password) return "Password is required";
  if (password.length < 8) return "Password must be at least 8 characters";
  if (!/[A-Z]/.test(password)) return "Include at least one uppercase letter";
  if (!/[a-z]/.test(password)) return "Include at least one lowercase letter";
  if (!/\d/.test(password)) return "Include at least one number";
  return null;
};

export const getPasswordStrengthLabel = (strength) => {
  const labels = ["Very Weak", "Weak", "Fair", "Good", "Strong", "Very Strong"];
  const colors = ["text-red-600", "text-red-500", "text-amber-500", "text-yellow-500", "text-emerald-500", "text-emerald-600"];
  return { label: labels[strength] || "Very Weak", color: colors[strength] || "text-red-600" };
};


// NAME VALIDATION

export const getNameError = (name) => {
  if (!name) return "Full name is required";
  if (name.length < 2) return "Name must be at least 2 characters";
  if (name.length > 50) return "Name must be less than 50 characters";
  if (!/^[a-zA-Z\s]+$/.test(name)) return "Name should only contain letters and spaces";
  return null;
};


// PINCODE VALIDATION (Indian)

export const isValidPincode = (pincode) => {
  return /^\d{6}$/.test(pincode);
};

export const getPincodeError = (pincode) => {
  if (!pincode) return "Pincode is required";
  if (!isValidPincode(pincode)) return "Enter valid 6-digit pincode";
  return null;
};


// ADDRESS VALIDATION

export const getStreetError = (street) => {
  if (!street) return "Street address is required";
  if (street.length < 5) return "Street address is too short";
  if (street.length > 200) return "Street address is too long (max 200 chars)";
  return null;
};

export const getCityError = (city) => {
  if (!city) return "City is required";
  if (city.length < 2) return "City name is too short";
  return null;
};

export const getStateError = (state) => {
  if (!state) return "State is required";
  if (state.length < 2) return "State name is too short";
  return null;
};


// PRODUCT VALIDATION

export const getProductNameError = (name) => {
  if (!name) return "Product name is required";
  if (name.length < 2) return "Name too short (min 2 chars)";
  if (name.length > 100) return "Name too long (max 100 chars)";
  return null;
};

export const getPriceError = (price, fieldName = "Price") => {
  if (!price && price !== 0) return `${fieldName} is required`;
  const num = Number(price);
  if (isNaN(num) || num < 0) return `${fieldName} must be a positive number`;
  if (num > 100000) return `${fieldName} too high (max ₹1,00,000)`;
  return null;
};

export const getQuantityError = (qty) => {
  if (!qty && qty !== 0) return "Quantity is required";
  const num = Number(qty);
  if (isNaN(num) || num <= 0) return "Quantity must be greater than 0";
  if (num > 10000) return "Quantity too high (max 10,000)";
  return null;
};

export const getStockError = (stock) => {
  if (!stock && stock !== 0) return "Stock is required";
  const num = Number(stock);
  if (isNaN(num) || num < 1) return "Stock must be at least 1";
  if (num > 10000) return "Stock too high (max 10,000)";
  return null;
};

export const getDescriptionError = (desc) => {
  if (desc && desc.length > 500) return "Description too long (max 500 chars)";
  return null;
};

export const getExpiryDateError = (date) => {
  if (!date) return "Expiry date is required";
  // Parse YYYY-MM-DD as local midnight to avoid timezone shift issues
  const [year, month, day] = date.split("-").map(Number);
  const expiry = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (expiry < today) return "Expiry date cannot be in the past";
  return null;
};

// FORM VALIDATION HELPERS

export const validateForm = (fields) => {
  const errors = {};
  let isValid = true;

  for (const [fieldName, error] of Object.entries(fields)) {
    if (error) {
      errors[fieldName] = error;
      isValid = false;
    }
  }

  return { isValid, errors };
};


// REAL-TIME VALIDATION HOOK (for React)

export const useFieldValidation = (value, validator) => {
  const [error, setError] = useState(null);
  const [touched, setTouched] = useState(false);

  const validate = () => {
    const err = validator(value);
    setError(err);
    setTouched(true);
    return !err;
  };

  const onBlur = () => {
    setError(validator(value));
    setTouched(true);
  };

  return { error, touched, validate, onBlur, setTouched };
};