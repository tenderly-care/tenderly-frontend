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
    console.log('🔗 Consultation API Request:', {
      method: config.method?.toUpperCase(),
      url: `${config.baseURL}${config.url}`,
      hasToken: !!token,
      tokenPreview: token ? token.substring(0, 20) + '...' : 'none'
    });
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for better error handling
apiClient.interceptors.response.use(
  (response) => {
    console.log('✅ Consultation API Response:', {
      status: response.status,
      url: response.config.url,
      dataType: typeof response.data,
      isArray: Array.isArray(response.data)
    });
    return response;
  },
  (error) => {
    console.error('❌ Consultation API Error:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      method: error.config?.method,
      message: error.response?.data?.message || error.message,
      baseURL: error.config?.baseURL
    });
    return Promise.reject(error);
  }
);

export interface Consultation {
  _id: string;
  id?: string; // For compatibility
  patientId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  doctorId: string;
  doctorInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    specialization: string;
    assignedAt: string;
    assignedBy: string;
  };
  consultationId: string;
  clinicalSessionId: string;
  status: 'active' | 'clinical_assessment_complete' | 'completed' | 'cancelled' | 'pending';
  consultationType: 'chat' | 'tele' | 'video' | 'emergency';
  priority: 'normal' | 'high' | 'low';
  isActive: boolean;
  activatedAt: string;
  expiresAt: string;
  sessionCount: number;
  messageCount: number;
  paymentInfo: {
    paymentId: string;
    paymentStatus: 'completed' | 'pending' | 'failed' | 'refunded';
    amount: number;
    currency: string;
    paidAt: string;
    transactionId: string;
    gatewayResponse: any;
  };
  prescriptionStatus: 'not_started' | 'draft' | 'completed';
  prescriptionHistory: any[];
  chatHistory: any[];
  statusHistory: {
    status: string;
    changedAt: string;
    changedBy: string;
    reason: string;
    metadata?: any;
  }[];
  businessRules: string[];
  requiresFollowUp: boolean;
  isQualityReviewed: boolean;
  metadata: {
    ipAddress: string;
    userAgent: string;
    source: string;
    referralSource: string;
    doctorAssignmentMethod: string;
  };
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  __v: number;
  aiAgentOutput?: {
    request_id: string;
    patient_age: number;
    primary_symptom: string;
    possible_diagnoses: {
      name: string;
      confidence_score: number;
      description: string;
    }[];
    clinical_reasoning: string;
    differential_considerations: string[];
    safety_assessment: any;
    risk_assessment: any;
    recommended_investigations: any[];
    treatment_recommendations: any;
    patient_education: string[];
    warning_signs: string[];
    confidence_score: number;
    processing_notes: string[];
    disclaimer: string;
    timestamp: string;
  };
  structuredAssessmentInput?: {
    patient_profile: {
      age: number;
      request_id: string;
      timestamp: string;
    };
    primary_complaint: {
      main_symptom: string;
      duration: string;
      severity: string;
      onset: string;
      progression: string;
    };
    symptom_specific_details: any;
    reproductive_history: any;
    associated_symptoms: any;
    medical_context: any;
    healthcare_interaction: any;
    patient_concerns: any;
  };
}

export interface SymptomScreening {
  id: string;
  sessionId: string;
  symptoms: string[];
  severity: 'low' | 'medium' | 'high';
  aiAnalysis?: string;
  createdAt: string;
}

export interface PaymentDetails {
  paymentId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'paid' | 'failed';
  paymentMethod: string;
  gatewayTransactionId?: string;
  paymentUrl?: string;
  expiresAt: string;
}

export interface Prescription {
  id: string;
  consultationId: string;
  medications: Medication[];
  instructions: string;
  diagnosis: string;
  doctorSignature: string;
  issuedAt: string;
  validUntil: string;
}

export interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

export interface DoctorShift {
  id: string;
  doctorId: string;
  date: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  consultationType: string[];
}

