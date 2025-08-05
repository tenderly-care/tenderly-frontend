import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { 
  EyeIcon, 
  EyeSlashIcon, 
  CheckIcon, 
  XMarkIcon,
  AcademicCapIcon,
  BuildingOfficeIcon,
  ClockIcon,
  ShieldCheckIcon,
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  LockClosedIcon,
  DocumentTextIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';
import { 
  validateRegistrationForm, 
  validatePasswordStrength, 
  sanitizeInput,
  type FormValidationErrors
} from '../../utils/validation';

interface DoctorFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  medicalLicenseNumber: string;
  specialization: string[];
  experience: number;
  workLocation: string;
  department: string;
  designation: string;
  consultationFee: number;
  biography: string;
  languagesSpoken: string[];
  acceptTerms: boolean;
  acceptMarketing: boolean;
  acceptProfessionalTerms: boolean;
}

interface PasswordStrength {
  score: number;
  feedback: string[];
  strength: 'very-weak' | 'weak' | 'fair' | 'good' | 'strong';
}

const SPECIALIZATIONS = [
  'General Medicine', 'Cardiology', 'Dermatology', 'Endocrinology',
  'Gastroenterology', 'Neurology', 'Oncology', 'Orthopedics',
  'Pediatrics', 'Psychiatry', 'Radiology', 'Surgery'
];

const LANGUAGES = [
  'English', 'Hindi', 'Bengali', 'Telugu', 'Marathi', 'Tamil',
  'Gujarati', 'Kannada', 'Malayalam', 'Punjabi', 'Urdu'
];

