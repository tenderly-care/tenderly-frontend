/**
 * Form Utilities
 * Production-level form handling utilities with error handling and validation
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';

export interface FormState<T> {
  data: T;
  errors: Record<string, string>;
  isSubmitting: boolean;
  isDirty: boolean;
  isValid: boolean;
}

export interface FormHandlers<T> {
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  handleSubmit: (e: React.FormEvent) => void;
  setFieldValue: (field: keyof T, value: any) => void;
  setFieldError: (field: keyof T, error: string) => void;
  clearErrors: () => void;
  resetForm: () => void;
}

export interface UseFormOptions<T> {
  initialData: T;
  onSubmit: (data: T) => Promise<void>;
  validate?: (data: T) => Record<string, string>;
  onError?: (error: any) => void;
  onSuccess?: () => void;
}

/**
 * Custom hook for form management with validation and error handling
 */
export function useForm<T extends Record<string, any>>({
  initialData,
  onSubmit,
  validate,
  onError,
  onSuccess,
}: UseFormOptions<T>): [FormState<T>, FormHandlers<T>] {
  const [state, setState] = useState<FormState<T>>({
    data: initialData,
    errors: {},
    isSubmitting: false,
    isDirty: false,
    isValid: true,
  });

  const initialDataRef = useRef(initialData);

  const validateForm = useCallback((data: T): Record<string, string> => {
    if (!validate) return {};
    return validate(data);
  }, [validate]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setState(prev => ({
      ...prev,
      data: {
        ...prev.data,
        [name]: type === 'checkbox' ? checked : value,
      },
      isDirty: true,
      errors: {
        ...prev.errors,
        [name]: '', // Clear field error when user starts typing
      },
    }));
  }, []);

  const setFieldValue = useCallback((field: keyof T, value: any) => {
    setState(prev => ({
      ...prev,
      data: {
        ...prev.data,
        [field]: value,
      },
      isDirty: true,
      errors: {
        ...prev.errors,
        [field]: '', // Clear field error when value is set programmatically
      },
    }));
  }, []);

  const setFieldError = useCallback((field: keyof T, error: string) => {
    setState(prev => ({
      ...prev,
      errors: {
        ...prev.errors,
        [field]: error,
      },
    }));
  }, []);

  const clearErrors = useCallback(() => {
    setState(prev => ({
      ...prev,
      errors: {},
    }));
  }, []);

  const resetForm = useCallback(() => {
    setState({
      data: initialDataRef.current,
      errors: {},
      isSubmitting: false,
      isDirty: false,
      isValid: true,
    });
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const errors = validateForm(state.data);
    
    if (Object.keys(errors).length > 0) {
      setState(prev => ({
        ...prev,
        errors,
        isValid: false,
      }));
      return;
    }

    setState(prev => ({
      ...prev,
      isSubmitting: true,
      isValid: true,
    }));

    try {
      await onSubmit(state.data);
      onSuccess?.();
    } catch (error) {
      onError?.(error);
    } finally {
      setState(prev => ({
        ...prev,
        isSubmitting: false,
      }));
    }
  }, [state.data, validateForm, onSubmit, onSuccess, onError]);

  return [state, { handleChange, handleSubmit, setFieldValue, setFieldError, clearErrors, resetForm }];
}

/**
 * Debounce utility for form inputs
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Form validation helper with async support
 */
export async function validateFormAsync<T>(
  data: T,
  validators: Record<string, (value: any, data: T) => Promise<string | null>>
): Promise<Record<string, string>> {
  const errors: Record<string, string> = {};
  
  const validationPromises = Object.entries(validators).map(async ([field, validator]) => {
    const error = await validator((data as any)[field], data);
    if (error) {
      errors[field] = error;
    }
  });

  await Promise.all(validationPromises);
  return errors;
}

/**
 * Form field focus management
 */
export function useFormFocus() {
  const focusRef = useRef<HTMLInputElement>(null);

  const focusFirstError = useCallback((errors: Record<string, string>) => {
    if (Object.keys(errors).length > 0) {
      const firstErrorField = Object.keys(errors)[0];
      const element = document.querySelector(`[name="${firstErrorField}"]`) as HTMLInputElement;
      if (element) {
        element.focus();
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, []);

  return { focusRef, focusFirstError };
}

/**
 * Form persistence utilities
 */
export function useFormPersistence<T>(key: string, initialData: T) {
  const [data, setData] = useState<T>(() => {
    const saved = localStorage.getItem(key);
    return saved ? { ...initialData, ...JSON.parse(saved) } : initialData;
  });

  const saveFormData = useCallback((formData: T) => {
    localStorage.setItem(key, JSON.stringify(formData));
  }, [key]);

  const clearFormData = useCallback(() => {
    localStorage.removeItem(key);
  }, [key]);

  return { data, setData, saveFormData, clearFormData };
}

/**
 * Form submission with retry logic
 */
export async function submitWithRetry<T>(
  submitFn: (data: T) => Promise<void>,
  data: T,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<void> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await submitFn(data);
      return;
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) {
        throw lastError;
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }

  throw lastError!;
} 