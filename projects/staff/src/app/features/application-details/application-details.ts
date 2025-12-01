import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Application } from '../../shared/interfaces/application';
import { AuthService } from '../../auth/auth.service';
import { ApplicationService } from '../../services/application.service';

@Component({
  selector: 'app-application-details',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
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
  activeTab: string = 'details';
  error: string | null = null;
  isLoading: boolean = true;

  // Registrar data
  registrars: any[] = [];
  isRegistrarsLoading: boolean = false;

  // Certificate upload
  selectedFile: File | null = null;
  isUploadingCertificate: boolean = false;
  rejectReason: string = '';
  isRejecting: boolean = false;
  certificateComment: string = '';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private applicationService: ApplicationService
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
    this.isLoading = true;
    this.error = null;

    if (this.currentUserRole === 'is_registrar') {
      this.loadRegistrarApplication(id);
    } else if (this.currentUserRole === 'is_registrar_in_charge') {
      this.loadRegistrarInChargeApplication(id);
    } else {
      this.error = 'Unauthorized access';
      this.isLoading = false;
    }
  }

  private loadRegistrarApplication(id: number): void {
    this.applicationService.getRegistrarAssignedApplications().subscribe({
      next: (response) => {
        const apiApplication = response.results.find(app => app.id === id);
        if (apiApplication) {
          this.application = this.mapApiToApplication(apiApplication);
          console.log('✅ Application loaded:', this.application);
        } else {
          this.error = 'Application not found or not assigned to you';
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('❌ Error loading application:', error);
        this.error = 'Failed to load application details';
        this.isLoading = false;
      }
    });
  }

  private loadRegistrarInChargeApplication(id: number): void {
    this.applicationService.getRegistrarInChargeApplications().subscribe({
      next: (response) => {
        const apiApplication = response.results.find(app => app.id === id);
        if (apiApplication) {
          this.application = this.mapApiToApplication(apiApplication);
          console.log('✅ Application loaded:', this.application);
        } else {
          this.error = 'Application not found in your registry';
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('❌ Error loading application:', error);
        this.error = 'Failed to load application details';
        this.isLoading = false;
      }
    });
  }

  // ========== DATA MAPPING METHOD ==========

  private mapApiToApplication(apiApp: any): Application {
    console.log('🔍 Mapping API data:', apiApp);

    const submittedDate = new Date(apiApp.submitted_at);
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

    // Extract applicant info
    let applicantName = 'Unknown Applicant';
    let applicantId = 0;

    if (apiApp.applicant && typeof apiApp.applicant === 'object') {
      const applicant = apiApp.applicant;
      applicantName = applicant.username ||
                     `${applicant.first_name || ''} ${applicant.last_name || ''}`.trim() ||
                     `Applicant #${applicant.id}`;
      applicantId = applicant.id;
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

      // Store IDs for permission checks
      assigned_to: assignedRegistrarId,
      applicant: applicantId,

      // Store names for display
      assigned_to_username: assignedRegistrarName,
      applicantName: applicantName,
      applicantId: applicantId,

      // Frontend properties
      dateSubmitted: submittedDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }),
      timeElapsed: this.calculateTimeElapsed(diffDays),
      referenceNo: apiApp.reference_number,
      parcelNo: apiApp.parcel_number,

      // Certificate info
      certificate: certificateInfo,

      // Store full objects for debugging
      applicantObject: apiApp.applicant,
      assignedToObject: apiApp.assigned_to
    };

    console.log('✅ Mapped application:', {
      id: application.id,
      applicantName: application.applicantName,
      assigned_to: application.assigned_to,
      assigned_to_username: application.assigned_to_username,
      status: application.status
    });

    return application;
  }

  // ========== PERMISSION METHODS ==========

  canUploadCertificate(): boolean {
    if (!this.application || !this.currentUserId) return false;

    const canUpload = this.currentUserRole === 'is_registrar' &&
           this.application.status === 'assigned' &&
           this.application.assigned_to === this.currentUserId;

    console.log('🔐 Upload check:', {
      canUpload,
      userRole: this.currentUserRole,
      appStatus: this.application.status,
      assignedTo: this.application.assigned_to,
      currentUserId: this.currentUserId,
      matches: this.application.assigned_to === this.currentUserId
    });

    return canUpload;
  }

  canRejectApplication(): boolean {
    if (!this.application || !this.currentUserId) return false;

    const canReject = this.currentUserRole === 'is_registrar' &&
           this.application.status === 'assigned' &&
           this.application.assigned_to === this.currentUserId;

    return canReject;
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

        // Update local state
        if (this.application) {
          this.application.assigned_to = registrarId;
          this.application.assigned_to_username = newRegistrarName;
          this.application.status = 'assigned';
        }

        // Reload application
        this.loadApplicationDetails(this.applicationId!);
      },
      error: (error: any) => {
        console.error('❌ Error assigning application:', error);
        alert('Failed to assign application. Please try again.');
      }
    });
  }

  // ========== CERTIFICATE UPLOAD METHODS ==========

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const validationResult = this.validateFileBeforeSelection(file);
      if (!validationResult.isValid) {
        alert(validationResult.errorMessage);
        this.clearSelectedFile();
        return;
      }
      this.selectedFile = file;
    }
  }

  validateFileBeforeSelection(file: File): { isValid: boolean; errorMessage: string } {
    if (file.type !== 'application/pdf') {
      return { isValid: false, errorMessage: 'Certificate must be a PDF file.' };
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
    if (!this.selectedFile || !this.applicationId) {
      alert('Please select a certificate file');
      return;
    }

    if (this.application?.status !== 'assigned') {
      alert('This application cannot be approved. Status must be "assigned".');
      return;
    }

    if (!this.certificateComment.trim()) {
      alert('Please provide approval comments');
      return;
    }

    this.isUploadingCertificate = true;

    this.applicationService.uploadCertificate(
      this.applicationId,
      this.selectedFile,
      this.certificateComment
    ).subscribe({
      next: (response) => {
        this.isUploadingCertificate = false;
        this.selectedFile = null;
        this.certificateComment = '';
        this.clearSelectedFile();

        alert('Application approved and certificate uploaded successfully!');
        this.loadApplicationDetails(this.applicationId!);
      },
      error: (error) => {
        this.isUploadingCertificate = false;
        console.error('❌ Error uploading certificate:', error);
        alert(error.message || 'Error uploading certificate. Please try again.');
      }
    });
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

  clearSelectedFile(): void {
    this.selectedFile = null;
    this.certificateComment = '';
    const fileInput = document.getElementById('certificateUpload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
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
    if (days === 1) return '1 day';
    if (days < 30) return `${days} days`;
    if (days < 365) return `${Math.floor(days / 30)} months`;
    return `${Math.floor(days / 365)} years`;
  }

  setActiveTab(tabName: string): void {
    this.activeTab = tabName;
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

  // debugApplication(): void {
  //   console.log('🔍 ===== DEBUG =====');
  //   console.log('APPLICATION:', this.application);
  //   console.log('USER:', {
  //     id: this.currentUserId,
  //     role: this.currentUserRole,
  //     name: this.currentUserName,
  //     registry: this.currentUserRegistry
  //   });
  //   console.log('PERMISSIONS:', {
  //     canUpload: this.canUploadCertificate(),
  //     canReject: this.canRejectApplication(),
  //     canAssign: this.canAssignOfficers()
  //   });
  //   console.log('REGISTRARS:', this.registrars);
  //   console.log('===== END DEBUG =====');
  // }
}
