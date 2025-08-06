import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { 
  ShieldCheckIcon, 
  QrCodeIcon,
  DocumentDuplicateIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import { authApi } from '../../services/api/authApi';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

interface MFASetupData {
  qrCode?: string;
  secret?: string;
  backupCodes?: string[];
  instructions: string;
}

export const MFASetupPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { 
    user, 
    pendingMFASetup, 
    getTempCredentials, 
    setPendingMFASetup,
    login 
  } = useAuth();
  
  const [currentStep, setCurrentStep] = useState<'setup' | 'verify' | 'backup' | 'complete'>('setup');
  const [isLoading, setIsLoading] = useState(false);
  const [mfaSetupData, setMfaSetupData] = useState<MFASetupData | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [backupCodesCopied, setBackupCodesCopied] = useState(false);

  // Get email from URL params (for users who need to set up MFA after registration)
  const emailFromParams = searchParams.get('email');

  // Initialize MFA setup on component mount
  useEffect(() => {
    // Check if user needs MFA setup
    const needsMFASetup = user?.requiresMFA && !user?.isMFAEnabled;
    const hasEmailParam = emailFromParams;
    const isPendingMFASetup = pendingMFASetup;
    
    if (needsMFASetup || hasEmailParam || isPendingMFASetup) {
      initializeMFASetup();
    } else {
      // If MFA is not required or already enabled, redirect to dashboard
      navigate('/doctor/dashboard');
    }
  }, [user, emailFromParams, pendingMFASetup]);

  const initializeMFASetup = async () => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('Initializing MFA setup...');
      console.log('- Pending MFA Setup:', pendingMFASetup);
      console.log('- User:', user);
      console.log('- Email from params:', emailFromParams);
      
      const tempCredentials = getTempCredentials();
      console.log('- Temp Credentials Available:', !!tempCredentials);
      
      const currentToken = localStorage.getItem('token');
      console.log('- Current token:', currentToken);
      console.log('- Token type:', currentToken === 'temp_mfa_setup' ? 'temp_mfa_setup' : 'valid_token');
      
      let response;
      // Check if we have a valid authentication token (including temporary tokens from backend)
      if (currentToken && currentToken !== 'temp_mfa_setup') {
        // We have a valid token (regular token or temporary token from new backend)
        console.log('✅ Using token-based MFA setup (token available from backend)');
        console.log('- Token is valid for MFA setup requests');
        response = await authApi.setupMFA('authenticator');
      } else if (pendingMFASetup && tempCredentials) {
        // Fallback: credentials-based approach (legacy support)
        console.log('⚠️ Using credentials-based MFA setup (fallback - no temporary token)');
        console.log('⚠️ This may fail if backend requires temporary token authentication');
        response = await authApi.setupMFAWithCredentials(
          'authenticator',
          tempCredentials.email!,
          tempCredentials.password!
        );
      } else {
        console.error('❌ No authentication method available for MFA setup');
        console.error('- No valid token in localStorage');
        console.error('- No temporary credentials available');
        console.error('- Backend should provide temporaryToken in 403 response');
        throw new Error('No authentication method available for MFA setup. Please try logging in again.');
      }
      
      console.log('MFA Setup Response:', response);
      
      // Map the backend response to our expected format
      const mfaData: MFASetupData = {
        qrCode: response.qrCode || response.qrCodeUrl,
        secret: response.secret || response.manualEntryKey,
        backupCodes: response.backupCodes || response.recoveryCodes,
        instructions: response.instructions || 'Scan the QR code with your authenticator app (Google Authenticator, Authy, etc.)'
      };
      
      setMfaSetupData(mfaData);
      setCurrentStep('setup');
    } catch (error: any) {
      console.error('MFA Setup Error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to initialize MFA setup';
      setError(errorMessage);
      toast.error(errorMessage);
      
      // If there's an auth error, redirect back to login
      if (error.response?.status === 401) {
        toast.error('Session expired. Please log in again.');
        navigate('/doctor/login');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const verifyMFASetup = async () => {
    if (verificationCode.length !== 6) {
      setError('Please enter a 6-digit verification code');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('Verifying MFA setup with code:', verificationCode);
      console.log('- Pending MFA Setup:', pendingMFASetup);
      
      const tempCredentials = getTempCredentials();
      console.log('- Temp Credentials Available:', !!tempCredentials);
      
      const currentToken = localStorage.getItem('token');
      console.log('- Current token for verification:', currentToken);
      
      let response;
      // Check if we have a valid token (including temporary token from backend)
      if (currentToken && currentToken !== 'temp_mfa_setup') {
        // Use token-based MFA verification with temporary or regular token
        console.log('✅ Using token-based MFA verification (token available)');
        response = await authApi.verifyMFASetup('authenticator', verificationCode);
      } else if (pendingMFASetup && tempCredentials) {
        // Fallback: Use credentials-based MFA verification
        console.log('⚠️ Using credentials-based MFA verification (fallback)');
        response = await authApi.verifyMFASetupWithCredentials(
          'authenticator',
          verificationCode,
          tempCredentials.email!,
          tempCredentials.password!
        );
      } else {
        throw new Error('No authentication method available for MFA verification');
      }
      
      console.log('MFA Verification Response:', response);
      
      // After successful MFA setup, we need to get proper authentication tokens
      // The backend should return real tokens after MFA setup completion
      if (response.accessToken && response.refreshToken) {
        console.log('✅ Received real authentication tokens after MFA setup');
        // Store the real tokens
        localStorage.setItem('token', response.accessToken);
        localStorage.setItem('refreshToken', response.refreshToken);
        
        // Update the auth context with successful authentication
        // This is handled in completeSetup now
      }
      
      toast.success('MFA setup completed successfully!');
      
      // Check if we have backup codes to show
      if (mfaSetupData?.backupCodes && mfaSetupData.backupCodes.length > 0) {
        setCurrentStep('backup');
      } else {
        // Skip directly to complete and authenticate
        await completeAuthentication(response);
      }
    } catch (error: any) {
      console.error('MFA Verification Error:', error);
      const errorMessage = error.response?.data?.message || 'Invalid verification code';
      setError(errorMessage);
      toast.error(errorMessage);
      
      // If there's an auth error, redirect back to login
      if (error.response?.status === 401) {
        toast.error('Session expired. Please log in again.');
        navigate('/doctor/login');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard!');
    } catch (error) {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        toast.success('Copied to clipboard!');
      } catch (fallbackError) {
        toast.error('Failed to copy to clipboard');
      }
      document.body.removeChild(textArea);
    }
  };

  const copyBackupCodes = async () => {
    if (mfaSetupData?.backupCodes) {
      const backupText = 'Tenderly Care - MFA Backup Codes\n\n' + 
        mfaSetupData.backupCodes.join('\n') + 
        '\n\nKeep these codes safe! Each code can only be used once.';
      
      await copyToClipboard(backupText);
      setBackupCodesCopied(true);
    }
  };

  // Production-level authentication completion with proper state management
  const completeAuthentication = async (mfaResponse?: any) => {
    try {
      console.log('🔄 Completing authentication after MFA setup...');
      setIsLoading(true);
      
      const tempCredentials = getTempCredentials();
      if (!tempCredentials) {
        console.error('❌ No temporary credentials available');
        throw new Error('Authentication session expired');
      }
      
      // Step 1: Check if we received real tokens from MFA verification
      if (mfaResponse?.accessToken && mfaResponse?.refreshToken) {
        console.log('✅ Received real tokens from MFA verification response');
        
        // Store the real tokens
        localStorage.setItem('token', mfaResponse.accessToken);
        localStorage.setItem('refreshToken', mfaResponse.refreshToken);
        
        // Get the authenticated user profile
        const userProfile = await authApi.getProfile();
        console.log('✅ Retrieved user profile:', userProfile);
        
        // Clear pending MFA setup state and properly authenticate
        setPendingMFASetup(false, null);
        
        // Show success message
        toast.success('MFA setup completed! Welcome to your dashboard.');
        
        // Navigate to dashboard
        navigate('/doctor/dashboard');
        return;
      }
      
      // Step 2: If no tokens in response, perform a complete login to get proper authentication
      console.log('🔄 No tokens in MFA response - performing complete login for proper authentication');
      
      try {
        // Clear pending MFA setup state first
        setPendingMFASetup(false, null);
        
        // Perform a complete login which will handle authentication state properly
        await login(tempCredentials.email!, tempCredentials.password!);
        
        // If we reach here, login was successful
        console.log('✅ Complete login successful after MFA setup');
        toast.success('MFA setup completed! Welcome to your dashboard.');
        
      } catch (loginError: any) {
        console.log('Login after MFA setup details:', {
          error: loginError,
          email: tempCredentials.email,
          hasPassword: !!tempCredentials.password
        });
        
        // If login fails, it might be because MFA is now enabled
        // The user should be redirected to login page to enter MFA code
        console.log('ℹ️ Login failed after MFA setup - user may need to provide MFA code');
        toast.success('MFA setup completed! Please log in with your new MFA code.');
        navigate('/doctor/login', {
          state: {
            email: tempCredentials.email,
            message: 'MFA setup completed! Please enter your credentials and MFA code to continue.'
          }
        });
      }
      
    } catch (error: any) {
      console.error('❌ Error completing authentication:', error);
      
      // Clear any invalid states
      setPendingMFASetup(false, null);
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      
      // Show user-friendly error
      const errorMessage = error.message || 'Unable to complete authentication';
      toast.error(`${errorMessage}. Please log in again.`);
      
      // Redirect to login
      navigate('/doctor/login', {
        state: {
          message: 'MFA setup was completed, but please log in again to access your account.'
        }
      });
    } finally {
      setIsLoading(false);
    }
  };

  const completeSetup = async () => {
    console.log('Completing MFA setup...');
    await completeAuthentication();
  };

  const renderSetupStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-blue-100 mb-4">
          <QrCodeIcon className="h-8 w-8 text-blue-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Set Up Two-Factor Authentication
        </h3>
        <p className="text-gray-600 mb-6">
          Scan the QR code with your authenticator app to get started.
        </p>
      </div>

      {mfaSetupData && (
        <div className="space-y-6">
          {/* QR Code */}
          <div className="bg-white border-2 border-gray-200 rounded-lg p-6 text-center">
            {mfaSetupData.qrCode ? (
              <div className="space-y-4">
                <img 
                  src={mfaSetupData.qrCode} 
                  alt="MFA QR Code" 
                  className="mx-auto w-48 h-48 border border-gray-300 rounded-lg"
                />
                <p className="text-sm text-gray-600">
                  Scan this QR code with your authenticator app
                </p>
              </div>
            ) : (
              <div className="w-48 h-48 mx-auto bg-gray-100 rounded-lg flex items-center justify-center">
                <LoadingSpinner size="lg" />
              </div>
            )}
          </div>

          {/* Manual Entry Option */}
          {mfaSetupData.secret && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                Can't scan the QR code?
              </h4>
              <p className="text-sm text-gray-600 mb-3">
                Manually enter this secret key in your authenticator app:
              </p>
              <div className="flex items-center space-x-2">
                <code className="flex-1 bg-white border border-gray-300 rounded px-3 py-2 text-sm font-mono">
                  {mfaSetupData.secret}
                </code>
                <button
                  onClick={() => copyToClipboard(mfaSetupData.secret!)}
                  className="flex items-center px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <DocumentDuplicateIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Instructions:</h4>
            <div className="text-sm text-blue-800 space-y-1">
              <p>1. Download an authenticator app (Google Authenticator, Authy, etc.)</p>
              <p>2. Scan the QR code or manually enter the secret key</p>
              <p>3. Enter the 6-digit code from your app below to continue</p>
            </div>
          </div>

          {/* Verification Code Input */}
          <div>
            <label htmlFor="verification-code" className="block text-sm font-medium text-gray-700 mb-2">
              Enter the 6-digit code from your authenticator app
            </label>
            <div className="flex items-center space-x-4">
              <input
                type="text"
                id="verification-code"
                maxLength={6}
                value={verificationCode}
                onChange={(e) => {
                  setVerificationCode(e.target.value.replace(/\D/g, ''));
                  setError(null);
                }}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-lg font-mono tracking-widest"
                placeholder="000000"
                autoFocus
              />
              <button
                onClick={verifyMFASetup}
                disabled={isLoading || verificationCode.length !== 6}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? <LoadingSpinner size="sm" color="white" /> : 'Verify'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderBackupStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-amber-100 mb-4">
          <ExclamationCircleIcon className="h-8 w-8 text-amber-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Save Your Backup Codes
        </h3>
        <p className="text-gray-600">
          Keep these backup codes safe. You can use them to access your account if you lose your authenticator device.
        </p>
      </div>

      {mfaSetupData?.backupCodes && (
        <div className="space-y-4">
          <div className="bg-white border-2 border-amber-200 rounded-lg p-6">
            <div className="grid grid-cols-2 gap-3 mb-4">
              {mfaSetupData.backupCodes.map((code, index) => (
                <div
                  key={index}
                  className="bg-gray-50 border border-gray-200 rounded px-3 py-2 text-center font-mono text-sm"
                >
                  {code}
                </div>
              ))}
            </div>
            
            <button
              onClick={copyBackupCodes}
              className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <DocumentDuplicateIcon className="h-4 w-4 mr-2" />
              {backupCodesCopied ? 'Copied!' : 'Copy All Codes'}
            </button>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-red-900 mb-2">Important:</h4>
            <ul className="text-sm text-red-800 space-y-1">
              <li>• Each backup code can only be used once</li>
              <li>• Store these codes in a secure location</li>
              <li>• Don't share these codes with anyone</li>
              <li>• You'll need these if you lose access to your authenticator app</li>
            </ul>
          </div>

          <button
            onClick={() => setCurrentStep('complete')}
            disabled={!backupCodesCopied}
            className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            I've Saved My Backup Codes
          </button>
        </div>
      )}
    </div>
  );

  const renderCompleteStep = () => (
    <div className="space-y-6 text-center">
      <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-green-100 mb-4">
        <CheckCircleIcon className="h-8 w-8 text-green-600" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        MFA Setup Complete!
      </h3>
      <p className="text-gray-600 mb-6">
        Your account is now secured with two-factor authentication. You can now access your dashboard and start providing care to patients.
      </p>
      
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <h4 className="text-sm font-medium text-green-900 mb-2">What's Next:</h4>
        <ul className="text-sm text-green-800 space-y-1 text-left">
          <li>• Complete your professional profile</li>
          <li>• Set your consultation availability</li>
          <li>• Review platform features and tools</li>
          <li>• Start accepting patient consultations</li>
        </ul>
      </div>

      <button
        onClick={completeSetup}
        className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        Go to Dashboard
      </button>
    </div>
  );

  if (isLoading && !mfaSetupData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Setting up MFA...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-blue-100">
            <ShieldCheckIcon className="h-8 w-8 text-blue-600" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Secure Your Account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Two-factor authentication is required for healthcare providers
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        <div className="bg-white shadow-xl rounded-lg p-8">
          {currentStep === 'setup' && renderSetupStep()}
          {currentStep === 'backup' && renderBackupStep()}
          {currentStep === 'complete' && renderCompleteStep()}
        </div>

        <div className="text-center">
          <button
            onClick={() => navigate('/doctor/login')}
            className="text-sm text-blue-600 hover:text-blue-500 flex items-center justify-center mx-auto"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Back to login
          </button>
        </div>
      </div>
    </div>
  );
}; 