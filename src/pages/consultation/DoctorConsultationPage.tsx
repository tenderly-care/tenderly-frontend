import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  UserIcon,
  ClockIcon,
  CalendarIcon,
  ChatBubbleLeftIcon,
  VideoCameraIcon,
  PhoneIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  DocumentTextIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  PlusIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { consultationApi, Consultation } from '../../services/api/consultationApi';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';

interface ConsultationWithPatient extends Consultation {
  patientName: string;
  patientAge?: number;
  patientGender?: string;
  symptoms: string[];
  diagnosis: string;
  prescription: string;
  amount: number;
}

export const DoctorConsultationPage: React.FC = () => {
  const navigate = useNavigate();
  const [consultations, setConsultations] = useState<ConsultationWithPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'active' | 'completed'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'chat' | 'tele' | 'video' | 'emergency'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedConsultation, setSelectedConsultation] = useState<ConsultationWithPatient | null>(null);

  useEffect(() => {
    loadConsultations();
  }, []);

  const loadConsultations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📋 Loading doctor consultations...');
      console.log('🔍 API Base URL:', 'http://localhost:3000/api/v1');
      console.log('🔍 Full endpoint URL:', 'http://localhost:3000/api/v1/consultations/doctor/me');
      
      const response = await consultationApi.getDoctorConsultations();
      
      console.log('✅ Doctor Consultation API response received:', response);
      console.log('🔍 Response type:', typeof response);
      
      // Handle backend response structure: { consultations: [...], total: number }
      let data: Consultation[] = [];
      if (response && typeof response === 'object') {
        if ('consultations' in response && Array.isArray((response as any).consultations)) {
          data = (response as any).consultations;
          console.log('🔍 Extracted consultations array:', data.length, 'consultations');
          console.log('🔍 Total from backend:', (response as any).total);
        } else if (Array.isArray(response)) {
          data = response;
          console.log('🔍 Direct array response:', data.length, 'consultations');
        } else {
          console.error('❌ Unexpected response format:', response);
          throw new Error('Invalid response format from server');
        }
      } else {
        console.error('❌ API returned non-object response:', response);
        throw new Error('Invalid response format from server');
      }
      
      // Process consultation data to extract patient information and create display-friendly structure
      const consultationsWithPatient: ConsultationWithPatient[] = data.map((consultation, index) => {
        console.log(`🔍 Processing consultation ${index + 1}:`, consultation._id);
        console.log('🔍 Consultation object keys:', Object.keys(consultation));
        console.log('🔍 Patient info:', consultation.patientId);
        console.log('🔍 AI output:', consultation.aiAgentOutput?.primary_symptom);
        
        // Extract patient information with null safety
        const firstName = consultation.patientId?.firstName || 'Unknown';
        const lastName = consultation.patientId?.lastName || 'Patient';
        const patientName = `${firstName} ${lastName}`;
        
        const patientAge = consultation.structuredAssessmentInput?.patient_profile?.age || 
                          consultation.aiAgentOutput?.patient_age || 
                          undefined;
        
        // Extract symptoms from structured assessment or AI output with null safety
        const symptoms: string[] = [];
        const primarySymptom = consultation.structuredAssessmentInput?.primary_complaint?.main_symptom;
        const aiSymptom = consultation.aiAgentOutput?.primary_symptom;
        
        if (primarySymptom && typeof primarySymptom === 'string') {
          symptoms.push(primarySymptom);
        }
        if (aiSymptom && typeof aiSymptom === 'string' && !symptoms.includes(aiSymptom)) {
          symptoms.push(aiSymptom);
        }
        
        // Fallback if no symptoms found
        if (symptoms.length === 0) {
          symptoms.push('Not specified');
        }
        
        // Extract diagnosis from AI output with null safety
        const diagnosis = consultation.aiAgentOutput?.possible_diagnoses?.[0]?.name || '';
        
        // Map backend status to frontend status with null safety
        let mappedStatus: 'pending' | 'active' | 'completed' | 'cancelled';
        const currentStatus = consultation.status || 'pending';
        
        switch (currentStatus) {
          case 'active':
            mappedStatus = 'active';
            break;
          case 'clinical_assessment_complete':
            mappedStatus = 'active'; // Still in progress, waiting for doctor
            break;
          case 'completed':
            mappedStatus = 'completed';
            break;
          case 'cancelled':
            mappedStatus = 'cancelled';
            break;
          default:
            mappedStatus = 'pending';
        }
        
        // Safe extraction of payment info
        const paymentInfo = consultation.paymentInfo || {};
        const paymentStatus = paymentInfo.paymentStatus || 'pending';
        const amount = paymentInfo.amount || 0;
        const currency = paymentInfo.currency || 'INR';
        
        // Map payment status with null safety
        let mappedPaymentStatus: 'paid' | 'pending' | 'failed' | 'refunded';
        switch (paymentStatus) {
          case 'completed':
            mappedPaymentStatus = 'paid';
            break;
          case 'pending':
            mappedPaymentStatus = 'pending';
            break;
          case 'failed':
            mappedPaymentStatus = 'failed';
            break;
          case 'refunded':
            mappedPaymentStatus = 'refunded';
            break;
          default:
            mappedPaymentStatus = 'pending';
        }
        
        // Ensure we have a valid unique ID
        const consultationId = consultation._id || consultation.id || `temp-${index}`;
        console.log(`🔍 Mapped consultation ${index + 1} ID:`, consultationId);
        
        return {
          // Original backend fields first
          ...consultation,
          
          // Override specific fields with processed values
          id: consultationId,
          sessionId: consultation.consultationId || 'unknown',
          patientId: consultation.patientId?._id || 'unknown',
          doctorId: consultation.doctorId || 'unknown',
          consultationType: consultation.consultationType || 'chat',
          status: mappedStatus,
          paymentStatus: mappedPaymentStatus,
          amount: amount,
          currency: currency,
          createdAt: consultation.createdAt || new Date().toISOString(),
          updatedAt: consultation.updatedAt || new Date().toISOString(),
          
          // Additional computed fields
          symptoms: symptoms,
          diagnosis: diagnosis,
          prescription: consultation.prescriptionStatus === 'completed' ? 'Available' : '',
          patientName: patientName,
          patientAge: patientAge,
          patientGender: undefined, // Not available in current backend response
        };
      });
      
      setConsultations(consultationsWithPatient);
      console.log(`✅ Successfully loaded and processed ${consultationsWithPatient.length} doctor consultations`);
      
    } catch (err: any) {
      console.error('❌ Load doctor consultations error:', err);
      
      // Enhanced error handling with specific status codes
      let errorMessage = 'Failed to load consultations';
      
      if (err.response?.status === 401) {
        errorMessage = 'Authentication failed. Please log in again.';
      } else if (err.response?.status === 403) {
        errorMessage = 'Access denied. You may not have permission to view consultations.';
      } else if (err.response?.status === 404) {
        errorMessage = 'Doctor consultations endpoint not found. Please contact support.';
      } else if (err.response?.status >= 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (err.code === 'NETWORK_ERROR') {
        errorMessage = 'Network error. Please check your connection and ensure the backend is running.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      setConsultations([]);
      
    } finally {
      setLoading(false);
    }
  };

  const filteredConsultations = consultations.filter(consultation => {
    // Status filter logic
    const matchesStatusFilter = statusFilter === 'all' || consultation.status === statusFilter;
    
    // Consultation type filter logic
    const matchesTypeFilter = typeFilter === 'all' || consultation.consultationType === typeFilter;
    
    // Search filter logic
    const matchesSearch = consultation.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         consultation.symptoms.some(symptom => symptom.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         consultation.diagnosis.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatusFilter && matchesTypeFilter && matchesSearch;
  });

  // Helper function to get consultation type counts for stats
  const getTypeCount = (type: string) => {
    if (type === 'all') return consultations.length;
    return consultations.filter(c => c.consultationType === type).length;
  };

  // Helper function to get consultation type label with count
  const getTypeLabel = (type: string) => {
    const count = getTypeCount(type);
    const label = type === 'all' ? 'All Types' : 
                  type === 'tele' ? 'Tele' :
                  type === 'video' ? 'Video' :
                  type === 'chat' ? 'Chat' :
                  type === 'emergency' ? 'Emergency' : type;
    return `${label} (${count})`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'active':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getConsultationTypeIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <VideoCameraIcon className="h-5 w-5 text-blue-600" />;
      case 'tele':
        return <PhoneIcon className="h-5 w-5 text-green-600" />;
      case 'chat':
        return <ChatBubbleLeftIcon className="h-5 w-5 text-purple-600" />;
      default:
        return <ChatBubbleLeftIcon className="h-5 w-5 text-gray-600" />;
    }
  };

  const handleStartConsultation = (consultation: ConsultationWithPatient) => {
    // In a real app, this would start the consultation session
    navigate(`/consultation/${consultation.id}/session`);
  };

  const handleViewPrescription = (consultation: ConsultationWithPatient) => {
    navigate(`/prescription/workspace/${consultation.id}`);
  };

  const handleCompleteConsultation = async (consultation: ConsultationWithPatient) => {
    try {
      if (!consultation.id) {
        throw new Error('Consultation ID is missing');
      }
      await consultationApi.endConsultation(consultation.id);
      await loadConsultations();
    } catch (err) {
      setError('Failed to complete consultation');
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
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
              <h1 className="text-xl font-semibold text-gray-900">My Consultations</h1>
              <p className="text-sm text-gray-600">Manage your patient consultations</p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={loadConsultations}
                className="btn-secondary flex items-center"
              >
                <ArrowPathIcon className="h-4 w-4 mr-2" />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search patients or symptoms..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <FunnelIcon className="h-5 w-5 text-gray-400" />
              
              {/* Status Filter */}
              <div className="flex flex-col">
                <label className="text-xs text-gray-500 mb-1">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm min-w-[130px]"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              
              {/* Consultation Type Filter */}
              <div className="flex flex-col">
                <label className="text-xs text-gray-500 mb-1">Type</label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as any)}
                  className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm min-w-[130px]"
                >
                  <option value="all">{getTypeLabel('all')}</option>
                  <option value="video">{getTypeLabel('video')}</option>
                  <option value="tele">{getTypeLabel('tele')}</option>
                  <option value="chat">{getTypeLabel('chat')}</option>
                  <option value="emergency">{getTypeLabel('emergency')}</option>
                </select>
              </div>
              
              {/* Clear Filters Button */}
              {(statusFilter !== 'all' || typeFilter !== 'all' || searchTerm) && (
                <button
                  onClick={() => {
                    setStatusFilter('all');
                    setTypeFilter('all');
                    setSearchTerm('');
                  }}
                  className="text-sm text-gray-500 hover:text-gray-700 underline"
                >
                  Clear All
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClockIcon className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {consultations.filter(c => c.status === 'pending').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <VideoCameraIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {consultations.filter(c => c.status === 'active').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {consultations.filter(c => c.status === 'completed').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DocumentTextIcon className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {consultations.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Consultations List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Consultations ({filteredConsultations.length})
            </h3>
          </div>
          
          {error && (
            <div className="px-6 py-4 bg-red-50 border-b border-red-200">
              <div className="flex items-center">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          <div className="divide-y divide-gray-200">
            {filteredConsultations.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <UserIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No consultations found</h3>
                <p className="text-gray-600">
                  {searchTerm || statusFilter !== 'all' || typeFilter !== 'all' 
                    ? 'Try adjusting your search or filter criteria.'
                    : 'You don\'t have any consultations assigned yet.'
                  }
                </p>
              </div>
            ) : (
              filteredConsultations.map((consultation) => {
                console.log('🔗 Rendering consultation card with ID:', consultation.id, 'for patient:', consultation.patientName);
                return (
                  <div key={consultation.id} className="px-6 py-4 hover:bg-gray-50 cursor-pointer" onClick={(e) => {
                    console.log('🔗 Card clicked for consultation ID:', consultation.id);
                    console.log('🔗 Navigating to:', `/doctor/consultations/${consultation.id}`);
                    navigate(`/doctor/consultations/${consultation.id}`);
                  }}>
                    <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <UserIcon className="h-5 w-5 text-gray-400 mr-2" />
                          <span className="font-medium text-gray-900">{consultation.patientName}</span>
                          {consultation.patientAge && (
                            <span className="ml-2 text-sm text-gray-500">
                              ({consultation.patientAge} years{consultation.patientGender ? `, ${consultation.patientGender}` : ''})
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(consultation.status)}`}>
                            {consultation.status}
                          </span>
                          <span className="text-sm font-medium text-gray-900">₹{consultation.amount}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-600 mb-2">
                        <CalendarIcon className="h-4 w-4 mr-1" />
                        <span>{new Date(consultation.createdAt).toLocaleDateString()}</span>
                        <span className="mx-2">•</span>
                        <span>{new Date(consultation.createdAt).toLocaleTimeString()}</span>
                        <span className="mx-2">•</span>
                        <div className="flex items-center">
                          {getConsultationTypeIcon(consultation.consultationType)}
                          <span className="ml-1 capitalize">{consultation.consultationType}</span>
                        </div>
                      </div>
                      
                      <div className="mb-2">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Symptoms:</span> {consultation.symptoms.join(', ')}
                        </p>
                      </div>
                      
                      {consultation.diagnosis && (
                        <div className="mb-2">
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Diagnosis:</span> {consultation.diagnosis}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      {consultation.status === 'pending' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleStartConsultation(consultation); }}
                          className="btn-primary text-sm"
                        >
                          Start
                        </button>
                      )}
                      
                      {consultation.status === 'active' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleCompleteConsultation(consultation); }}
                          className="btn-secondary text-sm"
                        >
                          Complete
                        </button>
                      )}
                      
                      {consultation.status === 'completed' && !consultation.prescription && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleViewPrescription(consultation); }}
                          className="btn-secondary text-sm flex items-center"
                        >
                          <DocumentTextIcon className="h-4 w-4 mr-1" />
                          Prescription
                        </button>
                      )}
                      
                      {consultation.prescription && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleViewPrescription(consultation); }}
                          className="btn-primary text-sm flex items-center"
                        >
                          <EyeIcon className="h-4 w-4 mr-1" />
                          View
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}; 