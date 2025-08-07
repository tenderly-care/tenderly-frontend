import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  UserIcon,
  CalendarIcon,
  ClockIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  PencilSquareIcon,
  EyeIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowLeftIcon,
  ChevronRightIcon,
  ChatBubbleLeftRightIcon,
  HeartIcon,
  BeakerIcon,
  LightBulbIcon,
  ShieldCheckIcon,
  ClipboardDocumentListIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { consultationApi } from '../../services/api/consultationApi';

// Define interfaces matching backend DTOs
interface ConsultationDetails {
  _id: string;
  consultationId: string;
  patientId: {
    _id: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
  };
  doctorId?: string;
  status: string;
  consultationType: string;
  priority: string;
  paymentInfo?: {
    amount: number;
    currency: string;
    paymentStatus: string;
    paidAt?: string;
  };
  structuredAssessmentInput?: any;
  aiAgentOutput?: any;
  doctorDiagnosis?: {
    possible_diagnoses: string[];
    clinical_reasoning: string;
    recommended_investigations: Array<{
      category: string;
      tests: Array<{ name: string; priority: string; reason: string }>;
    }>;
    treatment_recommendations: {
      primary_treatment: string;
      safe_medications: string[];
      lifestyle_modifications: string[];
      dietary_advice: string[];
      follow_up_timeline: string;
    };
    patient_education: string[];
    warning_signs: string[];
    confidence_score: number;
    processing_notes: string;
    disclaimer: string;
    modifiedAt: string;
    modifiedBy: string;
    modificationType: string;
    modificationNotes?: string;
    changesFromAI: string[];
  };
  prescriptionStatus: string;
  prescriptionData?: any;
  createdAt: string;
  updatedAt: string;
}

interface PrescriptionWorkspace {
  consultationId: string;
  structuredAssessmentInput: any;
  aiAgentOutput: any;
  doctorDiagnosis?: any;
  prescriptionStatus: string;
  prescriptionData?: any;
  patientInfo: {
    firstName: string;
    lastName: string;
    age?: number;
    gender?: string;
  };
  hasDoctorDiagnosis: boolean;
}

