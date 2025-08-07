import axios from 'axios';
import config from '../../config/env';

const API_BASE_URL = config.apiUrl;

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Types for prescription data
export interface PrescriptionWorkspace {
  consultationId: string;
  structuredAssessmentInput: any;
  aiAgentOutput: any;
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
    modifiedAt: Date;
    modifiedBy: string;
    modificationType: string;
    modificationNotes?: string;
    changesFromAI: string[];
    isInitialCopy?: boolean;
  };
  prescriptionStatus: 'pending' | 'draft' | 'review' | 'signed' | 'sent';
  prescriptionData?: any;
  patientInfo: {
    firstName: string;
    lastName: string;
    age?: number;
    gender?: string;
  };
  hasDoctorDiagnosis: boolean;
}

export interface UpdateDiagnosisRequest {
  primaryDiagnosis: string;
  differentialDiagnosis: string[];
  clinicalReasoning: string;
  confidenceScore: number;
}

export interface ModifyDiagnosisRequest {
  modificationType: 'edit' | 'override' | 'enhance';
  originalDiagnosis: string;
  modifiedDiagnosis: string;
  modificationNotes: string;
  confidenceScore: number;
}

export interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

export interface Investigation {
  name: string;
  instructions: string;
}

export interface FollowUp {
  date: Date;
  instructions: string;
}

export interface SavePrescriptionDraftRequest {
  medications: Medication[];
  investigations: Investigation[];
  lifestyleAdvice: string[];
  followUp: FollowUp;
}

export interface SignAndSendRequest {
  password: string;
  mfaCode?: string;
}

export interface PrescriptionHistory {
  action: 'created' | 'modified' | 'signed' | 'sent';
  timestamp: Date;
  performedBy: string;
  details: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface PrescriptionStatusResponse {
  prescriptionStatus: string;
  message: string;
  updatedAt: Date;
}

export interface PrescriptionPreviewResponse {
  draftPdfUrl: string;
  prescriptionStatus: string;
  message: string;
  generatedAt: Date;
}

export interface SignedPrescriptionResponse {
  signedPdfUrl: string;
  pdfHash: string;
  prescriptionStatus: string;
  digitalSignature: {
    algorithm: string;
    signedAt: Date;
    certificateId: string;
  };
  message: string;
}

export const prescriptionApi = {
  // Get prescription workspace data
  getPrescriptionWorkspace: async (consultationId: string): Promise<PrescriptionWorkspace> => {
    const response = await apiClient.get(`/consultations/${consultationId}/prescription/workspace`);
    return response.data;
  },

  // Update diagnosis
  updateDiagnosis: async (
    consultationId: string,
    data: UpdateDiagnosisRequest
  ): Promise<PrescriptionStatusResponse> => {
    const response = await apiClient.put(`/consultations/${consultationId}/prescription/diagnosis`, data);
    return response.data;
  },

  // Modify AI diagnosis
  modifyDiagnosis: async (
    consultationId: string,
    data: ModifyDiagnosisRequest
  ): Promise<PrescriptionStatusResponse> => {
    const response = await apiClient.put(`/consultations/${consultationId}/prescription/diagnosis/modify`, data);
    return response.data;
  },

  // Save prescription draft
  savePrescriptionDraft: async (
    consultationId: string,
    data: SavePrescriptionDraftRequest
  ): Promise<PrescriptionStatusResponse> => {
    const response = await apiClient.put(`/consultations/${consultationId}/prescription/draft`, data);
    return response.data;
  },

  // Generate PDF preview
  generatePreview: async (consultationId: string): Promise<PrescriptionPreviewResponse> => {
    const response = await apiClient.post(`/consultations/${consultationId}/prescription/generate-preview`);
    return response.data;
  },

  // Sign and send prescription
  signAndSendPrescription: async (
    consultationId: string,
    data: SignAndSendRequest
  ): Promise<SignedPrescriptionResponse> => {
    const response = await apiClient.post(`/consultations/${consultationId}/prescription/sign-and-send`, data);
    return response.data;
  },

  // Get prescription history
  getPrescriptionHistory: async (consultationId: string): Promise<PrescriptionHistory[]> => {
    const response = await apiClient.get(`/consultations/${consultationId}/prescription/history`);
    return response.data;
  },

  // Complete consultation
  completeConsultation: async (consultationId: string): Promise<{
    message: string;
    consultationStatus: string;
    completedAt: Date;
  }> => {
    const response = await apiClient.post(`/consultations/${consultationId}/prescription/complete-consultation`);
    return response.data;
  },
};
