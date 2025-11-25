// import { Component, OnInit } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { MatCardModule } from '@angular/material/card';
// import { MatButtonModule } from '@angular/material/button';
// import { MatDividerModule } from '@angular/material/divider';
// import { MatIconModule } from '@angular/material/icon';
// import { MatListModule } from '@angular/material/list';
// import { Router, ActivatedRoute } from '@angular/router';
// import { MatTableModule } from '@angular/material/table';
// import { FormsModule } from '@angular/forms';
// import { Application } from '../../shared/interfaces/application';
// import { AuthService } from '../../auth/auth.service';
// import { ApplicationService } from '../../services/application.service';

// @Component({
//   selector: 'app-application-details',
//   standalone: true,
//   imports: [
//     CommonModule,
//     MatCardModule,
//     MatButtonModule,
//     MatDividerModule,
//     MatIconModule,
//     MatListModule,
//     MatTableModule,
//     FormsModule,
//   ],
//   templateUrl: './application-details.html',
//   styleUrls: ['./application-details.css'],
// })
// export class ApplicationDetails implements OnInit {
//   currentUserRole: string = '';
//   currentUserName: string = '';
//   currentUserId: number = 0;
//   currentUserRegistry: string = '';

//   application: Application | null = null;
//   applicationId: number | null = null;
//   activeTab: string = 'details';
//   error: string | null = null;
//   isLoading: boolean = true;

//   // Adding registrar data
//   registrars: any[] = [];
//   isRegistrarsLoading: boolean = false;

//   // Certificate upload properties
//   selectedFile: File | null = null;
//   isUploadingCertificate: boolean = false;
//   showCertificateUpload: boolean = false;
//   rejectReason: string = '';
//   isRejecting: boolean = false;
//   certificateComment: string = '';
//   constructor(
//     private router: Router,
//     private route: ActivatedRoute,
//     private authService: AuthService,
//     private applicationService: ApplicationService
//   ) {}

//   ngOnInit(): void {
//     console.log('ApplicationDetails component initialized');
//     this.currentUserRole = this.authService.getCurrentUserRole();
//     this.currentUserName = this.authService.getCurrentUserName();
//     this.currentUserId = this.authService.getCurrentUserId();
//     this.currentUserRegistry = this.authService.getCurrentUserRegistry();

//     console.log('🔐 Current User:', {
//       role: this.currentUserRole,
//       name: this.currentUserName,
//       id: this.currentUserId,
//       registry: this.currentUserRegistry
//     });

//     // Load registrars first
//     this.loadRegistrars();

//     this.route.paramMap.subscribe(params => {
//       const id = params.get('id');
//       console.log('Route parameter id:', id);

//       if (id) {
//         this.applicationId = +id;
//         console.log('Loading application with ID:', this.applicationId);
//         this.loadApplicationDetails(this.applicationId);
//       } else {
//         console.error('No ID parameter found in route');
//         this.error = 'No application ID provided';
//         this.isLoading = false;
//       }
//     });
//   }

//   // Add method to load registrars
//   private loadRegistrars(): void {
//     this.isRegistrarsLoading = true;
//     const currentUserRegistry = this.authService.getCurrentUserRegistry();

//     this.applicationService.getAvailableRegistrars(currentUserRegistry).subscribe({
//       next: (registrars: any[]) => {
//         this.registrars = registrars;
//         this.isRegistrarsLoading = false;
//         console.log('✅ Registrars loaded for application details:', this.registrars.length);
//       },
//       error: (error: any) => {
//         this.isRegistrarsLoading = false;
//         console.error('❌ Error loading registrars:', error);
//         this.registrars = [];
//       }
//     });
//   }

//   public loadApplicationDetails(id: number): void {
//     this.isLoading = true;
//     this.error = null;
//     console.log('🔄 Loading application details, registrars available:', this.registrars.length);
//     if (this.currentUserRole === 'is_registrar') {
//       this.loadRegistrarApplication(id);
//     } else if (this.currentUserRole === 'is_registrar_in_charge') {
//       this.loadRegistrarInChargeApplication(id);
//     } else {
//       this.error = 'Unauthorized access';
//       this.isLoading = false;
//     }
//   }

