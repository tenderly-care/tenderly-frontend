import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  UserIcon,
  IdentificationIcon,
  AcademicCapIcon,
  ClockIcon,
  CogIcon,
  ShieldCheckIcon,
  PencilIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  TrashIcon,
  InformationCircleIcon,
  CalendarIcon,
  CurrencyRupeeIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  BuildingOfficeIcon,
  UserGroupIcon,
  DocumentTextIcon,
  XMarkIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { 
  doctorProfileApi, 
  DoctorProfileResponse, 
  UpdateProfessionalInfoRequest, 
  UpdateAvailabilityRequest,
  AvailabilitySlot,
  Qualification,
  Specialization,
  DayOfWeek,
  LicenseVerificationStatus,
  ProfileCompletionStatus
} from '../../services/api/doctorProfileApi';
import toast from 'react-hot-toast';

export const DoctorProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState<DoctorProfileResponse | null>(null);
  const [completionStatus, setCompletionStatus] = useState<ProfileCompletionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<UpdateProfessionalInfoRequest>({});
  const [availabilityData, setAvailabilityData] = useState<AvailabilitySlot[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
  const [editingSlot, setEditingSlot] = useState<AvailabilitySlot | null>(null);
  const [showQualificationModal, setShowQualificationModal] = useState(false);
  const [editingQualification, setEditingQualification] = useState<Qualification | null>(null);
  const [qualificationIndex, setQualificationIndex] = useState<number>(-1);

  // Load profile data
  const loadProfile = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const [profileData, completionData] = await Promise.all([
        doctorProfileApi.getDoctorProfile(user.id),
        doctorProfileApi.getProfileCompletionStatus(user.id)
      ]);
      
      setProfile(profileData);
      setCompletionStatus(completionData);
      
      // Convert qualification strings to objects for the form
      const qualificationObjects: Qualification[] = profileData.professionalInfo.qualification?.map(q => {
        if (typeof q === 'string') {
          // Parse string format like "MBBS from All India Institute of Medical Sciences (2015)"
          const match = q.match(/^(.+?) from (.+?) \((\d+)\)$/);
          if (match) {
            return {
              degree: match[1],
              institution: match[2],
              year: parseInt(match[3])
            };
          } else {
            // Fallback for simple strings
            return {
              degree: q,
              institution: '',
              year: new Date().getFullYear()
            };
          }
        }
        return q as Qualification;
      }) || [];
      
      // Initialize form data
      setFormData({
        specialization: profileData.professionalInfo.specialization,
        experience: profileData.professionalInfo.experience,
        qualification: qualificationObjects,
        workLocation: profileData.professionalInfo.workLocation,
        department: profileData.professionalInfo.department,
        designation: profileData.professionalInfo.designation,
        consultationFee: profileData.professionalInfo.consultationFee,
        professionalPhone: profileData.professionalInfo.professionalPhone,
        professionalEmail: profileData.professionalInfo.professionalEmail,
        biography: profileData.professionalInfo.biography,
        languagesSpoken: profileData.professionalInfo.languagesSpoken,
      });
      
      setAvailabilityData(profileData.professionalInfo.availableSlots || []);
      
    } catch (err: any) {
      setError(err.message || 'Failed to load profile');
      console.error('Profile loading error:', err);
      toast.error(err.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Handle form field changes
  const handleFormChange = (field: keyof UpdateProfessionalInfoRequest, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Save professional info
  const saveProfessionalInfo = async () => {
    try {
      setSaving(true);
      setValidationErrors([]);
      
      const updatedProfile = await doctorProfileApi.updateProfessionalInfo({
        ...formData,
        availableSlots: availabilityData
      });
      
      setProfile(updatedProfile);
      setEditMode(false);
      toast.success('Professional information updated successfully');
      
      // Reload completion status
      if (user?.id) {
        const completionData = await doctorProfileApi.getProfileCompletionStatus(user.id);
        setCompletionStatus(completionData);
      }
      
    } catch (err: any) {
      setError(err.message || 'Failed to update professional information');
      toast.error(err.message || 'Failed to update professional information');
    } finally {
      setSaving(false);
    }
  };

  // Save availability separately
  const saveAvailability = async () => {
    try {
      setSaving(true);
      setValidationErrors([]);
      
      const validation = doctorProfileApi.validateAvailabilitySlots(availabilityData);
      if (!validation.isValid) {
        setValidationErrors(validation.errors);
        toast.error('Please fix validation errors');
        return;
      }
      
      const updatedProfile = await doctorProfileApi.updateAvailability({
        availableSlots: availabilityData
      });
      
      setProfile(updatedProfile);
      setShowAvailabilityModal(false);
      toast.success('Availability updated successfully');
      
    } catch (err: any) {
      setError(err.message || 'Failed to update availability');
      toast.error(err.message || 'Failed to update availability');
    } finally {
      setSaving(false);
    }
  };

  // Cancel edit mode
  const cancelEdit = () => {
    setEditMode(false);
    setValidationErrors([]);
    // Reset form data to original values
    if (profile) {
      // Convert qualification strings to objects for the form
      const qualificationObjects: Qualification[] = profile.professionalInfo.qualification?.map(q => {
        if (typeof q === 'string') {
          const match = q.match(/^(.+?) from (.+?) \((\d+)\)$/);
          if (match) {
            return {
              degree: match[1],
              institution: match[2],
              year: parseInt(match[3])
            };
          } else {
            return {
              degree: q,
              institution: '',
              year: new Date().getFullYear()
            };
          }
        }
        return q as Qualification;
      }) || [];
      
      setFormData({
        specialization: profile.professionalInfo.specialization,
        experience: profile.professionalInfo.experience,
        qualification: qualificationObjects,
        workLocation: profile.professionalInfo.workLocation,
        department: profile.professionalInfo.department,
        designation: profile.professionalInfo.designation,
        consultationFee: profile.professionalInfo.consultationFee,
        professionalPhone: profile.professionalInfo.professionalPhone,
        professionalEmail: profile.professionalInfo.professionalEmail,
        biography: profile.professionalInfo.biography,
        languagesSpoken: profile.professionalInfo.languagesSpoken,
      });
      setAvailabilityData(profile.professionalInfo.availableSlots || []);
    }
  };

  // Add availability slot
  const addAvailabilitySlot = () => {
    setEditingSlot({
      day: DayOfWeek.MONDAY,
      startTime: '09:00',
      endTime: '17:00'
    });
    setShowAvailabilityModal(true);
  };

  // Edit availability slot
  const editAvailabilitySlot = (slot: AvailabilitySlot, index: number) => {
    setEditingSlot({ ...slot });
    setShowAvailabilityModal(true);
  };

  // Delete availability slot
  const deleteAvailabilitySlot = (index: number) => {
    setAvailabilityData(prev => prev.filter((_, i) => i !== index));
  };

  // Save availability slot
  const saveAvailabilitySlot = () => {
    if (!editingSlot) return;
    
    const validation = doctorProfileApi.validateAvailabilitySlots([editingSlot]);
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      return;
    }

    setAvailabilityData(prev => {
      const existingIndex = prev.findIndex(slot => slot.day === editingSlot.day);
      if (existingIndex >= 0) {
        // Update existing slot
        const updated = [...prev];
        updated[existingIndex] = editingSlot;
        return updated;
      } else {
        // Add new slot
        return [...prev, editingSlot];
      }
    });
    
    setEditingSlot(null);
    setShowAvailabilityModal(false);
    setValidationErrors([]);
  };

  // Add qualification
  const addQualification = () => {
    setEditingQualification({
      degree: '',
      institution: '',
      year: new Date().getFullYear()
    });
    setQualificationIndex(-1);
    setShowQualificationModal(true);
  };

  // Edit qualification
  const editQualification = (qualification: Qualification, index: number) => {
    setEditingQualification({ ...qualification });
    setQualificationIndex(index);
    setShowQualificationModal(true);
  };

  // Delete qualification
  const deleteQualification = (index: number) => {
    const currentQualifications = formData.qualification || [];
    const updatedQualifications = currentQualifications.filter((_, i) => i !== index);
    handleFormChange('qualification', updatedQualifications);
  };

  // Save qualification
  const saveQualification = () => {
    if (!editingQualification) return;
    
    // Validate qualification
    if (!editingQualification.degree.trim()) {
      setValidationErrors(['Degree is required']);
      return;
    }
    
    if (!editingQualification.institution.trim()) {
      setValidationErrors(['Institution is required']);
      return;
    }
    
    if (editingQualification.year < 1950 || editingQualification.year > new Date().getFullYear()) {
      setValidationErrors(['Year must be between 1950 and current year']);
      return;
    }

    const currentQualifications = formData.qualification || [];
    
    if (qualificationIndex >= 0) {
      // Update existing qualification
      const updated = [...currentQualifications];
      updated[qualificationIndex] = editingQualification;
      handleFormChange('qualification', updated);
    } else {
      // Add new qualification
      handleFormChange('qualification', [...currentQualifications, editingQualification]);
    }
    
    setEditingQualification(null);
    setShowQualificationModal(false);
    setQualificationIndex(-1);
    setValidationErrors([]);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <LoadingSpinner />
          <p className="mt-4 text-gray-600">Loading your profile...</p>
        </div>
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

  const getLicenseStatusColor = (status: LicenseVerificationStatus) => {
    switch (status) {
      case LicenseVerificationStatus.VERIFIED:
        return 'text-green-600 bg-green-100';
      case LicenseVerificationStatus.PENDING:
        return 'text-yellow-600 bg-yellow-100';
      case LicenseVerificationStatus.REJECTED:
        return 'text-red-600 bg-red-100';
      case LicenseVerificationStatus.EXPIRED:
        return 'text-orange-600 bg-orange-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getLicenseStatusText = (status: LicenseVerificationStatus) => {
    switch (status) {
      case LicenseVerificationStatus.VERIFIED:
        return 'Verified';
      case LicenseVerificationStatus.PENDING:
        return 'Pending Verification';
      case LicenseVerificationStatus.REJECTED:
        return 'Rejected';
      case LicenseVerificationStatus.EXPIRED:
        return 'Expired';
      default:
        return 'Unknown';
    }
  };

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
                    onClick={cancelEdit}
                    className="btn-secondary"
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveProfessionalInfo}
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
        {/* Error Messages */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2" />
              <p className="text-sm font-medium text-red-700">Validation Errors</p>
            </div>
            <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
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
                    {profile.basicInfo.profilePicture ? (
                      <img
                        src={profile.basicInfo.profilePicture}
                        alt="Profile"
                        className="w-24 h-24 rounded-full object-cover"
                      />
                    ) : (
                      <UserIcon className="h-12 w-12 text-gray-400" />
                    )}
                  </div>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mt-4">
                  Dr. {profile.basicInfo.firstName} {profile.basicInfo.lastName}
                </h3>
                <p className="text-sm text-gray-600">
                  {profile.professionalInfo.specialization?.map(spec => 
                    doctorProfileApi.formatSpecialization(spec)
                  ).join(', ')}
                </p>
                
                {/* License Status */}
                <div className="mt-3">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getLicenseStatusColor(profile.professionalInfo.licenseVerificationStatus)}`}>
                    <ShieldCheckIcon className="h-3 w-3 mr-1" />
                    {getLicenseStatusText(profile.professionalInfo.licenseVerificationStatus)}
                  </span>
                </div>

                {/* Profile Completion */}
                {completionStatus && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Profile Completion</span>
                      <span className="font-medium">{completionStatus.completionPercentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${completionStatus.completionPercentage}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Navigation Tabs */}
              <nav className="space-y-1">
                {[
                  { id: 'overview', name: 'Overview', icon: UserIcon, description: 'Profile summary' },
                  { id: 'personal', name: 'Personal Info', icon: IdentificationIcon, description: 'Basic information' },
                  { id: 'credentials', name: 'Credentials', icon: AcademicCapIcon, description: 'Medical qualifications' },
                  { id: 'availability', name: 'Availability', icon: ClockIcon, description: 'Schedule' },
                  { id: 'preferences', name: 'Preferences', icon: CogIcon, description: 'Settings' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <tab.icon className="h-5 w-5 mr-3" />
                    <div className="text-left">
                      <div>{tab.name}</div>
                      <div className="text-xs text-gray-500">{tab.description}</div>
                    </div>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6">
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-medium text-gray-900">Profile Overview</h3>
                    
                    {/* Profile Completion Status */}
                    {completionStatus && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center mb-3">
                          <InformationCircleIcon className="h-5 w-5 text-blue-400 mr-2" />
                          <h4 className="font-medium text-blue-900">Profile Completion</h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-blue-700 mb-2">
                              Your profile is {completionStatus.completionPercentage}% complete
                            </p>
                            <div className="w-full bg-blue-200 rounded-full h-3">
                              <div 
                                className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                                style={{ width: `${completionStatus.completionPercentage}%` }}
                              />
                            </div>
                          </div>
                          <div>
                            <p className="text-sm text-blue-700 mb-2">
                              {completionStatus.canAcceptConsultations 
                                ? '✅ Ready to accept consultations' 
                                : '❌ Cannot accept consultations yet'
                              }
                            </p>
                          </div>
                        </div>
                        
                        {completionStatus.missingFields.length > 0 && (
                          <div className="mt-4">
                            <p className="text-sm font-medium text-blue-900 mb-2">Missing Required Fields:</p>
                            <ul className="list-disc list-inside text-sm text-blue-700 space-y-1">
                              {completionStatus.missingFields.map((field, index) => (
                                <li key={index}>{field}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Professional Information Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-3">Professional Info</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Experience:</span>
                            <span className="font-medium">{profile.professionalInfo.experience || 0} years</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Consultation Fee:</span>
                            <span className="font-medium">₹{profile.professionalInfo.consultationFee || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Work Location:</span>
                            <span className="font-medium">{profile.professionalInfo.workLocation || 'Not specified'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Department:</span>
                            <span className="font-medium">{profile.professionalInfo.department || 'Not specified'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-3">Availability</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Available Days:</span>
                            <span className="font-medium">
                              {profile.professionalInfo.availableSlots?.length || 0} days
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Languages:</span>
                            <span className="font-medium">
                              {profile.professionalInfo.languagesSpoken?.length || 0} languages
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Last Updated:</span>
                            <span className="font-medium">
                              {profile.professionalInfo.lastUpdated 
                                ? new Date(profile.professionalInfo.lastUpdated).toLocaleDateString()
                                : 'Never'
                              }
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Verification Status */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3">Verification Status</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex items-center">
                          <div className={`w-3 h-3 rounded-full mr-2 ${profile.verificationStatus.isProfileComplete ? 'bg-green-500' : 'bg-red-500'}`} />
                          <span className="text-sm">Profile Complete</span>
                        </div>
                        <div className="flex items-center">
                          <div className={`w-3 h-3 rounded-full mr-2 ${profile.verificationStatus.isLicenseVerified ? 'bg-green-500' : 'bg-red-500'}`} />
                          <span className="text-sm">License Verified</span>
                        </div>
                        <div className="flex items-center">
                          <div className={`w-3 h-3 rounded-full mr-2 ${profile.verificationStatus.canAcceptConsultations ? 'bg-green-500' : 'bg-red-500'}`} />
                          <span className="text-sm">Can Accept Consultations</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Personal Info Tab */}
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
                          value={profile.basicInfo.firstName}
                          disabled
                          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Last Name
                        </label>
                        <input
                          type="text"
                          value={profile.basicInfo.lastName}
                          disabled
                          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email
                        </label>
                        <input
                          type="email"
                          value={profile.basicInfo.email}
                          disabled
                          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Phone
                        </label>
                        <input
                          type="tel"
                          value={profile.basicInfo.phone}
                          disabled
                          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Credentials Tab */}
                {activeTab === 'credentials' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-medium text-gray-900">Professional Credentials</h3>
                    
                    {editMode ? (
                      <div className="space-y-6">
                        {/* Specialization */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Specializations
                          </label>
                          <select
                            multiple
                            value={formData.specialization || []}
                            onChange={(e) => {
                              const selected = Array.from(e.target.selectedOptions, option => option.value as Specialization);
                              handleFormChange('specialization', selected);
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          >
                            {doctorProfileApi.getAllSpecializations().map(spec => (
                              <option key={spec.value} value={spec.value}>
                                {spec.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Experience */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Years of Experience
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="50"
                            value={formData.experience || ''}
                            onChange={(e) => handleFormChange('experience', parseInt(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          />
                        </div>

                        {/* Qualifications */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-medium text-gray-700">
                              Qualifications
                            </label>
                            <button
                              type="button"
                              onClick={addQualification}
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                            >
                              <PlusIcon className="h-4 w-4 inline mr-1" />
                              Add Qualification
                            </button>
                          </div>
                          
                          {formData.qualification && formData.qualification.length > 0 ? (
                            <div className="space-y-2">
                              {formData.qualification.map((qual, index) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                                  <div className="flex-1">
                                    <p className="font-medium text-gray-900">{qual.degree}</p>
                                    <p className="text-sm text-gray-600">{qual.institution} ({qual.year})</p>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <button
                                      onClick={() => editQualification(qual, index)}
                                      className="text-blue-600 hover:text-blue-800"
                                    >
                                      <PencilIcon className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={() => deleteQualification(index)}
                                      className="text-red-600 hover:text-red-800"
                                    >
                                      <TrashIcon className="h-4 w-4" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-4 text-gray-500">
                              <AcademicCapIcon className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                              <p>No qualifications added yet</p>
                              <button
                                onClick={addQualification}
                                className="text-blue-600 hover:text-blue-800 text-sm font-medium mt-2"
                              >
                                Add your first qualification
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Consultation Fee */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Consultation Fee (₹)
                          </label>
                          <input
                            type="number"
                            min="100"
                            max="10000"
                            value={formData.consultationFee || ''}
                            onChange={(e) => handleFormChange('consultationFee', parseInt(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          />
                        </div>

                        {/* Work Location */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Work Location
                          </label>
                          <input
                            type="text"
                            value={formData.workLocation || ''}
                            onChange={(e) => handleFormChange('workLocation', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            placeholder="e.g., Apollo Hospital, Delhi"
                          />
                        </div>

                        {/* Department */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Department
                          </label>
                          <input
                            type="text"
                            value={formData.department || ''}
                            onChange={(e) => handleFormChange('department', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            placeholder="e.g., Cardiology Department"
                          />
                        </div>

                        {/* Designation */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Designation
                          </label>
                          <input
                            type="text"
                            value={formData.designation || ''}
                            onChange={(e) => handleFormChange('designation', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            placeholder="e.g., Senior Consultant"
                          />
                        </div>

                        {/* Professional Phone */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Professional Phone
                          </label>
                          <input
                            type="tel"
                            value={formData.professionalPhone || ''}
                            onChange={(e) => handleFormChange('professionalPhone', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            placeholder="+919876543210"
                          />
                        </div>

                        {/* Professional Email */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Professional Email
                          </label>
                          <input
                            type="email"
                            value={formData.professionalEmail || ''}
                            onChange={(e) => handleFormChange('professionalEmail', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            placeholder="dr.john@hospital.com"
                          />
                        </div>

                        {/* Biography */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Biography
                          </label>
                          <textarea
                            rows={4}
                            value={formData.biography || ''}
                            onChange={(e) => handleFormChange('biography', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            placeholder="Brief about your specialization and approach to patient care..."
                          />
                        </div>

                        {/* Languages Spoken */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Languages Spoken (comma-separated)
                          </label>
                          <input
                            type="text"
                            value={formData.languagesSpoken?.join(', ') || ''}
                            onChange={(e) => handleFormChange('languagesSpoken', e.target.value.split(',').map(lang => lang.trim()))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            placeholder="English, Hindi, Bengali"
                          />
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="bg-gray-50 rounded-lg p-4">
                            <h4 className="font-medium text-gray-900 mb-3">Professional Details</h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Specializations:</span>
                                <span className="font-medium">
                                  {profile.professionalInfo.specialization?.map(spec => 
                                    doctorProfileApi.formatSpecialization(spec)
                                  ).join(', ') || 'Not specified'}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Experience:</span>
                                <span className="font-medium">{profile.professionalInfo.experience || 0} years</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Consultation Fee:</span>
                                <span className="font-medium">₹{profile.professionalInfo.consultationFee || 0}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Work Location:</span>
                                <span className="font-medium">{profile.professionalInfo.workLocation || 'Not specified'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Department:</span>
                                <span className="font-medium">{profile.professionalInfo.department || 'Not specified'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Designation:</span>
                                <span className="font-medium">{profile.professionalInfo.designation || 'Not specified'}</span>
                              </div>
                            </div>
                          </div>

                          <div className="bg-gray-50 rounded-lg p-4">
                            <h4 className="font-medium text-gray-900 mb-3">Contact Information</h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Professional Phone:</span>
                                <span className="font-medium">{profile.professionalInfo.professionalPhone || 'Not specified'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Professional Email:</span>
                                <span className="font-medium">{profile.professionalInfo.professionalEmail || 'Not specified'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Languages:</span>
                                <span className="font-medium">
                                  {profile.professionalInfo.languagesSpoken?.join(', ') || 'Not specified'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Qualifications Section */}
                        <div className="mt-6 bg-gray-50 rounded-lg p-4">
                          <h4 className="font-medium text-gray-900 mb-3">Qualifications</h4>
                          {profile.professionalInfo.qualification && profile.professionalInfo.qualification.length > 0 ? (
                            <div className="space-y-2">
                              {profile.professionalInfo.qualification.map((qual, index) => (
                                <div key={index} className="p-3 bg-white rounded-md border border-gray-200">
                                  {typeof qual === 'string' ? (
                                    <p className="text-sm text-gray-900">{qual}</p>
                                  ) : (
                                    <div>
                                      <p className="font-medium text-gray-900">{qual.degree}</p>
                                      <p className="text-sm text-gray-600">{qual.institution} ({qual.year})</p>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500">No qualifications specified</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Availability Tab */}
                {activeTab === 'availability' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-gray-900">Availability Schedule</h3>
                      <button
                        onClick={addAvailabilitySlot}
                        className="btn-primary flex items-center"
                      >
                        <PlusIcon className="h-4 w-4 mr-2" />
                        Add Slot
                      </button>
                    </div>
                    
                    {availabilityData.length === 0 ? (
                      <div className="text-center py-12">
                        <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Availability Set</h3>
                        <p className="text-gray-600 mb-4">Add your availability slots to start accepting consultations.</p>
                        <button
                          onClick={addAvailabilitySlot}
                          className="btn-primary"
                        >
                          Add First Slot
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {availabilityData.map((slot, index) => (
                          <div key={index} className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <CalendarIcon className="h-5 w-5 text-gray-400" />
                              <div>
                                <p className="font-medium text-gray-900">
                                  {slot.day.charAt(0).toUpperCase() + slot.day.slice(1)}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {slot.startTime} - {slot.endTime}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => editAvailabilitySlot(slot, index)}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                <PencilIcon className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => deleteAvailabilitySlot(index)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Preferences Tab */}
                {activeTab === 'preferences' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-medium text-gray-900">Preferences</h3>
                    <p className="text-gray-600">This section is under development.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Availability Modal */}
      {showAvailabilityModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {editingSlot ? 'Edit' : 'Add'} Availability Slot
              </h3>
              <button
                onClick={() => {
                  setShowAvailabilityModal(false);
                  setEditingSlot(null);
                  setValidationErrors([]);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            {validationErrors.length > 0 && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
                <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Day of Week
                </label>
                <select
                  value={editingSlot?.day || DayOfWeek.MONDAY}
                  onChange={(e) => setEditingSlot(prev => prev ? { ...prev, day: e.target.value as DayOfWeek } : null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  {doctorProfileApi.getAllDaysOfWeek().map(day => (
                    <option key={day.value} value={day.value}>
                      {day.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={editingSlot?.startTime || '09:00'}
                    onChange={(e) => setEditingSlot(prev => prev ? { ...prev, startTime: e.target.value } : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={editingSlot?.endTime || '17:00'}
                    onChange={(e) => setEditingSlot(prev => prev ? { ...prev, endTime: e.target.value } : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowAvailabilityModal(false);
                  setEditingSlot(null);
                  setValidationErrors([]);
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={saveAvailabilitySlot}
                className="btn-primary"
              >
                Save Slot
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Qualification Modal */}
      {showQualificationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {editingQualification ? 'Edit' : 'Add'} Qualification
              </h3>
              <button
                onClick={() => {
                  setShowQualificationModal(false);
                  setEditingQualification(null);
                  setQualificationIndex(-1);
                  setValidationErrors([]);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            {validationErrors.length > 0 && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
                <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Degree
                </label>
                <input
                  type="text"
                  value={editingQualification?.degree || ''}
                  onChange={(e) => setEditingQualification(prev => prev ? { ...prev, degree: e.target.value } : null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="e.g., MBBS"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Institution
                </label>
                <input
                  type="text"
                  value={editingQualification?.institution || ''}
                  onChange={(e) => setEditingQualification(prev => prev ? { ...prev, institution: e.target.value } : null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="e.g., All India Institute of Medical Sciences"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Year of Passing
                </label>
                <input
                  type="number"
                  min="1900"
                  max={new Date().getFullYear()}
                  value={editingQualification?.year || ''}
                  onChange={(e) => setEditingQualification(prev => prev ? { ...prev, year: parseInt(e.target.value) || 0 } : null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowQualificationModal(false);
                  setEditingQualification(null);
                  setQualificationIndex(-1);
                  setValidationErrors([]);
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={saveQualification}
                className="btn-primary"
              >
                Save Qualification
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
