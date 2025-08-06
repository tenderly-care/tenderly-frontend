/**
 * Validation Utilities
 * Production-level validation functions for forms and user input
 */

export interface ValidationResult {
  isValid: boolean;
  message?: string;
}

export interface PasswordStrength {
  score: number;
  feedback: string[];
  strength: 'very-weak' | 'weak' | 'fair' | 'good' | 'strong';
}

/**
 * Email validation
 */
export const validateEmail = (email: string): ValidationResult => {
  if (!email.trim()) {
    return { isValid: false, message: 'Email is required' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, message: 'Please enter a valid email address' };
  }

  // Check for common disposable email domains
  const disposableDomains = [
    'tempmail.org',
    'guerrillamail.com',
    'mailinator.com',
    '10minutemail.com',
    'throwaway.email',
  ];
  
  const domain = email.split('@')[1]?.toLowerCase();
  if (domain && disposableDomains.includes(domain)) {
    return { isValid: false, message: 'Please use a valid email address' };
  }

  return { isValid: true };
};

/**
 * Phone number validation
 */
export const validatePhone = (phone: string): ValidationResult => {
  if (!phone.trim()) {
    return { isValid: false, message: 'Phone number is required' };
  }

  // Remove all non-digit characters except + for international format
  const cleanedPhone = phone.replace(/[^\d+]/g, '');
  
  // Check for minimum length (7 digits) and maximum length (15 digits)
  const digitCount = cleanedPhone.replace(/[^\d]/g, '').length;
  
  if (digitCount < 7) {
    return { isValid: false, message: 'Phone number must be at least 7 digits' };
  }
  
  if (digitCount > 15) {
    return { isValid: false, message: 'Phone number is too long' };
  }

  // Basic international format validation
  const phoneRegex = /^[\+]?[1-9][\d]{6,14}$/;
  if (!phoneRegex.test(cleanedPhone)) {
    return { isValid: false, message: 'Please enter a valid phone number' };
  }

  return { isValid: true };
};

/**
 * Password strength validation
 */
export const validatePasswordStrength = (password: string): PasswordStrength => {
  const feedback: string[] = [];
  let score = 0;

  // Length check
  if (password.length >= 8) {
    score += 1;
  } else {
    feedback.push('At least 8 characters');
  }

  // Lowercase check
  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('At least one lowercase letter');
  }

  // Uppercase check
  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('At least one uppercase letter');
  }

  // Number check
  if (/[0-9]/.test(password)) {
    score += 1;
  } else {
    feedback.push('At least one number');
  }

  // Special character check
  if (/[^A-Za-z0-9]/.test(password)) {
    score += 1;
  } else {
    feedback.push('At least one special character');
  }

  // Determine strength level
  let strength: PasswordStrength['strength'];
  if (score <= 1) strength = 'very-weak';
  else if (score <= 2) strength = 'weak';
  else if (score <= 3) strength = 'fair';
  else if (score <= 4) strength = 'good';
  else strength = 'strong';

  return { score, feedback, strength };
};

/**
 * Calculate password strength score (0-5)
 * Used for real-time password strength indicator
 */
export const calculatePasswordStrength = (password: string): number => {
  if (!password) return 0;
  
  let score = 0;
  
  // Length check
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 0.5;
  
  // Character variety checks
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[@$!%*?&]/.test(password)) score += 1;
  
  // Additional complexity bonus
  if (password.length >= 16) score += 0.5;
  
  return Math.min(Math.floor(score), 5);
};

/**
 * Password validation
 */
export const validatePassword = (password: string): ValidationResult => {
  if (!password) {
    return { isValid: false, message: 'Password is required' };
  }

  const strength = validatePasswordStrength(password);
  
  if (strength.score < 3) {
    return { isValid: false, message: 'Password is too weak' };
  }

  return { isValid: true };
};

/**
 * Name validation
 */
