# Tenderly Frontend

A modern, responsive React TypeScript application for the Tenderly Healthcare Telemedicine Platform.

## 🏥 Overview

Tenderly Frontend is a comprehensive healthcare telemedicine platform that enables patients to:
- Book consultations with healthcare professionals
- Get AI-powered symptom analysis
- Make secure payments
- Receive digital prescriptions
- Manage their health records

## 🚀 Features

### Core Features
- **Authentication & Authorization**: Secure JWT-based authentication with role-based access control
- **Consultation Management**: Book and manage different types of consultations (Chat, Video, Telephone, Emergency)
- **AI-Powered Diagnosis**: Intelligent symptom analysis and preliminary diagnosis
- **Payment Integration**: Secure payment processing with Razorpay integration
- **Digital Prescriptions**: Generate and manage digital prescriptions with cryptographic verification
- **Real-time Communication**: Live chat and video consultation capabilities
- **Responsive Design**: Mobile-first design that works on all devices

### Technical Features
- **TypeScript**: Full type safety and better developer experience
- **React 18**: Latest React features with hooks and concurrent rendering
- **Tailwind CSS**: Utility-first CSS framework for rapid UI development
- **React Query**: Powerful data fetching and caching
- **React Router**: Client-side routing with protected routes
- **React Hook Form**: Performant forms with validation
- **Zustand**: Lightweight state management
- **Axios**: HTTP client with interceptors for authentication
- **React Hot Toast**: Beautiful toast notifications
- **Framer Motion**: Smooth animations and transitions

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Backend API running (see backend documentation)

### Setup
1. Clone the repository:
```bash
git clone <repository-url>
cd tenderly-frontend
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Create environment file:
```bash
cp .env.example .env.local
```

4. Configure environment variables:
```env
REACT_APP_API_URL=http://localhost:3000/api/v1
REACT_APP_RAZORPAY_KEY=your_razorpay_key
REACT_APP_GA_TRACKING_ID=your_ga_tracking_id
```

5. Start the development server:
```bash
npm start
# or
yarn start
```

The application will be available at `http://localhost:3000`

## 🏗️ Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── auth/           # Authentication components
│   ├── layout/         # Layout components
│   ├── ui/             # Basic UI components
│   └── forms/          # Form components
├── contexts/           # React contexts
│   └── AuthContext.tsx # Authentication context
├── hooks/              # Custom React hooks
├── pages/              # Page components
│   ├── auth/           # Authentication pages
│   ├── dashboard/      # Dashboard pages
│   ├── consultation/   # Consultation pages
│   └── payment/        # Payment pages
├── services/           # API services
│   └── api/            # API client and endpoints
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
├── App.tsx             # Main App component
└── index.tsx           # Application entry point
```

## 🔧 Development

### Available Scripts

- `npm start` - Start development server
- `npm build` - Build for production
- `npm test` - Run tests
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm run type-check` - Run TypeScript type checking
- `npm run format` - Format code with Prettier

### Code Style

The project uses:
- **ESLint** for code linting
- **Prettier** for code formatting
- **TypeScript** for type checking

### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

## 🔐 Authentication

The application uses JWT-based authentication with the following features:

- **Login/Register**: User registration and login
- **Token Management**: Automatic token refresh
- **Protected Routes**: Role-based access control
- **Session Persistence**: Automatic session restoration

### User Roles

- `patient` - Regular patients
- `doctor` - Healthcare providers
- `admin` - System administrators
- `super_admin` - Super administrators

## 💳 Payment Integration

The application integrates with Razorpay for secure payment processing:

- **Multiple Payment Methods**: Cards, UPI, Net Banking
- **Secure Processing**: PCI DSS compliant
- **Payment Verification**: Cryptographic signature verification
- **Refund Support**: Automated refund processing

## 📱 Responsive Design

The application is built with a mobile-first approach and supports:

- **Mobile**: iOS Safari, Android Chrome
- **Tablet**: iPad, Android tablets
- **Desktop**: Chrome, Firefox, Safari, Edge

## 🚀 Deployment

### Production Build

```bash
npm run build
```

### Environment Variables

Set the following environment variables for production:

```env
REACT_APP_API_URL=https://api.tenderly.care/api/v1
REACT_APP_RAZORPAY_KEY=rzp_live_your_key
REACT_APP_GA_TRACKING_ID=G-XXXXXXXXXX
NODE_ENV=production
```

### Deployment Platforms

The application can be deployed to:

- **Vercel**: Zero-config deployment
- **Netlify**: Static site hosting
- **AWS S3**: Static website hosting
- **Firebase Hosting**: Google's hosting platform

## 🔧 Configuration

### API Configuration

The application connects to the Tenderly Backend API. Ensure the backend is running and accessible.

### Payment Configuration

Configure Razorpay keys in your environment variables:

```env
REACT_APP_RAZORPAY_KEY=rzp_test_your_test_key
REACT_APP_RAZORPAY_SECRET=your_secret_key
```

### Analytics Configuration

Configure Google Analytics for tracking:

```env
REACT_APP_GA_TRACKING_ID=G-XXXXXXXXXX
```

## 🐛 Troubleshooting

### Common Issues

1. **API Connection Error**
   - Ensure backend is running
   - Check API URL in environment variables
   - Verify CORS configuration

2. **Payment Issues**
   - Verify Razorpay keys
   - Check payment gateway configuration
   - Ensure HTTPS in production

3. **Build Errors**
   - Clear node_modules and reinstall
   - Check TypeScript configuration
   - Verify all dependencies are installed

### Debug Mode

Enable debug mode by setting:

```env
REACT_APP_DEBUG=true
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For support and questions:

- **Email**: support@tenderly.care
- **Documentation**: [docs.tenderly.care](https://docs.tenderly.care)
- **Issues**: [GitHub Issues](https://github.com/tenderly/frontend/issues)

## 🔗 Related Projects

- [Tenderly Backend](https://github.com/tenderly/backend) - Backend API
- [Tenderly Mobile](https://github.com/tenderly/mobile) - Mobile application
- [Tenderly Admin](https://github.com/tenderly/admin) - Admin dashboard
