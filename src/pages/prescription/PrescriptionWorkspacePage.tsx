import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  DocumentTextIcon,
  UserIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PencilIcon,
  EyeIcon,
  ArrowLeftIcon,
  PlusIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { prescriptionApi, PrescriptionWorkspace, Medication, Investigation, FollowUp } from '../../services/api/prescriptionApi';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';

interface DiagnosisFormData {
  primaryDiagnosis: string;
  differentialDiagnosis: string[];
  clinicalReasoning: string;
  confidenceScore: number;
}

interface PrescriptionFormData {
  medications: Medication[];
  investigations: Investigation[];
  lifestyleAdvice: string[];
  followUp: FollowUp;
}

export const PrescriptionWorkspacePage: React.FC = () => {
  const { consultationId } = useParams<{ consultationId: string }>();
  const navigate = useNavigate();
  const [workspace, setWorkspace] = useState<PrescriptionWorkspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'diagnosis' | 'prescription' | 'preview' | 'history'>('diagnosis');
  const [diagnosisForm, setDiagnosisForm] = useState<DiagnosisFormData>({
    primaryDiagnosis: '',
    differentialDiagnosis: [''],
    clinicalReasoning: '',
    confidenceScore: 85,
  });
  const [prescriptionForm, setPrescriptionForm] = useState<PrescriptionFormData>({
    medications: [{ name: '', dosage: '', frequency: '', duration: '', instructions: '' }],
    investigations: [{ name: '', instructions: '' }],
    lifestyleAdvice: [''],
    followUp: { date: new Date(), instructions: '' },
  });
  const [saving, setSaving] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showSignModal, setShowSignModal] = useState(false);
  const [signForm, setSignForm] = useState({ password: '', mfaCode: '' });

  useEffect(() => {
    if (consultationId) {
      loadWorkspace();
    }
  }, [consultationId]);

  const loadWorkspace = async () => {
    try {
      setLoading(true);
      const data = await prescriptionApi.getPrescriptionWorkspace(consultationId!);
      setWorkspace(data);
      
      if (data.doctorDiagnosis) {
        // Handle both object and string formats for diagnoses
        const primaryDiagnosis = data.doctorDiagnosis.possible_diagnoses?.[0];
        const primaryDiagnosisText = typeof primaryDiagnosis === 'object' && primaryDiagnosis && 'name' in primaryDiagnosis
          ? (primaryDiagnosis as any).name 
          : (typeof primaryDiagnosis === 'string' ? primaryDiagnosis : '');
        
        const differentialDiagnosis = data.doctorDiagnosis.possible_diagnoses?.slice(1) || [];
        const differentialDiagnosisText = differentialDiagnosis.map((d: any) => 
          typeof d === 'object' && d && 'name' in d ? (d as any).name : (typeof d === 'string' ? d : '')
        ).filter(Boolean);
        
        setDiagnosisForm({
          primaryDiagnosis: primaryDiagnosisText,
          differentialDiagnosis: differentialDiagnosisText.length > 0 ? differentialDiagnosisText : [''],
          clinicalReasoning: data.doctorDiagnosis.clinical_reasoning || '',
          confidenceScore: data.doctorDiagnosis.confidence_score || 85,
        });
      }
    } catch (err) {
      setError('Failed to load prescription workspace');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
          <div className="text-center">
            <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => navigate('/doctor/dashboard')}
              className="btn-primary"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Prescription Not Found</h3>
          <p className="text-gray-600 mb-4">The prescription workspace could not be loaded.</p>
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
            <div className="flex items-center">
              <button
                onClick={() => navigate('/doctor/dashboard')}
                className="mr-4 p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Prescription Workspace
                </h1>
                <p className="text-sm text-gray-600">
                  Consultation #{consultationId} • {workspace.patientInfo.firstName} {workspace.patientInfo.lastName}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                workspace.prescriptionStatus === 'signed' ? 'bg-green-100 text-green-800' :
                workspace.prescriptionStatus === 'draft' ? 'bg-blue-100 text-blue-800' :
                workspace.prescriptionStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {workspace.prescriptionStatus.toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="text-center py-12">
            <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Prescription Workspace</h3>
            <p className="text-gray-600 mb-4">Prescription management interface coming soon...</p>
            <button
              onClick={() => navigate('/doctor/dashboard')}
              className="btn-primary"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 