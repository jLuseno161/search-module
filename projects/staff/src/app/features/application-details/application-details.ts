import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Application } from '../../shared/interfaces/application';
import { AuthService } from '../../auth/auth.service';
import { ApplicationService } from '../../services/application.service';
import { SearchComponent } from '../search-form/search-form.component';
import { PdfGeneratorService } from '../../services/pdf-generator.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-application-details',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SearchComponent
  ],
  templateUrl: './application-details.html',
  styleUrls: ['./application-details.css'],
})
export class ApplicationDetails implements OnInit {
  // User information
  currentUserRole: string = '';
  currentUserName: string = '';
  currentUserId: number = 0;
  currentUserRegistry: string = '';

  // Application data
  application: Application | null = null;
  applicationId: number | null = null;
  activeTab: 'details' | 'search-form' | 'certificate-upload' = 'details';
  error: string | null = null;
  isLoading: boolean = true;

  // Registrar data
  registrars: any[] = [];
  isRegistrarsLoading: boolean = false;

  // Certificate upload
  selectedCertificate: File | null = null; // LRA 84 Certificate (generated from form)
  selectedSupportingDoc: File | null = null; // Supporting document (proof used for verification)
  isUploadingCertificate: boolean = false;
  rejectReason: string = '';
  isRejecting: boolean = false;
  certificateComment: string = '';
  savedCertificateData: any = null; // Stores the generated LRA 84 certificate data
  savedCertificateBlob: Blob | null = null;
  savedCertificateFile: File | null = null;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private pdfGenerator: PdfGeneratorService,
    private applicationService: ApplicationService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    // Get current user info
    this.currentUserRole = this.authService.getCurrentUserRole();
    this.currentUserName = this.authService.getCurrentUserName();
    this.currentUserId = this.authService.getCurrentUserId();
    this.currentUserRegistry = this.authService.getCurrentUserRegistry();

    console.log('👤 Current User:', {
      id: this.currentUserId,
      role: this.currentUserRole,
      name: this.currentUserName,
      registry: this.currentUserRegistry
    });

    // Load registrars first
    this.loadRegistrars();

