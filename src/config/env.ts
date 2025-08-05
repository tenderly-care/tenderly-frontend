/**
 * Environment Configuration
 * Production-level environment variable validation and configuration
 */

interface EnvConfig {
  API_URL: string;
  RAZORPAY_KEY: string;
  NODE_ENV: 'development' | 'production' | 'test';
  IS_PRODUCTION: boolean;
  IS_DEVELOPMENT: boolean;
}

const validateEnvVar = (name: string, value: string | undefined): string => {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

const getConfig = (): EnvConfig => {
  const nodeEnv = (import.meta.env.MODE || 'development') as 'development' | 'production' | 'test';
  
  return {
    API_URL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
    RAZORPAY_KEY: import.meta.env.VITE_RAZORPAY_KEY || '',
    NODE_ENV: nodeEnv,
    IS_PRODUCTION: nodeEnv === 'production',
    IS_DEVELOPMENT: nodeEnv === 'development',
  };
};

// Validate critical environment variables in production
const config = getConfig();

if (config.IS_PRODUCTION) {
  validateEnvVar('VITE_API_URL', import.meta.env.VITE_API_URL);
  validateEnvVar('VITE_RAZORPAY_KEY', import.meta.env.VITE_RAZORPAY_KEY);
}

export default config;