export const ConsultationDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [consultation, setConsultation] = useState<ConsultationDetails | null>(null);
  const [prescriptionWorkspace, setPrescriptionWorkspace] = useState<PrescriptionWorkspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'assessment' | 'ai-diagnosis' | 'doctor-diagnosis' | 'prescription'>('overview');
  const [isDiagnosisEditing, setIsDiagnosisEditing] = useState(false);
  const [diagnosisModifications, setDiagnosisModifications] = useState<any>({});

  useEffect(() => {
    if (id) {
      loadConsultationDetails();
    }
  }, [id]);

  const loadConsultationDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      // Try to load consultation details directly first
      let consultationResponse;
      try {
        consultationResponse = await consultationApi.getConsultationById(id!);
        setConsultation(consultationResponse);
      } catch (directAccessError: any) {
        console.log('🔄 Direct access failed, trying doctor consultations list...', directAccessError);
        
        // If direct access fails due to permissions, try to get it from doctor consultations list
        if (directAccessError.response?.status === 401 || directAccessError.response?.status === 403) {
          const doctorConsultationsResponse = await consultationApi.getDoctorConsultations();
          
          // Handle backend response structure
          let consultations: any[] = [];
          if (doctorConsultationsResponse && typeof doctorConsultationsResponse === 'object') {
            if ('consultations' in doctorConsultationsResponse && Array.isArray(doctorConsultationsResponse.consultations)) {
              consultations = doctorConsultationsResponse.consultations;
            } else if (Array.isArray(doctorConsultationsResponse)) {
              consultations = doctorConsultationsResponse;
            }
          }
          
          // Find the specific consultation by ID
          const targetConsultation = consultations.find(c => c._id === id || c.id === id);
          if (targetConsultation) {
            console.log('✅ Found consultation in doctor list:', targetConsultation._id);
            setConsultation(targetConsultation);
          } else {
            throw new Error('This consultation is not assigned to you or does not exist.');
          }
        } else {
          // Re-throw the original error if it's not a permission issue
          throw directAccessError;
        }
      }

      // Load prescription workspace if doctor diagnosis exists or can be created
      try {
        const workspaceResponse = await fetch(`/api/v1/consultations/${id}/prescription/workspace`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (workspaceResponse.ok) {
          const workspace = await workspaceResponse.json();
          setPrescriptionWorkspace(workspace);
        }
      } catch (workspaceError) {
        console.log('Prescription workspace not available:', workspaceError);
      }

    } catch (err: any) {
      console.error('Error loading consultation details:', err);
      
      // Handle specific error types
      let errorMessage = 'Failed to load consultation details';
      
      if (err.response?.status === 401) {
        errorMessage = 'You do not have permission to view this consultation. It may not be assigned to you or you may need to log in again.';
      } else if (err.response?.status === 403) {
        errorMessage = 'Access denied. This consultation is not accessible with your current permissions.';
      } else if (err.response?.status === 404) {
        errorMessage = 'This consultation was not found. It may have been deleted or the ID is incorrect.';
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleModifyDiagnosis = async () => {
    try {
      const response = await fetch(`/api/v1/consultations/${id}/prescription/diagnosis/modify`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(diagnosisModifications),
      });

      if (response.ok) {
        toast.success('Diagnosis modified successfully');
        loadConsultationDetails();
        setIsDiagnosisEditing(false);
        setDiagnosisModifications({});
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to modify diagnosis');
      }
    } catch (error: any) {
      console.error('Error modifying diagnosis:', error);
      toast.error('Failed to modify diagnosis');
    }
  };

  const initializeDiagnosis = async () => {
    try {
      const response = await fetch(`/api/v1/consultations/${id}/prescription/diagnosis/modify`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}), // Empty body to initialize with AI data
      });

      if (response.ok) {
        toast.success('Diagnosis initialized from AI output');
        loadConsultationDetails();
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to initialize diagnosis');
      }
    } catch (error: any) {
      console.error('Error initializing diagnosis:', error);
      toast.error('Failed to initialize diagnosis');
    }
  };

  const navigateToPrescription = () => {
    navigate(`/prescription/workspace/${id}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !consultation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Consultation</h3>
          <p className="text-gray-600 mb-4">{error || 'Consultation not found'}</p>
          <button
            onClick={() => navigate('/doctor/consultations')}
            className="btn-primary"
          >
            Back to Consultations
          </button>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'active':
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending':
      case 'payment_confirmed':
      case 'clinical_assessment_complete':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPrescriptionStatusColor = (status: string) => {
    switch (status) {
      case 'signed':
      case 'sent':
        return 'text-green-600';
      case 'awaiting_signature':
      case 'awaiting_review':
        return 'text-blue-600';
      case 'prescription_draft':
      case 'diagnosis_modification':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            {/* Patient Information */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
                <h3 className="text-lg font-semibold text-white flex items-center">
                  <UserIcon className="h-5 w-5 mr-2" />
                  Patient Information
                </h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Name</label>
                    <p className="text-lg font-semibold text-gray-900">
                      {consultation.patientId?.firstName} {consultation.patientId?.lastName}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email</label>
                    <p className="text-gray-900">{consultation.patientId?.email || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Phone</label>
                    <p className="text-gray-900">{consultation.patientId?.phone || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Consultation Type</label>
                    <p className="text-gray-900 capitalize">{consultation.consultationType}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Consultation Status & Payment */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h4 className="font-medium text-gray-900 mb-4">Consultation Status</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Current Status</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(consultation.status)}`}>
                      {consultation.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Priority</span>
                    <span className="text-gray-900 capitalize">{consultation.priority}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Created</span>
                    <span className="text-gray-900">{new Date(consultation.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {consultation.paymentInfo && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h4 className="font-medium text-gray-900 mb-4 flex items-center">
                    <CurrencyDollarIcon className="h-5 w-5 mr-2 text-green-600" />
                    Payment Information
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Amount</span>
                      <span className="text-lg font-semibold text-gray-900">
                        {consultation.paymentInfo.currency} {consultation.paymentInfo.amount}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Status</span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        consultation.paymentInfo.paymentStatus === 'completed' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {consultation.paymentInfo.paymentStatus}
                      </span>
                    </div>
                    {consultation.paymentInfo.paidAt && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Paid At</span>
                        <span className="text-gray-900">
                          {new Date(consultation.paymentInfo.paidAt).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Prescription Status */}
            {prescriptionWorkspace && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h4 className="font-medium text-gray-900 mb-4 flex items-center">
                  <DocumentTextIcon className="h-5 w-5 mr-2 text-purple-600" />
                  Prescription Status
                </h4>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-lg font-semibold ${getPrescriptionStatusColor(prescriptionWorkspace.prescriptionStatus)}`}>
                      {prescriptionWorkspace.prescriptionStatus.replace('_', ' ').toUpperCase()}
                    </p>
                    <p className="text-gray-600 text-sm">
                      {prescriptionWorkspace.hasDoctorDiagnosis 
                        ? 'Doctor has reviewed the AI diagnosis' 
                        : 'Ready for doctor review'}
                    </p>
                  </div>
                  <button
                    onClick={navigateToPrescription}
                    className="btn-primary flex items-center"
                  >
                    <DocumentTextIcon className="h-4 w-4 mr-2" />
                    Manage Prescription
                  </button>
                </div>
              </div>
            )}
          </div>
        );

      case 'assessment':
        const assessment = consultation.structuredAssessmentInput;
        
        // Helper function to format any data type into readable text
        const formatValue = (value: any): string => {
          if (value === null || value === undefined) return 'Not provided';
          if (typeof value === 'boolean') return value ? 'Yes' : 'No';
          if (Array.isArray(value)) {
            if (value.length === 0) return 'None';
            return value.map(item => 
              typeof item === 'object' ? JSON.stringify(item) : String(item)
            ).join(', ');
          }
          if (typeof value === 'object') {
            return Object.entries(value)
              .map(([k, v]) => `${k.replace('_', ' ')}: ${formatValue(v)}`)
              .join(' • ');
          }
          return String(value);
        };
        
        // Helper function to make field names readable
        const formatLabel = (key: string): string => {
          return key
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
        };
        
        return assessment ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-green-600 to-blue-600 px-6 py-4">
              <h3 className="text-lg font-semibold text-white flex items-center">
                <ClipboardDocumentListIcon className="h-5 w-5 mr-2" />
                Patient Assessment Summary
              </h3>
            </div>
            <div className="p-8">
              <div className="space-y-8">
                {Object.entries(assessment).map(([sectionKey, sectionValue]) => {
                  if (!sectionValue || (typeof sectionValue === 'object' && Object.keys(sectionValue).length === 0)) {
                    return null;
                  }
                  
                  return (
                    <div key={sectionKey} className="border-b border-gray-200 pb-6 last:border-b-0">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                        {formatLabel(sectionKey)}
                      </h4>
                      
                      {typeof sectionValue === 'object' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                          {Object.entries(sectionValue).map(([fieldKey, fieldValue]) => (
                            <div key={fieldKey} className="flex flex-col">
                              <dt className="text-sm font-medium text-gray-500 mb-1">
                                {formatLabel(fieldKey)}
                              </dt>
                              <dd className="text-gray-900 leading-relaxed">
                                {formatValue(fieldValue)}
                              </dd>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-gray-900 leading-relaxed">
                          {formatValue(sectionValue)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <ClipboardDocumentListIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Assessment Data</h3>
            <p className="text-gray-600">Patient assessment data is not available for this consultation.</p>
          </div>
        );

      case 'ai-diagnosis':
        try {
          // Debug logging to understand the data structure
          console.log('🔍 AI Diagnosis Rendering Debug:');
          console.log('- consultation.aiAgentOutput:', consultation.aiAgentOutput);
          console.log('- possible_diagnoses:', consultation.aiAgentOutput?.possible_diagnoses);
          console.log('- possible_diagnoses type:', typeof consultation.aiAgentOutput?.possible_diagnoses);
          console.log('- possible_diagnoses isArray:', Array.isArray(consultation.aiAgentOutput?.possible_diagnoses));
          console.log('- treatment_recommendations:', consultation.aiAgentOutput?.treatment_recommendations);
          console.log('- safe_medications:', consultation.aiAgentOutput?.treatment_recommendations?.safe_medications);
          console.log('- safe_medications type:', typeof consultation.aiAgentOutput?.treatment_recommendations?.safe_medications);
          console.log('- safe_medications isArray:', Array.isArray(consultation.aiAgentOutput?.treatment_recommendations?.safe_medications));
          if (consultation.aiAgentOutput?.treatment_recommendations?.safe_medications) {
            console.log('- First medication sample:', consultation.aiAgentOutput.treatment_recommendations.safe_medications[0]);
          }

          return consultation.aiAgentOutput ? (
            <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4">
                <h3 className="text-lg font-semibold text-white flex items-center">
                  <SparklesIcon className="h-5 w-5 mr-2" />
                  AI Diagnosis Output
                </h3>
              </div>
              <div className="p-6 space-y-6">
                {/* Primary Diagnosis */}
                {consultation.aiAgentOutput.possible_diagnoses && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                      <BeakerIcon className="h-5 w-5 mr-2 text-purple-600" />
                      Possible Diagnoses
                    </h4>
                    <div className="space-y-2">
                      {Array.isArray(consultation.aiAgentOutput.possible_diagnoses) ? 
                        consultation.aiAgentOutput.possible_diagnoses.map((diagnosis: any, index: number) => (
                          <div key={index} className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                            {typeof diagnosis === 'string' ? (
                              <p className="font-medium text-purple-900">{diagnosis}</p>
                            ) : (
                              <div>
                                <p className="font-medium text-purple-900">{diagnosis.name || 'Unnamed diagnosis'}</p>
                                {diagnosis.confidence_score && (
                                  <p className="text-sm text-purple-700 mt-1">
                                    Confidence: {Math.round(diagnosis.confidence_score * 100)}%
                                  </p>
                                )}
                                {diagnosis.description && (
                                  <p className="text-sm text-gray-600 mt-2">{diagnosis.description}</p>
                                )}
                              </div>
                            )}
                          </div>
                        )) : (
                          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                            <p className="font-medium text-purple-900">{String(consultation.aiAgentOutput.possible_diagnoses)}</p>
                          </div>
                        )
                      }
                    </div>
                  </div>
                )}

                {/* Clinical Reasoning */}
                {consultation.aiAgentOutput.clinical_reasoning && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                      <LightBulbIcon className="h-5 w-5 mr-2 text-yellow-600" />
                      Clinical Reasoning
                    </h4>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <p className="text-gray-700">{consultation.aiAgentOutput.clinical_reasoning}</p>
                    </div>
                  </div>
                )}

                {/* Recommended Investigations */}
                {consultation.aiAgentOutput.recommended_investigations && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                      <BeakerIcon className="h-5 w-5 mr-2 text-blue-600" />
                      Recommended Investigations
                    </h4>
                    <div className="space-y-3">
                      {consultation.aiAgentOutput.recommended_investigations.map((category: any, categoryIndex: number) => (
                        <div key={categoryIndex} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <h5 className="font-medium text-blue-900 mb-2">{category.category}</h5>
                          <div className="space-y-2">
                            {category.tests?.map((test: any, testIndex: number) => (
                              <div key={testIndex} className="bg-white rounded-md p-3 border border-blue-100">
                                <div className="flex items-center justify-between">
                                  <span className="font-medium text-gray-900">{test.name}</span>
                                  <span className={`px-2 py-1 text-xs rounded-full ${
                                    test.priority === 'high' ? 'bg-red-100 text-red-800' :
                                    test.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-green-100 text-green-800'
                                  }`}>
                                    {test.priority} priority
                                  </span>
                                </div>
                                {test.reason && (
                                  <p className="text-sm text-gray-600 mt-1">{test.reason}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Treatment Recommendations */}
                {consultation.aiAgentOutput.treatment_recommendations && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                      <HeartIcon className="h-5 w-5 mr-2 text-red-600" />
                      Treatment Recommendations
                    </h4>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-3">
                      {consultation.aiAgentOutput.treatment_recommendations.primary_treatment && (
                        <div>
                          <h5 className="font-medium text-red-900">Primary Treatment</h5>
                          <p className="text-gray-700">{consultation.aiAgentOutput.treatment_recommendations.primary_treatment}</p>
                        </div>
                      )}
                      
                      {consultation.aiAgentOutput.treatment_recommendations.safe_medications && (
                        <div>
                          <h5 className="font-medium text-red-900">Safe Medications</h5>
                          <ul className="list-disc list-inside text-gray-700 space-y-1">
                            {consultation.aiAgentOutput.treatment_recommendations.safe_medications.map((med: any, index: number) => (
                              <li key={index}>
                                {typeof med === 'string' ? (
                                  med
                                ) : (
                                  <div>
                                    <span className="font-medium">{med.name || 'Unknown medication'}</span>
                                    {med.dosage && <span className="text-sm text-gray-600 ml-2">({med.dosage})</span>}
                                    {med.frequency && <span className="text-sm text-gray-600 ml-1">- {med.frequency}</span>}
                                    {med.duration && <span className="text-sm text-gray-600 ml-1">for {med.duration}</span>}
                                    {med.reason && <div className="text-xs text-gray-500 mt-1">{med.reason}</div>}
                                    {med.notes && <div className="text-xs text-gray-500 mt-1">{med.notes}</div>}
                                  </div>
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Patient Education */}
                {consultation.aiAgentOutput.patient_education && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                      <LightBulbIcon className="h-5 w-5 mr-2 text-indigo-600" />
                      Patient Education
                    </h4>
                    <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                      <ul className="list-disc list-inside text-gray-700 space-y-2">
                        {consultation.aiAgentOutput.patient_education.map((item: any, index: number) => (
                          <li key={index}>
                            {typeof item === 'string' ? (
                              item
                            ) : (
                              <div>
                                <span className="font-medium">{item.name || item.title || 'Education item'}</span>
                                {item.description && <div className="text-sm text-gray-600 mt-1">{item.description}</div>}
                                {item.reason && <div className="text-xs text-gray-500 mt-1">{item.reason}</div>}
                                {item.notes && <div className="text-xs text-gray-500 mt-1">{item.notes}</div>}
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Warning Signs */}
                {consultation.aiAgentOutput.warning_signs && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                      <ExclamationTriangleIcon className="h-5 w-5 mr-2 text-orange-600" />
                      Warning Signs
                    </h4>
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <ul className="list-disc list-inside text-gray-700 space-y-2">
                        {consultation.aiAgentOutput.warning_signs.map((sign: any, index: number) => (
                          <li key={index}>
                            {typeof sign === 'string' ? (
                              sign
                            ) : (
                              <div>
                                <span className="font-medium">{sign.name || sign.title || 'Warning sign'}</span>
                                {sign.description && <div className="text-sm text-gray-600 mt-1">{sign.description}</div>}
                                {sign.severity && <span className="text-xs bg-red-100 text-red-800 px-1 rounded ml-2">{sign.severity}</span>}
                                {sign.reason && <div className="text-xs text-gray-500 mt-1">{sign.reason}</div>}
                                {sign.notes && <div className="text-xs text-gray-500 mt-1">{sign.notes}</div>}
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Confidence Score */}
                {consultation.aiAgentOutput.confidence_score && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                      <ShieldCheckIcon className="h-5 w-5 mr-2 text-green-600" />
                      AI Confidence Score
                    </h4>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700">Confidence Level</span>
                        <span className="text-2xl font-bold text-green-600">
                          {Math.round(consultation.aiAgentOutput.confidence_score * 100)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                        <div 
                          className="bg-green-600 h-2 rounded-full" 
                          style={{ width: `${consultation.aiAgentOutput.confidence_score * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
              <SparklesIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No AI Diagnosis Available</h3>
              <p className="text-gray-600">AI diagnosis output is not available for this consultation.</p>
            </div>
          );
        } catch (renderError) {
          console.error('Error rendering AI diagnosis tab:', renderError);
          return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
              <ExclamationTriangleIcon className="h-16 w-16 text-red-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Something went wrong</h3>
              <p className="text-gray-600 mb-4">There was an error displaying the AI diagnosis data.</p>
              <button
                onClick={() => setActiveTab('overview')}
                className="btn-primary"
              >
                Go to Overview
              </button>
            </div>
          );
        }

      case 'doctor-diagnosis':
        return consultation.doctorDiagnosis ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white flex items-center">
                  <CheckCircleIcon className="h-5 w-5 mr-2" />
                  Doctor's Modified Diagnosis
                </h3>
                <button
                  onClick={() => {
                    // Pre-populate form with current diagnosis data
                    setDiagnosisModifications({
                      possible_diagnoses: consultation.doctorDiagnosis.possible_diagnoses || [],
                      clinical_reasoning: consultation.doctorDiagnosis.clinical_reasoning || '',
                      recommended_investigations: consultation.doctorDiagnosis.recommended_investigations || [],
                      treatment_recommendations: {
                        primary_treatment: consultation.doctorDiagnosis.treatment_recommendations?.primary_treatment || '',
                        safe_medications: consultation.doctorDiagnosis.treatment_recommendations?.safe_medications || [],
                        lifestyle_modifications: consultation.doctorDiagnosis.treatment_recommendations?.lifestyle_modifications || [],
                        dietary_advice: consultation.doctorDiagnosis.treatment_recommendations?.dietary_advice || [],
                        follow_up_timeline: consultation.doctorDiagnosis.treatment_recommendations?.follow_up_timeline || ''
                      },
                      patient_education: consultation.doctorDiagnosis.patient_education || [],
                      warning_signs: consultation.doctorDiagnosis.warning_signs || [],
                      modificationNotes: consultation.doctorDiagnosis.modificationNotes || ''
                    });
                    setIsDiagnosisEditing(true);
                  }}
                  className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-3 py-1 rounded-md text-sm flex items-center transition-colors"
                >
                  <PencilSquareIcon className="h-4 w-4 mr-1" />
                  Edit
                </button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <div className="mb-4 text-sm text-gray-600">
                Modified on {new Date(consultation.doctorDiagnosis.modifiedAt).toLocaleString()} • 
                Changes: {consultation.doctorDiagnosis.changesFromAI.length > 0 ? consultation.doctorDiagnosis.changesFromAI.join(', ') : 'No changes from AI'}
              </div>
              
              {/* Possible Diagnoses */}
              {consultation.doctorDiagnosis.possible_diagnoses && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                    <BeakerIcon className="h-5 w-5 mr-2 text-purple-600" />
                    Possible Diagnoses
                  </h4>
                  <div className="space-y-2">
                    {consultation.doctorDiagnosis.possible_diagnoses.map((diagnosis: string, index: number) => (
                      <div key={index} className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                        <p className="font-medium text-purple-900">{diagnosis}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Clinical Reasoning */}
              {consultation.doctorDiagnosis.clinical_reasoning && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                    <LightBulbIcon className="h-5 w-5 mr-2 text-yellow-600" />
                    Clinical Reasoning
                  </h4>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-gray-700">{consultation.doctorDiagnosis.clinical_reasoning}</p>
                  </div>
                </div>
              )}

              {/* Recommended Investigations */}
              {consultation.doctorDiagnosis.recommended_investigations && consultation.doctorDiagnosis.recommended_investigations.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                    <BeakerIcon className="h-5 w-5 mr-2 text-blue-600" />
                    Recommended Investigations
                  </h4>
                  <div className="space-y-3">
                    {consultation.doctorDiagnosis.recommended_investigations.map((category: any, categoryIndex: number) => (
                      <div key={categoryIndex} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h5 className="font-medium text-blue-900 mb-2">{category.category}</h5>
                        <div className="space-y-2">
                          {category.tests?.map((test: any, testIndex: number) => (
                            <div key={testIndex} className="bg-white rounded-md p-3 border border-blue-100">
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-gray-900">{test.name}</span>
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                  test.priority === 'high' ? 'bg-red-100 text-red-800' :
                                  test.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-green-100 text-green-800'
                                }`}>
                                  {test.priority} priority
                                </span>
                              </div>
                              {test.reason && (
                                <p className="text-sm text-gray-600 mt-1">{test.reason}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Treatment Recommendations */}
              {consultation.doctorDiagnosis.treatment_recommendations && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                    <HeartIcon className="h-5 w-5 mr-2 text-red-600" />
                    Treatment Recommendations
                  </h4>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-4">
                    {consultation.doctorDiagnosis.treatment_recommendations.primary_treatment && (
                      <div>
                        <h5 className="font-medium text-red-900 mb-2">Primary Treatment</h5>
                        <p className="text-gray-700">{consultation.doctorDiagnosis.treatment_recommendations.primary_treatment}</p>
                      </div>
                    )}
                    
                    {consultation.doctorDiagnosis.treatment_recommendations.safe_medications && consultation.doctorDiagnosis.treatment_recommendations.safe_medications.length > 0 && (
                      <div>
                        <h5 className="font-medium text-red-900 mb-2">Safe Medications</h5>
                        <ul className="list-disc list-inside text-gray-700 space-y-1">
                          {consultation.doctorDiagnosis.treatment_recommendations.safe_medications.map((med: string, index: number) => (
                            <li key={index}>{med}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {consultation.doctorDiagnosis.treatment_recommendations.lifestyle_modifications && consultation.doctorDiagnosis.treatment_recommendations.lifestyle_modifications.length > 0 && (
                      <div>
                        <h5 className="font-medium text-red-900 mb-2">Lifestyle Modifications</h5>
                        <ul className="list-disc list-inside text-gray-700 space-y-1">
                          {consultation.doctorDiagnosis.treatment_recommendations.lifestyle_modifications.map((mod: string, index: number) => (
                            <li key={index}>{mod}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {consultation.doctorDiagnosis.treatment_recommendations.dietary_advice && consultation.doctorDiagnosis.treatment_recommendations.dietary_advice.length > 0 && (
                      <div>
                        <h5 className="font-medium text-red-900 mb-2">Dietary Advice</h5>
                        <ul className="list-disc list-inside text-gray-700 space-y-1">
                          {consultation.doctorDiagnosis.treatment_recommendations.dietary_advice.map((advice: string, index: number) => (
                            <li key={index}>{advice}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {consultation.doctorDiagnosis.treatment_recommendations.follow_up_timeline && (
                      <div>
                        <h5 className="font-medium text-red-900 mb-2">Follow-up Timeline</h5>
                        <p className="text-gray-700">{consultation.doctorDiagnosis.treatment_recommendations.follow_up_timeline}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Patient Education */}
              {consultation.doctorDiagnosis.patient_education && consultation.doctorDiagnosis.patient_education.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                    <LightBulbIcon className="h-5 w-5 mr-2 text-indigo-600" />
                    Patient Education
                  </h4>
                  <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                    <ul className="list-disc list-inside text-gray-700 space-y-2">
                      {consultation.doctorDiagnosis.patient_education.map((item: string, index: number) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Warning Signs */}
              {consultation.doctorDiagnosis.warning_signs && consultation.doctorDiagnosis.warning_signs.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                    <ExclamationTriangleIcon className="h-5 w-5 mr-2 text-orange-600" />
                    Warning Signs
                  </h4>
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <ul className="list-disc list-inside text-gray-700 space-y-2">
                      {consultation.doctorDiagnosis.warning_signs.map((sign: string, index: number) => (
                        <li key={index}>{sign}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
            <PencilSquareIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Doctor Diagnosis Yet</h3>
            <p className="text-gray-600 mb-6">
              Initialize diagnosis from AI output or create a new diagnosis for prescription management.
            </p>
            <button
              onClick={initializeDiagnosis}
              className="btn-primary"
            >
              Initialize Diagnosis from AI
            </button>
          </div>
        );

      case 'prescription':
        return (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <DocumentTextIcon className="h-16 w-16 text-purple-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Prescription Management</h3>
            <p className="text-gray-600 mb-6">
              Access the full prescription workspace to manage medications, investigations, and generate prescriptions.
            </p>
            <button
              onClick={navigateToPrescription}
              className="btn-primary"
            >
              Open Prescription Workspace
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/doctor/consultations')}
                className="mr-4 p-2 rounded-md hover:bg-gray-100 transition-colors"
              >
                <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Consultation Details
                </h1>
                <p className="text-sm text-gray-600">
                  {consultation.patientId?.firstName} {consultation.patientId?.lastName} • 
                  ID: {consultation.consultationId}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(consultation.status)}`}>
                {consultation.status.replace('_', ' ')}
              </span>
              {prescriptionWorkspace && (
                <button
                  onClick={navigateToPrescription}
                  className="btn-primary flex items-center"
                >
                  <DocumentTextIcon className="h-4 w-4 mr-2" />
                  Prescription
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
          <nav className="flex space-x-8 px-6 py-4">
            {[
              { id: 'overview', label: 'Overview', icon: UserIcon },
              { id: 'assessment', label: 'Patient Assessment', icon: ClipboardDocumentListIcon },
              { id: 'ai-diagnosis', label: 'AI Diagnosis', icon: SparklesIcon },
              { id: 'doctor-diagnosis', label: 'Doctor Diagnosis', icon: CheckCircleIcon },
              { id: 'prescription', label: 'Prescription', icon: DocumentTextIcon },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="transition-all duration-200">
          {renderTabContent()}
        </div>
      </div>

      {/* Diagnosis Editing Modal */}
      {isDiagnosisEditing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
              <h3 className="text-lg font-semibold text-gray-900">Edit Doctor Diagnosis</h3>
            </div>
            <div className="p-6">
              <div className="space-y-8">
                {/* Possible Diagnoses */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Possible Diagnoses
                  </label>
                  <div className="space-y-2">
                    {(diagnosisModifications.possible_diagnoses || []).map((diagnosis: string, index: number) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={diagnosis}
                          onChange={(e) => {
                            const newDiagnoses = [...(diagnosisModifications.possible_diagnoses || [])];
                            newDiagnoses[index] = e.target.value;
                            setDiagnosisModifications((prev: any) => ({
                              ...prev,
                              possible_diagnoses: newDiagnoses
                            }));
                          }}
                          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter diagnosis..."
                        />
                        <button
                          onClick={() => {
                            const newDiagnoses = (diagnosisModifications.possible_diagnoses || []).filter((_: any, i: number) => i !== index);
                            setDiagnosisModifications((prev: any) => ({
                              ...prev,
                              possible_diagnoses: newDiagnoses
                            }));
                          }}
                          className="text-red-600 hover:text-red-800 p-2"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => {
                        const newDiagnoses = [...(diagnosisModifications.possible_diagnoses || []), ''];
                        setDiagnosisModifications((prev: any) => ({
                          ...prev,
                          possible_diagnoses: newDiagnoses
                        }));
                      }}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      + Add Diagnosis
                    </button>
                  </div>
                </div>

                {/* Clinical Reasoning */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Clinical Reasoning
                  </label>
                  <textarea
                    value={diagnosisModifications.clinical_reasoning || ''}
                    onChange={(e) => setDiagnosisModifications((prev: any) => ({
                      ...prev,
                      clinical_reasoning: e.target.value
                    }))}
                    rows={4}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Add your clinical reasoning..."
                  />
                </div>

                {/* Primary Treatment */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Primary Treatment
                  </label>
                  <textarea
                    value={diagnosisModifications.treatment_recommendations?.primary_treatment || ''}
                    onChange={(e) => setDiagnosisModifications((prev: any) => ({
                      ...prev,
                      treatment_recommendations: {
                        ...prev.treatment_recommendations,
                        primary_treatment: e.target.value
                      }
                    }))}
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Describe primary treatment approach..."
                  />
                </div>

                {/* Safe Medications */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Safe Medications
                  </label>
                  <div className="space-y-2">
                    {(diagnosisModifications.treatment_recommendations?.safe_medications || []).map((medication: string, index: number) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={medication}
                          onChange={(e) => {
                            const newMeds = [...(diagnosisModifications.treatment_recommendations?.safe_medications || [])];
                            newMeds[index] = e.target.value;
                            setDiagnosisModifications((prev: any) => ({
                              ...prev,
                              treatment_recommendations: {
                                ...prev.treatment_recommendations,
                                safe_medications: newMeds
                              }
                            }));
                          }}
                          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter medication..."
                        />
                        <button
                          onClick={() => {
                            const newMeds = (diagnosisModifications.treatment_recommendations?.safe_medications || []).filter((_: any, i: number) => i !== index);
                            setDiagnosisModifications((prev: any) => ({
                              ...prev,
                              treatment_recommendations: {
                                ...prev.treatment_recommendations,
                                safe_medications: newMeds
                              }
                            }));
                          }}
                          className="text-red-600 hover:text-red-800 p-2"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => {
                        const newMeds = [...(diagnosisModifications.treatment_recommendations?.safe_medications || []), ''];
                        setDiagnosisModifications((prev: any) => ({
                          ...prev,
                          treatment_recommendations: {
                            ...prev.treatment_recommendations,
                            safe_medications: newMeds
                          }
                        }));
                      }}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      + Add Medication
                    </button>
                  </div>
                </div>

                {/* Lifestyle Modifications */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lifestyle Modifications
                  </label>
                  <div className="space-y-2">
                    {(diagnosisModifications.treatment_recommendations?.lifestyle_modifications || []).map((modification: string, index: number) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={modification}
                          onChange={(e) => {
                            const newMods = [...(diagnosisModifications.treatment_recommendations?.lifestyle_modifications || [])];
                            newMods[index] = e.target.value;
                            setDiagnosisModifications((prev: any) => ({
                              ...prev,
                              treatment_recommendations: {
                                ...prev.treatment_recommendations,
                                lifestyle_modifications: newMods
                              }
                            }));
                          }}
                          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter lifestyle modification..."
                        />
                        <button
                          onClick={() => {
                            const newMods = (diagnosisModifications.treatment_recommendations?.lifestyle_modifications || []).filter((_: any, i: number) => i !== index);
                            setDiagnosisModifications((prev: any) => ({
                              ...prev,
                              treatment_recommendations: {
                                ...prev.treatment_recommendations,
                                lifestyle_modifications: newMods
                              }
                            }));
                          }}
                          className="text-red-600 hover:text-red-800 p-2"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => {
                        const newMods = [...(diagnosisModifications.treatment_recommendations?.lifestyle_modifications || []), ''];
                        setDiagnosisModifications((prev: any) => ({
                          ...prev,
                          treatment_recommendations: {
                            ...prev.treatment_recommendations,
                            lifestyle_modifications: newMods
                          }
                        }));
                      }}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      + Add Modification
                    </button>
                  </div>
                </div>

                {/* Dietary Advice */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dietary Advice
                  </label>
                  <div className="space-y-2">
                    {(diagnosisModifications.treatment_recommendations?.dietary_advice || []).map((advice: string, index: number) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={advice}
                          onChange={(e) => {
                            const newAdvice = [...(diagnosisModifications.treatment_recommendations?.dietary_advice || [])];
                            newAdvice[index] = e.target.value;
                            setDiagnosisModifications((prev: any) => ({
                              ...prev,
                              treatment_recommendations: {
                                ...prev.treatment_recommendations,
                                dietary_advice: newAdvice
                              }
                            }));
                          }}
                          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter dietary advice..."
                        />
                        <button
                          onClick={() => {
                            const newAdvice = (diagnosisModifications.treatment_recommendations?.dietary_advice || []).filter((_: any, i: number) => i !== index);
                            setDiagnosisModifications((prev: any) => ({
                              ...prev,
                              treatment_recommendations: {
                                ...prev.treatment_recommendations,
                                dietary_advice: newAdvice
                              }
                            }));
                          }}
                          className="text-red-600 hover:text-red-800 p-2"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => {
                        const newAdvice = [...(diagnosisModifications.treatment_recommendations?.dietary_advice || []), ''];
                        setDiagnosisModifications((prev: any) => ({
                          ...prev,
                          treatment_recommendations: {
                            ...prev.treatment_recommendations,
                            dietary_advice: newAdvice
                          }
                        }));
                      }}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      + Add Advice
                    </button>
                  </div>
                </div>

                {/* Follow-up Timeline */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Follow-up Timeline
                  </label>
                  <input
                    type="text"
                    value={diagnosisModifications.treatment_recommendations?.follow_up_timeline || ''}
                    onChange={(e) => setDiagnosisModifications((prev: any) => ({
                      ...prev,
                      treatment_recommendations: {
                        ...prev.treatment_recommendations,
                        follow_up_timeline: e.target.value
                      }
                    }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Follow up in 2 weeks"
                  />
                </div>

                {/* Patient Education */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Patient Education
                  </label>
                  <div className="space-y-2">
                    {(diagnosisModifications.patient_education || []).map((education: string, index: number) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={education}
                          onChange={(e) => {
                            const newEducation = [...(diagnosisModifications.patient_education || [])];
                            newEducation[index] = e.target.value;
                            setDiagnosisModifications((prev: any) => ({
                              ...prev,
                              patient_education: newEducation
                            }));
                          }}
                          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter patient education point..."
                        />
                        <button
                          onClick={() => {
                            const newEducation = (diagnosisModifications.patient_education || []).filter((_: any, i: number) => i !== index);
                            setDiagnosisModifications((prev: any) => ({
                              ...prev,
                              patient_education: newEducation
                            }));
                          }}
                          className="text-red-600 hover:text-red-800 p-2"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => {
                        const newEducation = [...(diagnosisModifications.patient_education || []), ''];
                        setDiagnosisModifications((prev: any) => ({
                          ...prev,
                          patient_education: newEducation
                        }));
                      }}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      + Add Education Point
                    </button>
                  </div>
                </div>

                {/* Warning Signs */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Warning Signs
                  </label>
                  <div className="space-y-2">
                    {(diagnosisModifications.warning_signs || []).map((warning: string, index: number) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={warning}
                          onChange={(e) => {
                            const newWarnings = [...(diagnosisModifications.warning_signs || [])];
                            newWarnings[index] = e.target.value;
                            setDiagnosisModifications((prev: any) => ({
                              ...prev,
                              warning_signs: newWarnings
                            }));
                          }}
                          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter warning sign..."
                        />
                        <button
                          onClick={() => {
                            const newWarnings = (diagnosisModifications.warning_signs || []).filter((_: any, i: number) => i !== index);
                            setDiagnosisModifications((prev: any) => ({
                              ...prev,
                              warning_signs: newWarnings
                            }));
                          }}
                          className="text-red-600 hover:text-red-800 p-2"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => {
                        const newWarnings = [...(diagnosisModifications.warning_signs || []), ''];
                        setDiagnosisModifications((prev: any) => ({
                          ...prev,
                          warning_signs: newWarnings
                        }));
                      }}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      + Add Warning Sign
                    </button>
                  </div>
                </div>

                {/* Modification Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Modification Notes
                  </label>
                  <textarea
                    value={diagnosisModifications.modificationNotes || ''}
                    onChange={(e) => setDiagnosisModifications((prev: any) => ({
                      ...prev,
                      modificationNotes: e.target.value
                    }))}
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Notes about your modifications..."
                  />
                </div>
              </div>
            </div>
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setIsDiagnosisEditing(false);
                  setDiagnosisModifications({});
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleModifyDiagnosis}
                className="btn-primary"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