    // Get application ID from route
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.applicationId = +id;
        console.log('📋 Loading application ID:', this.applicationId);
        this.loadApplicationDetails(this.applicationId);
      } else {
        this.error = 'No application ID provided';
        this.isLoading = false;
      }
    });
  }

  // ========== DATA LOADING METHODS ==========

  private loadRegistrars(): void {
    this.isRegistrarsLoading = true;
    this.applicationService.getAvailableRegistrars(this.currentUserRegistry).subscribe({
      next: (registrars: any[]) => {
        this.registrars = registrars;
        this.isRegistrarsLoading = false;
        console.log('✅ Registrars loaded:', this.registrars.length);
      },
      error: (error: any) => {
        console.error('❌ Error loading registrars:', error);
        this.isRegistrarsLoading = false;
        this.registrars = [];
      }
    });
  }

 public loadApplicationDetails(id: number): void {
  console.log('🔍 loadApplicationDetails called with id:', id);
  console.log('👤 Current user role:', this.currentUserRole);
  this.isLoading = true;
  this.error = null;

  if (this.currentUserRole === 'is_registrar') {
    console.log('👤 Loading as registrar - calling loadRegistrarApplication');
    this.loadRegistrarApplication(id);
  } else if (this.currentUserRole === 'is_registrar_in_charge') {
    console.log('👤 Loading as registrar in charge - calling loadRegistrarInChargeApplication');
    this.loadRegistrarInChargeApplication(id);
  } else {
    console.log('❌ Unauthorized access, role:', this.currentUserRole);
    this.error = 'Unauthorized access';
    this.isLoading = false;
  }
}
 private loadRegistrarApplication(id: number): void {
  console.log('📡 Inside loadRegistrarApplication, calling API with id:', id);

  this.applicationService.getRegistrarAssignedApplications().subscribe({
    next: (response) => {
      console.log('📦 API Response received in loadRegistrarApplication:', response);

      // Handle different response formats
      let applicationsArray = [];
      if (Array.isArray(response)) {
        applicationsArray = response;
        console.log('✅ Response is an array with', applicationsArray.length, 'applications');
      } else if (response && response.results && Array.isArray(response.results)) {
        applicationsArray = response.results;
        console.log('✅ Response has results array with', applicationsArray.length, 'applications');
      } else {
        console.error('❌ Unexpected response format:', response);
        this.error = 'Invalid response format from server';
        this.isLoading = false;
        return;
      }

      console.log('🔍 Looking for application with id:', id);
      const apiApplication = applicationsArray.find((app: any) => app.id === id);
      console.log('🔍 Found application:', apiApplication);

      if (apiApplication) {
        console.log('✅ Application found, calling mapApiToApplication');
        this.application = this.mapApiToApplication(apiApplication);
        console.log('✅ Application mapped successfully:', this.application);
      } else {
        console.log('❌ Application not found or not assigned to you');
        this.error = 'Application not found or not assigned to you';
      }
      console.log('🔄 Setting isLoading to false');
      this.isLoading = false;
    },
    error: (error) => {
      console.error('❌ Error in loadRegistrarApplication:', error);
      this.error = 'Failed to load application details: ' + (error.message || 'Unknown error');
      this.isLoading = false;
    }
  });
}

 private loadRegistrarInChargeApplication(id: number): void {
  console.log('📡 Inside loadRegistrarInChargeApplication, calling API with id:', id);

  this.applicationService.getRegistrarInChargeApplications().subscribe({
    next: (response) => {
      console.log('📦 API Response received in loadRegistrarInChargeApplication:', response);

      // Handle different response formats
      let applicationsArray = [];
      if (Array.isArray(response)) {
        applicationsArray = response;
        console.log('✅ Response is an array with', applicationsArray.length, 'applications');
      } else if (response && response.results && Array.isArray(response.results)) {
        applicationsArray = response.results;
        console.log('✅ Response has results array with', applicationsArray.length, 'applications');
      } else {
        console.error('❌ Unexpected response format:', response);
        this.error = 'Invalid response format from server';
        this.isLoading = false;
        return;
      }

      console.log('🔍 Looking for application with id:', id);
      const apiApplication = applicationsArray.find((app: any) => app.id === id);
      console.log('🔍 Found application:', apiApplication);

      if (apiApplication) {
        console.log('✅ Application found, calling mapApiToApplication');
        this.application = this.mapApiToApplication(apiApplication);
        console.log('✅ Application mapped successfully:', this.application);
      } else {
        console.log('❌ Application not found in registry');
        this.error = 'Application not found in your registry';
      }
      console.log('🔄 Setting isLoading to false');
      this.isLoading = false;
    },
    error: (error) => {
      console.error('❌ Error in loadRegistrarInChargeApplication:', error);
      this.error = 'Failed to load application details: ' + (error.message || 'Unknown error');
      this.isLoading = false;
    }
  });
}

  // ========== DATA MAPPING METHOD ==========

  private mapApiToApplication(apiApp: any): Application {
    console.log('🔍 Mapping API data:', apiApp);

    const submittedDate = new Date(apiApp.payment.paid_at);
    console.log("time", submittedDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - submittedDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Extract assigned registrar info
    let assignedRegistrarName = 'Not assigned';
    let assignedRegistrarId: number | null = null;

    if (apiApp.assigned_to && typeof apiApp.assigned_to === 'object') {
      const assignedRegistrar = apiApp.assigned_to;
      assignedRegistrarName = assignedRegistrar.username ||
                             `${assignedRegistrar.first_name || ''} ${assignedRegistrar.last_name || ''}`.trim() ||
                             `Registrar #${assignedRegistrar.id}`;
      assignedRegistrarId = assignedRegistrar.id;
    } else if (apiApp.assigned_to && typeof apiApp.assigned_to === 'number') {
      assignedRegistrarId = apiApp.assigned_to;
      const foundRegistrar = this.registrars.find(r => r.id === assignedRegistrarId);
      assignedRegistrarName = foundRegistrar?.username || `Registrar #${assignedRegistrarId}`;
    }

    let paidAtValue = null;
    if (apiApp.payment && apiApp.payment.paid_at) {
      paidAtValue = apiApp.payment.paid_at;
    } else if (apiApp.paid_at) {
      paidAtValue = apiApp.paid_at;
    }
    // Extract applicant info
    let applicantName = 'Unknown Applicant';
    let applicantId = 0;
    let applicantIdNo = 0;
    let applicantEmail = '';
    let applicantPhone = '';

    if (apiApp.applicant && typeof apiApp.applicant === 'object') {
      const applicant = apiApp.applicant;
      applicantName = applicant.username ||
                     `${applicant.first_name || ''} ${applicant.last_name || ''}`.trim() ||
                     `Applicant #${applicant.id}`;
      applicantId = applicant.id;
      applicantEmail = applicant.email || '';
      applicantPhone = applicant.phone_number || '';
      applicantIdNo = applicant.id_no || 0;

      console.log('📧 Extracted applicant details:', {
        id: applicantId,
        name: applicantName,
        email: applicantEmail,
        phone: applicantPhone,
        id_no: applicantIdNo
      });
    } else if (apiApp.applicant && typeof apiApp.applicant === 'number') {
      applicantId = apiApp.applicant;
      applicantName = `Applicant #${applicantId}`;
    }

    // Create certificate info if exists
    let certificateInfo = undefined;
    if (apiApp.certificate && apiApp.certificate.signed_file) {
      certificateInfo = {
        signed_file: apiApp.certificate.signed_file,
        uploaded_at: this.formatDate(apiApp.certificate.uploaded_at)
      };
    }

    // Create the Application object
    const application: Application = {
      id: apiApp.id,
      reference_number: apiApp.reference_number,
      parcel_number: apiApp.parcel_number,
      purpose: apiApp.purpose,
      county: apiApp.county,
      registry: apiApp.registry,
      status: apiApp.status,
      submitted_at: apiApp.submitted_at,
      id_no: applicantIdNo,
      assigned_to: assignedRegistrarId,
      applicant: applicantId,
      assigned_to_username: assignedRegistrarName,
      applicantName: applicantName,
      applicantId: applicantId,
      applicantEmail: applicantEmail,
      applicantPhone: applicantPhone,
      applicantIdNo: applicantIdNo,
      paid_at_formatted: submittedDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }),
      time_elapsed: this.calculateTimeElapsed(diffDays),
      referenceNo: apiApp.reference_number,
      parcelNo: apiApp.parcel_number,
      certificate: certificateInfo,
      applicantObject: apiApp.applicant,
      assignedToObject: apiApp.assigned_to
    };

    return application;
  }

  // ========== PERMISSION METHODS ==========

  canUploadCertificate(): boolean {
    if (!this.application || !this.currentUserId) return false;
    const isAssignedToCurrentUser = this.application.assigned_to === this.currentUserId;
    const isValidStatus = this.application.status === 'submitted' || this.application.status === 'assigned';
    const canUpload = this.currentUserRole === 'is_registrar' && isValidStatus && isAssignedToCurrentUser;
    return canUpload;
  }

  canRejectApplication(): boolean {
    if (!this.application || !this.currentUserId) return false;
    const isAssignedToCurrentUser = this.application.assigned_to === this.currentUserId;
    // const isValidStatus = this.application.status === 'submitted';
    const isValidStatus = this.application.status === 'assigned' || this.application.status === 'submitted';
    const canReject = this.currentUserRole === 'is_registrar' && isValidStatus && isAssignedToCurrentUser;
    return canReject;
  }


  canReturnApplication(): boolean {
    if (!this.application || !this.currentUserId) return false;
    const isAssignedToCurrentUser = this.application.assigned_to === this.currentUserId;
    const isValidStatus = this.application.status === 'assigned' || this.application.status === 'submitted';
    return this.currentUserRole === 'is_registrar' && isValidStatus && isAssignedToCurrentUser;
  }

  approveApplication(): void {
    if (!this.canUploadCertificate()) return;

    this.applicationService.checkRegistrarSignature(this.currentUserId).subscribe({
      next: (response) => {
        if (!response.has_signature) {
          alert('You must upload your signature before approving applications. Please go to your profile to add a signature.');
          return;
        }
        this.activeTab = 'certificate-upload';
      },
      error: (error) => {
        console.error('Error checking signature:', error);
        alert('Could not verify signature status. Please try again.');
      }
    });
  }

  canAssignOfficers(): boolean {
    return this.currentUserRole === 'is_registrar_in_charge' &&
           this.application?.registry === this.currentUserRegistry &&
           (this.application?.status === 'pending' ||
            this.application?.status === 'submitted' ||
            this.application?.status === 'assigned');
  }

  // ========== ACTION METHODS ==========

  assignOfficer(): void {
    if (!this.canAssignOfficers()) {
      alert('Only Registrar In Charge can assign officers within their registry');
      return;
    }

    const availableRegistrars = this.getAvailableRegistrarsForAssignment();
    if (availableRegistrars.length === 0) {
      alert('No registrars available in your registry');
      return;
    }

    const registrarOptions = availableRegistrars.map((registrar, index) =>
      `${index + 1}. ${registrar.username}${registrar.id === this.application?.assigned_to ? ' (Currently Assigned)' : ''}`
    ).join('\n');

    const message = `Select a registrar to assign this application to:\n\n${registrarOptions}\n\nEnter the number (1-${availableRegistrars.length}):`;

    const selectedIndex = prompt(message);
    if (selectedIndex !== null && selectedIndex.trim() !== '') {
      const index = parseInt(selectedIndex) - 1;
      if (index >= 0 && index < availableRegistrars.length) {
        const selectedRegistrar = availableRegistrars[index];

        if (selectedRegistrar.id === this.application?.assigned_to) {
          alert('This registrar is already assigned to this application.');
          return;
        }

        if (confirm(`Assign application to ${selectedRegistrar.username}?`)) {
          this.executeAssignment(this.applicationId!, selectedRegistrar.id);
        }
      }
    }
  }

  private executeAssignment(applicationId: number, registrarId: number): void {
    this.applicationService.assignApplication(applicationId, registrarId).subscribe({
      next: (response: any) => {
        const newRegistrarName = this.registrars.find(r => r.id === registrarId)?.username || 'Assigned';
        alert(`✅ Application successfully assigned to ${newRegistrarName}!`);

        if (this.application) {
          this.application.assigned_to = registrarId;
          this.application.assigned_to_username = newRegistrarName;
          this.application.status = 'assigned';
        }

        this.loadApplicationDetails(this.applicationId!);
      },
      error: (error: any) => {
        console.error('❌ Error assigning application:', error);
        alert('Failed to assign application. Please try again.');
      }
    });
  }

  // ========== SEARCH FORM METHODS ==========

  handleSearchFormSubmit(formData: any): void {
    console.log('📝 LRA 84 Certificate generated:', formData);
    this.savedCertificateData = formData;

    if (this.application?.status !== 'assigned' || !this.application?.assigned_to) {
      console.log('🔄 Assigning application to current registrar...');

      this.applicationService.assignApplication(this.applicationId!, this.currentUserId).subscribe({
        next: (response) => {
          console.log('✅ Application assigned successfully to:', this.currentUserName);
          this.loadApplicationDetails(this.applicationId!);
          this.snackBar?.open(
            'LRA 84 Certificate generated! Application assigned to you. Proceed to upload supporting document.',
            'Close',
            { duration: 5000, panelClass: 'success-snackbar' }
          );
        },
        error: (error) => {
          console.error('❌ Failed to assign application:', error);
          this.snackBar?.open(
            'Certificate generated but assignment failed. Please contact Registrar In Charge.',
            'Close',
            { duration: 5000 }
          );
        }
      });
    } else {
      this.snackBar?.open('LRA 84 Certificate generated successfully!', 'Close', { duration: 3000 });
    }
  }

  // In application-details.ts