export const DoctorRegisterPage: React.FC = () => {
  const [formData, setFormData] = useState<DoctorFormData>({
    firstName: '', lastName: '', email: '', phone: '',
    password: '', confirmPassword: '', medicalLicenseNumber: '',
    specialization: [], experience: 0, workLocation: '',
    department: '', designation: '', consultationFee: 0,
    biography: '', languagesSpoken: [], acceptTerms: false,
    acceptMarketing: false, acceptProfessionalTerms: false
  });

  const [errors, setErrors] = useState<FormValidationErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({
    score: 0, feedback: [], strength: 'very-weak'
  });

  const { register, error, clearError } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (formData.password) {
      setPasswordStrength(validatePasswordStrength(formData.password));
    } else {
      setPasswordStrength({ score: 0, feedback: [], strength: 'very-weak' });
    }
  }, [formData.password]);

  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      setErrors({});
      clearError();
    }
  }, [formData, clearError]);

  const validateStep = (step: number): boolean => {
    const newErrors: FormValidationErrors = {};

    if (step === 1) {
      if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
      if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
      if (!formData.email.trim()) newErrors.email = 'Email is required';
      if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
      if (!formData.password) newErrors.password = 'Password is required';
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    if (step === 2) {
      if (!formData.medicalLicenseNumber.trim()) {
        newErrors.medicalLicenseNumber = 'Medical license number is required';
      }
      if (formData.specialization.length === 0) {
        newErrors.specialization = 'Please select at least one specialization';
      }
      if (formData.experience < 1) {
        newErrors.experience = 'Experience must be at least 1 year';
      }
      if (!formData.workLocation.trim()) {
        newErrors.workLocation = 'Work location is required';
      }
    }

    if (step === 3) {
      if (!formData.acceptTerms) {
        newErrors.acceptTerms = 'You must accept the terms and conditions';
      }
      if (!formData.acceptProfessionalTerms) {
        newErrors.acceptProfessionalTerms = 'You must accept the professional terms';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: sanitizeInput(value) }));
    }
  };

  const handleSpecializationChange = (specialization: string) => {
    setFormData(prev => ({
      ...prev,
      specialization: prev.specialization.includes(specialization)
        ? prev.specialization.filter(s => s !== specialization)
        : [...prev.specialization, specialization]
    }));
  };

  const handleLanguageChange = (language: string) => {
    setFormData(prev => ({
      ...prev,
      languagesSpoken: prev.languagesSpoken.includes(language)
        ? prev.languagesSpoken.filter(l => l !== language)
        : [...prev.languagesSpoken, language]
    }));
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 3));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep(currentStep)) return;
    
    setIsLoading(true);
    
    try {
      await register({
        ...formData,
        role: 'healthcare_provider',
        professionalInfo: {
          medicalLicenseNumber: formData.medicalLicenseNumber,
          specialization: formData.specialization,
          experience: formData.experience,
          workLocation: formData.workLocation,
          department: formData.department,
          designation: formData.designation,
          consultationFee: formData.consultationFee,
          biography: formData.biography,
          languagesSpoken: formData.languagesSpoken,
        }
      });
      
      navigate('/doctor/login', { 
        state: { 
          message: 'Registration successful! Please verify your email and complete MFA setup to continue.',
          email: formData.email 
        } 
      });
    } catch (error) {
      // Error is handled by the auth context
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordStrengthColor = () => {
    switch (passwordStrength.strength) {
      case 'very-weak': return 'text-red-500';
      case 'weak': return 'text-orange-500';
      case 'fair': return 'text-yellow-500';
      case 'good': return 'text-blue-500';
      case 'strong': return 'text-green-500';
      default: return 'text-gray-500';
    }
  };

  const getPasswordStrengthText = () => {
    switch (passwordStrength.strength) {
      case 'very-weak': return 'Very Weak';
      case 'weak': return 'Weak';
      case 'fair': return 'Fair';
      case 'good': return 'Good';
      case 'strong': return 'Strong';
      default: return 'Very Weak';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-blue-100 mb-4">
            <AcademicCapIcon className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Join Tenderly as a Healthcare Provider
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Connect with patients, provide expert care, and grow your practice with our comprehensive telemedicine platform.
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className={`flex items-center ${currentStep >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                currentStep >= 1 ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300'
              }`}>
                1
              </div>
              <span className="ml-2 font-medium">Personal Information</span>
            </div>
            <div className={`flex items-center ${currentStep >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                currentStep >= 2 ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300'
              }`}>
                2
              </div>
              <span className="ml-2 font-medium">Professional Details</span>
            </div>
            <div className={`flex items-center ${currentStep >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                currentStep >= 3 ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300'
              }`}>
                3
              </div>
              <span className="ml-2 font-medium">Terms & Verification</span>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / 3) * 100}%` }}
            />
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1: Personal Information */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="border-b border-gray-200 pb-4">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">Personal Information</h2>
                  <p className="text-gray-600">Please provide your basic personal details</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                      First Name *
                    </label>
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors.firstName ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Enter your first name"
                      />
                    </div>
                    {errors.firstName && (
                      <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name *
                    </label>
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors.lastName ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Enter your last name"
                      />
                    </div>
                    {errors.lastName && (
                      <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <div className="relative">
                      <EnvelopeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors.email ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Enter your email address"
                      />
                    </div>
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number *
                    </label>
                    <div className="relative">
                      <PhoneIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors.phone ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Enter your phone number"
                      />
                    </div>
                    {errors.phone && (
                      <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                      Password *
                    </label>
                    <div className="relative">
                      <LockClosedIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors.password ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Create a strong password"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 transform -translate-y-1/2"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                        ) : (
                          <EyeIcon className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                    {formData.password && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className={`font-medium ${getPasswordStrengthColor()}`}>
                            Password Strength: {getPasswordStrengthText()}
                          </span>
                          <div className="flex space-x-1">
                            {[1, 2, 3, 4, 5].map((level) => (
                              <div
                                key={level}
                                className={`h-1 w-8 rounded-full ${
                                  passwordStrength.score >= level
                                    ? getPasswordStrengthColor().replace('text-', 'bg-')
                                    : 'bg-gray-200'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                    {errors.password && (
                      <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm Password *
                    </label>
                    <div className="relative">
                      <LockClosedIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        id="confirmPassword"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Confirm your password"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 transform -translate-y-1/2"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                        ) : (
                          <EyeIcon className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Professional Information */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="border-b border-gray-200 pb-4">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">Professional Information</h2>
                  <p className="text-gray-600">Tell us about your medical practice and expertise</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="medicalLicenseNumber" className="block text-sm font-medium text-gray-700 mb-2">
                      Medical License Number *
                    </label>
                    <div className="relative">
                      <DocumentTextIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        id="medicalLicenseNumber"
                        name="medicalLicenseNumber"
                        value={formData.medicalLicenseNumber}
                        onChange={handleInputChange}
                        className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors.medicalLicenseNumber ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Enter your medical license number"
                      />
                    </div>
                    {errors.medicalLicenseNumber && (
                      <p className="mt-1 text-sm text-red-600">{errors.medicalLicenseNumber}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="experience" className="block text-sm font-medium text-gray-700 mb-2">
                      Years of Experience *
                    </label>
                    <input
                      type="number"
                      id="experience"
                      name="experience"
                      min="1"
                      max="50"
                      value={formData.experience}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.experience ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Enter years of experience"
                    />
                    {errors.experience && (
                      <p className="mt-1 text-sm text-red-600">{errors.experience}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="workLocation" className="block text-sm font-medium text-gray-700 mb-2">
                      Work Location *
                    </label>
                    <div className="relative">
                      <MapPinIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        id="workLocation"
                        name="workLocation"
                        value={formData.workLocation}
                        onChange={handleInputChange}
                        className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors.workLocation ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="e.g., Apollo Hospital, Delhi"
                      />
                    </div>
                    {errors.workLocation && (
                      <p className="mt-1 text-sm text-red-600">{errors.workLocation}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-2">
                      Department *
                    </label>
                    <input
                      type="text"
                      id="department"
                      name="department"
                      value={formData.department}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.department ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="e.g., Cardiology Department"
                    />
                    {errors.department && (
                      <p className="mt-1 text-sm text-red-600">{errors.department}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="designation" className="block text-sm font-medium text-gray-700 mb-2">
                      Designation *
                    </label>
                    <input
                      type="text"
                      id="designation"
                      name="designation"
                      value={formData.designation}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.designation ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="e.g., Senior Consultant"
                    />
                    {errors.designation && (
                      <p className="mt-1 text-sm text-red-600">{errors.designation}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="consultationFee" className="block text-sm font-medium text-gray-700 mb-2">
                      Consultation Fee (₹) *
                    </label>
                    <input
                      type="number"
                      id="consultationFee"
                      name="consultationFee"
                      min="100"
                      step="50"
                      value={formData.consultationFee}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.consultationFee ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Enter consultation fee"
                    />
                    {errors.consultationFee && (
                      <p className="mt-1 text-sm text-red-600">{errors.consultationFee}</p>
                    )}
                  </div>
                </div>

                {/* Specializations */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Specializations *
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {SPECIALIZATIONS.map((spec) => (
                      <label key={spec} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.specialization.includes(spec)}
                          onChange={() => handleSpecializationChange(spec)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-700">{spec}</span>
                      </label>
                    ))}
                  </div>
                  {errors.specialization && (
                    <p className="mt-1 text-sm text-red-600">{errors.specialization}</p>
                  )}
                </div>

                {/* Languages */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Languages Spoken
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {LANGUAGES.map((language) => (
                      <label key={language} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.languagesSpoken.includes(language)}
                          onChange={() => handleLanguageChange(language)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-700">{language}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Biography */}
                <div>
                  <label htmlFor="biography" className="block text-sm font-medium text-gray-700 mb-2">
                    Professional Biography
                  </label>
                  <textarea
                    id="biography"
                    name="biography"
                    rows={4}
                    value={formData.biography}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Tell us about your expertise, experience, and approach to patient care..."
                  />
                </div>
              </div>
            )}

            {/* Step 3: Terms and Verification */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="border-b border-gray-200 pb-4">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">Terms & Verification</h2>
                  <p className="text-gray-600">Please review and accept our terms and conditions</p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      id="acceptTerms"
                      name="acceptTerms"
                      checked={formData.acceptTerms}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
                    />
                    <div>
                      <label htmlFor="acceptTerms" className="text-sm font-medium text-gray-700">
                        I accept the Terms and Conditions *
                      </label>
                      <p className="text-xs text-gray-500 mt-1">
                        By checking this box, you agree to our terms of service and privacy policy.
                      </p>
                    </div>
                  </div>
                  {errors.acceptTerms && (
                    <p className="text-sm text-red-600">{errors.acceptTerms}</p>
                  )}

                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      id="acceptProfessionalTerms"
                      name="acceptProfessionalTerms"
                      checked={formData.acceptProfessionalTerms}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
                    />
                    <div>
                      <label htmlFor="acceptProfessionalTerms" className="text-sm font-medium text-gray-700">
                        I accept the Professional Terms *
                      </label>
                      <p className="text-xs text-gray-500 mt-1">
                        I confirm that I am a licensed healthcare provider and will maintain professional standards.
                      </p>
                    </div>
                  </div>
                  {errors.acceptProfessionalTerms && (
                    <p className="text-sm text-red-600">{errors.acceptProfessionalTerms}</p>
                  )}

                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      id="acceptMarketing"
                      name="acceptMarketing"
                      checked={formData.acceptMarketing}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
                    />
                    <div>
                      <label htmlFor="acceptMarketing" className="text-sm font-medium text-gray-700">
                        I agree to receive marketing communications
                      </label>
                      <p className="text-xs text-gray-500 mt-1">
                        Receive updates about new features, opportunities, and platform improvements.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Security Notice */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <ShieldCheckIcon className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-medium text-blue-900">Security & Verification</h3>
                      <p className="text-sm text-blue-700 mt-1">
                        Your medical license will be verified by our team. You'll need to complete MFA setup after email verification to access the platform.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                {error}
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={prevStep}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Previous
                </button>
              )}
              
              <div className="flex space-x-3">
                {currentStep < 3 ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {isLoading ? (
                      <>
                        <LoadingSpinner size="sm" color="white" />
                        <span className="ml-2">Creating Account...</span>
                      </>
                    ) : (
                      'Create Account'
                    )}
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-gray-600">
            Already have an account?{' '}
            <Link
              to="/doctor/login"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Sign in as a healthcare provider
            </Link>
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Are you a patient?{' '}
            <Link
              to="/register"
              className="text-blue-600 hover:text-blue-500"
            >
              Register as a patient
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}; 