import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  UserIcon,
  IdentificationIcon,
  AcademicCapIcon,
  ClockIcon,
  CogIcon,
  ShieldCheckIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  CalendarIcon,
  StarIcon,
  DocumentTextIcon,
  CameraIcon,
  PencilIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';

interface DoctorProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  specialization: string;
  experience: number;
  education: string;
  licenseNumber: string;
  licenseExpiry: string;
  hospital: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  consultationFee: number;
  rating: number;
  totalConsultations: number;
  availability: {
    monday: { start: string; end: string; available: boolean };
    tuesday: { start: string; end: string; available: boolean };
    wednesday: { start: string; end: string; available: boolean };
    thursday: { start: string; end: string; available: boolean };
    friday: { start: string; end: string; available: boolean };
    saturday: { start: string; end: string; available: boolean };
    sunday: { start: string; end: string; available: boolean };
  };
  consultationTypes: string[];
  languages: string[];
  profileImage?: string;
}

export const DoctorProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState<DoctorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'personal' | 'credentials' | 'availability' | 'preferences'>('personal');
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      // Mock profile data - in real app, this would come from API
      const mockProfile: DoctorProfile = {
        id: user?.id || '',
        firstName: user?.firstName || 'Dr. John',
        lastName: user?.lastName || 'Smith',
        email: user?.email || 'john.smith@example.com',
        phone: '+91 98765 43210',
        specialization: 'Cardiology',
        experience: 8,
        education: 'MBBS, MD (Cardiology)',
        licenseNumber: 'MED123456789',
        licenseExpiry: '2025-12-31',
        hospital: 'City Heart Hospital',
        address: '123 Medical Center',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
        consultationFee: 1500,
        rating: 4.8,
        totalConsultations: 1250,
        availability: {
          monday: { start: '09:00', end: '17:00', available: true },
          tuesday: { start: '09:00', end: '17:00', available: true },
          wednesday: { start: '09:00', end: '17:00', available: true },
          thursday: { start: '09:00', end: '17:00', available: true },
          friday: { start: '09:00', end: '17:00', available: true },
          saturday: { start: '09:00', end: '13:00', available: true },
          sunday: { start: '', end: '', available: false },
        },
        consultationTypes: ['video', 'tele', 'chat'],
        languages: ['English', 'Hindi', 'Marathi'],
      };
      
      setProfile(mockProfile);
    } catch (err) {
      setError('Failed to load profile');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      // In real app, this would save to API
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSuccess('Profile updated successfully');
      setEditMode(false);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to update profile');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleAvailabilityChange = (day: string, field: 'start' | 'end' | 'available', value: string | boolean) => {
    if (!profile) return;
    
    setProfile(prev => prev ? {
      ...prev,
      availability: {
        ...prev.availability,
        [day]: {
          ...prev.availability[day as keyof typeof prev.availability],
          [field]: value
        }
      }
    } : null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <UserIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Profile Not Found</h3>
          <p className="text-gray-600 mb-4">Unable to load your profile information.</p>
          <button
            onClick={() => navigate('/doctor/dashboard')}
            className="btn-primary"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Profile Settings</h1>
              <p className="text-sm text-gray-600">Manage your professional profile</p>
            </div>
            <div className="flex items-center space-x-3">
              {editMode ? (
                <>
                  <button
                    onClick={() => setEditMode(false)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="btn-primary"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setEditMode(true)}
                  className="btn-primary flex items-center"
                >
                  <PencilIcon className="h-4 w-4 mr-2" />
                  Edit Profile
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <CheckCircleIcon className="h-5 w-5 text-green-400 mr-2" />
              <p className="text-sm text-green-700">{success}</p>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              {/* Profile Image */}
              <div className="text-center mb-6">
                <div className="relative inline-block">
                  <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center">
                    {profile.profileImage ? (
                      <img
                        src={profile.profileImage}
                        alt="Profile"
                        className="w-24 h-24 rounded-full object-cover"
                      />
                    ) : (
                      <UserIcon className="h-12 w-12 text-gray-400" />
                    )}
                  </div>
                  {editMode && (
                    <button className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700">
                      <CameraIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <h3 className="text-lg font-medium text-gray-900 mt-4">
                  Dr. {profile.firstName} {profile.lastName}
                </h3>
                <p className="text-sm text-gray-600">{profile.specialization}</p>
                <div className="flex items-center justify-center mt-2">
                  <StarIcon className="h-4 w-4 text-yellow-400" />
                  <span className="text-sm text-gray-600 ml-1">{profile.rating}/5</span>
                  <span className="text-sm text-gray-500 ml-2">({profile.totalConsultations} consultations)</span>
                </div>
              </div>

              {/* Navigation Tabs */}
              <nav className="space-y-1">
                {[
                  { id: 'personal', name: 'Personal Info', icon: UserIcon },
                  { id: 'credentials', name: 'Credentials', icon: AcademicCapIcon },
                  { id: 'availability', name: 'Availability', icon: ClockIcon },
                  { id: 'preferences', name: 'Preferences', icon: CogIcon },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                      activeTab === tab.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <tab.icon className="h-5 w-5 mr-3" />
                    {tab.name}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6">
                {/* Personal Information Tab */}
                {activeTab === 'personal' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-medium text-gray-900">Personal Information</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          First Name
                        </label>
                        <input
                          type="text"
                          value={profile.firstName}
                          onChange={(e) => setProfile(prev => prev ? { ...prev, firstName: e.target.value } : null)}
                          disabled={!editMode}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Last Name
                        </label>
                        <input
                          type="text"
                          value={profile.lastName}
                          onChange={(e) => setProfile(prev => prev ? { ...prev, lastName: e.target.value } : null)}
                          disabled={!editMode}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email
                        </label>
                        <input
                          type="email"
                          value={profile.email}
                          onChange={(e) => setProfile(prev => prev ? { ...prev, email: e.target.value } : null)}
                          disabled={!editMode}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Phone
                        </label>
                        <input
                          type="tel"
                          value={profile.phone}
                          onChange={(e) => setProfile(prev => prev ? { ...prev, phone: e.target.value } : null)}
                          disabled={!editMode}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Hospital/Clinic
                        </label>
                        <input
                          type="text"
                          value={profile.hospital}
                          onChange={(e) => setProfile(prev => prev ? { ...prev, hospital: e.target.value } : null)}
                          disabled={!editMode}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Consultation Fee (₹)
                        </label>
                        <input
                          type="number"
                          value={profile.consultationFee}
                          onChange={(e) => setProfile(prev => prev ? { ...prev, consultationFee: parseInt(e.target.value) } : null)}
                          disabled={!editMode}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Address
                      </label>
                      <textarea
                        value={`${profile.address}, ${profile.city}, ${profile.state} - ${profile.pincode}`}
                        onChange={(e) => {
                          // In real app, this would parse the address properly
                          setProfile(prev => prev ? { ...prev, address: e.target.value } : null);
                        }}
                        disabled={!editMode}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                      />
                    </div>
                  </div>
                )}

                {/* Credentials Tab */}
                {activeTab === 'credentials' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-medium text-gray-900">Medical Credentials</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Specialization
                        </label>
                        <input
                          type="text"
                          value={profile.specialization}
                          onChange={(e) => setProfile(prev => prev ? { ...prev, specialization: e.target.value } : null)}
                          disabled={!editMode}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Years of Experience
                        </label>
                        <input
                          type="number"
                          value={profile.experience}
                          onChange={(e) => setProfile(prev => prev ? { ...prev, experience: parseInt(e.target.value) } : null)}
                          disabled={!editMode}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Education
                        </label>
                        <input
                          type="text"
                          value={profile.education}
                          onChange={(e) => setProfile(prev => prev ? { ...prev, education: e.target.value } : null)}
                          disabled={!editMode}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          License Number
                        </label>
                        <input
                          type="text"
                          value={profile.licenseNumber}
                          onChange={(e) => setProfile(prev => prev ? { ...prev, licenseNumber: e.target.value } : null)}
                          disabled={!editMode}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          License Expiry Date
                        </label>
                        <input
                          type="date"
                          value={profile.licenseExpiry}
                          onChange={(e) => setProfile(prev => prev ? { ...prev, licenseExpiry: e.target.value } : null)}
                          disabled={!editMode}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Availability Tab */}
                {activeTab === 'availability' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-medium text-gray-900">Availability Schedule</h3>
                    
                    <div className="space-y-4">
                      {Object.entries(profile.availability).map(([day, schedule]) => (
                        <div key={day} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium text-gray-900 capitalize">{day}</h4>
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={schedule.available}
                                onChange={(e) => handleAvailabilityChange(day, 'available', e.target.checked)}
                                disabled={!editMode}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                              <span className="ml-2 text-sm text-gray-700">Available</span>
                            </label>
                          </div>
                          
                          {schedule.available && (
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Start Time
                                </label>
                                <input
                                  type="time"
                                  value={schedule.start}
                                  onChange={(e) => handleAvailabilityChange(day, 'start', e.target.value)}
                                  disabled={!editMode}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  End Time
                                </label>
                                <input
                                  type="time"
                                  value={schedule.end}
                                  onChange={(e) => handleAvailabilityChange(day, 'end', e.target.value)}
                                  disabled={!editMode}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Preferences Tab */}
                {activeTab === 'preferences' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-medium text-gray-900">Consultation Preferences</h3>
                    
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          Consultation Types
                        </label>
                        <div className="space-y-2">
                          {['video', 'tele', 'chat'].map((type) => (
                            <label key={type} className="flex items-center">
                              <input
                                type="checkbox"
                                checked={profile.consultationTypes.includes(type)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setProfile(prev => prev ? {
                                      ...prev,
                                      consultationTypes: [...prev.consultationTypes, type]
                                    } : null);
                                  } else {
                                    setProfile(prev => prev ? {
                                      ...prev,
                                      consultationTypes: prev.consultationTypes.filter(t => t !== type)
                                    } : null);
                                  }
                                }}
                                disabled={!editMode}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                              <span className="ml-2 text-sm text-gray-700 capitalize">{type}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Languages Spoken
                        </label>
                        <input
                          type="text"
                          value={profile.languages.join(', ')}
                          onChange={(e) => setProfile(prev => prev ? {
                            ...prev,
                            languages: e.target.value.split(',').map(lang => lang.trim())
                          } : null)}
                          disabled={!editMode}
                          placeholder="English, Hindi, Marathi"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                        />
                        <p className="text-xs text-gray-500 mt-1">Separate languages with commas</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 