// In application-details.ts

onNextToUpload(certificateData: any): void {
  console.log('➡️ Moving to upload tab with certificate:', certificateData);
  this.savedCertificateData = certificateData.certificateData;

  // ✅ Check if we received the file directly with proper null checking
  if (certificateData.certificateFile) {
    const file = certificateData.certificateFile;

    // Type guard - ensure file exists before accessing properties
    if (file && file instanceof File) {
      this.selectedCertificate = file;
      console.log('✅ Certificate file received directly:', {
        name: file.name,
        size: `${(file.size / 1024).toFixed(2)} KB`,
        type: file.type
      });

      this.snackBar?.open('Certificate loaded. Please upload supporting document and approve.', 'Close', { duration: 3000 });
      this.setActiveTab('certificate-upload');
      return;
    }
  }

  // Fallback: Try to retrieve from localStorage (for backward compatibility)
  const storageKey = certificateData.storageKey || certificateData.metadataKey || `certificate_${this.applicationId}`;
  const storedPdf = localStorage.getItem(storageKey);

  if (storedPdf) {
    try {
      // Convert base64 back to File
      const base64Data = storedPdf.split(',')[1] || storedPdf;
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const pdfBlob = new Blob([byteArray], { type: 'application/pdf' });

      this.selectedCertificate = new File(
        [pdfBlob],
        `LRA84_${this.application?.reference_number || this.applicationId}.pdf`,
        { type: 'application/pdf' }
      );

      console.log('✅ Retrieved PDF from localStorage:', {
        key: storageKey,
        name: this.selectedCertificate.name,
        size: `${(this.selectedCertificate.size / 1024).toFixed(2)} KB`
      });

      this.snackBar?.open('Certificate loaded. Please upload supporting document and approve.', 'Close', { duration: 3000 });
    } catch (error) {
      console.error('❌ Error parsing stored PDF:', error);
      this.snackBar?.open('Error loading certificate. Please generate it again.', 'Close', { duration: 3000 });
      return;
    }
  } else {
    console.warn('⚠️ No stored PDF found in localStorage');
    this.snackBar?.open('Certificate not found. Please generate it again.', 'Close', { duration: 3000 });
    return;
  }

  // Check if application is assigned before switching
  if (this.application?.status === 'assigned' && this.application?.assigned_to === this.currentUserId) {
    this.setActiveTab('certificate-upload');
  } else {
    // Try to assign first
    this.applicationService.assignApplication(this.applicationId!, this.currentUserId).subscribe({
      next: () => {
        this.loadApplicationDetails(this.applicationId!);
        this.setActiveTab('certificate-upload');
        this.snackBar?.open('Application assigned! Please upload supporting document.', 'Close', { duration: 3000 });
      },
      error: (error) => {
        console.error('Failed to assign:', error);
        this.snackBar?.open('Please contact Registrar In Charge to assign this application to you.', 'Close', { duration: 5000 });
      }
    });
  }
}

  async previewCertificate(formData: any): Promise<void> {
    console.log('👁️ Preview requested:', formData);

    try {
      this.isLoading = true;
      const doc = await this.pdfGenerator.generateSearchCertificate(formData, this.currentUserName);
      const pdfBlob = doc.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      window.open(pdfUrl, '_blank');

      setTimeout(() => {
        URL.revokeObjectURL(pdfUrl);
        this.isLoading = false;
      }, 100);
    } catch (error) {
      console.error('Error generating PDF preview:', error);
      alert('Could not generate preview. Please try again.');
      this.isLoading = false;
    }
  }

  onSearchFormCancel(): void {
    console.log('❌ Search form cancelled');
    this.setActiveTab('details');
  }

  // ========== CERTIFICATE UPLOAD METHODS ==========

  onSupportingDocSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const validationResult = this.validateFileBeforeSelection(file);
      if (!validationResult.isValid) {
        this.snackBar?.open(validationResult.errorMessage, 'Close', { duration: 3000 });
        return;
      }
      this.selectedSupportingDoc = file;
      console.log('✅ Supporting document (proof) selected:', {
        name: file.name,
        size: `${(file.size / 1024).toFixed(2)} KB`,
        type: file.type
      });
    }
  }

  validateFileBeforeSelection(file: File): { isValid: boolean; errorMessage: string } {
    if (file.type !== 'application/pdf') {
      return { isValid: false, errorMessage: 'File must be a PDF file.' };
    }

    const fileExtension = file.name.toLowerCase().split('.').pop();
    if (fileExtension !== 'pdf') {
      return { isValid: false, errorMessage: 'File must have .pdf extension.' };
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      return { isValid: false, errorMessage: `File size (${fileSizeMB}MB) exceeds maximum limit of 10MB.` };
    }

    if (file.size === 0) {
      return { isValid: false, errorMessage: 'Selected file is empty.' };
    }

    return { isValid: true, errorMessage: '' };
  }

  uploadCertificate(): void {
    console.log('🔍 ===== APPROVAL PROCESS START =====');

    // Check if we have the generated certificate
    if (!this.selectedCertificate) {
      console.error('❌ No generated certificate found');
      this.snackBar?.open('No certificate found. Please generate it in Search Form first.', 'Close', { duration: 3000 });
      return;
    }

    // Check supporting document
    if (!this.selectedSupportingDoc) {
      console.error('❌ No supporting document selected');
      this.snackBar?.open('Please select the supporting document', 'Close', { duration: 3000 });
      return;
    }

    // Log what we're uploading
    console.log('📄 Generated Certificate (signed_file):', {
      name: this.selectedCertificate.name,
      type: this.selectedCertificate.type,
      size: `${(this.selectedCertificate.size / 1024).toFixed(2)} KB`,
      fromLocalStorage: true
    });

    console.log('📋 Supporting Document (registration_document):', {
      name: this.selectedSupportingDoc.name,
      type: this.selectedSupportingDoc.type,
      size: `${(this.selectedSupportingDoc.size / 1024).toFixed(2)} KB`
    });

    console.log('💬 Comment:', this.certificateComment);
    console.log('📊 Application Status:', this.application?.status);
    console.log('👤 Current User:', this.currentUserId);
    console.log('👤 Assigned To:', this.application?.assigned_to);

    // Validate
    if (this.application?.status !== 'submitted') {
      this.snackBar?.open(`Application must be "assigned". Current: "${this.application?.status}"`, 'Close', { duration: 3000 });
      return;
    }

    if (!this.certificateComment.trim()) {
      this.snackBar?.open('Please provide approval comments', 'Close', { duration: 3000 });
      return;
    }

    this.isUploadingCertificate = true;

    // Create FormData
    const formData = new FormData();
    formData.append('comment', this.certificateComment.trim());
    formData.append('signed_file', this.selectedCertificate);
    formData.append('registration_document', this.selectedSupportingDoc);

    // Log FormData contents
    console.log('📦 FormData being sent:');
    for (let pair of (formData as any).entries()) {
      if (pair[1] instanceof File) {
        console.log(`  ${pair[0]}: ${pair[1].name} (${(pair[1].size / 1024).toFixed(2)} KB)`);
      } else {
        console.log(`  ${pair[0]}: ${pair[1]}`);
      }
    }

    this.applicationService.uploadCertificate(this.applicationId!, formData).subscribe({
      next: (response) => {
        console.log('✅ Approval successful:', response);

        // Clear localStorage after successful upload
        const storageKey = `certificate_${this.applicationId}`;
        localStorage.removeItem(storageKey);
        localStorage.removeItem(`certificate_meta_${this.applicationId}`);
        console.log('🗑️ Cleared certificate from localStorage');

        this.isUploadingCertificate = false;
        this.selectedCertificate = null;
        this.selectedSupportingDoc = null;
        this.certificateComment = '';
        this.clearSelectedFiles();

        this.snackBar?.open('✓ Application approved successfully!', 'Close', { duration: 5000 });
        this.loadApplicationDetails(this.applicationId!);
        this.setActiveTab('details');
      },
      error: (error) => {
        this.isUploadingCertificate = false;
        console.error('❌ Approval failed:', error);
        console.error('Error status:', error.status);
        console.error('Error response:', error.error);

        let errorMessage = 'Approval failed. ';
        if (error.status === 500) {
          errorMessage = 'Server error. Please ensure files are valid PDFs and try again.';
        } else if (error.error?.error) {
          errorMessage += error.error.error;
        } else {
          errorMessage += 'Please check your files and try again.';
        }

        this.snackBar?.open(errorMessage, 'Close', { duration: 5000 });
      }
    });
  }

  clearSelectedFiles(): void {
    this.selectedCertificate = null;
    this.selectedSupportingDoc = null;
    this.certificateComment = '';

    const certInput = document.getElementById('certificateUpload') as HTMLInputElement;
    if (certInput) certInput.value = '';

    const supportInput = document.getElementById('supportingDocUpload') as HTMLInputElement;
    if (supportInput) supportInput.value = '';
  }

  clearStoredCertificate(): void {
    const storageKey = `certificate_${this.applicationId}`;
    localStorage.removeItem(storageKey);
    localStorage.removeItem(`certificate_meta_${this.applicationId}`);
    console.log('🗑️ Cleared certificate from localStorage');
    this.snackBar?.open('Stored certificate cleared', 'Close', { duration: 2000 });
  }

  rejectApplication(): void {
    if (!this.rejectReason.trim() || !this.applicationId) {
      alert('Please provide a rejection reason');
      return;
    }

    this.isRejecting = true;
    const rejectData = { comment: this.rejectReason.trim() };

    this.applicationService.rejectApplication(this.applicationId, rejectData).subscribe({
      next: (response) => {
        this.isRejecting = false;
        this.rejectReason = '';
        alert('Application rejected successfully!');
        this.loadApplicationDetails(this.applicationId!);
      },
      error: (error) => {
        this.isRejecting = false;
        console.error('❌ Error rejecting application:', error);
        alert('Error rejecting application. Please try again.');
      }
    });
  }

  // ========== HELPER METHODS ==========

  getAvailableRegistrarsForAssignment(): any[] {
    return this.registrars.filter(registrar =>
      registrar.registry === this.currentUserRegistry &&
      registrar.role === 'is_registrar'
    );
  }

  isApplicationAssigned(): boolean {
    return !!this.application?.assigned_to;
  }

  getAssignedRegistrarName(): string {
    return this.application?.assigned_to_username || 'Not assigned';
  }

  getApplicantDisplayName(): string {
    return this.application?.applicantName || 'Unknown Applicant';
  }

  getStatusBadgeClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'submitted':
      case 'pending':
        return 'badge bg-warning text-dark';
      case 'assigned':
        return 'badge bg-primary text-white';
      case 'completed':
      case 'verified':
        return 'badge bg-success text-white';
      case 'rejected':
        return 'badge bg-danger text-white';
      default:
        return 'badge bg-secondary text-white';
    }
  }

  getFileValidationMessage(file: File | null): string {
    if (!file) return 'No file selected';
    const validation = this.validateFileBeforeSelection(file);
    if (!validation.isValid) {
      return `${validation.errorMessage}`;
    }
    return `${file.name} (${this.getFileSize(file.size)}) - Ready to upload`;
  }

  getFileSize(bytes: number): string {
    if (!bytes) return 'Unknown size';
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  private formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  }

  private calculateTimeElapsed(days: number): string {
    if (days === null || days === undefined || isNaN(days) || days < 0) {
      return 'Just now';
    }
    if (days === 0) return 'Today';
    if (days === 1) return '1 day ago';
    if (days < 30) return `${days} days ago`;
    if (days < 365) {
      const months = Math.floor(days / 30);
      return `${months} month${months > 1 ? 's' : ''} ago`;
    }
    const years = Math.floor(days / 365);
    return `${years} year${years > 1 ? 's' : ''} ago`;
  }

  setActiveTab(tab: 'details' | 'search-form' | 'certificate-upload'): void {
    this.activeTab = tab;
  }

  goBack(): void {
    if (this.currentUserRole === 'is_registrar_in_charge') {
      this.router.navigate(['/registrarInCharge']);
    } else if (this.currentUserRole === 'is_registrar') {
      this.router.navigate(['/registrar-dashboard']);
    } else {
      this.router.navigate(['/dashboard']);
    }
  }

  returnApplication(): void {
    if (!this.canReturnApplication() || !this.applicationId) return;

    const reason = prompt('Please enter reason for returning this application:');
    if (!reason || !reason.trim()) return;

    this.isLoading = true;

    this.applicationService.returnApplication(this.applicationId, { comment: reason.trim() }).subscribe({
      next: (response) => {
        this.isLoading = false;
        alert('Application returned successfully!');
        this.loadApplicationDetails(this.applicationId!);
      },
      error: (error) => {
        this.isLoading = false;
        console.error('❌ Error returning application:', error);
        alert('Error returning application. Please try again.');
      }
    });
  }

  previewGeneratedCertificate(): void {
    if (this.savedCertificateData && this.savedCertificateData.blob) {
      const pdfUrl = URL.createObjectURL(this.savedCertificateData.blob);
      window.open(pdfUrl, '_blank');
      setTimeout(() => URL.revokeObjectURL(pdfUrl), 1000);
    } else if (this.selectedCertificate) {
      const pdfUrl = URL.createObjectURL(this.selectedCertificate);
      window.open(pdfUrl, '_blank');
      setTimeout(() => URL.revokeObjectURL(pdfUrl), 1000);
    } else {
      this.snackBar?.open('No generated LRA 84 certificate found', 'Close', { duration: 3000 });
    }
  }

  uploadSupportingDocument(): void {
    this.uploadCertificate();
  }
