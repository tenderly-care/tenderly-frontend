import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  HeartIcon, 
  ChatBubbleLeftRightIcon, 
  ClockIcon, 
  ShieldCheckIcon,
  ArrowRightIcon,
  PlayIcon,
  AcademicCapIcon,
  UserGroupIcon,
  ChartBarIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';

export const HomePage: React.FC = () => {
  const { isAuthenticated } = useAuth();

  const features = [
    {
      icon: ChatBubbleLeftRightIcon,
      title: '24/7 Consultations',
      description: 'Get medical advice anytime, anywhere with our round-the-clock consultation service.',
    },
    {
      icon: HeartIcon,
      title: 'Expert Healthcare',
      description: 'Connect with qualified doctors and healthcare professionals for personalized care.',
    },
    {
      icon: ClockIcon,
      title: 'Quick & Easy',
      description: 'Book appointments in minutes and get instant access to healthcare services.',
    },
    {
      icon: ShieldCheckIcon,
      title: 'Secure & Private',
      description: 'Your health information is protected with enterprise-grade security measures.',
    },
  ];

  const consultationTypes = [
    {
      type: 'Chat',
      price: '₹150',
      description: 'Text-based consultation with healthcare professionals',
      features: ['Instant messaging', 'File sharing', '24/7 availability'],
    },
    {
      type: 'Telephone',
      price: '₹200',
      description: 'Voice consultation for immediate medical advice',
      features: ['Voice calls', 'Audio quality', 'Quick response'],
    },
    {
      type: 'Video',
      price: '₹250',
      description: 'Face-to-face consultation with video calling',
      features: ['HD video calls', 'Screen sharing', 'Visual examination'],
    },
    {
      type: 'Emergency',
      price: '₹300',
      description: 'Urgent care for critical health situations',
      features: ['Priority access', 'Immediate response', 'Emergency protocols'],
    },
  ];

  const doctorFeatures = [
    {
      icon: UserGroupIcon,
      title: 'Patient Management',
      description: 'Efficiently manage your patient records and consultation history.',
    },
    {
      icon: ChartBarIcon,
      title: 'Practice Analytics',
      description: 'Track your practice performance with detailed analytics and insights.',
    },
    {
      icon: CurrencyDollarIcon,
      title: 'Revenue Tracking',
      description: 'Monitor your earnings and manage payments seamlessly.',
    },
    {
      icon: AcademicCapIcon,
      title: 'Professional Growth',
      description: 'Expand your practice and reach more patients nationwide.',
    },
  ];

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-100" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              Healthcare at Your
              <span className="text-blue-600"> Fingertips</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600 max-w-3xl mx-auto">
              Connect with qualified healthcare professionals instantly. Get medical advice, 
              prescriptions, and care from the comfort of your home with our secure telemedicine platform.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              {isAuthenticated ? (
                <Link
                  to="/dashboard"
                  className="btn-primary text-lg px-8 py-3"
                >
                  Go to Dashboard
                  <ArrowRightIcon className="ml-2 h-5 w-5" />
                </Link>
              ) : (
                <>
                  <Link
                    to="/register"
                    className="btn-primary text-lg px-8 py-3"
                  >
                    Get Started
                    <ArrowRightIcon className="ml-2 h-5 w-5" />
                  </Link>
                  <Link
                    to="/login"
                    className="btn-secondary text-lg px-8 py-3"
                  >
                    Sign In
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Why Choose Tenderly?
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Experience healthcare reimagined with our comprehensive telemedicine platform.
            </p>
          </div>
          <div className="mt-20 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <div key={feature.title} className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-blue-600">
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="mt-6 text-lg font-semibold text-gray-900">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Consultation Types Section */}
      <div className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Consultation Types
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Choose the consultation type that best fits your needs.
            </p>
          </div>
          <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {consultationTypes.map((type) => (
              <div key={type.type} className="card hover:shadow-lg transition-shadow duration-300">
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-gray-900">{type.type}</h3>
                  <div className="mt-4 text-3xl font-bold text-blue-600">{type.price}</div>
                  <p className="mt-2 text-sm text-gray-600">{type.description}</p>
                  <ul className="mt-6 space-y-2">
                    {type.features.map((feature) => (
                      <li key={feature} className="text-sm text-gray-600">
                        ✓ {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Healthcare Providers Section */}
      <div className="py-24 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              For Healthcare Providers
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Join our platform and expand your practice with our comprehensive telemedicine tools.
            </p>
          </div>
          <div className="mt-20 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {doctorFeatures.map((feature) => (
              <div key={feature.title} className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-blue-600">
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="mt-6 text-lg font-semibold text-gray-900">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-12 text-center">
            <div className="flex items-center justify-center gap-x-6">
              <Link
                to="/doctor/register"
                className="btn-primary text-lg px-8 py-3"
              >
                Join as Healthcare Provider
                <ArrowRightIcon className="ml-2 h-5 w-5" />
              </Link>
              <Link
                to="/doctor/login"
                className="btn-secondary text-lg px-8 py-3"
              >
                Sign In as Provider
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-24 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Ready to Get Started?
          </h2>
          <p className="mt-4 text-lg text-blue-100">
            Join thousands of patients and healthcare providers who trust Tenderly for their healthcare needs.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Link
              to="/register"
              className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-3 rounded-lg font-medium transition-colors"
            >
              Get Started Today
              <ArrowRightIcon className="ml-2 h-5 w-5 inline" />
            </Link>
            <Link
              to="/login"
              className="text-white border border-white hover:bg-white hover:text-blue-600 text-lg px-8 py-3 rounded-lg font-medium transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="text-2xl font-bold text-white">🏥 Tenderly</div>
              <p className="mt-4 text-gray-400">
                Your trusted partner in healthcare telemedicine.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">
                Services
              </h3>
              <ul className="mt-4 space-y-2">
                <li><Link to="/consultation" className="text-gray-300 hover:text-white">Consultations</Link></li>
                <li><Link to="/prescription" className="text-gray-300 hover:text-white">Prescriptions</Link></li>
                <li><Link to="/payment" className="text-gray-300 hover:text-white">Payments</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">
                Support
              </h3>
              <ul className="mt-4 space-y-2">
                <li><a href="#" className="text-gray-300 hover:text-white">Help Center</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white">Contact Us</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white">Privacy Policy</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">
                Company
              </h3>
              <ul className="mt-4 space-y-2">
                <li><a href="#" className="text-gray-300 hover:text-white">About Us</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white">Careers</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 border-t border-gray-800 pt-8">
            <p className="text-gray-400 text-center">
              © 2024 Tenderly Healthcare. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}; 