//   private loadRegistrarApplication(id: number): void {
//     this.applicationService.getRegistrarAssignedApplications().subscribe({
//       next: (response) => {
//         const apiApplication = response.results.find(app => app.id === id);
//         if (apiApplication) {
//           this.application = this.mapApiToApplication(apiApplication);
//           console.log('✅ Application loaded from API:', this.application);
//         } else {
//           this.error = 'Application not found or not assigned to you';
//           console.error('Application not found in assigned applications');
//         }
//         this.isLoading = false;
//       },
//       error: (error) => {
//         console.error('❌ Error loading application:', error);
//         this.error = 'Failed to load application details';
//         this.isLoading = false;
//       }
//     });
//   }

//   private loadRegistrarInChargeApplication(id: number): void {
//     this.applicationService.getRegistrarInChargeApplications().subscribe({
//       next: (response) => {
//         const apiApplication = response.results.find(app => app.id === id);

//         if (apiApplication) {
//           this.application = this.mapApiToApplication(apiApplication);
//           console.log('✅ Application loaded from API:', this.application);
//         } else {
//           this.error = 'Application not found in your registry';
//           console.error('Application not found in registry applications');
//         }
//         this.isLoading = false;
//       },
//       error: (error) => {
//         console.error('❌ Error loading application:', error);
//         this.error = 'Failed to load application details';
//         this.isLoading = false;
//       }
//     });
//   }

//   private mapApiToApplication(apiApp: any): Application {
//     const submittedDate = new Date(apiApp.submitted_at);
//     const now = new Date();
//     const diffTime = Math.abs(now.getTime() - submittedDate.getTime());
//     const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

//     console.log('🔍 APPLICATION DATA FOR MAPPING:', apiApp);

//     // FIX: Look up registrar name from local registrars array
//     let assignedRegistrarName = 'Not assigned';

//     if (apiApp.assigned_to) {
//       const assignedRegistrar = this.registrars.find(reg => reg.id === apiApp.assigned_to);
//       if (assignedRegistrar) {
//         assignedRegistrarName = assignedRegistrar.username;
//         console.log('✅ Found assigned registrar in application details:', assignedRegistrarName);
//       } else {
//         console.log('❌ Registrar not found in local array, ID:', apiApp.assigned_to);
//         assignedRegistrarName = `Registrar #${apiApp.assigned_to}`;
//       }
//     }

//     // Handle applicant data properly
//     let applicantName = 'Unknown Applicant';
//     let applicantId = 0;

//     if (apiApp.user?.normal) {
//       const applicant = apiApp.user.normal;
//       applicantName = `${applicant.first_name || ''} ${applicant.last_name || ''}`.trim() || applicant.username || 'Applicant';
//       applicantId = applicant.id || 0;
//     } else if (apiApp.applicant) {
//       // Fallback if applicant data is in different format
//       applicantName = `Applicant #${apiApp.applicant}`;
//       applicantId = apiApp.applicant;
//     }

//     return {
//       id: apiApp.id,
//       reference_number: apiApp.reference_number,
//       parcel_number: apiApp.parcel_number,
//       purpose: apiApp.purpose,
//       county: apiApp.county,
//       registry: apiApp.registry,
//       status: apiApp.status as any,
//       submitted_at: apiApp.submitted_at,
//       assigned_to: apiApp.assigned_to,
//       assigned_to_username: assignedRegistrarName,
//       applicant: apiApp.applicant,
//       dateSubmitted: submittedDate.toLocaleDateString('en-US', {
//         year: 'numeric',
//         month: 'short',
//         day: 'numeric'
//       }),
//       timeElapsed: this.calculateTimeElapsed(diffDays),
//       referenceNo: apiApp.reference_number,
//       parcelNo: apiApp.parcel_number,
//       applicantName: applicantName,
//       applicantId: applicantId
//       // FIXED: Removed extra properties that don't exist in Application interface
//     };
//   }

//   // ========== OFFICER ASSIGNMENT METHODS ==========

//   canAssignOfficers(): boolean {
//     const canAssign = this.currentUserRole === 'is_registrar_in_charge' &&
//            this.application?.registry === this.currentUserRegistry &&
//            (this.application?.status === 'pending' || this.application?.status === 'submitted');

//     return canAssign;
//   }

//   assignOfficer(): void {
//     if (!this.canAssignOfficers()) {
//       alert('Only Registrar In Charge can assign officers within their registry for unassigned applications');
//       return;
//     }

//     if (this.registrars.length === 0) {
//       alert('No registrars available for assignment');
//       return;
//     }

//     // Show available registrars for selection
//     const availableRegistrars = this.getAvailableRegistrarsForAssignment();

