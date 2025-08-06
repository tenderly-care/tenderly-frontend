import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { 
  AcademicCapIcon, 
  DocumentTextIcon,
  CheckCircleIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  EyeIcon,
  EyeSlashIcon,
  ShieldCheckIcon,
  ExclamationCircleIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  IdentificationIcon,
  BriefcaseIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';
import { validateEmail, validatePassword, validatePhone, validateName, calculatePasswordStrength } from '../../utils/validation';
import { authApi } from '../../services/api/authApi';
import toast from 'react-hot-toast';

interface PersonalInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  medicalLicenseNumber: string;
  specializations: string[];
}

interface TermsAcceptance {
  acceptTerms: boolean;
  acceptPrivacy: boolean;
  acceptProfessionalTerms: boolean;
}

export const DoctorRegisterPage: React.FC = () => {
  const navigate = useNavigate();

  // Step management
  const [currentStep, setCurrentStep] = useState<'personal' | 'terms'>('personal');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Form data
  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    medicalLicenseNumber: '',
    specializations: [],
  });

  const [terms, setTerms] = useState<TermsAcceptance>({
    acceptTerms: false,
    acceptPrivacy: false,
    acceptProfessionalTerms: false,
  });

  // Validation states
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Medical specializations
  const SPECIALIZATIONS = [
    'Dermatology','Gynecology','Pediatrics','Obstetrics'
  ];

  // Password strength monitoring
  useEffect(() => {
    if (personalInfo.password) {
      const strength = calculatePasswordStrength(personalInfo.password);
      setPasswordStrength(strength);
    } else {
      setPasswordStrength(0);
    }
  }, [personalInfo.password]);

  // Clear error when user starts typing
  const clearError = () => {
    setError(null);
  };

  // Validation functions
  const validatePersonalInfo = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Basic validation
    if (!validateName(personalInfo.firstName)) {
      newErrors.firstName = 'First name is required and must be 2-50 characters';
    }
    if (!validateName(personalInfo.lastName)) {
      newErrors.lastName = 'Last name is required and must be 2-50 characters';
    }
    if (!validateEmail(personalInfo.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!validatePhone(personalInfo.phone)) {
      newErrors.phone = 'Please enter a valid phone number with country code (e.g., +919876543210)';
    }
    if (!validatePassword(personalInfo.password)) {
      newErrors.password = 'Password must be at least 8 characters with uppercase, lowercase, number, and special character';
    }
    if (passwordStrength < 3) {
      newErrors.password = 'Password is too weak. Please choose a stronger password.';
    }
    if (personalInfo.password !== personalInfo.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Healthcare provider specific validation
    if (!personalInfo.medicalLicenseNumber.trim()) {
      newErrors.medicalLicenseNumber = 'Medical license number is required';
    } else if (personalInfo.medicalLicenseNumber.length < 4) {
      newErrors.medicalLicenseNumber = 'Medical license number must be at least 4 characters';
    }

    if (personalInfo.specializations.length === 0) {
      newErrors.specializations = 'Please select at least one specialization';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateTerms = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!terms.acceptTerms) {
      newErrors.acceptTerms = 'You must accept the terms and conditions';
    }
    if (!terms.acceptPrivacy) {
      newErrors.acceptPrivacy = 'You must accept the privacy policy';
    }
    if (!terms.acceptProfessionalTerms) {
      newErrors.acceptProfessionalTerms = 'You must accept the professional terms';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Step navigation
  const nextStep = () => {
    if (currentStep === 'personal') {
      if (validatePersonalInfo()) {
        setCurrentStep('terms');
      }
    }
  };

  const prevStep = () => {
    if (currentStep === 'terms') {
      setCurrentStep('personal');
    }
  };

  // Handle registration
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateTerms()) {
      return;
    }

    setIsLoading(true);
    clearError();

    try {
      // Prepare registration data according to backend API requirements
      const registerData = {
        firstName: personalInfo.firstName.trim(),
        lastName: personalInfo.lastName.trim(),
        email: personalInfo.email.trim().toLowerCase(),
        phone: personalInfo.phone.trim(),
        password: personalInfo.password,
        role: 'healthcare_provider' as const,
        medicalLicenseNumber: personalInfo.medicalLicenseNumber.trim(),
        specializations: personalInfo.specializations,
        userAgent: navigator.userAgent,
        deviceFingerprint: generateDeviceFingerprint(),
      };

      console.log('Submitting registration data:', registerData);

      // Call backend registration API
      const response = await authApi.register(registerData);
      
      console.log('Registration successful! User ID:', response.user?.id);
      console.log('User data:', response.user);
      // console.log('Access Token:', response.accessToken);
      // console.log('Refresh Token:', response.refreshToken);
      console.log('Full registration response:', response);
      
      toast.success('Registration successful! Please check your email for verification.');
      
      // Registration successful - redirect to doctor login with success message
      navigate('/doctor/login', { 
        state: { 
          message: 'Registration successful! Please verify your email, then log in to complete MFA setup.',
          email: personalInfo.email.trim().toLowerCase(),
          registrationComplete: true
        } 
      });
    } catch (error: any) {
      console.error('Registration error:', error);
      
      let errorMessage = 'Registration failed';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }

      // Handle specific backend validation errors
      if (error.response?.data?.errors) {
        const backendErrors = error.response.data.errors;
        const fieldErrors: Record<string, string> = {};
        
        Object.keys(backendErrors).forEach(field => {
          if (backendErrors[field] && backendErrors[field].length > 0) {
            fieldErrors[field] = backendErrors[field][0];
          }
        });
        
        if (Object.keys(fieldErrors).length > 0) {
          setErrors(fieldErrors);
          return;
        }
      }

      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Generate device fingerprint for security
  const generateDeviceFingerprint = (): string => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('Device fingerprint', 2, 2);
    }
    
    return btoa([
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      canvas.toDataURL()
    ].join('|'));
  };

  // Get password strength color and text
  const getPasswordStrengthInfo = () => {
    if (passwordStrength === 0) return { color: 'bg-gray-200', text: 'No password', textColor: 'text-gray-500' };
    if (passwordStrength === 1) return { color: 'bg-red-500', text: 'Very weak', textColor: 'text-red-600' };
    if (passwordStrength === 2) return { color: 'bg-orange-500', text: 'Weak', textColor: 'text-orange-600' };
    if (passwordStrength === 3) return { color: 'bg-yellow-500', text: 'Fair', textColor: 'text-yellow-600' };
    if (passwordStrength === 4) return { color: 'bg-blue-500', text: 'Good', textColor: 'text-blue-600' };
    return { color: 'bg-green-500', text: 'Strong', textColor: 'text-green-600' };
  };

  // Render step content
  const renderPersonalInfo = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>
        <p className="text-sm text-gray-600 mb-6">Please provide your basic information and professional details.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Information */}
        <div className="md:col-span-2">
          <h4 className="text-md font-medium text-gray-700 mb-4 flex items-center">
            <UserIcon className="h-5 w-5 mr-2" />
            Basic Information
          </h4>
        </div>

        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
            First Name *
          </label>
          <input
            type="text"
            id="firstName"
            value={personalInfo.firstName}
            onChange={(e) => {
              setPersonalInfo({ ...personalInfo, firstName: e.target.value });
              clearError();
            }}
            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
              errors.firstName ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Enter your first name"
          />
          {errors.firstName && <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>}
        </div>

        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
            Last Name *
          </label>
          <input
            type="text"
            id="lastName"
            value={personalInfo.lastName}
            onChange={(e) => {
              setPersonalInfo({ ...personalInfo, lastName: e.target.value });
              clearError();
            }}
            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
              errors.lastName ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Enter your last name"
          />
          {errors.lastName && <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email Address *
          </label>
          <div className="relative">
            <input
              type="email"
              id="email"
              value={personalInfo.email}
              onChange={(e) => {
                setPersonalInfo({ ...personalInfo, email: e.target.value });
                clearError();
              }}
              className={`mt-1 block w-full px-3 py-2 pl-10 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                errors.email ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="john.doe@example.com"
            />
            <EnvelopeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          </div>
          {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
            Phone Number *
          </label>
          <div className="relative">
            <input
              type="tel"
              id="phone"
              value={personalInfo.phone}
              onChange={(e) => {
                setPersonalInfo({ ...personalInfo, phone: e.target.value });
                clearError();
              }}
              className={`mt-1 block w-full px-3 py-2 pl-10 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                errors.phone ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="+919876543210"
            />
            <PhoneIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          </div>
          {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
        </div>

        {/* Professional Information */}
        <div className="md:col-span-2">
          <h4 className="text-md font-medium text-gray-700 mb-4 flex items-center">
            <BriefcaseIcon className="h-5 w-5 mr-2" />
            Professional Information
          </h4>
        </div>

        <div>
          <label htmlFor="medicalLicense" className="block text-sm font-medium text-gray-700">
            Medical License Number *
          </label>
          <div className="relative">
            <input
              type="text"
              id="medicalLicense"
              value={personalInfo.medicalLicenseNumber}
              onChange={(e) => {
                setPersonalInfo({ ...personalInfo, medicalLicenseNumber: e.target.value });
                clearError();
              }}
              className={`mt-1 block w-full px-3 py-2 pl-10 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                errors.medicalLicenseNumber ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Enter your medical license number"
            />
            <IdentificationIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          </div>
          {errors.medicalLicenseNumber && <p className="mt-1 text-sm text-red-600">{errors.medicalLicenseNumber}</p>}
        </div>

        <div className="md:col-span-2">
          <label htmlFor="specializations" className="block text-sm font-medium text-gray-700">
            Medical Specializations *
          </label>
          <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-2 max-h-32 overflow-y-auto border border-gray-300 rounded-md p-2">
            {SPECIALIZATIONS.map((spec) => (
              <label key={spec} className="flex items-center text-sm">
                <input
                  type="checkbox"
                  value={spec}
                  checked={personalInfo.specializations.includes(spec)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setPersonalInfo({ 
                        ...personalInfo, 
                        specializations: [...personalInfo.specializations, spec] 
                      });
                    } else {
                      setPersonalInfo({ 
                        ...personalInfo, 
                        specializations: personalInfo.specializations.filter(s => s !== spec) 
                      });
                    }
                    clearError();
                  }}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-2"
                />
                <span className="text-gray-700">{spec}</span>
              </label>
            ))}
          </div>
          {errors.specializations && <p className="mt-1 text-sm text-red-600">{errors.specializations}</p>}
          <p className="mt-1 text-xs text-gray-500">Select your areas of medical expertise</p>
        </div>
      </div>

      {/* Password Section */}
      <div className="space-y-4">
        <h4 className="text-md font-medium text-gray-700 mb-4 flex items-center">
          <ShieldCheckIcon className="h-5 w-5 mr-2" />
          Security
        </h4>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Password *
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              value={personalInfo.password}
              onChange={(e) => {
                setPersonalInfo({ ...personalInfo, password: e.target.value });
                clearError();
              }}
              className={`mt-1 block w-full px-3 py-2 pr-10 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                errors.password ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Enter a strong password"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeSlashIcon className="h-5 w-5 text-gray-400" />
              ) : (
                <EyeIcon className="h-5 w-5 text-gray-400" />
              )}
            </button>
          </div>
          
          {/* Password Strength Indicator */}
          {personalInfo.password && (
            <div className="mt-2">
              <div className="flex items-center space-x-2">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrengthInfo().color}`}
                    style={{ width: `${(passwordStrength / 5) * 100}%` }}
                  />
                </div>
                <span className={`text-xs font-medium ${getPasswordStrengthInfo().textColor}`}>
                  {getPasswordStrengthInfo().text}
                </span>
              </div>
              <div className="mt-1 text-xs text-gray-600">
                <div className="grid grid-cols-2 gap-2">
                  <div className={personalInfo.password.length >= 8 ? 'text-green-600' : 'text-gray-400'}>
                    ✓ At least 8 characters
                  </div>
                  <div className={/[A-Z]/.test(personalInfo.password) ? 'text-green-600' : 'text-gray-400'}>
                    ✓ Uppercase letter
                  </div>
                  <div className={/[a-z]/.test(personalInfo.password) ? 'text-green-600' : 'text-gray-400'}>
                    ✓ Lowercase letter
                  </div>
                  <div className={/\d/.test(personalInfo.password) ? 'text-green-600' : 'text-gray-400'}>
                    ✓ Number
                  </div>
                  <div className={/[@$!%*?&]/.test(personalInfo.password) ? 'text-green-600' : 'text-gray-400'}>
                    ✓ Special character
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
            Confirm Password *
          </label>
          <div className="relative">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              id="confirmPassword"
              value={personalInfo.confirmPassword}
              onChange={(e) => {
                setPersonalInfo({ ...personalInfo, confirmPassword: e.target.value });
                clearError();
              }}
              className={`mt-1 block w-full px-3 py-2 pr-10 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Confirm your password"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? (
                <EyeSlashIcon className="h-5 w-5 text-gray-400" />
              ) : (
                <EyeIcon className="h-5 w-5 text-gray-400" />
              )}
            </button>
          </div>
          
          {/* Password Match Indicator */}
          {personalInfo.confirmPassword && (
            <div className="mt-1 text-xs">
              {personalInfo.password === personalInfo.confirmPassword ? (
                <span className="text-green-600">✓ Passwords match</span>
              ) : (
                <span className="text-red-600">✗ Passwords do not match</span>
              )}
            </div>
          )}
          
          {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
        </div>
      </div>
    </div>
  );

  const renderTerms = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Terms & Verification</h3>
        <p className="text-sm text-gray-600 mb-6">Please review and accept the terms to complete your registration.</p>
      </div>

      <div className="space-y-4">
        <div className="flex items-start">
          <input
            type="checkbox"
            id="acceptTerms"
            checked={terms.acceptTerms}
            onChange={(e) => setTerms({ ...terms, acceptTerms: e.target.checked })}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
          />
          <label htmlFor="acceptTerms" className="ml-3 text-sm text-gray-700">
            I accept the <Link to="/terms" className="text-blue-600 hover:text-blue-500">Terms and Conditions</Link> *
          </label>
        </div>
        {errors.acceptTerms && <p className="text-sm text-red-600">{errors.acceptTerms}</p>}

        <div className="flex items-start">
          <input
            type="checkbox"
            id="acceptPrivacy"
            checked={terms.acceptPrivacy}
            onChange={(e) => setTerms({ ...terms, acceptPrivacy: e.target.checked })}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
          />
          <label htmlFor="acceptPrivacy" className="ml-3 text-sm text-gray-700">
            I accept the <Link to="/privacy" className="text-blue-600 hover:text-blue-500">Privacy Policy</Link> *
          </label>
        </div>
        {errors.acceptPrivacy && <p className="text-sm text-red-600">{errors.acceptPrivacy}</p>}

        <div className="flex items-start">
          <input
            type="checkbox"
            id="acceptProfessionalTerms"
            checked={terms.acceptProfessionalTerms}
            onChange={(e) => setTerms({ ...terms, acceptProfessionalTerms: e.target.checked })}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
          />
          <label htmlFor="acceptProfessionalTerms" className="ml-3 text-sm text-gray-700">
            I accept the <Link to="/professional-terms" className="text-blue-600 hover:text-blue-500">Professional Terms</Link> for healthcare providers *
          </label>
        </div>
        {errors.acceptProfessionalTerms && <p className="text-sm text-red-600">{errors.acceptProfessionalTerms}</p>}
      </div>

      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex items-start">
            <ShieldCheckIcon className="h-5 w-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-blue-900 mb-2">Security Requirements for Healthcare Providers:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Two-Factor Authentication (MFA) is mandatory for all healthcare providers</li>
                <li>• Your account will be created with PENDING_VERIFICATION status</li>
                <li>• You'll receive an email verification link within a few minutes</li>
                <li>• After email verification, you must complete MFA setup during first login</li>
                <li>• Professional information can be updated in your dashboard</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
          <div className="flex items-start">
            <ExclamationCircleIcon className="h-5 w-5 text-amber-600 mt-0.5 mr-2 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-amber-900 mb-2">Professional Verification:</h4>
              <ul className="text-sm text-amber-800 space-y-1">
                <li>• Your medical license will be verified by our team</li>
                <li>• Account activation may take 24-48 hours for verification</li>
                <li>• Please ensure all professional information is accurate</li>
                <li>• You may be asked to provide additional documentation</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Step indicators
  const steps = [
    { id: 'personal', name: 'Personal Information', icon: AcademicCapIcon },
    { id: 'terms', name: 'Terms & Verification', icon: DocumentTextIcon },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8">
        <div>
          <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-blue-100">
            <AcademicCapIcon className="h-8 w-8 text-blue-600" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Healthcare Provider Registration
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Join our healthcare platform and start providing care to patients
          </p>
        </div>

        {/* Step Indicators */}
        <div className="flex items-center justify-center">
          <div className="flex items-center space-x-4">
            {steps.map((step, index) => {
              const isActive = currentStep === step.id;
              const isCompleted = steps.findIndex(s => s.id === currentStep) > index;
              
              return (
                <div key={step.id} className="flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    isActive 
                      ? 'border-blue-600 bg-blue-600 text-white' 
                      : isCompleted 
                        ? 'border-green-500 bg-green-500 text-white'
                        : 'border-gray-300 bg-white text-gray-400'
                  }`}>
                    {isCompleted ? (
                      <CheckCircleIcon className="h-6 w-6" />
                    ) : (
                      <step.icon className="h-5 w-5" />
                    )}
                  </div>
                  <div className="ml-3">
                    <p className={`text-sm font-medium ${
                      isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      {step.name}
                    </p>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-8 h-0.5 ml-4 ${
                      isCompleted ? 'bg-green-500' : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        {/* Step Content */}
        <div className="bg-white shadow-xl rounded-lg p-8">
          {currentStep === 'personal' && renderPersonalInfo()}
          {currentStep === 'terms' && renderTerms()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={prevStep}
            disabled={currentStep === 'personal'}
            className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
              currentStep === 'personal'
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-blue-600 hover:text-blue-500'
            }`}
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Previous
          </button>

          {currentStep === 'terms' ? (
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={isLoading}
              className="flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <LoadingSpinner size="sm" color="white" />
              ) : (
                <>
                  Complete Registration
                  <ArrowRightIcon className="h-4 w-4 ml-2" />
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={nextStep}
              className="flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Next
              <ArrowRightIcon className="h-4 w-4 ml-2" />
            </button>
          )}
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link
              to="/doctor/login"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Sign in as healthcare provider
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}; 