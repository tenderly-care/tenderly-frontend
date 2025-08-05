import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { EyeIcon, EyeSlashIcon, AcademicCapIcon, ShieldCheckIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

export const DoctorLoginPage: React.FC = () => {
  const { login, loginWithMFA, error, clearError, requiresMFA } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState(location.state?.email || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mfaCode, setMfaCode] = useState('');
  const [loginStep, setLoginStep] = useState<'credentials' | 'mfa'>('credentials');

  const from = location.state?.from?.pathname || '/doctor/dashboard';
  const registrationMessage = location.state?.message;

  // Monitor requiresMFA state changes
  useEffect(() => {
    if (requiresMFA) {
      setLoginStep('mfa');
    }
  }, [requiresMFA]);

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    clearError();

    try {
      // Use the login function from AuthContext which handles MFA for healthcare providers
      await login(email, password);
      
      // Check if MFA is required after login attempt
      // The AuthContext will set requiresMFA to true for doctor logins
      if (requiresMFA) {
        setLoginStep('mfa');
      }
      // If not requiring MFA, the AuthContext will handle navigation
    } catch (error: any) {
      // Error is handled by the auth context
    } finally {
      setIsLoading(false);
    }
  };

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Use the loginWithMFA function from AuthContext
      await loginWithMFA(email, password, mfaCode);
      // Navigation is handled by the AuthContext
    } catch (error) {
      // Error is handled by the auth context
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToCredentials = () => {
    setLoginStep('credentials');
    setMfaCode('');
    clearError();
  };

  // If MFA is required, show MFA step
  if (requiresMFA || loginStep === 'mfa') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-blue-100">
              <ShieldCheckIcon className="h-8 w-8 text-blue-600" />
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Two-Factor Authentication Required
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              As a healthcare provider, MFA is required for security. Enter the 6-digit code from your authenticator app.
            </p>
          </div>
          
          <form className="mt-8 space-y-6" onSubmit={handleMfaSubmit}>
            <div className="text-center">
              <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100 mb-4">
                <ShieldCheckIcon className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Two-Factor Authentication Required
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                As a healthcare provider, MFA is required for security. Enter the 6-digit code from your authenticator app.
              </p>
            </div>

            <div>
              <label htmlFor="mfa-code" className="sr-only">
                MFA Code
              </label>
              <input
                id="mfa-code"
                name="mfa-code"
                type="text"
                maxLength={6}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-lg font-mono tracking-widest"
                placeholder="000000"
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                autoFocus
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                {error}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading || mfaCode.length !== 6}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <LoadingSpinner size="sm" color="white" />
                ) : (
                  'Verify Code'
                )}
              </button>
            </div>

            <div className="text-center space-y-3">
              <button
                type="button"
                onClick={handleBackToCredentials}
                className="text-sm text-blue-600 hover:text-blue-500 flex items-center justify-center mx-auto"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-1" />
                Back to login
              </button>
              
              <div className="text-xs text-gray-500">
                <p>Don't have access to your authenticator?</p>
                <Link
                  to="/doctor/mfa-setup"
                  className="text-blue-600 hover:text-blue-500"
                >
                  Set up MFA
                </Link>
              </div>
            </div>
          </form>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Are you a patient?{' '}
              <Link
                to="/login"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Sign in as a patient
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-blue-100">
            <AcademicCapIcon className="h-8 w-8 text-blue-600" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your practice
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Access your patient consultations and manage your healthcare practice
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleCredentialsSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="input-field rounded-t-lg"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="relative">
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                className="input-field rounded-b-lg pr-10"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
          </div>

          {registrationMessage && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
              {registrationMessage}
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <Link
                to="/doctor/forgot-password"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Forgot your password?
              </Link>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <LoadingSpinner size="sm" color="white" />
              ) : (
                'Sign in to practice'
              )}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link
                to="/doctor/register"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Register as healthcare provider
              </Link>
            </p>
          </div>
        </form>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Are you a patient?{' '}
            <Link
              to="/login"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Sign in as a patient
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}; 