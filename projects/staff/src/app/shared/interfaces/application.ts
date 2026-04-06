export interface CertificateInfo {
  signed_file: string;
  uploaded_at: string;
}

export interface Application {
  // Required backend properties
  id: number;
  id_no: number;
  reference_number: string;
  parcel_number: string;
  purpose: string;
  county: string;
  registry: string;
  status: string;
  submitted_at: string | null;
  assigned_to: number | null;
  applicant: number;
  returned?: boolean;
  paid_at?: string | null;
  paid_at_formatted?: string;
  time_elapsed?: string;
  referenceNo?: string;
  parcelNo?: string;

  // Applicant details - ADD THESE
  applicantName?: string;
  applicantIdNo?: number;
  applicantId?: number;
  applicantEmail?: string;
  applicantPhone?: string;

  // Optional additional properties
  assigned_to_username?: string;
  certificate?: CertificateInfo;
  payment?:{}
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

export interface Application {
  // ... existing fields

  // New fields for documents
  documents?: {
    applicationDocs: Document[];
    supportingDocs: Document[];
    certificate?: Certificate;
  };

  // Search history
  searchHistory?: SearchRecord[];

  // Status tracking
  statusHistory?: StatusChange[];
  rejectionReason?: string;
  returnReason?: string;
}

export interface Document {
  id: number;
  name: string;
  type: string;
  url: string;
  uploadedAt: string;
  category: 'application' | 'supporting' | 'certificate';
}

export interface Certificate {
  id: number;
  url: string;
  referenceNo: string;
  qrCode: string;
  generatedAt: string;
  registrarSignature: string;
}

export interface SearchRecord {
  id: number;
  searchDate: string;
  searchedBy: string;
  searchType: string;
  result: string;
  certificateRef?: string;
}

export interface StatusChange {
  status: string;
  changedAt: string;
  changedBy: string;
  reason?: string;
}

export interface Payment {
  id: number;
  amount: string;
  invoice_number: string;
  payment_reference: string;
  merchant_request_id: string;
  paid_at: string;
}
