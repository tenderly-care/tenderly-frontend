import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { authApi } from '../../services/api/authApi';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export const EmailVerificationBanner: React.FC = () => {
  const { user, clearError } = useAuth();
  const [isResending, setIsResending] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Don't show banner if user is verified or not logged in
  if (!user || user.isEmailVerified || isDismissed) {
    return null;
  }

  const handleResendVerification = async () => {
    try {
      setIsResending(true);
      clearError();
      
      const response = await authApi.resendVerificationEmail(user.email);
      
      if (response.success) {
        toast.success('Verification email sent successfully!');
      } else {
        toast.error(response.message || 'Failed to send verification email.');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to send verification email.';
      toast.error(errorMessage);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
      <div className="flex">
        <div className="flex-shrink-0">
          <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
        </div>
        <div className="ml-3 flex-1">
          <p className="text-sm text-yellow-700">
            <strong>Email Verification Required:</strong> Please verify your email address to access all features.
          </p>
          <div className="mt-2 flex space-x-3">
            <button
              onClick={handleResendVerification}
              disabled={isResending}
              className="text-sm font-medium text-yellow-800 hover:text-yellow-900 underline"
            >
              {isResending ? (
                <span className="flex items-center">
                  <LoadingSpinner size="sm" color="primary" />
                  <span className="ml-1">Sending...</span>
                </span>
              ) : (
                'Resend verification email'
              )}
            </button>
            <button
              onClick={() => setIsDismissed(true)}
              className="text-sm font-medium text-yellow-800 hover:text-yellow-900"
            >
              Dismiss
            </button>
          </div>
        </div>
        <div className="ml-auto pl-3">
          <button
            onClick={() => setIsDismissed(true)}
            className="inline-flex text-yellow-400 hover:text-yellow-500"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}; 