//     if (availableRegistrars.length === 0) {
//       alert('No registrars available in your registry');
//       return;
//     }

//     // Create a more user-friendly selection dialog
//     this.showRegistrarSelectionDialog(availableRegistrars);
//   }

//   private showRegistrarSelectionDialog(availableRegistrars: any[]): void {
//     // Create a modal-like dialog using prompt
//     const registrarOptions = availableRegistrars.map((registrar, index) =>
//       `${index + 1}. ${registrar.username}${registrar.id === this.application?.assigned_to ? ' (Currently Assigned)' : ''}`
//     ).join('\n');

//     const message = `Select a registrar to assign this application to:\n\n${registrarOptions}\n\nEnter the number (1-${availableRegistrars.length}):`;

//     const selectedIndex = prompt(message);

//     if (selectedIndex !== null && selectedIndex.trim() !== '') {
//       const index = parseInt(selectedIndex) - 1;

//       if (index >= 0 && index < availableRegistrars.length) {
//         const selectedRegistrar = availableRegistrars[index];

//         // Don't reassign to the same registrar
//         if (selectedRegistrar.id === this.application?.assigned_to) {
//           alert('This registrar is already assigned to this application.');
//           return;
//         }

//         this.confirmAssignment(selectedRegistrar);
//       } else {
//         alert('Invalid selection. Please enter a number between 1 and ' + availableRegistrars.length);
//       }
//     }
//   }

//   private confirmAssignment(registrar: any): void {
//     const currentRegistrar = this.application?.assigned_to_username || 'Not assigned';
//     const confirmation = confirm(
//       `Assign this application to ${registrar.username}?\n\n` +
//       `Current assignee: ${currentRegistrar}\n` +
//       `New assignee: ${registrar.username}\n\n` +
//       `This will change the application status to "assigned".`
//     );

//     if (confirmation && this.applicationId) {
//       this.executeAssignment(this.applicationId, registrar.id);
//     }
//   }

//   private executeAssignment(applicationId: number, registrarId: number): void {
//     console.log('🔄 Assigning application:', applicationId, 'to registrar:', registrarId);

//     this.applicationService.assignApplication(applicationId, registrarId).subscribe({
//       next: (response: any) => {
//         console.log('✅ Assignment successful:', response);

//         const newRegistrarName = this.registrars.find(r => r.id === registrarId)?.username || 'Assigned';
//         alert(`✅ Application successfully assigned to ${newRegistrarName}!`);

//         // Update local state immediately
//         if (this.application) {
//           this.application.assigned_to = registrarId;
//           this.application.assigned_to_username = newRegistrarName;
//           this.application.status = 'assigned';

//           console.log('✅ Local state updated:', {
//             assigned_to: this.application.assigned_to,
//             assigned_to_username: this.application.assigned_to_username,
//             status: this.application.status
//           });
//         }

//         // Reload to get fresh data from server
//         this.loadApplicationDetails(this.applicationId!);
//       },
//       error: (error: any) => {
//         console.error('❌ Error assigning application:', error);

//         let errorMessage = 'Failed to assign application. ';
//         if (error.error) {
//           errorMessage += error.error.detail || error.error.message || 'Please try again.';
//         } else {
//           errorMessage += 'Please try again.';
//         }
//         alert(errorMessage);
//       }
//     });
//   }

//   getAvailableRegistrarsForAssignment(): any[] {
//     return this.registrars.filter(registrar =>
//       registrar.registry === this.currentUserRegistry &&
//       registrar.role === 'is_registrar'
//     );
//   }

//   // Helper method to check if application is currently assigned
//   isApplicationAssigned(): boolean {
//     return !!this.application?.assigned_to;
//   }

//   // ========== CERTIFICATE UPLOAD METHODS ==========

//   onFileSelected(event: any): void {
//     const file = event.target.files[0];
//     if (file) {
//       // Only allow PDF for certificates
//       if (file.type !== 'application/pdf') {
//         alert('Certificate must be a PDF file');
//         this.clearSelectedFile();
//         return;
//       }

//       if (file.size > 10 * 1024 * 1024) {
//         alert('Certificate must be less than 10MB');
//         this.clearSelectedFile();
//         return;
//       }

//       this.selectedFile = file;
//       console.log('Certificate file selected:', file.name);
//     }
//   }

//   clearSelectedFile(): void {
//     this.selectedFile = null;
//     const fileInput = document.getElementById('certificateUpload') as HTMLInputElement;
//     if (fileInput) fileInput.value = '';
//   }