export const consultationApi = {
  // Get all consultations for current user
  getConsultations: async (): Promise<Consultation[]> => {
    const response = await apiClient.get('/consultations');
    return response.data;
  },

  // Get all consultations for the current doctor
  getDoctorConsultations: async (): Promise<Consultation[]> => {
    const response = await apiClient.get('/consultations/doctor/me');
    return response.data;
  },

  // Get consultation by ID
  getConsultation: async (id: string): Promise<Consultation> => {
    const response = await apiClient.get(`/consultations/${id}`);
    return response.data;
  },

  // Get consultation by ID with detailed information
  getConsultationById: async (id: string): Promise<Consultation> => {
    try {
      // Try the direct consultation endpoint first
      const response = await apiClient.get(`/consultations/${id}`);
      return response.data;
    } catch (error: any) {
      // If direct endpoint fails, try to get it from doctor consultations list
      if (error.response?.status === 500 || error.response?.status === 404) {
        console.log('⚠️ Direct consultation endpoint failed, trying doctor consultations list...');
        try {
          const doctorConsultationsResponse = await apiClient.get('/consultations/doctor/me');
          let consultations: Consultation[] = [];
          
          // Handle different response formats
          if (doctorConsultationsResponse.data && typeof doctorConsultationsResponse.data === 'object') {
            if ('consultations' in doctorConsultationsResponse.data && Array.isArray(doctorConsultationsResponse.data.consultations)) {
              consultations = doctorConsultationsResponse.data.consultations;
            } else if (Array.isArray(doctorConsultationsResponse.data)) {
              consultations = doctorConsultationsResponse.data;
            }
          }
          
          // Find the specific consultation by ID
          const consultation = consultations.find(c => c._id === id || c.id === id);
          if (consultation) {
            return consultation;
          } else {
            throw new Error(`Consultation with ID ${id} not found`);
          }
        } catch (fallbackError) {
          console.error('❌ Fallback consultation fetch also failed:', fallbackError);
          throw fallbackError;
        }
      } else {
        throw error;
      }
    }
  },

  // Create new consultation
  createConsultation: async (data: {
    consultationType: string;
    symptoms?: string[];
    scheduledAt?: string;
  }): Promise<Consultation> => {
    const response = await apiClient.post('/consultations', data);
    return response.data;
  },

  // Select consultation type
  selectConsultationType: async (data: {
    sessionId: string;
    selectedConsultationType: string;
  }): Promise<{ success: boolean; sessionId: string }> => {
    const response = await apiClient.post('/consultations/select-consultation', data);
    return response.data;
  },

  // Submit symptoms
  submitSymptoms: async (data: {
    sessionId: string;
    symptoms: string[];
    description?: string;
  }): Promise<SymptomScreening> => {
    const response = await apiClient.post('/consultations/symptoms', data);
    return response.data;
  },

  // Get AI diagnosis
  getAIDiagnosis: async (sessionId: string): Promise<{
    diagnosis: string;
    confidence: number;
    recommendations: string[];
  }> => {
    const response = await apiClient.get(`/consultations/ai-diagnosis/${sessionId}`);
    return response.data;
  },

  // Create payment
  createPayment: async (sessionId: string): Promise<PaymentDetails> => {
    const response = await apiClient.post(`/consultations/create-payment/${sessionId}`);
    return response.data;
  },

  // Create mock payment
  createMockPayment: async (sessionId: string): Promise<PaymentDetails> => {
    const response = await apiClient.post(`/consultations/mock-payment/${sessionId}`);
    return response.data;
  },

  // Confirm payment
  confirmPayment: async (data: {
    sessionId: string;
    paymentId: string;
    gatewayTransactionId: string;
    paymentMethod: string;
    paymentMetadata: any;
  }): Promise<{
    success: boolean;
    clinicalSessionId: string;
    consultationId: string;
  }> => {
    const response = await apiClient.post('/consultations/confirm-payment', data);
    return response.data;
  },

  // Debug payment
  debugPayment: async (data: {
    sessionId: string;
    paymentId: string;
  }): Promise<any> => {
    const response = await apiClient.post('/consultations/debug-payment', data);
    return response.data;
  },

  // Get available doctors
  getAvailableDoctors: async (consultationType: string): Promise<{
    doctors: Array<{
      id: string;
      name: string;
      specialization: string;
      rating: number;
      experience: number;
      availability: string[];
    }>;
  }> => {
    const response = await apiClient.get(`/consultations/available-doctors?type=${consultationType}`);
    return response.data;
  },

  // Assign doctor
  assignDoctor: async (consultationId: string, doctorId: string): Promise<{
    success: boolean;
    message: string;
  }> => {
    const response = await apiClient.post(`/consultations/${consultationId}/assign-doctor`, {
      doctorId,
    });
    return response.data;
  },

  // Start consultation
  startConsultation: async (consultationId: string): Promise<{
    success: boolean;
    sessionToken: string;
    roomId: string;
  }> => {
    const response = await apiClient.post(`/consultations/${consultationId}/start`);
    return response.data;
  },

  // End consultation
  endConsultation: async (consultationId: string): Promise<{
    success: boolean;
    message: string;
  }> => {
    const response = await apiClient.post(`/consultations/${consultationId}/end`);
    return response.data;
  },

  // Get prescription
  getPrescription: async (consultationId: string): Promise<Prescription> => {
    const response = await apiClient.get(`/consultations/${consultationId}/prescription`);
    return response.data;
  },

  // Generate prescription
  generatePrescription: async (consultationId: string, data: {
    medications: Medication[];
    instructions: string;
    diagnosis: string;
  }): Promise<Prescription> => {
    const response = await apiClient.post(`/consultations/${consultationId}/prescription`, data);
    return response.data;
  },

  // Get doctor shifts
  getDoctorShifts: async (date?: string): Promise<DoctorShift[]> => {
    const params = date ? { date } : {};
    const response = await apiClient.get('/consultations/doctor-shifts', { params });
    return response.data;
  },

  // Create doctor shift
  createDoctorShift: async (data: {
    date: string;
    startTime: string;
    endTime: string;
    consultationType: string[];
  }): Promise<DoctorShift> => {
    const response = await apiClient.post('/consultations/doctor-shifts', data);
    return response.data;
  },

  // Update doctor shift
  updateDoctorShift: async (shiftId: string, data: Partial<DoctorShift>): Promise<DoctorShift> => {
    const response = await apiClient.patch(`/consultations/doctor-shifts/${shiftId}`, data);
    return response.data;
  },

  // Delete doctor shift
  deleteDoctorShift: async (shiftId: string): Promise<{ success: boolean }> => {
    const response = await apiClient.delete(`/consultations/doctor-shifts/${shiftId}`);
    return response.data;
  },

  // Upload file
  uploadFile: async (consultationId: string, file: File): Promise<{
    success: boolean;
    fileUrl: string;
    fileName: string;
  }> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post(`/consultations/${consultationId}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Get consultation history
  getConsultationHistory: async (patientId?: string): Promise<Consultation[]> => {
    const params = patientId ? { patientId } : {};
    const response = await apiClient.get('/consultations/history', { params });
    return response.data;
  },

  // Cancel consultation
  cancelConsultation: async (consultationId: string, reason?: string): Promise<{
    success: boolean;
    message: string;
  }> => {
    const response = await apiClient.post(`/consultations/${consultationId}/cancel`, {
      reason,
    });
    return response.data;
  },

  // Reschedule consultation
  rescheduleConsultation: async (consultationId: string, newDateTime: string): Promise<{
    success: boolean;
    message: string;
  }> => {
    const response = await apiClient.post(`/consultations/${consultationId}/reschedule`, {
      newDateTime,
    });
    return response.data;
  },

  // Prescription Management APIs
  // Modify AI diagnosis for prescription
  modifyAIDiagnosis: async (consultationId: string, data: {
    diagnosis?: string;
    modifications?: any;
  }): Promise<any> => {
    const response = await apiClient.post(`/consultations/${consultationId}/prescription/diagnosis/modify`, data);
    return response.data;
  },

  // Save prescription draft
  savePrescriptionDraft: async (consultationId: string, data: {
    medications?: Medication[];
    diagnosis?: string;
    instructions?: string;
    doctorNotes?: string;
  }): Promise<any> => {
    const response = await apiClient.post(`/consultations/${consultationId}/prescription/draft`, data);
    return response.data;
  },

  // Generate prescription PDF preview
  generatePrescriptionPreview: async (consultationId: string): Promise<{
    previewUrl?: string;
    pdfData?: string;
    success: boolean;
  }> => {
    const response = await apiClient.post(`/consultations/${consultationId}/prescription/generate-preview`);
    return response.data;
  },

  // Sign and send prescription
  signAndSendPrescription: async (consultationId: string, data?: {
    digitalSignature?: string;
    sendMethod?: 'email' | 'sms' | 'both';
  }): Promise<{
    success: boolean;
    prescriptionId?: string;
    message?: string;
  }> => {
    const response = await apiClient.post(`/consultations/${consultationId}/prescription/sign-and-send`, data || {});
    return response.data;
  },

  // Complete consultation with prescription
  completeConsultationWithPrescription: async (consultationId: string): Promise<{
    success: boolean;
    message: string;
  }> => {
    const response = await apiClient.post(`/consultations/${consultationId}/prescription/complete-consultation`);
    return response.data;
  },
};
