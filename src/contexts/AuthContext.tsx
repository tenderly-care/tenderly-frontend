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
  | { type: 'SET_REQUIRES_MFA'; payload: { requires: boolean; tempData?: any } };

// Initial State
const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  isLoading: false,
  error: null,
  requiresMFA: false,
  tempAuthData: null,
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
      if (token) {
        try {
          dispatch({ type: 'AUTH_START' });
          const response = await authApi.getProfile();
          dispatch({
            type: 'AUTH_SUCCESS',
            payload: { user: response, token },
          });
        } catch (error) {
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          dispatch({ type: 'AUTH_FAILURE', payload: 'Token expired' });
        }
      }
    };

    checkAuth();
  }, []);

  // Update localStorage when token changes
  useEffect(() => {
    if (state.token) {
      localStorage.setItem('token', state.token);
    } else {
      localStorage.removeItem('token');
    }
  }, [state.token]);

  const login = async (email: string, password: string) => {
    try {
      dispatch({ type: 'AUTH_START' });
      
      // Call the real backend API
      const response = await authApi.login({ email, password });
      
      // Check if MFA is required
      if (response.requiresMFA) {
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
      const errorMessage = error.message || 'Login failed';
      dispatch({ type: 'AUTH_FAILURE', payload: errorMessage });
      toast.error(errorMessage);
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