// uploadCertificate(): void {
//   if (!this.selectedFile || !this.applicationId) {
//     alert('Please select a certificate file');
//     return;
//   }

//   // Check if application can be approved
//   if (this.application?.status !== 'assigned') {
//     alert('This application cannot be approved. Status must be "assigned".');
//     return;
//   }

//   // Check if comment is provided
//   if (!this.certificateComment.trim()) {
//     alert('Please provide approval comments');
//     return;
//   }

//   this.isUploadingCertificate = true;

//   console.log('📤 Uploading certificate for application:', this.applicationId);

//   // UPDATED: Pass the comment to the service
//   this.applicationService.uploadCertificate(
//     this.applicationId,
//     this.selectedFile,
//     this.certificateComment // Include the comment
//   ).subscribe({
//     next: (response) => {
//       this.isUploadingCertificate = false;

//       this.selectedFile = null;
//       this.certificateComment = ''; // Clear the comment
//       this.clearSelectedFile();

//       console.log('✅ Certificate uploaded successfully:', response);
//       alert('Application approved and certificate uploaded successfully!');

//       // Refresh application data to show new status
//       this.loadApplicationDetails(this.applicationId!);
//     },
//     error: (error) => {
//       this.isUploadingCertificate = false;
//       console.error('❌ Error uploading certificate:', error);

//       let errorMessage = 'Error uploading certificate. Please try again.';
//       if (error.error?.comment) {
//         errorMessage = `Validation error: ${error.error.comment.join(', ')}`;
//       } else if (error.error && error.error.error) {
//         errorMessage = error.error.error;
//       } else if (error.error && error.error.detail) {
//         errorMessage = error.error.detail;
//       }
//       alert(errorMessage);
//     }
//   });
// }

//   rejectApplication(): void {
//     if (!this.rejectReason.trim() || !this.applicationId) {
//       alert('Please provide a rejection reason');
//       return;
//     }

//     this.isRejecting = true;

//     const rejectData = {
//       comment: this.rejectReason.trim()
//     };

//     console.log('📤 Rejecting application:', this.applicationId);

//     this.applicationService.rejectApplication(this.applicationId, rejectData).subscribe({
//       next: (response) => {
//         this.isRejecting = false;
//         this.rejectReason = '';

//         console.log('✅ Application rejected successfully:', response);
//         alert('Application rejected successfully!');

//         this.loadApplicationDetails(this.applicationId!);
//       },
//       error: (error) => {
//         this.isRejecting = false;
//         console.error('❌ Error rejecting application:', error);

//         let errorMessage = 'Error rejecting application. Please try again.';
//         if (error.error && error.error.error) {
//           errorMessage = error.error.error;
//         } else if (error.error && error.error.detail) {
//           errorMessage = error.error.detail;
//         }
//         alert(errorMessage);
//       }
//     });
//   }

//   canUploadCertificate(): boolean {
//     const canUpload = this.currentUserRole === 'is_registrar' &&
//            this.application?.status === 'assigned' &&
//            this.application?.assigned_to === this.currentUserId;

//     // console.log('🔍 Certificate upload check:', {
//     //   userRole: this.currentUserRole,
//     //   appStatus: this.application?.status,
//     //   assignedTo: this.application?.assigned_to,
//     //   currentUserId: this.currentUserId,
//     //   canUpload: canUpload
//     // });

//     return canUpload;
//   }

//   canRejectApplication(): boolean {
//     return this.currentUserRole === 'is_registrar' &&
//            this.application?.status === 'assigned' &&
//            this.application?.assigned_to === this.currentUserId;
//   }

//  toggleCertificateUpload(): void {
//   this.showCertificateUpload = !this.showCertificateUpload;
//   if (this.showCertificateUpload) {
//     this.clearSelectedFile();
//     this.certificateComment = ''; // Clear comment when showing upload form
//   }
// }

//   // ========== STATUS MANAGEMENT METHODS ==========

//   canMarkCompleted(): boolean {
//     return this.currentUserRole === 'is_registrar_in_charge' &&
//            this.application?.registry === this.currentUserRegistry &&
//            this.application?.status === 'assigned';
//   }

//   canMarkVerified(): boolean {
//     return this.currentUserRole === 'is_registrar_in_charge' &&
//            this.application?.registry === this.currentUserRegistry &&
//            this.application?.status === 'completed';
//   }

