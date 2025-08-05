import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  CalendarIcon,
  DocumentTextIcon,
  BellIcon,
  CogIcon,
  PlusIcon,
  EyeIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon as ClockIconSolid,
  UserIcon,
  PhoneIcon,
  VideoCameraIcon,
  ChatBubbleLeftIcon,
  StarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';

export const DoctorDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [selectedTimeframe, setSelectedTimeframe] = useState('week');

  // Mock data - in real app, this would come from API
  const stats = [
    {
      name: 'Total Patients',
      value: '156',
      change: '+12',
      changeType: 'positive',
      icon: UserGroupIcon,
      color: 'blue',
    },
    {
      name: 'Active Consultations',
      value: '8',
      change: '+3',
      changeType: 'positive',
      icon: ChatBubbleLeftRightIcon,
      color: 'green',
    },
    {
      name: 'Monthly Revenue',
      value: '₹45,250',
      change: '+₹8,500',
      changeType: 'positive',
      icon: CurrencyDollarIcon,
      color: 'purple',
    },
    {
      name: 'Avg. Rating',
      value: '4.8',
      change: '+0.2',
      changeType: 'positive',
      icon: StarIcon,
      color: 'yellow',
    },
  ];

  const recentConsultations = [
    {
      id: '1',
      patientName: 'Priya Sharma',
      type: 'Video Consultation',
      date: '2024-01-15',
      time: '10:30 AM',
      status: 'completed',
      amount: '₹1,500',
      rating: 5,
      symptoms: 'Fever, Headache',
    },
    {
      id: '2',
      patientName: 'Rajesh Kumar',
      type: 'Chat Consultation',
      date: '2024-01-15',
      time: '09:15 AM',
      status: 'completed',
      amount: '₹800',
      rating: 4,
      symptoms: 'Cough, Cold',
    },
    {
      id: '3',
      patientName: 'Anita Patel',
      type: 'Video Consultation',
      date: '2024-01-14',
      time: '02:00 PM',
      status: 'completed',
      amount: '₹1,500',
      rating: 5,
      symptoms: 'Back Pain',
    },
  ];

  const upcomingAppointments = [
    {
      id: '1',
      patientName: 'Suresh Verma',
      type: 'Video Consultation',
      date: '2024-01-16',
      time: '11:00 AM',
      status: 'scheduled',
      symptoms: 'Chest Pain',
      priority: 'high',
    },
    {
      id: '2',
      patientName: 'Meera Singh',
      type: 'Chat Consultation',
      date: '2024-01-16',
      time: '03:30 PM',
      status: 'scheduled',
      symptoms: 'Skin Rash',
      priority: 'normal',
    },
    {
      id: '3',
      patientName: 'Amit Kumar',
      type: 'Video Consultation',
      date: '2024-01-17',
      time: '10:00 AM',
      status: 'scheduled',
      symptoms: 'Diabetes Follow-up',
      priority: 'normal',
    },
  ];

  const pendingPrescriptions = [
    {
      id: '1',
      patientName: 'Priya Sharma',
      consultationDate: '2024-01-15',
      status: 'draft',
      medications: 3,
      lastUpdated: '2 hours ago',
    },
    {
      id: '2',
      patientName: 'Rajesh Kumar',
      consultationDate: '2024-01-15',
      status: 'awaiting_review',
      medications: 2,
      lastUpdated: '1 hour ago',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'awaiting_review':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'normal':
        return 'bg-blue-100 text-blue-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getIconColor = (color: string) => {
    switch (color) {
      case 'blue':
        return 'text-blue-600';
      case 'green':
        return 'text-green-600';
      case 'purple':
        return 'text-purple-600';
      case 'yellow':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back, Dr. {user?.lastName}!
            </h1>
            <p className="text-gray-600 mt-1">
              Here's what's happening with your practice today.
            </p>
          </div>
          <div className="flex space-x-3">
            <Link
              to="/consultation/new"
              className="btn-primary flex items-center"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              New Consultation
            </Link>
            <Link
              to="/doctor/profile"
              className="btn-secondary flex items-center"
            >
              <CogIcon className="h-4 w-4 mr-2" />
              Profile Settings
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <stat.icon className={`h-8 w-8 ${getIconColor(stat.color)}`} />
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                <p className={`text-sm flex items-center ${
                  stat.changeType === 'positive' ? 'text-green-600' : 
                  stat.changeType === 'negative' ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {stat.changeType === 'positive' ? (
                    <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
                  ) : (
                    <ArrowTrendingDownIcon className="h-4 w-4 mr-1" />
                  )}
                  {stat.change}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Consultations */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Recent Consultations</h3>
              <Link
                to="/consultations"
                className="text-blue-600 hover:text-blue-500 text-sm font-medium"
              >
                View all
              </Link>
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {recentConsultations.map((consultation) => (
              <div key={consultation.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <UserIcon className="h-5 w-5 text-blue-600 mr-2" />
                        <span className="font-medium text-gray-900">{consultation.patientName}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(consultation.status)}`}>
                          {consultation.status}
                        </span>
                        <span className="font-semibold text-gray-900">{consultation.amount}</span>
                      </div>
                    </div>
                    <div className="flex items-center mt-2 text-sm text-gray-600">
                      <ClockIcon className="h-4 w-4 mr-1" />
                      <span>{consultation.date} at {consultation.time}</span>
                      <span className="mx-2">•</span>
                      <span>{consultation.type}</span>
                    </div>
                    <div className="mt-2">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Symptoms:</span> {consultation.symptoms}
                      </p>
                    </div>
                    <div className="flex items-center mt-2">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <StarIcon
                            key={i}
                            className={`h-4 w-4 ${
                              i < consultation.rating ? 'text-yellow-400' : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="ml-2 text-sm text-gray-600">
                        {consultation.rating}/5
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Appointments */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Upcoming Appointments</h3>
              <Link
                to="/appointments"
                className="text-blue-600 hover:text-blue-500 text-sm font-medium"
              >
                View all
              </Link>
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {upcomingAppointments.map((appointment) => (
              <div key={appointment.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <UserIcon className="h-5 w-5 text-green-600 mr-2" />
                        <span className="font-medium text-gray-900">{appointment.patientName}</span>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(appointment.priority)}`}>
                        {appointment.priority}
                      </span>
                    </div>
                    <div className="flex items-center mt-2 text-sm text-gray-600">
                      <CalendarIcon className="h-4 w-4 mr-1" />
                      <span>{appointment.date} at {appointment.time}</span>
                    </div>
                    <div className="mt-2">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Symptoms:</span> {appointment.symptoms}
                      </p>
                    </div>
                    <div className="flex items-center mt-2">
                      {appointment.type === 'Video Consultation' ? (
                        <VideoCameraIcon className="h-4 w-4 text-blue-600 mr-1" />
                      ) : (
                        <ChatBubbleLeftIcon className="h-4 w-4 text-green-600 mr-1" />
                      )}
                      <span className="text-sm text-gray-600">{appointment.type}</span>
                    </div>
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <button className="text-blue-600 hover:text-blue-500 text-sm font-medium">
                      Start
                    </button>
                    <button className="text-gray-600 hover:text-gray-500 text-sm font-medium">
                      Reschedule
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pending Prescriptions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Pending Prescriptions</h3>
            <Link
              to="/prescriptions"
              className="text-blue-600 hover:text-blue-500 text-sm font-medium"
            >
              View all
            </Link>
          </div>
        </div>
        <div className="divide-y divide-gray-200">
          {pendingPrescriptions.map((prescription) => (
            <div key={prescription.id} className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <DocumentTextIcon className="h-5 w-5 text-orange-600 mr-2" />
                      <span className="font-medium text-gray-900">{prescription.patientName}</span>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(prescription.status)}`}>
                      {prescription.status}
                    </span>
                  </div>
                  <div className="flex items-center mt-2 text-sm text-gray-600">
                    <CalendarIcon className="h-4 w-4 mr-1" />
                    <span>Consultation: {prescription.consultationDate}</span>
                    <span className="mx-2">•</span>
                    <span>{prescription.medications} medications</span>
                  </div>
                  <div className="mt-2">
                    <p className="text-sm text-gray-600">
                      Last updated: {prescription.lastUpdated}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2 ml-4">
                  <button className="text-blue-600 hover:text-blue-500 text-sm font-medium">
                    Review
                  </button>
                  <button className="text-green-600 hover:text-green-500 text-sm font-medium">
                    Sign
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/consultation/new"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
          >
            <PlusIcon className="h-6 w-6 text-blue-600 mr-3" />
            <div>
              <p className="font-medium text-gray-900">New Consultation</p>
              <p className="text-sm text-gray-600">Start a consultation</p>
            </div>
          </Link>
          
          <Link
            to="/patients"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
          >
            <UserGroupIcon className="h-6 w-6 text-green-600 mr-3" />
            <div>
              <p className="font-medium text-gray-900">Patient Records</p>
              <p className="text-sm text-gray-600">View patient history</p>
            </div>
          </Link>
          
          <Link
            to="/prescriptions"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
          >
            <DocumentTextIcon className="h-6 w-6 text-orange-600 mr-3" />
            <div>
              <p className="font-medium text-gray-900">Prescriptions</p>
              <p className="text-sm text-gray-600">Manage prescriptions</p>
            </div>
          </Link>
          
          <Link
            to="/doctor/profile"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
          >
            <CogIcon className="h-6 w-6 text-purple-600 mr-3" />
            <div>
              <p className="font-medium text-gray-900">Settings</p>
              <p className="text-sm text-gray-600">Update profile</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Recent Notifications</h3>
          <Link
            to="/notifications"
            className="text-blue-600 hover:text-blue-500 text-sm font-medium"
          >
            View all
          </Link>
        </div>
        <div className="space-y-3">
          <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
            <BellIcon className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-900">New patient registration</p>
              <p className="text-xs text-gray-600">Priya Sharma has registered for your consultation</p>
              <p className="text-xs text-gray-500 mt-1">2 hours ago</p>
            </div>
          </div>
          <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
            <CheckCircleIcon className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-900">Prescription signed</p>
              <p className="text-xs text-gray-600">Your prescription for Rajesh Kumar has been signed</p>
              <p className="text-xs text-gray-500 mt-1">4 hours ago</p>
            </div>
          </div>
          <div className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg">
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-900">License verification pending</p>
              <p className="text-xs text-gray-600">Please complete your medical license verification</p>
              <p className="text-xs text-gray-500 mt-1">1 day ago</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 