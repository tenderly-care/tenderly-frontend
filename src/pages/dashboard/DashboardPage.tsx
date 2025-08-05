import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  ChatBubbleLeftRightIcon,
  CreditCardIcon,
  DocumentTextIcon,
  CalendarIcon,
  UserIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  // Mock data - in real app, this would come from API
  const stats = [
    {
      name: 'Total Consultations',
      value: '12',
      change: '+2.5%',
      changeType: 'positive',
      icon: ChatBubbleLeftRightIcon,
    },
    {
      name: 'Active Prescriptions',
      value: '3',
      change: '+1',
      changeType: 'positive',
      icon: DocumentTextIcon,
    },
    {
      name: 'Total Spent',
      value: '₹2,450',
      change: '+₹150',
      changeType: 'positive',
      icon: CreditCardIcon,
    },
    {
      name: 'Upcoming Appointments',
      value: '2',
      change: 'Next: Tomorrow',
      changeType: 'neutral',
      icon: CalendarIcon,
    },
  ];

  const recentConsultations = [
    {
      id: '1',
      type: 'Video Consultation',
      doctor: 'Dr. Sarah Johnson',
      date: '2024-01-15',
      status: 'completed',
      amount: '₹250',
    },
    {
      id: '2',
      type: 'Chat Consultation',
      doctor: 'Dr. Michael Chen',
      date: '2024-01-14',
      status: 'completed',
      amount: '₹150',
    },
    {
      id: '3',
      type: 'Emergency Consultation',
      doctor: 'Dr. Emily Davis',
      date: '2024-01-13',
      status: 'completed',
      amount: '₹300',
    },
  ];

  const upcomingAppointments = [
    {
      id: '1',
      type: 'Video Consultation',
      doctor: 'Dr. Robert Wilson',
      date: '2024-01-20',
      time: '10:00 AM',
      status: 'scheduled',
    },
    {
      id: '2',
      type: 'Chat Consultation',
      doctor: 'Dr. Lisa Brown',
      date: '2024-01-22',
      time: '2:30 PM',
      status: 'scheduled',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back, {user?.firstName}!
            </h1>
            <p className="text-gray-600 mt-1">
              Here's what's happening with your health today.
            </p>
          </div>
          <div className="flex space-x-3">
            <Link
              to="/consultation"
              className="btn-primary"
            >
              New Consultation
            </Link>
            <Link
              to="/profile"
              className="btn-secondary"
            >
              <UserIcon className="h-4 w-4 mr-2" />
              Profile
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
                <stat.icon className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                <p className={`text-sm ${
                  stat.changeType === 'positive' ? 'text-green-600' : 
                  stat.changeType === 'negative' ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {stat.change}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Consultations */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Consultations</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {recentConsultations.map((consultation) => (
              <div key={consultation.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <ChatBubbleLeftRightIcon className="h-5 w-5 text-blue-600 mr-2" />
                      <span className="font-medium text-gray-900">{consultation.type}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{consultation.doctor}</p>
                    <div className="flex items-center mt-2">
                      <ClockIcon className="h-4 w-4 text-gray-400 mr-1" />
                      <span className="text-sm text-gray-500">{consultation.date}</span>
                      <span className={`ml-2 px-2 py-1 text-xs rounded-full ${getStatusColor(consultation.status)}`}>
                        {consultation.status}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{consultation.amount}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="px-6 py-4 border-t border-gray-200">
            <Link
              to="/consultation"
              className="text-blue-600 hover:text-blue-500 text-sm font-medium"
            >
              View all consultations →
            </Link>
          </div>
        </div>

        {/* Upcoming Appointments */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Upcoming Appointments</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {upcomingAppointments.map((appointment) => (
              <div key={appointment.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <CalendarIcon className="h-5 w-5 text-green-600 mr-2" />
                      <span className="font-medium text-gray-900">{appointment.type}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{appointment.doctor}</p>
                    <div className="flex items-center mt-2">
                      <ClockIcon className="h-4 w-4 text-gray-400 mr-1" />
                      <span className="text-sm text-gray-500">
                        {appointment.date} at {appointment.time}
                      </span>
                      <span className={`ml-2 px-2 py-1 text-xs rounded-full ${getStatusColor(appointment.status)}`}>
                        {appointment.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button className="text-blue-600 hover:text-blue-500 text-sm font-medium">
                      Reschedule
                    </button>
                    <button className="text-red-600 hover:text-red-500 text-sm font-medium">
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="px-6 py-4 border-t border-gray-200">
            <Link
              to="/schedule"
              className="text-blue-600 hover:text-blue-500 text-sm font-medium"
            >
              Schedule new appointment →
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/consultation"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
          >
            <ChatBubbleLeftRightIcon className="h-6 w-6 text-blue-600 mr-3" />
            <div>
              <p className="font-medium text-gray-900">New Consultation</p>
              <p className="text-sm text-gray-600">Book a consultation</p>
            </div>
          </Link>
          
          <Link
            to="/prescription"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
          >
            <DocumentTextIcon className="h-6 w-6 text-green-600 mr-3" />
            <div>
              <p className="font-medium text-gray-900">Prescriptions</p>
              <p className="text-sm text-gray-600">View prescriptions</p>
            </div>
          </Link>
          
          <Link
            to="/payment"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
          >
            <CreditCardIcon className="h-6 w-6 text-purple-600 mr-3" />
            <div>
              <p className="font-medium text-gray-900">Payments</p>
              <p className="text-sm text-gray-600">Manage payments</p>
            </div>
          </Link>
          
          <Link
            to="/profile"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
          >
            <UserIcon className="h-6 w-6 text-orange-600 mr-3" />
            <div>
              <p className="font-medium text-gray-900">Profile</p>
              <p className="text-sm text-gray-600">Update profile</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}; 