//   markAsCompleted(): void {
//     if (!this.canMarkCompleted() || !this.applicationId) {
//       alert('You cannot mark this application as completed');
//       return;
//     }

//     if (confirm('Mark this application as completed?')) {
//       this.applicationService.completeApplication(this.applicationId).subscribe({
//         next: (response) => {
//           console.log('✅ Application marked as completed:', response);
//           alert('Application marked as completed!');
//           this.loadApplicationDetails(this.applicationId!);
//         },
//         error: (error) => {
//           console.error('❌ Error marking as completed:', error);
//           alert('Failed to mark application as completed');
//         }
//       });
//     }
//   }

//   markAsVerified(): void {
//     if (!this.canMarkVerified() || !this.applicationId) {
//       alert('You cannot mark this application as verified');
//       return;
//     }

//     if (confirm('Mark this application as verified?')) {
//       this.applicationService.verifyApplication(this.applicationId).subscribe({
//         next: (response) => {
//           console.log('✅ Application marked as verified:', response);
//           alert('Application marked as verified!');
//           this.loadApplicationDetails(this.applicationId!);
//         },
//         error: (error) => {
//           console.error('❌ Error marking as verified:', error);
//           alert('Failed to mark application as verified');
//         }
//       });
//     }
//   }

//   // ========== UTILITY METHODS ==========

//   setActiveTab(tabName: string): void {
//     this.activeTab = tabName;
//   }

//   getApplicantDisplayName(applicant?: any): string {
//     if (!applicant) {
//       return 'Unknown Applicant';
//     }

//     return `${applicant.first_name || ''} ${applicant.last_name || ''}`.trim() || applicant.username || 'Applicant';
//   }

//   getApplicantEmail(): string {
//     const applicant = this.application?.applicant;
//     if (!applicant) {
//       return 'No email provided';
//     }

//     return applicant.email || 'No email provided';
//   }

//   getAssignedRegistrarName(): string {
//     return this.application?.assigned_to_username || 'Not assigned';
//   }

//   getStatusBadgeClass(status: string): string {
//     switch (status?.toLowerCase()) {
//       case 'submitted':
//       case 'pending':
//         return 'badge bg-warning text-dark';
//       case 'assigned':
//         return 'badge bg-primary';
//       case 'completed':
//       case 'verified':
//         return 'badge bg-success';
//       case 'rejected':
//         return 'badge bg-danger';
//       default:
//         return 'badge bg-secondary';
//     }
//   }

//   getFileSize(bytes: number): string {
//     if (!bytes) return 'Unknown size';
//     if (bytes === 0) return '0 Bytes';
//     const k = 1024;
//     const sizes = ['Bytes', 'KB', 'MB', 'GB'];
//     const i = Math.floor(Math.log(bytes) / Math.log(k));
//     return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
//   }

//   hasApplication(): boolean {
//     return this.application !== null;
//   }

//   goBack(): void {
//     console.log('Navigating back from application details. Role:', this.currentUserRole);
//     if (this.currentUserRole === 'is_registrar_in_charge') {
//       this.router.navigate(['/registrarInCharge']);
//     } else if (this.currentUserRole === 'is_registrar') {
//       this.router.navigate(['/registrar-dashboard']);
//     } else {
//       this.router.navigate(['/dashboard']);
//     }
//   }

//   private calculateTimeElapsed(days: number): string {
//     if (days === 1) return '1 day';
//     if (days < 30) return `${days} days`;
//     if (days < 365) return `${Math.floor(days / 30)} months`;
//     return `${Math.floor(days / 365)} years`;
//   }

//   // Debug method
//   debugApplication(): void {
//     console.log('🔍 APPLICATION DEBUG:', this.application);
//     console.log('👤 CURRENT USER:', {
//       role: this.currentUserRole,
//       id: this.currentUserId,
//       registry: this.currentUserRegistry
//     });
//     console.log('👥 REGISTRARS:', this.registrars);
//   }
// }
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
  ],
  templateUrl: './application-details.html',
  styleUrls: ['./application-details.css'],
})
export class ApplicationDetails implements OnInit {
  currentUserRole: string = '';
  currentUserName: string = '';
  currentUserId: number = 0;
  currentUserRegistry: string = '';

  application: Application | null = null;
  applicationId: number | null = null;
  activeTab: string = 'details';
  error: string | null = null;
  isLoading: boolean = true;

  // Adding registrar data
  registrars: any[] = [];
  isRegistrarsLoading: boolean = false;

