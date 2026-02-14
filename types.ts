
export enum UserRole {
  PATIENT = 'PATIENT',
  DOCTOR = 'DOCTOR',
  ADMIN = 'ADMIN'
}

export enum AdmissionStatus {
  ON_THE_WAY = 'ON_THE_WAY',
  ADMITTED = 'ADMITTED',
  DISCHARGED = 'DISCHARGED'
}

export interface HistoryItem {
  id: string;
  date: string;
  event: string;
  details: string;
  visitType: string;
}

export interface Prescription {
  id: string;
  medication: string;
  dosage: string;
  status: 'ORDERED' | 'APPROVED' | 'READY_FOR_PICKUP';
  prescribedBy: string;
  date: string;
  patientId?: string;
  patientName?: string;
}

export interface PharmacyItem {
  id: string;
  name: string;
  available: boolean;
  category: string;
  lastRestocked: string;
}

export interface MedicalRecord {
  bloodType: string;
  allergies: string;
  conditions: string;
  medications: string;
  lastUpdated: string;
  medicalHistory?: HistoryItem[];
  prescriptions?: Prescription[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  photo?: string;
  medicalRecord?: MedicalRecord;
}

export interface EmergencyAlert {
  id: string;
  patientId: string;
  patientName: string;
  age: string;
  sex: 'M' | 'F' | 'Other';
  incidentType: string; // Accident or Disease type
  timestamp: string;
  location?: {
    lat: number;
    lng: number;
  };
  medicalSummary: MedicalRecord;
  status: 'ACTIVE' | 'RESPONDED' | 'RESOLVED';
}

export interface Inpatient {
  id: string;
  patientName: string;
  dob?: string;
  status: AdmissionStatus;
  admissionDate: string;
  dischargeDate?: string;
  ward: string;
  attendingPhysician: string;
  medicalSummary: MedicalRecord;
}

export interface ScheduleItem {
  id: string;
  title: string;
  time: string;
  type: 'SURGERY' | 'CONSULTATION' | 'ROUNDS' | 'BREAK';
  patientName?: string;
  location: string;
}

export interface MedicalBoardMeeting {
  id: string;
  title: string;
  date: string;
  time: string;
  specialty: string;
  participants: string[];
}