export const validateName = (name: string, fieldName: string = 'Name'): ValidationResult => {
  if (!name.trim()) {
    return { isValid: false, message: `${fieldName} is required` };
  }

  if (name.trim().length < 2) {
    return { isValid: false, message: `${fieldName} must be at least 2 characters` };
  }

  if (name.trim().length > 50) {
    return { isValid: false, message: `${fieldName} must be less than 50 characters` };
  }

  // Check for valid characters (letters, spaces, hyphens, apostrophes)
  const nameRegex = /^[a-zA-Z\s\-']+$/;
  if (!nameRegex.test(name.trim())) {
    return { isValid: false, message: `${fieldName} contains invalid characters` };
  }

  return { isValid: true };
};

/**
 * Confirm password validation
 */
export const validateConfirmPassword = (password: string, confirmPassword: string): ValidationResult => {
  if (!confirmPassword) {
    return { isValid: false, message: 'Please confirm your password' };
  }

  if (password !== confirmPassword) {
    return { isValid: false, message: 'Passwords do not match' };
  }

  return { isValid: true };
};

/**
 * Terms acceptance validation
 */
export const validateTermsAcceptance = (accepted: boolean): ValidationResult => {
  if (!accepted) {
    return { isValid: false, message: 'You must accept the terms and conditions' };
  }

  return { isValid: true };
};

/**
 * Form validation helper
 */
export interface FormValidationErrors {
  [key: string]: string;
}

export const validateRegistrationForm = (formData: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
}): { isValid: boolean; errors: FormValidationErrors } => {
  const errors: FormValidationErrors = {};

  // Validate first name
  const firstNameValidation = validateName(formData.firstName, 'First name');
  if (!firstNameValidation.isValid) {
    errors.firstName = firstNameValidation.message!;
  }

  // Validate last name
  const lastNameValidation = validateName(formData.lastName, 'Last name');
  if (!lastNameValidation.isValid) {
    errors.lastName = lastNameValidation.message!;
  }

  // Validate email
  const emailValidation = validateEmail(formData.email);
  if (!emailValidation.isValid) {
    errors.email = emailValidation.message!;
  }

  // Validate phone
  const phoneValidation = validatePhone(formData.phone);
  if (!phoneValidation.isValid) {
    errors.phone = phoneValidation.message!;
  }

  // Validate password
  const passwordValidation = validatePassword(formData.password);
  if (!passwordValidation.isValid) {
    errors.password = passwordValidation.message!;
  }

  // Validate confirm password
  const confirmPasswordValidation = validateConfirmPassword(formData.password, formData.confirmPassword);
  if (!confirmPasswordValidation.isValid) {
    errors.confirmPassword = confirmPasswordValidation.message!;
  }

  // Validate terms acceptance
  const termsValidation = validateTermsAcceptance(formData.acceptTerms);
  if (!termsValidation.isValid) {
    errors.acceptTerms = termsValidation.message!;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Sanitize input for security
 */
export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, ''); // Remove event handlers
};

/**
 * Format phone number for display
 */
export const formatPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  
  return phone;
};

/**
 * Validate URL
 */
export const validateUrl = (url: string): ValidationResult => {
  if (!url.trim()) {
    return { isValid: false, message: 'URL is required' };
  }

  try {
    new URL(url);
    return { isValid: true };
  } catch {
    return { isValid: false, message: 'Please enter a valid URL' };
  }
};

/**
 * Validate date
 */
export const validateDate = (date: string): ValidationResult => {
  if (!date) {
    return { isValid: false, message: 'Date is required' };
  }

  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) {
    return { isValid: false, message: 'Please enter a valid date' };
  }

  return { isValid: true };
};

/**
 * Validate age (must be 18 or older)
 */
export const validateAge = (birthDate: string): ValidationResult => {
  const dateValidation = validateDate(birthDate);
  if (!dateValidation.isValid) {
    return dateValidation;
  }

  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  if (age < 18) {
    return { isValid: false, message: 'You must be at least 18 years old' };
  }

  return { isValid: true };
}; 