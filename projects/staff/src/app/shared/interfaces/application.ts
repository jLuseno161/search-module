export interface CertificateInfo {
  signed_file: string;
  uploaded_at: string;
}

// export interface Application {
//   // Backend properties
//   id: number;
//   reference_number: string;
//   parcel_number: string;
//   purpose: string;
//   county: string;
//   registry: string;
//   status: string;
//   submitted_at: string;
//   assigned_to: number | null;
//   assigned_to_username?: string;
//   applicant: number;

//   // Frontend display properties
//   dateSubmitted?: string;
//   timeElapsed?: string;

//   // For table compatibility
//   referenceNo?: string;
//   parcelNo?: string;
//   applicantName?: string;
//   applicantId?: number;

//   // Certificate information
//   certificate?: CertificateInfo;

//   // Payment information (optional)
//   payment?: any;

//   // Reviews (optional)
//   reviews?: any[];

//   // Optional: Store full objects for debugging
//   applicantObject?: any;
//   assignedToObject?: any;

//   // Additional properties for this component
//   assignedRegistrar?: string;
//   assignedRegistrarId?: number | null;
// }
export interface Application {
  // Required backend properties
  id: number;
  reference_number: string;
  parcel_number: string;
  purpose: string;
  county: string;
  registry: string;
  status: string;
  submitted_at: string;
  assigned_to: number | null;
  applicant: number;

  // Optional frontend properties
  dateSubmitted?: string;
  timeElapsed?: string;
  referenceNo?: string;
  parcelNo?: string;
  applicantName?: string;
  applicantId?: number;

  // Optional additional properties
  assigned_to_username?: string;
  certificate?: CertificateInfo;
  payment?: any;
  reviews?: any[];

  // For component-specific needs
  assignedRegistrar?: string;
  assignedRegistrarId?: number | null;

  // For debugging
  applicantObject?: any;
  assignedToObject?: any;
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
