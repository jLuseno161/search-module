// src/app/shared/interfaces/application.interface.ts
export interface Application {
  // Backend properties
  id: number;
  reference_number: string;
  parcel_number: string;
  purpose: string;
  county: string;
  registry: string;
  status: 'submitted' | 'assigned' | 'verified' | 'rejected' | 'completed' | 'pending';
  submitted_at: string;
  assigned_to?: number;
  assigned_to_username?: string;
  applicant?: any; // Can be object or ID
  
  // Frontend display properties
  dateSubmitted?: string;
  timeElapsed?: string;
  
  // For table compatibility
  referenceNo?: string;
  parcelNo?: string;
  applicantName?: string;
  applicantId?: number;
  certificate?: {
    signed_file: string;
    uploaded_at: string;
  };
}

export interface Registrar {
  id: number;
  name: string;
  username: string;
  email?: string;
  county: string;
  registry: string;
  role: string;
  first_name?: string;
  last_name?: string;
}