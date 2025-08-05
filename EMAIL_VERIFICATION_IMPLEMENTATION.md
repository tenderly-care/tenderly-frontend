# Email Verification Implementation Guide

## Overview

This guide explains how to implement email verification functionality that integrates with your backend token generation and Redis verification system. The implementation includes both frontend components and backend integration patterns.

## Backend Integration

### 1. **Token Generation & Redis Storage**

Your backend should implement the following flow:

```javascript
// Backend implementation example (Node.js/Express)
const crypto = require('crypto');
const redis = require('redis');

// Generate verification token
const generateVerificationToken = (userId, email) => {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
  
  // Store in Redis with expiration
  await redis.setex(`email_verification:${token}`, 86400, JSON.stringify({
    userId,
    email,
    expiresAt
  }));
  
  return token;
};

// Verify token from Redis
const verifyEmailToken = async (token) => {
  const data = await redis.get(`email_verification:${token}`);
  
  if (!data) {
    throw new Error('Invalid or expired token');
  }
  
  const verificationData = JSON.parse(data);
  
  if (Date.now() > verificationData.expiresAt) {
    await redis.del(`email_verification:${token}`);
    throw new Error('Token expired');
  }
  
  // Mark user as verified
  await updateUserVerificationStatus(verificationData.userId);
  
  // Clean up Redis
  await redis.del(`email_verification:${token}`);
  
  return { success: true, message: 'Email verified successfully' };
};
```

### 2. **Email Template**

Create an email template that includes the verification link:

```html
<!-- Email template example -->
<!DOCTYPE html>
<html>
<head>
    <title>Verify Your Email</title>
</head>
<body>
    <h2>Welcome to Tenderly Healthcare!</h2>
    <p>Please verify your email address by clicking the link below:</p>
    
    <a href="{{verificationUrl}}" style="background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
        Verify Email Address
    </a>
    
    <p>Or copy and paste this link in your browser:</p>
    <p>{{verificationUrl}}</p>
    
    <p>This link will expire in 24 hours.</p>
    
    <p>If you didn't create an account, you can safely ignore this email.</p>
</body>
</html>
```

### 3. **Backend API Endpoints**

Implement these endpoints in your backend:

