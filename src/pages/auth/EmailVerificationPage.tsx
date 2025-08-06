import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { authApi } from '../../services/api/authApi';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

type VerificationStatus = 'pending' | 'success' | 'error' | 'expired' | 'invalid';

interface VerificationState {
  status: VerificationStatus;
  message: string;
  isLoading: boolean;
  isResending: boolean;
}

export const EmailVerificationPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [state, setState] = useState<VerificationState>({
    status: 'pending',
    message: 'Verifying your email...',
    isLoading: true,
    isResending: false,
  });

  const token = searchParams.get('token');
  const email = searchParams.get('email');

  useEffect(() => {
    if (!token) {
      setState({
        status: 'invalid',
        message: 'Invalid verification link. Please check your email for the correct link.',
        isLoading: false,
        isResending: false,
      });
      return;
    }

    verifyEmail(token);
  }, [token]);

  const verifyEmail = async (verificationToken: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      const response = await authApi.verifyEmail(verificationToken);
      
      if (response.success) {
        setState({
          status: 'success',
          message: response.message || 'Email verified successfully! You can now log in to your account.',
          isLoading: false,
          isResending: false,
        });
        
        toast.success('Email verified successfully!');
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login', { 
            state: { 
              message: 'Email verified successfully! You can now log in to your account.',
              email: email || ''
            } 
          });
        }, 3000);
      } else {
        setState({
          status: 'error',
          message: response.message || 'Email verification failed. Please try again.',
          isLoading: false,
          isResending: false,
        });
      }
    } catch (error: any) {
      let status: VerificationStatus = 'error';
      let message = 'Email verification failed. Please try again.';

      if (error.response?.status === 400) {
        status = 'expired';
        message = 'Verification link has expired. Please request a new verification email.';
      } else if (error.response?.status === 404) {
        status = 'invalid';
        message = 'Invalid verification link. Please check your email for the correct link.';
      } else if (error.response?.data?.message) {
        message = error.response.data.message;
      }

      setState({
        status,
        message,
        isLoading: false,
        isResending: false,
      });
    }
  };

  const handleResendVerification = async () => {
    if (!email) {
      toast.error('Email address not found. Please try registering again.');
      return;
    }

    try {
      setState(prev => ({ ...prev, isResending: true }));
      
      // You'll need to add this endpoint to your authApi
      const response = await authApi.resendVerificationEmail(email);
      
      if (response.success) {
        toast.success('Verification email sent successfully!');
        setState(prev => ({ 
          ...prev, 
          message: 'A new verification email has been sent to your email address.',
          isResending: false 
        }));
      } else {
        toast.error(response.message || 'Failed to send verification email.');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to send verification email.';
      toast.error(errorMessage);
      setState(prev => ({ ...prev, isResending: false }));
    }
  };

  const getStatusIcon = () => {
    switch (state.status) {
      case 'success':
        return <CheckCircleIcon className="h-12 w-12 text-green-500" />;
      case 'error':
      case 'expired':
      case 'invalid':
        return <XCircleIcon className="h-12 w-12 text-red-500" />;
      default:
        return <ExclamationTriangleIcon className="h-12 w-12 text-yellow-500" />;
    }
  };

  const getStatusColor = () => {
    switch (state.status) {
      case 'success':
        return 'text-green-600';
      case 'error':
      case 'expired':
      case 'invalid':
        return 'text-red-600';
      default:
        return 'text-yellow-600';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100">
            <span className="text-2xl">📧</span>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Email Verification
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {state.status === 'pending' && 'Verifying your email address...'}
            {state.status === 'success' && 'Your email has been verified successfully!'}
            {state.status === 'error' && 'There was an issue verifying your email.'}
            {state.status === 'expired' && 'Your verification link has expired.'}
            {state.status === 'invalid' && 'Invalid verification link.'}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {state.isLoading ? (
            <div className="text-center">
              <LoadingSpinner size="lg" color="primary" />
              <p className="mt-4 text-gray-600">Verifying your email...</p>
            </div>
          ) : (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                {getStatusIcon()}
              </div>
              
              <div>
                <p className={`text-sm font-medium ${getStatusColor()}`}>
                  {state.message}
                </p>
              </div>

              {state.status === 'success' && (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    Redirecting you to login page...
                  </p>
                  <Link
                    to="/login"
                    className="btn-primary"
                  >
                    Go to Login
                  </Link>
                </div>
              )}

              {(state.status === 'error' || state.status === 'expired' || state.status === 'invalid') && (
                <div className="space-y-3">
                  {email && (
                    <button
                      onClick={handleResendVerification}
                      disabled={state.isResending}
                      className="btn-primary w-full"
                    >
                      {state.isResending ? (
                        <LoadingSpinner size="sm" color="white" />
                      ) : (
                        'Resend Verification Email'
                      )}
                    </button>
                  )}
                  
                  <Link
                    to="/login"
                    className="btn-secondary w-full block"
                  >
                    Go to Login
                  </Link>
                  
                  <Link
                    to="/register"
                    className="text-sm text-blue-600 hover:text-blue-500"
                  >
                    Register with different email
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Need help?{' '}
            <Link
              to="/contact"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Contact Support
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}; 