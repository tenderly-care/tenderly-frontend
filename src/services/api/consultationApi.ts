import axios from 'axios';
import config from '../../config/env';

const API_BASE_URL = config.API_URL;

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

export interface Consultation {
  id: string;
  sessionId: string;
  patientId: string;
  doctorId?: string;
  consultationType: 'chat' | 'tele' | 'video' | 'emergency';
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  symptoms: string[];
  diagnosis?: string;
  prescription?: string;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  amount: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
  scheduledAt?: string;
  completedAt?: string;
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

  // Get consultation by ID
  getConsultation: async (id: string): Promise<Consultation> => {
    const response = await apiClient.get(`/consultations/${id}`);
    return response.data;
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
}; 