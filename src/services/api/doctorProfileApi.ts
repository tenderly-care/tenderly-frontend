import axios from 'axios';
import config from '../../config/env';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: config.apiUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
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

// Enums matching backend
export enum Specialization {
  GENERAL_MEDICINE = 'general_medicine',
  CARDIOLOGY = 'cardiology',
  DERMATOLOGY = 'dermatology',
  ENDOCRINOLOGY = 'endocrinology',
  GASTROENTEROLOGY = 'gastroenterology',
  GYNECOLOGY = 'gynecology',
  NEUROLOGY = 'neurology',
  ORTHOPEDICS = 'orthopedics',
  PEDIATRICS = 'pediatrics',
  PSYCHIATRY = 'psychiatry',
  PULMONOLOGY = 'pulmonology',
  RADIOLOGY = 'radiology',
  UROLOGY = 'urology',
  ONCOLOGY = 'oncology',
  OPHTHALMOLOGY = 'ophthalmology',
  ENT = 'ent',
  ANESTHESIOLOGY = 'anesthesiology',
  EMERGENCY_MEDICINE = 'emergency_medicine',
}

export enum DayOfWeek {
  MONDAY = 'monday',
  TUESDAY = 'tuesday',
  WEDNESDAY = 'wednesday',
  THURSDAY = 'thursday',
  FRIDAY = 'friday',
  SATURDAY = 'saturday',
  SUNDAY = 'sunday',
}

export enum LicenseVerificationStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
}

// Types matching backend DTOs
export interface AvailabilitySlot {
  day: DayOfWeek;
  startTime: string;
  endTime: string;
}

export interface Qualification {
  degree: string;
  institution: string;
  year: number;
}

export interface BasicInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  profilePicture?: string;
}

export interface ProfessionalInfo {
  medicalLicenseNumber?: string;
  licenseVerificationStatus: LicenseVerificationStatus;
  licenseVerifiedAt?: Date;
  licenseVerifiedBy?: string;
  specialization?: Specialization[];
  experience?: number;
  qualification?: (Qualification | string)[];
  workLocation?: string;
  department?: string;
  designation?: string;
  consultationFee?: number;
  availableSlots?: AvailabilitySlot[];
  professionalPhone?: string;
  professionalEmail?: string;
  biography?: string;
  languagesSpoken?: string[];
  profileCompletionPercentage: number;
  lastUpdated: Date;
}

export interface VerificationStatus {
  isProfileComplete: boolean;
  isLicenseVerified: boolean;
  canAcceptConsultations: boolean;
  verificationNotes?: string;
}

export interface DoctorProfileResponse {
  id: string;
  basicInfo: BasicInfo;
  professionalInfo: ProfessionalInfo;
  verificationStatus: VerificationStatus;
}

export interface UpdateProfessionalInfoRequest {
  specialization?: Specialization[];
  experience?: number;
  qualification?: Qualification[];
  workLocation?: string;
  department?: string;
  designation?: string;
  consultationFee?: number;
  availableSlots?: AvailabilitySlot[];
  professionalPhone?: string;
  professionalEmail?: string;
  biography?: string;
  languagesSpoken?: string[];
}

export interface UpdateAvailabilityRequest {
  availableSlots: AvailabilitySlot[];
}

export interface ProfileCompletionStatus {
  completionPercentage: number;
  missingFields: string[];
  optionalFields: string[];
  canAcceptConsultations: boolean;
}

// API functions with correct endpoints
export const doctorProfileApi = {
  /**
   * Get doctor profile by ID
   */
  async getDoctorProfile(doctorId: string): Promise<DoctorProfileResponse> {
    try {
      const response = await api.get<DoctorProfileResponse>(`/doctor-profile/${doctorId}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error('Doctor profile not found');
      }
      throw new Error(error.response?.data?.message || 'Failed to get doctor profile');
    }
  },

  /**
   * Update professional information
   */
  async updateProfessionalInfo(data: UpdateProfessionalInfoRequest): Promise<DoctorProfileResponse> {
    try {
      const response = await api.put<DoctorProfileResponse>('/doctor-profile/professional-info', data);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 400) {
        throw new Error(error.response?.data?.message || 'Invalid input data');
      }
      throw new Error(error.response?.data?.message || 'Failed to update professional information');
    }
  },

  /**
   * Update availability
   */
  async updateAvailability(data: UpdateAvailabilityRequest): Promise<DoctorProfileResponse> {
    try {
      const response = await api.patch<DoctorProfileResponse>('/doctor-profile/availability', data);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 400) {
        throw new Error(error.response?.data?.message || 'Invalid availability data');
      }
      throw new Error(error.response?.data?.message || 'Failed to update availability');
    }
  },

  /**
   * Get profile completion status
   */
  async getProfileCompletionStatus(doctorId: string): Promise<ProfileCompletionStatus> {
    try {
      const response = await api.get<ProfileCompletionStatus>(`/doctor-profile/${doctorId}/completion-status`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error('Doctor profile not found');
      }
      throw new Error(error.response?.data?.message || 'Failed to get profile completion status');
    }
  },

  /**
   * Validate availability slots
   */
  validateAvailabilitySlots(slots: AvailabilitySlot[]): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!slots || slots.length === 0) {
      errors.push('At least one availability slot is required');
      return { isValid: false, errors };
    }

    // Check for overlapping slots on the same day
    const slotsByDay = new Map<DayOfWeek, AvailabilitySlot[]>();
    
    slots.forEach(slot => {
      if (!slotsByDay.has(slot.day)) {
        slotsByDay.set(slot.day, []);
      }
      slotsByDay.get(slot.day)!.push(slot);
    });

    slotsByDay.forEach((daySlots, day) => {
      if (daySlots.length > 1) {
        // Sort by start time
        daySlots.sort((a, b) => a.startTime.localeCompare(b.startTime));
        
        for (let i = 0; i < daySlots.length - 1; i++) {
          const current = daySlots[i];
          const next = daySlots[i + 1];
          
          if (current.endTime > next.startTime) {
            errors.push(`Overlapping slots on ${day}: ${current.startTime}-${current.endTime} and ${next.startTime}-${next.endTime}`);
          }
        }
      }
    });

    // Validate time format and logic
    slots.forEach(slot => {
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      
      if (!timeRegex.test(slot.startTime)) {
        errors.push(`Invalid start time format for ${slot.day}: ${slot.startTime}`);
      }
      
      if (!timeRegex.test(slot.endTime)) {
        errors.push(`Invalid end time format for ${slot.day}: ${slot.endTime}`);
      }
      
      if (slot.startTime >= slot.endTime) {
        errors.push(`End time must be after start time for ${slot.day}: ${slot.startTime}-${slot.endTime}`);
      }
    });

    return { isValid: errors.length === 0, errors };
  },

  /**
   * Format specialization for display
   */
  formatSpecialization(specialization: Specialization): string {
    return specialization
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  },

  /**
   * Get all specializations
   */
  getAllSpecializations(): { value: Specialization; label: string }[] {
    return Object.values(Specialization).map(spec => ({
      value: spec,
      label: this.formatSpecialization(spec)
    }));
  },

  /**
   * Get all days of week
   */
  getAllDaysOfWeek(): { value: DayOfWeek; label: string }[] {
    return Object.values(DayOfWeek).map(day => ({
      value: day,
      label: day.charAt(0).toUpperCase() + day.slice(1)
    }));
  }
};
