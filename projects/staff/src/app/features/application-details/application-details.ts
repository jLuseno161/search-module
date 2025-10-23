import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { Router, ActivatedRoute } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { FormsModule } from '@angular/forms';
import { Application } from '../../shared/interfaces/application';
import { AuthService } from '../../auth/auth.service';
import { ApplicationService } from '../../services/application.service';
// import { TitleCasePipe, DatePipe } from '@angular/common';
@Component({
  selector: 'app-application-details',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatDividerModule,
    MatIconModule,
    MatListModule,
    MatTableModule,
    FormsModule,
    // DatePipe
  ],
  templateUrl: './application-details.html',
  styleUrls: ['./application-details.css'],
})
export class ApplicationDetails implements OnInit {
  currentUserRole: string = '';
  currentUserName: string = '';
  currentUserId: number = 0;

  application: Application | null = null;
  applicationId: number | null = null;
  activeTab: string = 'details';
  error: string | null = null;
  isLoading: boolean = true;

  // Certificate upload properties
  selectedFile: File | null = null;
  isUploadingCertificate: boolean = false;
  showCertificateUpload: boolean = false;
  rejectReason: string = '';
  isRejecting: boolean = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private applicationService: ApplicationService
  ) {}

  ngOnInit(): void {
    console.log('ApplicationDetails component initialized');
    this.currentUserRole = this.authService.getCurrentUserRole();
    this.currentUserName = this.authService.getCurrentUserName();
    this.currentUserId = this.authService.getCurrentUserId();

    console.log('🔐 Current User:', {
      role: this.currentUserRole,
      name: this.currentUserName,
      id: this.currentUserId
    });

    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      console.log('Route parameter id:', id);

      if (id) {
        this.applicationId = +id;
        console.log('Loading application with ID:', this.applicationId);
        this.loadApplicationDetails(this.applicationId);
      } else {
        console.error('No ID parameter found in route');
        this.error = 'No application ID provided';
        this.isLoading = false;
      }
    });
  }

  private loadApplicationDetails(id: number): void {
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
          console.log('✅ Application loaded from API:', this.application);
        } else {
          this.error = 'Application not found or not assigned to you';
          console.error('Application not found in assigned applications');
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

  private fetchApplicantDetails(applicantId: number): void {
    if (!applicantId) return;
    
    this.applicationService.getUserDetails(applicantId).subscribe({
      next: (user) => {
        if (this.application) {
          this.application.applicant = user;
          this.application.applicantName = this.getApplicantDisplayName(user);
          this.application.applicantId = user.id;
          console.log('✅ Applicant details loaded:', user);
        }
      },
      error: (error) => {
        console.error('❌ Error loading applicant details:', error);
        if (this.application) {
          this.application.applicantName = `Applicant #${applicantId}`;
        }
      }
    });
  }

  private fetchAssignedRegistrarDetails(registrarId: number): void {
    if (!registrarId) return;
    
    this.applicationService.getUserDetails(registrarId).subscribe({
      next: (user) => {
        if (this.application) {
          this.application.assigned_to_username = user.username || `${user.first_name} ${user.last_name}`.trim();
          console.log('✅ Registrar details loaded:', user);
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('❌ Error loading registrar details:', error);
        if (this.application) {
          this.application.assigned_to_username = `Registrar #${registrarId}`;
        }
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
          console.log('✅ Application loaded from API:', this.application);
        } else {
          this.error = 'Application not found in your registry';
          console.error('Application not found in registry applications');
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

  private mapApiToApplication(apiApp: any): Application {
    const submittedDate = new Date(apiApp.submitted_at);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - submittedDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    console.log('🔍 APPLICATION DATA FOR MAPPING:', apiApp);
    
    return {
      id: apiApp.id,
      reference_number: apiApp.reference_number,
      parcel_number: apiApp.parcel_number,
      purpose: apiApp.purpose,
      county: apiApp.county,
      registry: apiApp.registry,
      status: apiApp.status as any,
      submitted_at: apiApp.submitted_at,
      assigned_to: apiApp.assigned_to, 
      assigned_to_username: 'Loading...',
      applicant: apiApp.applicant, 
      dateSubmitted: submittedDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }),
      timeElapsed: this.calculateTimeElapsed(diffDays),
      referenceNo: apiApp.reference_number,
      parcelNo: apiApp.parcel_number,
      applicantName: 'Loading applicant...',
      applicantId: apiApp.applicant 
    };
  }

  // ========== CERTIFICATE UPLOAD METHODS ==========

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Only allow PDF for certificates
      if (file.type !== 'application/pdf') {
        alert('Certificate must be a PDF file');
        this.clearSelectedFile();
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        alert('Certificate must be less than 10MB');
        this.clearSelectedFile();
        return;
      }

      this.selectedFile = file;
      console.log('Certificate file selected:', file.name);
    }
  }

  clearSelectedFile(): void {
    this.selectedFile = null;
    const fileInput = document.getElementById('certificateUpload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  }

  uploadCertificate(): void {
    if (!this.selectedFile || !this.applicationId) {
      alert('Please select a certificate file');
      return;
    }

    // Check if application can be approved
    if (this.application?.status !== 'assigned') {
      alert('This application cannot be approved. Status must be "assigned".');
      return;
    }

    this.isUploadingCertificate = true;

    console.log('📤 Uploading certificate for application:', this.applicationId);

    this.applicationService.uploadCertificate(this.applicationId, this.selectedFile).subscribe({
      next: (response) => {
        this.isUploadingCertificate = false;
        
        this.selectedFile = null;
        this.clearSelectedFile();
        
        console.log('✅ Certificate uploaded successfully:', response);
        alert('Application approved and certificate uploaded successfully!');
        
        // Refresh application data to show new status
        this.loadApplicationDetails(this.applicationId!);
      },
      error: (error) => {
        this.isUploadingCertificate = false;
        console.error('❌ Error uploading certificate:', error);
        
        let errorMessage = 'Error uploading certificate. Please try again.';
        if (error.error && error.error.error) {
          errorMessage = error.error.error;
        } else if (error.error && error.error.detail) {
          errorMessage = error.error.detail;
        }
        alert(errorMessage);
      }
    });
  }

  rejectApplication(): void {
    if (!this.rejectReason.trim() || !this.applicationId) {
      alert('Please provide a rejection reason');
      return;
    }

    this.isRejecting = true;

    const rejectData = {
      comment: this.rejectReason.trim()
    };

    console.log('📤 Rejecting application:', this.applicationId);

    this.applicationService.rejectApplication(this.applicationId, rejectData).subscribe({
      next: (response) => {
        this.isRejecting = false;
        this.rejectReason = '';
        
        console.log('✅ Application rejected successfully:', response);
        alert('Application rejected successfully!');
        
        this.loadApplicationDetails(this.applicationId!);
      },
      error: (error) => {
        this.isRejecting = false;
        console.error('❌ Error rejecting application:', error);
        
        let errorMessage = 'Error rejecting application. Please try again.';
        if (error.error && error.error.error) {
          errorMessage = error.error.error;
        } else if (error.error && error.error.detail) {
          errorMessage = error.error.detail;
        }
        alert(errorMessage);
      }
    });
  }

  canUploadCertificate(): boolean {
    const canUpload = this.currentUserRole === 'is_registrar' && 
           this.application?.status === 'assigned';
    
    console.log('🔍 Certificate upload check:', {
      userRole: this.currentUserRole,
      appStatus: this.application?.status,
      canUpload: canUpload
    });
    
    return canUpload;
  }

  canRejectApplication(): boolean {
    return this.currentUserRole === 'is_registrar' && 
           this.application?.status === 'assigned';
  }

  toggleCertificateUpload(): void {
    this.showCertificateUpload = !this.showCertificateUpload;
    if (this.showCertificateUpload) {
      this.clearSelectedFile();
    }
  }

  // ========== UTILITY METHODS ==========

  setActiveTab(tabName: string): void {
    this.activeTab = tabName;
  }

  getApplicantDisplayName(applicant?: any): string {
    if (!applicant) {
      return 'Unknown Applicant';
    }
    
    return `${applicant.first_name || ''} ${applicant.last_name || ''}`.trim() || applicant.username || 'Applicant';
  }

  getApplicantEmail(): string {
    const applicant = this.application?.applicant;
    if (!applicant) {
      return 'No email provided';
    }
    
    return applicant.email || 'No email provided';
  }

  getAssignedRegistrarName(): string {
    return this.application?.assigned_to_username || 'Not assigned';
  }

  getStatusBadgeClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'submitted':
      case 'pending':
        return 'badge bg-warning text-dark';
      case 'assigned':
        return 'badge bg-primary';
      case 'completed':
      case 'verified':
        return 'badge bg-success';
      case 'rejected':
        return 'badge bg-danger';
      default:
        return 'badge bg-secondary';
    }
  }

  getFileSize(bytes: number): string {
    if (!bytes) return 'Unknown size';
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  hasApplication(): boolean {
    return this.application !== null;
  }

  goBack(): void {
    console.log('Navigating back from application details. Role:', this.currentUserRole);
    if (this.currentUserRole === 'is_registrar_in_charge') {
      this.router.navigate(['/registrarInCharge']);
    } else if (this.currentUserRole === 'is_registrar') {
      this.router.navigate(['/registrar-dashboard']);
    } else {
      this.router.navigate(['/dashboard']);
    }
  }

  private calculateTimeElapsed(days: number): string {
    if (days === 1) return '1 day';
    if (days < 30) return `${days} days`;
    if (days < 365) return `${Math.floor(days / 30)} months`;
    return `${Math.floor(days / 365)} years`;
  }

  canAssignOfficers(): boolean {
    const canAssign = this.currentUserRole === 'is_registrar_in_charge';
    return canAssign;
  }

  assignOfficer(): void {
    if (this.canAssignOfficers()) {
      console.log('Assigning officer...');
      alert('Officer assignment functionality would go here');
    } else {
      alert('You do not have permission to assign officers.');
    }
  }
}