```javascript
// POST /api/v1/auth/register
app.post('/auth/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone } = req.body;
    
    // Create user (unverified)
    const user = await createUser({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      phone,
      isEmailVerified: false
    });
    
    // Generate verification token
    const token = generateVerificationToken(user.id, email);
    
    // Send verification email
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}&email=${email}`;
    await sendVerificationEmail(email, verificationUrl);
    
    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isEmailVerified: false,
        // ... other user fields
      },
      requiresEmailVerification: true,
      message: 'Registration successful. Please check your email for verification.'
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// POST /api/v1/auth/verify-email
app.post('/auth/verify-email', async (req, res) => {
  try {
    const { token } = req.body;
    
    const result = await verifyEmailToken(token);
    
    res.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// POST /api/v1/auth/resend-verification
app.post('/auth/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;
    
    // Find user by email
    const user = await findUserByEmail(email);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (user.isEmailVerified) {
      return res.status(400).json({ message: 'Email already verified' });
    }
    
    // Generate new token
    const token = generateVerificationToken(user.id, email);
    
    // Send new verification email
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}&email=${email}`;
    await sendVerificationEmail(email, verificationUrl);
    
    res.json({
      success: true,
      message: 'Verification email sent successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});
```

## Frontend Implementation

### 1. **Email Verification Page**

The `EmailVerificationPage.tsx` component handles verification links:

```typescript
// Key features:
- Extracts token from URL parameters
- Calls verifyEmail API endpoint
- Handles different verification states (success, error, expired)
- Provides resend functionality
- Auto-redirects to login on success
```

### 2. **Verification Banner**

The `EmailVerificationBanner.tsx` component shows for unverified users:

```typescript
// Key features:
- Shows only for logged-in, unverified users
- Provides resend verification functionality
- Can be dismissed by user
- Non-intrusive design
```

### 3. **Updated Registration Flow**

The registration process now:

1. **Creates user account** (unverified)
2. **Generates verification token** (backend)
3. **Sends verification email** (backend)
4. **Redirects to login** with success message
5. **User must verify email** before full access

## Configuration

### 1. **Environment Variables**

```bash
# Backend
FRONTEND_URL=http://localhost:3001
REDIS_URL=redis://localhost:6379
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Frontend
VITE_API_URL=http://localhost:3000/api/v1
```

### 2. **Email Service Setup**

```javascript
// Backend email service (using Nodemailer)
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

const sendVerificationEmail = async (email, verificationUrl) => {
  const mailOptions = {
    from: process.env.SMTP_USER,
    to: email,
    subject: 'Verify Your Email - Tenderly Healthcare',
    html: emailTemplate.replace('{{verificationUrl}}', verificationUrl)
  };
  
  await transporter.sendMail(mailOptions);
};
```

## Security Considerations

### 1. **Token Security**
- **Cryptographically secure** random tokens
- **Time-limited** tokens (24 hours)
- **Single-use** tokens (deleted after verification)
- **Rate limiting** on resend requests

### 2. **Email Security**
- **HTTPS verification links** only
- **No sensitive data** in email content
- **Secure SMTP** configuration
- **Email validation** before sending

### 3. **Frontend Security**
- **Token validation** before API calls
- **Error handling** without exposing internals
- **Rate limiting** on frontend requests
- **Secure redirects** after verification

## Testing Strategy

### 1. **Backend Testing**
```javascript
// Test token generation
test('should generate valid verification token', async () => {
  const token = generateVerificationToken('user123', 'test@example.com');
  expect(token).toHaveLength(64);
  expect(await redis.get(`email_verification:${token}`)).toBeTruthy();
});

// Test token verification
test('should verify valid token', async () => {
  const token = generateVerificationToken('user123', 'test@example.com');
  const result = await verifyEmailToken(token);
  expect(result.success).toBe(true);
});

// Test expired token
test('should reject expired token', async () => {
  // Mock expired token
  const expiredToken = 'expired_token';
  await expect(verifyEmailToken(expiredToken)).rejects.toThrow('Token expired');
});
```

### 2. **Frontend Testing**
```typescript
// Test verification page
test('should verify email with valid token', async () => {
  render(<EmailVerificationPage />);
  
  // Mock URL with valid token
  window.history.pushState({}, '', '/verify-email?token=valid_token');
  
  await waitFor(() => {
    expect(screen.getByText('Email verified successfully!')).toBeInTheDocument();
  });
});

// Test resend functionality
test('should resend verification email', async () => {
  render(<EmailVerificationPage />);
  
  const resendButton = screen.getByText('Resend Verification Email');
  fireEvent.click(resendButton);
  
  await waitFor(() => {
    expect(screen.getByText('Verification email sent successfully!')).toBeInTheDocument();
  });
});
```

## Deployment Checklist

### 1. **Backend Deployment**
- [ ] **Redis configuration** for production
- [ ] **SMTP settings** for email service
- [ ] **Environment variables** configured
- [ ] **Rate limiting** implemented
- [ ] **Error handling** for all endpoints
- [ ] **Logging** for verification events

### 2. **Frontend Deployment**
- [ ] **Email verification route** added to router
- [ ] **Verification banner** integrated in layout
- [ ] **Error boundaries** for verification page
- [ ] **Loading states** implemented
- [ ] **Accessibility** features added
- [ ] **Mobile responsiveness** tested

### 3. **Email Service**
- [ ] **SMTP credentials** configured
- [ ] **Email templates** created
- [ ] **Spam score** optimized
- [ ] **Delivery testing** completed
- [ ] **Bounce handling** implemented

## Monitoring & Analytics

### 1. **Key Metrics**
- **Verification rate**: % of users who verify email
- **Resend rate**: How often users request new emails
- **Token expiration rate**: % of tokens that expire
- **Email delivery rate**: % of emails successfully delivered

### 2. **Error Tracking**
- **Invalid token attempts**: Track failed verifications
- **Expired token attempts**: Monitor token expiration
- **Email delivery failures**: Track SMTP errors
- **Rate limit violations**: Monitor abuse attempts

## Troubleshooting

### 1. **Common Issues**

**Token not found in Redis:**
- Check Redis connection
- Verify token generation
- Check token expiration

**Email not received:**
- Check SMTP configuration
- Verify email address format
- Check spam folder

**Verification page not loading:**
- Check frontend routing
- Verify API endpoint
- Check CORS configuration

### 2. **Debug Steps**
1. **Check Redis logs** for token operations
2. **Monitor SMTP logs** for email delivery
3. **Verify API responses** in browser network tab
4. **Check frontend console** for JavaScript errors

This implementation provides a robust, secure email verification system that integrates seamlessly with your existing backend token generation and Redis verification infrastructure. 