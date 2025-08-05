# Environment Setup

## Environment Variables

This project uses environment variables for configuration. Follow these steps to set up your environment:

### 1. Copy the example file
```bash
cp .env.example .env
```

### 2. Update the variables in `.env`:

#### Required Variables:
- `VITE_API_URL`: Your backend API URL
  - Development: `http://localhost:3000/api/v1`
  - Production: `https://your-api-domain.com/api/v1`

- `VITE_RAZORPAY_KEY`: Your Razorpay API key
  - Test key: Starts with `rzp_test_`
  - Live key: Starts with `rzp_live_`

#### Optional Variables:
- `VITE_GA_TRACKING_ID`: Google Analytics tracking ID
- `VITE_SENTRY_DSN`: Sentry error monitoring DSN

### 3. Example .env file:
```env
VITE_API_URL=http://localhost:3000/api/v1
VITE_RAZORPAY_KEY=rzp_test_your_key_here
```

## Important Notes:

- **Never commit `.env` files** - They contain sensitive information
- **Always use `.env.example`** - This is safe to commit and shows required variables
- **Vite Environment Variables** - Must be prefixed with `VITE_` to be available in the browser
- **Production Deployment** - Ensure all required environment variables are set in your deployment platform

## Security:

- Keep your API keys secure
- Use test keys for development
- Use live keys only in production
- Regularly rotate your API keys