  // Certificate upload properties
  selectedFile: File | null = null;
  isUploadingCertificate: boolean = false;
  showCertificateUpload: boolean = false;
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
    console.log('ApplicationDetails component initialized');
    this.currentUserRole = this.authService.getCurrentUserRole();
    this.currentUserName = this.authService.getCurrentUserName();
    this.currentUserId = this.authService.getCurrentUserId();
    this.currentUserRegistry = this.authService.getCurrentUserRegistry();

    console.log('🔐 Current User:', {
      role: this.currentUserRole,
      name: this.currentUserName,
      id: this.currentUserId,
      registry: this.currentUserRegistry
    });

    // Load registrars first
    this.loadRegistrars();

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

  // Add method to load registrars
  private loadRegistrars(): void {
    this.isRegistrarsLoading = true;
    const currentUserRegistry = this.authService.getCurrentUserRegistry();

    this.applicationService.getAvailableRegistrars(currentUserRegistry).subscribe({
      next: (registrars: any[]) => {
        this.registrars = registrars;
        this.isRegistrarsLoading = false;
        console.log('✅ Registrars loaded for application details:', this.registrars.length);
      },
      error: (error: any) => {
        this.isRegistrarsLoading = false;
        console.error('❌ Error loading registrars:', error);
        this.registrars = [];
      }
    });
  }

