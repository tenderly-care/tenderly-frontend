import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Layout } from './components/layout/Layout';
import { LoadingSpinner } from './components/ui/LoadingSpinner';
import { ErrorBoundary } from 'react-error-boundary';

// Pages
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { DoctorRegisterPage } from './pages/auth/DoctorRegisterPage';
import { DoctorLoginPage } from './pages/auth/DoctorLoginPage';
import { MFASetupPage } from './pages/auth/MFASetupPage';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { DoctorDashboardPage } from './pages/dashboard/DoctorDashboardPage';
import { ConsultationPage } from './pages/consultation/ConsultationPage';
import { DoctorConsultationPage } from './pages/consultation/DoctorConsultationPage';
import { ConsultationDetailsPage } from './pages/consultation/ConsultationDetailsPage';
import { SymptomCollectionPage } from './pages/consultation/SymptomCollectionPage';
import { PaymentPage } from './pages/payment/PaymentPage';
import { PrescriptionPage } from './pages/prescription/PrescriptionPage';
import { PrescriptionWorkspacePage } from './pages/prescription/PrescriptionWorkspacePage';
import { ProfilePage } from './pages/profile/ProfilePage';
import { DoctorProfilePage } from './pages/profile/DoctorProfilePage';
import { NotFoundPage } from './pages/NotFoundPage';

// Error Fallback Component
const ErrorFallback = ({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Something went wrong</h3>
          <p className="mt-1 text-sm text-gray-500">
            {error.message || 'An unexpected error occurred'}
          </p>
          <div className="mt-6">
            <button
              onClick={resetErrorBoundary}
              className="btn-primary"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

function App() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <Router>
        <AuthProvider>
          <div className="App">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/doctor/register" element={<DoctorRegisterPage />} />
              <Route path="/doctor/login" element={<DoctorLoginPage />} />
              <Route path="/mfa/setup" element={<MFASetupPage />} />
              
              {/* Protected Patient Routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <DashboardPage />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/consultation"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <ConsultationPage />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/symptoms"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <SymptomCollectionPage />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/payment"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <PaymentPage />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/prescription"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <PrescriptionPage />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <ProfilePage />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              {/* Protected Doctor Routes */}
              <Route
                path="/doctor/dashboard"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <DoctorDashboardPage />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/prescription/workspace/:consultationId"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <PrescriptionWorkspacePage />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/doctor/consultations"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <DoctorConsultationPage />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/doctor/consultations/:id"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <ConsultationDetailsPage />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/doctor/profile"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <DoctorProfilePage />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              
              {/* 404 Page */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </div>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App; 