// In application-details.ts, add this method:

canAccessSearchForm(): boolean {
  if (!this.application || !this.currentUserId) return false;

  // Check if user is a registrar
  if (this.currentUserRole !== 'is_registrar') return false;

  // Check if application is assigned
  if (!this.application.assigned_to) return false;

  // Check if current user is the assigned registrar
  const isAssignedRegistrar = this.application.assigned_to === this.currentUserId;

  // Only allow access if application is assigned to this registrar
  return isAssignedRegistrar;
}
  debugAndApprove(): void {
    console.log('🔍 ===== DEBUG: APPROVE BUTTON CLICKED =====');
    console.log('📋 Current State:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    console.log('✅ GENERATED CERTIFICATE (LRA 84):');
    if (this.selectedCertificate) {
      console.log('  - File name:', this.selectedCertificate.name);
      console.log('  - File type:', this.selectedCertificate.type);
      console.log('  - File size:', (this.selectedCertificate.size / 1024).toFixed(2), 'KB');
      console.log('  - File size (bytes):', this.selectedCertificate.size);
    } else {
      console.log('  ❌ NO CERTIFICATE SELECTED!');
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ SUPPORTING DOCUMENT:');
    if (this.selectedSupportingDoc) {
      console.log('  - File name:', this.selectedSupportingDoc.name);
      console.log('  - File type:', this.selectedSupportingDoc.type);
      console.log('  - File size:', (this.selectedSupportingDoc.size / 1024).toFixed(2), 'KB');
    } else {
      console.log('  ❌ NO SUPPORTING DOCUMENT SELECTED!');
    }



    const hasCertificate = !!this.selectedCertificate;
    const hasSupportingDoc = !!this.selectedSupportingDoc;
    const hasComment = this.certificateComment.trim().length > 0;
    const hasCorrectStatus = this.application?.status === 'submitted';
    const isAssignedToCurrentUser = this.application?.assigned_to === this.currentUserId;

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ READINESS CHECK:');
    console.log('  - Certificate present:', hasCertificate ? '✅ YES' : '❌ NO');
    console.log('  - Supporting Doc present:', hasSupportingDoc ? '✅ YES' : '❌ NO');
    console.log('  - Comment provided:', hasComment ? '✅ YES' : '❌ NO');
    console.log('  - Status is "assigned":', hasCorrectStatus ? '✅ YES' : '❌ NO');
    console.log('  - Assigned to current user:', isAssignedToCurrentUser ? '✅ YES' : '❌ NO');

    if (hasCertificate && hasSupportingDoc && hasComment && hasCorrectStatus && isAssignedToCurrentUser) {
      console.log('🚀 All checks passed! Proceeding with approval...');
      this.uploadCertificate();
    } else {
      console.log('❌ Cannot proceed - missing requirements');
      let errorMessage = 'Cannot approve: ';
      if (!hasCertificate) errorMessage += 'Missing certificate. ';
      if (!hasSupportingDoc) errorMessage += 'Missing supporting document. ';
      if (!hasComment) errorMessage += 'Missing comments. ';
      if (!hasCorrectStatus) errorMessage += `Status must be "assigned". Current: "${this.application?.status}". `;
      if (!isAssignedToCurrentUser) errorMessage += 'Application not assigned to you. ';
      this.snackBar?.open(errorMessage, 'Close', { duration: 5000 });
    }
  }
}