  public loadApplicationDetails(id: number): void {
    this.isLoading = true;
    this.error = null;
    console.log('🔄 Loading application details, registrars available:', this.registrars.length);
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

    // FIX: Look up registrar name from local registrars array
    let assignedRegistrarName = 'Not assigned';

    if (apiApp.assigned_to) {
      const assignedRegistrar = this.registrars.find(reg => reg.id === apiApp.assigned_to);
      if (assignedRegistrar) {
        assignedRegistrarName = assignedRegistrar.username;
        console.log('✅ Found assigned registrar in application details:', assignedRegistrarName);
      } else {
        console.log('❌ Registrar not found in local array, ID:', apiApp.assigned_to);
        assignedRegistrarName = `Registrar #${apiApp.assigned_to}`;
      }
    }

    // Handle applicant data properly
    let applicantName = 'Unknown Applicant';
    let applicantId = 0;

    if (apiApp.user?.normal) {
      const applicant = apiApp.user.normal;
      applicantName = `${applicant.first_name || ''} ${applicant.last_name || ''}`.trim() || applicant.username || 'Applicant';
      applicantId = applicant.id || 0;
    } else if (apiApp.applicant) {
      // Fallback if applicant data is in different format
      applicantName = `Applicant #${apiApp.applicant}`;
      applicantId = apiApp.applicant;
    }

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
      assigned_to_username: assignedRegistrarName,
      applicant: apiApp.applicant,
      dateSubmitted: submittedDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }),
      timeElapsed: this.calculateTimeElapsed(diffDays),
      referenceNo: apiApp.reference_number,
      parcelNo: apiApp.parcel_number,
      applicantName: applicantName,
      applicantId: applicantId
    };
  }

  // ========== OFFICER ASSIGNMENT METHODS ==========

  canAssignOfficers(): boolean {
    const canAssign = this.currentUserRole === 'is_registrar_in_charge' &&
           this.application?.registry === this.currentUserRegistry &&
           (this.application?.status === 'pending' || this.application?.status === 'submitted');

    return canAssign;
  }

  assignOfficer(): void {
    if (!this.canAssignOfficers()) {
      alert('Only Registrar In Charge can assign officers within their registry for unassigned applications');
      return;
    }

    if (this.registrars.length === 0) {
      alert('No registrars available for assignment');
      return;
    }

    // Show available registrars for selection
    const availableRegistrars = this.getAvailableRegistrarsForAssignment();

    if (availableRegistrars.length === 0) {
      alert('No registrars available in your registry');
      return;
    }

    // Create a more user-friendly selection dialog
    this.showRegistrarSelectionDialog(availableRegistrars);
  }

  private showRegistrarSelectionDialog(availableRegistrars: any[]): void {
    // Create a modal-like dialog using prompt
    const registrarOptions = availableRegistrars.map((registrar, index) =>
      `${index + 1}. ${registrar.username}${registrar.id === this.application?.assigned_to ? ' (Currently Assigned)' : ''}`
    ).join('\n');

    const message = `Select a registrar to assign this application to:\n\n${registrarOptions}\n\nEnter the number (1-${availableRegistrars.length}):`;

    const selectedIndex = prompt(message);

    if (selectedIndex !== null && selectedIndex.trim() !== '') {
      const index = parseInt(selectedIndex) - 1;

      if (index >= 0 && index < availableRegistrars.length) {
        const selectedRegistrar = availableRegistrars[index];

        // Don't reassign to the same registrar
        if (selectedRegistrar.id === this.application?.assigned_to) {
          alert('This registrar is already assigned to this application.');
          return;
        }

        this.confirmAssignment(selectedRegistrar);
      } else {
        alert('Invalid selection. Please enter a number between 1 and ' + availableRegistrars.length);
      }
    }
  }

  private confirmAssignment(registrar: any): void {
    const currentRegistrar = this.application?.assigned_to_username || 'Not assigned';
    const confirmation = confirm(
      `Assign this application to ${registrar.username}?\n\n` +
      `Current assignee: ${currentRegistrar}\n` +
      `New assignee: ${registrar.username}\n\n` +
      `This will change the application status to "assigned".`
    );

    if (confirmation && this.applicationId) {
      this.executeAssignment(this.applicationId, registrar.id);
    }
  }

  private executeAssignment(applicationId: number, registrarId: number): void {
    console.log('🔄 Assigning application:', applicationId, 'to registrar:', registrarId);

    this.applicationService.assignApplication(applicationId, registrarId).subscribe({
      next: (response: any) => {
        console.log('✅ Assignment successful:', response);

        const newRegistrarName = this.registrars.find(r => r.id === registrarId)?.username || 'Assigned';
        alert(`✅ Application successfully assigned to ${newRegistrarName}!`);

        // Update local state immediately
        if (this.application) {
          this.application.assigned_to = registrarId;
          this.application.assigned_to_username = newRegistrarName;
          this.application.status = 'assigned';

          console.log('✅ Local state updated:', {
            assigned_to: this.application.assigned_to,
            assigned_to_username: this.application.assigned_to_username,
            status: this.application.status
          });
        }

        // Reload to get fresh data from server
        this.loadApplicationDetails(this.applicationId!);
      },
      error: (error: any) => {
        console.error('❌ Error assigning application:', error);

        let errorMessage = 'Failed to assign application. ';
        if (error.error) {
          errorMessage += error.error.detail || error.error.message || 'Please try again.';
        } else {
          errorMessage += 'Please try again.';
        }
        alert(errorMessage);
      }
    });
  }

  getAvailableRegistrarsForAssignment(): any[] {
    return this.registrars.filter(registrar =>
      registrar.registry === this.currentUserRegistry &&
      registrar.role === 'is_registrar'
    );
  }

  // Helper method to check if application is currently assigned
  isApplicationAssigned(): boolean {
    return !!this.application?.assigned_to;
  }

  // ========== ENHANCED CERTIFICATE UPLOAD METHODS ==========

  // ENHANCED: File selection with better validation
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Enhanced validation
      const validationResult = this.validateFileBeforeSelection(file);

      if (!validationResult.isValid) {
        alert(validationResult.errorMessage);
        this.clearSelectedFile();
        return;
      }

      this.selectedFile = file;
      console.log('✅ Certificate file validated and selected:', {
        name: file.name,
        type: file.type,
        size: this.getFileSize(file.size)
      });
    }
  }

  // NEW: Enhanced file validation method
  validateFileBeforeSelection(file: File): { isValid: boolean; errorMessage: string } {
    // Check file type
    if (file.type !== 'application/pdf') {
      return {
        isValid: false,
        errorMessage: 'Certificate must be a PDF file. Please select a PDF document.'
      };
    }

    // Check file extension
    const fileExtension = file.name.toLowerCase().split('.').pop();
    if (fileExtension !== 'pdf') {
      return {
        isValid: false,
        errorMessage: 'File must have .pdf extension. Please select a valid PDF file.'
      };
    }

    // Check file size (10MB limit)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      return {
        isValid: false,
        errorMessage: `File size (${fileSizeMB}MB) exceeds maximum limit of 10MB. Please choose a smaller file.`
      };
    }

    // Check if file is empty
    if (file.size === 0) {
      return {
        isValid: false,
        errorMessage: 'Selected file is empty. Please choose a valid PDF file.'
      };
    }

    return { isValid: true, errorMessage: '' };
  }

  // NEW: Get file validation message for UI
  getFileValidationMessage(file: File | null): string {
    if (!file) return 'No file selected';

    const validation = this.validateFileBeforeSelection(file);
    if (!validation.isValid) {
      return `❌ ${validation.errorMessage}`;
    }

    return `✅ ${file.name} (${this.getFileSize(file.size)}) - Ready to upload`;
  }

  // ENHANCED: Clear file method
  clearSelectedFile(): void {
    this.selectedFile = null;
    this.certificateComment = ''; // Also clear comment when clearing file
    const fileInput = document.getElementById('certificateUpload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  }

  // ENHANCED: Upload method with better error handling
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

    // Check if comment is provided
    if (!this.certificateComment.trim()) {
      alert('Please provide approval comments');
      return;
    }

    // Final validation before upload
    const validationResult = this.validateFileBeforeSelection(this.selectedFile);
    if (!validationResult.isValid) {
      alert(validationResult.errorMessage);
      return;
    }

    this.isUploadingCertificate = true;
    console.log('📤 Starting certificate upload for application:', this.applicationId);

    this.applicationService.uploadCertificate(
      this.applicationId,
      this.selectedFile,
      this.certificateComment
    ).subscribe({
      next: (response) => {
        this.isUploadingCertificate = false;

        // Reset form
        this.selectedFile = null;
        this.certificateComment = '';
        this.clearSelectedFile();

        console.log('✅ Certificate uploaded successfully:', response);
        alert('Application approved and certificate uploaded successfully!');

        // Refresh application data to show new status
        this.loadApplicationDetails(this.applicationId!);
      },
      error: (error) => {
        this.isUploadingCertificate = false;
        console.error('❌ Error uploading certificate:', error);

        // Use the user-friendly error message from service
        let errorMessage = error.message || 'Error uploading certificate. Please try again.';

        // Additional specific error handling
        if (error.status === 400) {
          errorMessage = `Upload failed: ${error.message}`;
        } else if (error.status === 413) {
          errorMessage = 'File too large. Please choose a smaller PDF file (max 10MB).';
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
           this.application?.status === 'assigned' &&
           this.application?.assigned_to === this.currentUserId;

    return canUpload;
  }

  canRejectApplication(): boolean {
    return this.currentUserRole === 'is_registrar' &&
           this.application?.status === 'assigned' &&
           this.application?.assigned_to === this.currentUserId;
  }

  toggleCertificateUpload(): void {
    this.showCertificateUpload = !this.showCertificateUpload;
    if (this.showCertificateUpload) {
      this.clearSelectedFile();
      this.certificateComment = ''; // Clear comment when showing upload form
    }
  }

  // ========== STATUS MANAGEMENT METHODS ==========

  canMarkCompleted(): boolean {
    return this.currentUserRole === 'is_registrar_in_charge' &&
           this.application?.registry === this.currentUserRegistry &&
           this.application?.status === 'assigned';
  }

  canMarkVerified(): boolean {
    return this.currentUserRole === 'is_registrar_in_charge' &&
           this.application?.registry === this.currentUserRegistry &&
           this.application?.status === 'completed';
  }

  markAsCompleted(): void {
    if (!this.canMarkCompleted() || !this.applicationId) {
      alert('You cannot mark this application as completed');
      return;
    }

    if (confirm('Mark this application as completed?')) {
      this.applicationService.completeApplication(this.applicationId).subscribe({
        next: (response) => {
          console.log('✅ Application marked as completed:', response);
          alert('Application marked as completed!');
          this.loadApplicationDetails(this.applicationId!);
        },
        error: (error) => {
          console.error('❌ Error marking as completed:', error);
          alert('Failed to mark application as completed');
        }
      });
    }
  }

  markAsVerified(): void {
    if (!this.canMarkVerified() || !this.applicationId) {
      alert('You cannot mark this application as verified');
      return;
    }

    if (confirm('Mark this application as verified?')) {
      this.applicationService.verifyApplication(this.applicationId).subscribe({
        next: (response) => {
          console.log('✅ Application marked as verified:', response);
          alert('Application marked as verified!');
          this.loadApplicationDetails(this.applicationId!);
        },
        error: (error) => {
          console.error('❌ Error marking as verified:', error);
          alert('Failed to mark application as verified');
        }
      });
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

  // Debug method
  debugApplication(): void {
    console.log('🔍 APPLICATION DEBUG:', this.application);
    console.log('👤 CURRENT USER:', {
      role: this.currentUserRole,
      id: this.currentUserId,
      registry: this.currentUserRegistry
    });
    console.log('👥 REGISTRARS:', this.registrars);
  }
}
