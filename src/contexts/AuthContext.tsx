import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authApi } from '../services/api/authApi';

// Types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  isEmailVerified: boolean;
  requiresMFA: boolean;
  isMFAEnabled: boolean;
  accountStatus: string;
  professionalInfo?: {
    medicalLicenseNumber?: string;
    specialization?: string[];
    experience?: number;
    workLocation?: string;
    department?: string;
    designation?: string;
    consultationFee?: number;
    biography?: string;
    languagesSpoken?: string[];
  };
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  requiresMFA: boolean;
  tempAuthData: any | null;
  pendingMFASetup: boolean;
}

export interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  loginWithMFA: (email: string, password: string, mfaCode: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  clearError: () => void;
  isDoctor: () => boolean;
  isPatient: () => boolean;
  setRequiresMFA: (requires: boolean, tempData?: any) => void;
  setPendingMFASetup: (pending: boolean, userData?: any) => void;
  getTempCredentials: () => { email?: string; password?: string } | null;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  role?: string;
  professionalInfo?: {
    medicalLicenseNumber?: string;
    specialization?: string[];
    experience?: number;
    workLocation?: string;
    department?: string;
    designation?: string;
    consultationFee?: number;
    biography?: string;
    languagesSpoken?: string[];
  };
}

// Action Types
type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'AUTH_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_REQUIRES_MFA'; payload: { requires: boolean; tempData?: any } }
  | { type: 'SET_PENDING_MFA_SETUP'; payload: { pending: boolean; userData?: any } };

// Initial State
const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  isLoading: false,
  error: null,
  requiresMFA: false,
  tempAuthData: null,
  pendingMFASetup: false,
};

// Reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        requiresMFA: false,
        tempAuthData: null,
        pendingMFASetup: false,
      };
    case 'AUTH_FAILURE':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
        requiresMFA: false,
        tempAuthData: null,
        pendingMFASetup: false,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        requiresMFA: false,
        tempAuthData: null,
        pendingMFASetup: false,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    case 'SET_REQUIRES_MFA':
      return {
        ...state,
        requiresMFA: action.payload.requires,
        tempAuthData: action.payload.tempData || null,
      };
    case 'SET_PENDING_MFA_SETUP':
      return {
        ...state,
        pendingMFASetup: action.payload.pending,
        user: action.payload.userData || null,
        token: action.payload.userData ? 'temp_mfa_setup' : null,
        isAuthenticated: action.payload.pending,
        tempAuthData: action.payload.tempCredentials ? { tempCredentials: action.payload.tempCredentials } : null,
      };
    default:
      return state;
  }
};

// Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider Component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const navigate = useNavigate();

  // Check token validity on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      
      // Only check auth for real tokens, not temporary ones
      if (token && !token.includes('temp') && token.length > 50) {
        try {
          console.log('🔄 Checking existing token validity on mount...');
          dispatch({ type: 'AUTH_START' });
          const response = await authApi.getProfile();
          console.log('✅ Existing token is valid, user authenticated');
          dispatch({
            type: 'AUTH_SUCCESS',
            payload: { user: response, token },
          });
        } catch (error) {
          console.log('❌ Existing token is invalid, clearing...');
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          dispatch({ type: 'AUTH_FAILURE', payload: 'Token expired' });
        }
      } else if (token) {
        console.log('⚠️ Found token on mount but not checking (temporary or invalid):', token.substring(0, 20) + '...');
      } else {
        console.log('ℹ️ No token found on mount');
      }
    };

    checkAuth();
  }, []);

  // Update localStorage when token changes
  useEffect(() => {
    if (state.token && state.token !== 'temp_mfa_setup') {
      console.log('💾 Storing token in localStorage:', state.token.substring(0, 20) + '...');
      localStorage.setItem('token', state.token);
    } else if (state.token === null) {
      console.log('🗑️ Removing token from localStorage (token is null)');
      localStorage.removeItem('token');
    } else {
      console.log('⚠️ Not storing temp_mfa_setup token in localStorage');
    }
  }, [state.token]);

  const login = async (email: string, password: string) => {
    try {
      console.log('🔐 Starting login process for:', email);
      
      // Clear any existing auth state to prevent conflicts
      console.log('🧹 Clearing previous auth state...');
      dispatch({ type: 'AUTH_FAILURE', payload: '' });
      
      // Start loading
      dispatch({ type: 'AUTH_START' });
      
      // Call the real backend API
      console.log('📞 Calling backend login API...');
      const response = await authApi.login({ email, password });
      console.log('📨 Backend response received');
      
      
      console.log('Login response received:', response);
      
      // Check if MFA setup is required (new backend format)
      if (response.requiresMFASetup) {
        console.log('MFA setup required from response');
        
        // Store temporary token if provided
        if (response.temporaryToken) {
          console.log('Storing temporary token from backend');
          localStorage.setItem('token', response.temporaryToken);
        }
        
        dispatch({ 
          type: 'SET_PENDING_MFA_SETUP', 
          payload: { 
            pending: true, 
            userData: { email, roles: ['healthcare_provider'] },
            hasTemporaryToken: !!response.temporaryToken,
            tempCredentials: { email, password } // Store credentials for MFA setup
          } 
        });
        
        toast(response.message || 'Please complete MFA setup to continue.', {
          icon: 'ℹ️',
          duration: 4000,
        });
        navigate('/mfa/setup');
        return;
      }
      
      // Check if MFA verification is required (existing user with MFA enabled)
      if (response.requiresMFA) {
        console.log('MFA verification required from response');
        dispatch({ 
          type: 'SET_REQUIRES_MFA', 
          payload: { requires: true, tempData: response } 
        });
        return; // Don't navigate yet, wait for MFA
      }
      
      // Login successful, store tokens and user data
      if (response.accessToken && response.refreshToken) {
        localStorage.setItem('token', response.accessToken);
        localStorage.setItem('refreshToken', response.refreshToken);
        
        console.log('Login successful!');
        console.log('Access Token:', response.accessToken);
        console.log('Refresh Token:', response.refreshToken);
        console.log('User data:', response.user);
        console.log('Full login response:', response);
        
        dispatch({
          type: 'AUTH_SUCCESS',
          payload: { 
            user: response.user, 
            token: response.accessToken 
          },
        });
        
        toast.success('Login successful!');
        
        // Route based on user role
        if (response.user.roles.includes('healthcare_provider')) {
          navigate('/doctor/dashboard');
        } else {
          navigate('/dashboard');
        }
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error: any) {
      // Log the actual error for debugging
      console.log('=== LOGIN ERROR DEBUG ===');
      console.log('Error message:', error.message);
      console.log('Error response data:', error.response?.data);
      console.log('Error response status:', error.response?.status);
      console.log('Error response headers:', error.response?.headers);
      console.log('Full error object:', error);
      console.log('Full error response object:', error.response);
      console.log('=== END LOGIN ERROR DEBUG ===');
      
      // CRITICAL: We need to analyze the ACTUAL backend response structure
      // The backend might be sending a different status code or message structure
      
      const errorStatus = error.response?.status;
      const errorMessage = error.message;
      const backendMessage = error.response?.data?.message;
      const backendError = error.response?.data?.error;
      
      console.log('=== ERROR ANALYSIS ===');
      console.log('- HTTP Status:', errorStatus);
      console.log('- Error message (thrown):', errorMessage);
      console.log('- Backend message:', backendMessage);
      console.log('- Backend error:', backendError);
      console.log('- Email being used:', email);
      
      // Check if this is specifically an MFA setup requirement
      // Look for multiple indicators to be more precise
      const mfaSetupKeywords = ['MFA setup', 'complete MFA setup', 'set up MFA', 'setup MFA'];
      const containsMFASetup = mfaSetupKeywords.some(keyword => 
        (errorMessage && errorMessage.includes(keyword)) ||
        (backendMessage && backendMessage.includes(keyword))
      );
      
      const isInvalidCredentials = errorStatus === 401 || 
                                   (errorMessage && errorMessage.toLowerCase().includes('invalid')) ||
                                   (errorMessage && errorMessage.toLowerCase().includes('credential')) ||
                                   (backendMessage && backendMessage.toLowerCase().includes('invalid')) ||
                                   (backendMessage && backendMessage.toLowerCase().includes('credential'));
      
      console.log('- Contains MFA Setup keywords:', containsMFASetup);
      console.log('- Is Invalid Credentials:', isInvalidCredentials);
      console.log('=== END ERROR ANALYSIS ===');
      
      // Now that backend is fixed, handle status codes correctly:
      // 401 = Invalid credentials (wrong email/password)
      // 403 = Valid credentials but MFA setup required
      // 200 = Success (either complete login or requiresMFA for MFA verification)
      
      if (errorStatus === 403 && containsMFASetup) {
        // Valid credentials but MFA setup is required (403 status)
        console.log('✅ REDIRECTING TO MFA SETUP');
        console.log('✅ Reason: Valid credentials, MFA setup required (403)');
        console.log('✅ Backend message:', backendMessage);
        console.log('✅ Full error response:', error.response?.data);
        
        // Check if the backend provided a temporary token for MFA setup
        const tempToken = error.response?.data?.tempToken || 
                         error.response?.data?.mfaSetupToken ||
                         error.response?.data?.setupToken;
        
        if (tempToken) {
          console.log('✅ Backend provided temporary MFA setup token');
          // Store the temporary token
          localStorage.setItem('token', tempToken);
          
          dispatch({ 
            type: 'SET_PENDING_MFA_SETUP', 
            payload: { 
              pending: true, 
              userData: { email, roles: ['healthcare_provider'] },
              hasTempToken: true
            } 
          });
        } else {
          console.log('❌ No temporary token from backend. Backend needs to be updated.');
          console.log('❌ Expected: 403 response should include tempToken/mfaSetupToken');
          
          // Store credentials as fallback (but this won\'t work with current backend)
          dispatch({ 
            type: 'SET_PENDING_MFA_SETUP', 
            payload: { 
              pending: true, 
              userData: { email, roles: ['healthcare_provider'] },
              tempCredentials: { email, password },
              needsBackendFix: true
            } 
          });
          
          // Show error message explaining the issue
          toast.error('Backend needs to provide temporary token for MFA setup. Please contact support.');
        }
        
        // Redirect to MFA setup page
        navigate('/mfa/setup');
        return;
      } else if (errorStatus === 401) {
        // Invalid credentials (401 status)
        console.log('❌ Invalid credentials - showing error message');
        const displayMessage = backendMessage || 'Invalid email or password. Please try again.';
        
        dispatch({ type: 'AUTH_FAILURE', payload: displayMessage });
        toast.error(displayMessage);
      } else {
        // Other errors
        console.log('❌ Other error:', { status: errorStatus, message: errorMessage });
        const displayMessage = backendMessage || errorMessage || 'Login failed';
        
        dispatch({ type: 'AUTH_FAILURE', payload: displayMessage });
        toast.error(displayMessage);
      }
    }
  };

  const loginWithMFA = async (email: string, password: string, mfaCode: string) => {
    try {
      dispatch({ type: 'AUTH_START' });
      
      // Call the backend API with MFA code
      const response = await authApi.login({ 
        email, 
        password, 
        mfaCode,
        rememberDevice: true 
      });
      
      // MFA verification successful
      if (response.accessToken && response.refreshToken) {
        localStorage.setItem('token', response.accessToken);
        localStorage.setItem('refreshToken', response.refreshToken);
        
        console.log('MFA login successful!');
        console.log('Access Token:', response.accessToken);
        console.log('Refresh Token:', response.refreshToken);
        console.log('User data:', response.user);
        console.log('Full MFA login response:', response);
        
        dispatch({
          type: 'AUTH_SUCCESS',
          payload: { 
            user: response.user, 
            token: response.accessToken 
          },
        });
        
        toast.success('Login successful!');
        
        // Always navigate to doctor dashboard for MFA logins (healthcare providers)
        navigate('/doctor/dashboard');
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error: any) {
      const errorMessage = error.message || 'MFA verification failed';
      dispatch({ type: 'AUTH_FAILURE', payload: errorMessage });
      toast.error(errorMessage);
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      dispatch({ type: 'AUTH_START' });
      
      // Prepare registration data for backend
      const registerData = {
        email: userData.email,
        password: userData.password,
        firstName: userData.firstName,
        lastName: userData.lastName,
        phone: userData.phone,
        role: userData.role || 'patient',
        ...(userData.professionalInfo && {
          medicalLicenseNumber: userData.professionalInfo.medicalLicenseNumber,
          specializations: userData.professionalInfo.specialization,
        }),
      };
      
      const response = await authApi.register(registerData);
      
      console.log('Registration response:', response);
      console.log('Access Token:', response.accessToken);
      console.log('Refresh Token:', response.refreshToken);
      console.log('User data:', response.user);
      console.log('Full registration response:', response);
      
      // Don't automatically log in the user after registration
      // Instead, redirect to login page with success message
      dispatch({ type: 'AUTH_FAILURE', payload: '' }); // Clear any existing errors
      
      const message = 'Registration successful! Please log in to continue.';
      toast.success(message);
      
      // Route based on user role
      if (userData.role === 'healthcare_provider') {
        navigate('/doctor/login', { 
          state: { 
            message,
            email: userData.email 
          } 
        });
      } else {
        navigate('/login', { 
          state: { 
            message,
            email: userData.email 
          } 
        });
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      const errorMessage = error.message || 'Registration failed';
      dispatch({ type: 'AUTH_FAILURE', payload: errorMessage });
      toast.error(errorMessage);
    }
  };

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        await authApi.logout(refreshToken);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      dispatch({ type: 'LOGOUT' });
      toast.success('Logged out successfully');
      navigate('/');
    }
  };

  const refreshToken = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }
      
      const response = await authApi.refreshToken({ refreshToken });
      
      if (response.accessToken && response.refreshToken) {
        localStorage.setItem('token', response.accessToken);
        localStorage.setItem('refreshToken', response.refreshToken);
        
        dispatch({
          type: 'AUTH_SUCCESS',
          payload: { user: response.user, token: response.accessToken },
        });
      } else {
        throw new Error('Invalid refresh response');
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      dispatch({ type: 'LOGOUT' });
      navigate('/login');
    }
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const isDoctor = () => {
    return state.user?.roles.includes('healthcare_provider') || false;
  };

  const isPatient = () => {
    return state.user?.roles.includes('patient') || false;
  };

  const setRequiresMFA = (requires: boolean, tempData?: any) => {
    dispatch({ 
      type: 'SET_REQUIRES_MFA', 
      payload: { requires, tempData } 
    });
  };

  const setPendingMFASetup = (pending: boolean, userData?: any) => {
    dispatch({ 
      type: 'SET_PENDING_MFA_SETUP', 
      payload: { pending, userData } 
    });
  };

  const getTempCredentials = () => {
    // Return credentials stored in tempAuthData during pendingMFASetup
    return state.tempAuthData?.tempCredentials || null;
  };

  const value: AuthContextType = {
    ...state,
    login,
    loginWithMFA,
    register,
    logout,
    refreshToken,
    clearError,
    isDoctor,
    isPatient,
    setRequiresMFA,
    setPendingMFASetup,
    getTempCredentials,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 