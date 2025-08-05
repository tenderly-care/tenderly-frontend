import axios from 'axios';
import { config } from '../../config/env';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: config.apiUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh and errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // If 401 and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await api.post('/auth/refresh', {
            refreshToken,
          });

          const { accessToken, refreshToken: newRefreshToken } = response.data;
          localStorage.setItem('token', accessToken);
          localStorage.setItem('refreshToken', newRefreshToken);

          // Retry the original request
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

// Types
export interface LoginRequest {
  email: string;
  password: string;
  mfaCode?: string;
  rememberDevice?: boolean;
  userAgent?: string;
  deviceFingerprint?: string;
  location?: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  role?: string;
  medicalLicenseNumber?: string;
  specializations?: string[];
  userAgent?: string;
  deviceFingerprint?: string;
}

export interface AuthResponse {
  accessToken: string | null;
  refreshToken: string | null;
  expiresIn: number;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    roles: string[];
    accountStatus: string;
    isEmailVerified: boolean;
    isMFAEnabled: boolean;
    requiresMFA: boolean;
  };
  requiresMFA?: boolean;
  mfaMethods?: string[];
}

export interface RefreshTokenRequest {
  refreshToken: string;
  deviceFingerprint?: string;
}

export interface VerifyEmailRequest {
  token: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// API functions
export const authApi = {
  /**
   * Login user
   */
  async login(loginData: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await api.post<AuthResponse>('/auth/login', {
        ...loginData,
        userAgent: navigator.userAgent,
        deviceFingerprint: this.generateDeviceFingerprint(),
        location: 'Unknown', // In production, get from IP geolocation
      });
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new Error(error.response.data?.message || 'Invalid credentials');
      }
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  },

  /**
   * Register user
   */
  async register(registerData: RegisterRequest): Promise<AuthResponse> {
    try {
      const response = await api.post<AuthResponse>('/auth/register', {
        ...registerData,
        userAgent: navigator.userAgent,
        deviceFingerprint: this.generateDeviceFingerprint(),
      });
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 409) {
        throw new Error('User with this email or phone already exists');
      }
      if (error.response?.status === 400) {
        const message = error.response.data?.message || 'Registration failed';
        throw new Error(message);
      }
      throw new Error(error.response?.data?.message || 'Registration failed');
    }
  },

  /**
   * Refresh access token
   */
  async refreshToken(refreshData: RefreshTokenRequest): Promise<AuthResponse> {
    try {
      const response = await api.post<AuthResponse>('/auth/refresh', refreshData);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Token refresh failed');
    }
  },

  /**
   * Logout user
   */
  async logout(refreshToken?: string, allDevices?: boolean): Promise<void> {
    try {
      await api.post('/auth/logout', {
        refreshToken,
        allDevices,
      });
    } catch (error: any) {
      // Even if logout fails, clear local tokens
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
    }
  },

  /**
   * Get current user profile
   */
  async getProfile(): Promise<any> {
    try {
      const response = await api.get('/auth/me');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to get profile');
    }
  },

  /**
   * Verify email
   */
  async verifyEmail(verifyData: VerifyEmailRequest): Promise<{ message: string }> {
    try {
      const response = await api.post<{ message: string }>('/auth/verify-email', verifyData);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Email verification failed');
    }
  },

  /**
   * Forgot password
   */
  async forgotPassword(forgotData: ForgotPasswordRequest): Promise<{ message: string }> {
    try {
      const response = await api.post<{ message: string }>('/auth/forgot-password', forgotData);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Forgot password failed');
    }
  },

  /**
   * Reset password
   */
  async resetPassword(resetData: ResetPasswordRequest): Promise<{ message: string }> {
    try {
      const response = await api.post<{ message: string }>('/auth/reset-password', resetData);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Password reset failed');
    }
  },

  /**
   * Change password
   */
  async changePassword(changeData: ChangePasswordRequest): Promise<{ message: string }> {
    try {
      const response = await api.post<{ message: string }>('/auth/change-password', changeData);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Password change failed');
    }
  },

  /**
   * Setup MFA
   */
  async setupMFA(method: 'sms' | 'email' | 'authenticator'): Promise<any> {
    try {
      const response = await api.post('/auth/setup-mfa', { method });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'MFA setup failed');
    }
  },

  /**
   * Verify MFA setup
   */
  async verifyMFASetup(code: string, method: 'sms' | 'email' | 'authenticator'): Promise<{ message: string }> {
    try {
      const response = await api.post<{ message: string }>('/auth/verify-mfa-setup', { code, method });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'MFA verification failed');
    }
  },

  /**
   * Generate device fingerprint
   */
  generateDeviceFingerprint(): string {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('Device fingerprint', 2, 2);
      return canvas.toDataURL();
    }
    return 'unknown';
  },
}; 