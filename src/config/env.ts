/**
 * Environment Configuration
 * Production-level environment variable validation and configuration
 */

interface EnvConfig {
  apiUrl: string;
  razorpayKey: string;
  nodeEnv: 'development' | 'production' | 'test';
  isProduction: boolean;
  isDevelopment: boolean;
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
    apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
    razorpayKey: import.meta.env.VITE_RAZORPAY_KEY || '',
    nodeEnv: nodeEnv,
    isProduction: nodeEnv === 'production',
    isDevelopment: nodeEnv === 'development',
  };
};

// Validate critical environment variables in production
const config = getConfig();

if (config.isProduction) {
  validateEnvVar('VITE_API_URL', import.meta.env.VITE_API_URL);
  validateEnvVar('VITE_RAZORPAY_KEY', import.meta.env.VITE_RAZORPAY_KEY);
}

export { config };
export default config;
