// chiefregistry-registrar.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatTabsModule } from '@angular/material/tabs';
import { MatBadgeModule } from '@angular/material/badge';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule } from '@angular/material/dialog';
import { AuthService } from '../../auth/auth.service';
import { ApplicationService, ApiApplication, ApiResponse, Registrar } from '../../services/application.service';

// Interfaces
export interface County {
  id: number;
  name: string;
  code: string;
  registries: Registry[];
  countyRegistrar?: string;
}

export interface Registry {
  id: number;
  name: string;
  code: string;
  countyId: number;
  registryRegistrar?: string;
}

export interface Application {
  id: number;
  referenceNo: string;
  parcelNo: string;
  dateSubmitted: string;
  timeElapsed: string;
  status: 'unassigned' | 'ongoing' | 'completed' | 'verified' | 'rejected';
  applicantName: string;
  applicantId: number;
  county: string;
  registry: string;
  assignedRegistrar?: string;
  assignedRegistrarId?: number | null;
  purpose: string;
  payment?: {
    amount: string;
    invoice_number: string;
    payment_reference: string;
    paid_at: string;
  };
  certificate?: {
    signed_file: string;
    uploaded_at: string;
  };
  reviews?: Array<{
    comment: string;
    created_at: string;
    reviewer: number;
    reviewer_name?: string;
  }>;
  submitted_at: string;
}

// Type for search configuration
type SearchType = 'invoice' | 'parcel' | 'document' | 'receipt';
type ApplicationStatus = 'unassigned' | 'ongoing' | 'completed' | 'verified' | 'registry';
type UserRole = 'is_registrar' | 'is_registrar_in_charge';

@Component({
  selector: 'app-chief-registry-registrar',
  standalone: true,
  imports: [
    CommonModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatDividerModule,
    MatTabsModule,
    MatBadgeModule,
    MatIconModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatDialogModule,
  ],
  templateUrl: './chiefregistry-registrar.html',
  styleUrls: ['./chiefregistry-registrar.css']
})
export class ChiefRegistryRegistrar implements OnInit {
  // Search form properties
  selectedSearchType: SearchType = 'invoice';
  inputLabel: string = 'Enter Invoice Number';
  inputPlaceholder: string = 'Enter Invoice Number';
  searchValue: string = '';

  // Table search property
  tableSearchValue: string = '';

  // Table columns
  displayedColumns: string[] = ['referenceNo', 'parcelNo', 'dateSubmitted', 'timeElapsed', 'actions'];

  // Current state properties
  currentTab: ApplicationStatus = 'unassigned';
  currentRegistry: string = 'all';
  currentUserRole: UserRole = 'is_registrar_in_charge';
  currentUserName: string = 'Registry Registrar In Charge';
  currentUserRegistry: string = 'Nairobi Central';
  currentUserId: number = 1;
  filteredApplications: Application[] = [];

  // API data properties
  apiApplications: ApiApplication[] = [];
  applications: Application[] = [];
  registrars: Registrar[] = [];
  isLoading: boolean = false;
  isRegistrarsLoading: boolean = false;
  error: string = '';

  // Configuration for search types
  searchConfig: Record<SearchType, { label: string; placeholder: string }> = {
    invoice: { label: 'Enter Invoice Number', placeholder: 'Enter Invoice Number' },
    parcel: { label: 'Enter Parcel Number', placeholder: 'Enter Parcel Number' },
    document: { label: 'Enter Document Number', placeholder: 'Enter Document Number' },
    receipt: { label: 'Enter Receipt Number', placeholder: 'Enter Receipt Number' }
  };

  constructor(
    private router: Router,
    private authService: AuthService,
    private applicationService: ApplicationService
  ) {
    // Initialize user data from AuthService
    this.currentUserRole = this.authService.getCurrentUserRole() as UserRole;
    this.currentUserName = this.authService.getCurrentUserName();
    this.currentUserRegistry = this.authService.getCurrentUserRegistry();
    this.currentUserId = 1;
  }

  ngOnInit(): void {
    this.loadApplications();
    this.loadRegistrars();
    this.applicationService.debugAllRoles().subscribe();
  }

  // ========== API METHODS ==========
  loadApplications(): void {
  this.isLoading = true;
  this.error = '';

  this.applicationService.getRegistrarInChargeApplications()
    .subscribe({
      next: (response: ApiResponse) => {
        this.apiApplications = response.results;
        this.isLoading = false;

        console.log('🔍 RAW API RESPONSE ANALYSIS:');
        response.results.forEach((apiApp, index) => {
          console.log(`Application ${index + 1}:`, {
            id: apiApp.id,
            reference_number: apiApp.reference_number,
            status: apiApp.status,
            assigned_to: apiApp.assigned_to,
            user_object: apiApp.user,
            has_registrar: !!apiApp.user?.registrar,
            registrar_data: apiApp.user?.registrar
          });
        });

        // Map API data to local applications format
        this.mapApiToLocalApplications();
      },
      error: (error: any) => {
        this.isLoading = false;
        this.error = 'Failed to load applications from API. Please try again later.';
        console.error('❌ Error loading applications from API:', error);
        this.applications = [];
        this.filteredApplications = [];
      }
    });
}


  loadRegistrars(): void {
    this.isRegistrarsLoading = true;

    this.applicationService.getAvailableRegistrars(this.currentUserRegistry)
      .subscribe({
        next: (registrars: Registrar[]) => {
          this.registrars = registrars;
          this.isRegistrarsLoading = false;

        },
        error: (error: any) => {
          this.isRegistrarsLoading = false;

          this.registrars = [];
        }
      });
  }

  // Map API data to your local Application interface
 private mapApiToLocalApplications(): void {
  console.log('🔄 mapApiToLocalApplications - FIXED VERSION');

  this.applications = this.apiApplications.map(apiApp => {
    console.log('🔍 Processing application:', apiApp.reference_number);

    // Map backend status to frontend status
    const statusMap: Record<string, 'unassigned' | 'ongoing' | 'completed' | 'verified' | 'rejected'> = {
      'pending': 'unassigned',
      'submitted': 'unassigned',
      'assigned': 'ongoing',
      'verified': 'verified',
      'completed': 'completed',
      'rejected': 'rejected'
    };

    const frontendStatus = statusMap[apiApp.status] || 'unassigned';

    // Extract user information - FIX: Handle missing user object
    const applicant = apiApp.user?.normal;

    // Handle applicant data
    let applicantName = 'Unknown Applicant';
    let applicantId = 0;

    if (applicant) {
      applicantName = `${applicant.first_name || ''} ${applicant.last_name || ''}`.trim() || applicant.username || 'Applicant';
      applicantId = applicant.id || 0;
    }

    // **CRITICAL FIX: Look up registrar from local registrars array**
    let assignedRegistrarName = 'Not assigned';
    let assignedRegistrarId = null;

    console.log('👤 FIXED Assignment Debug for', apiApp.reference_number, ':', {
      apiAssignedTo: apiApp.assigned_to,
      localRegistrarsCount: this.registrars.length,
      localRegistrars: this.registrars.map(r => ({ id: r.id, username: r.username }))
    });

    // FIX: Look up registrar name from local registrars array
    if (apiApp.assigned_to) {
      const assignedRegistrar = this.registrars.find(reg => reg.id === apiApp.assigned_to);

      if (assignedRegistrar) {
        assignedRegistrarName = assignedRegistrar.username;
        assignedRegistrarId = apiApp.assigned_to;
        console.log('✅ FOUND REGISTRAR IN LOCAL ARRAY:', assignedRegistrarName);
      } else {
        console.log('❌ Registrar ID', apiApp.assigned_to, 'not found in local registrars array');
        assignedRegistrarName = 'Assigned (Unknown)';
        assignedRegistrarId = apiApp.assigned_to;
      }
    }

    // Create application object with safe property access
    const application: Application = {
      id: apiApp.id,
      referenceNo: apiApp.reference_number,
      parcelNo: apiApp.parcel_number,
      dateSubmitted: this.formatDate(apiApp.submitted_at),
      timeElapsed: this.calculateTimeElapsed(apiApp.submitted_at),
      status: frontendStatus,
      applicantName: applicantName,
      applicantId: applicantId,
      county: apiApp.county,
      registry: apiApp.registry,
      assignedRegistrar: assignedRegistrarName,
      assignedRegistrarId: assignedRegistrarId,
      purpose: apiApp.purpose,
      submitted_at: apiApp.submitted_at,
      certificate: apiApp.certificate ? {
        signed_file: apiApp.certificate.signed_file,
        uploaded_at: this.formatDate(apiApp.certificate.uploaded_at)
      } : undefined,
      reviews: []
    };

    console.log('🎯 Final application object:', {
      id: application.id,
      status: application.status,
      assignedRegistrar: application.assignedRegistrar,
      assignedRegistrarId: application.assignedRegistrarId
    });

    return application;
  });

  console.log('✅ ALL APPLICATIONS AFTER FIXED MAPPING:', this.applications.map(app => ({
    id: app.id,
    referenceNo: app.referenceNo,
    status: app.status,
    assignedRegistrar: app.assignedRegistrar,
    assignedRegistrarId: app.assignedRegistrarId
  })));

  this.filterByStatus(this.currentTab);
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

  private calculateTimeElapsed(dateString: string): string {
    try {
      const submitted = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - submitted.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 30) {
        return `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
      } else if (diffDays < 365) {
        const months = Math.floor(diffDays / 30);
        return `${months} month${months !== 1 ? 's' : ''}`;
      } else {
        const years = Math.floor(diffDays / 365);
        return `${years} year${years !== 1 ? 's' : ''}`;
      }
    } catch (error) {
      return 'Unknown';
    }
  }

  private getRegistrarById(registrarId: number): Registrar | undefined {
    const registrar = this.registrars.find(registrar => registrar.id === registrarId);
    return registrar;
  }

  // ========== SEARCH TYPE CHANGE METHOD ==========
  onSearchTypeChange(): void {
    const config = this.searchConfig[this.selectedSearchType];
    if (config) {
      this.inputLabel = config.label;
      this.inputPlaceholder = config.placeholder;
    }
  }

  // ========== ASSIGNMENT METHODS ==========


// COMPLETELY REVISED assignToRegistrar method:
assignToRegistrar(applicationId: number, registrarId: string): void {
  console.log('🎯 ASSIGNMENT WITH LOCAL LOOKUP');

  if (!registrarId || registrarId === '') return;

  const registrarIdNum = parseInt(registrarId, 10);

  // Look up registrar from local array
  const registrar = this.registrars.find(r => r.id === registrarIdNum);

  if (!registrar) {
    console.error('Registrar not found in local array');
    return;
  }

  console.log('Assigning to registrar:', registrar.username);

  // Update local state
  const appIndex = this.applications.findIndex(app => app.id === applicationId);
  if (appIndex === -1) return;

  const updatedApplication: Application = {
    ...this.applications[appIndex],
    status: 'ongoing',
    assignedRegistrar: registrar.username,
    assignedRegistrarId: registrar.id
  };

  this.applications[appIndex] = updatedApplication;
  this.applications = [...this.applications]; // Force change detection

  console.log('Local state updated:', {
    assignedRegistrar: this.applications[appIndex].assignedRegistrar,
    assignedRegistrarId: this.applications[appIndex].assignedRegistrarId
  });

  // Update view
  this.currentTab = 'ongoing';
  this.filterByStatus('ongoing');

  // Call API
  this.applicationService.assignApplication(applicationId, registrarIdNum)
    .subscribe({
      next: (response: any) => {
        console.log('API success');
        alert(`Application successfully assigned to ${registrar.username}`);
      },
      error: (error: any) => {
        console.error('API failed:', error);
        alert('Assignment saved locally but API failed');
      }
    });
}

  markAsCompleted(applicationId: number): void {
    const application = this.applications.find(app => app.id === applicationId);
    if (!application) return;

    // Check if the current user has permission to mark as completed
    if (this.currentUserRole === 'is_registrar_in_charge' && application.registry === this.currentUserRegistry) {

      this.applicationService.completeApplication(applicationId)
        .subscribe({
          next: (updatedApplication: any) => {
            // Update local state
            const index = this.applications.findIndex(app => app.id === applicationId);
            if (index !== -1) {
              this.applications[index] = {
                ...this.applications[index],
                status: 'completed'
              };
            }
            console.log(`✅ Application ${applicationId} marked as completed`);
            alert('Application marked as completed');
            this.filterByStatus(this.currentTab);
          },
          error: (error: any) => {
            console.error('❌ Error completing application:', error);
            alert('Failed to mark application as completed. Please try again.');
          }
        });
    } else {
      alert('You can only mark applications from your registry as completed');
    }
  }

  markAsVerified(applicationId: number): void {
    const application = this.applications.find(app => app.id === applicationId);
    if (!application) return;

    if (this.currentUserRole === 'is_registrar_in_charge' && application.registry === this.currentUserRegistry) {

      this.applicationService.verifyApplication(applicationId)
        .subscribe({
          next: (updatedApplication: any) => {
            // Update local state
            const index = this.applications.findIndex(app => app.id === applicationId);
            if (index !== -1) {
              this.applications[index] = {
                ...this.applications[index],
                status: 'verified'
              };
            }
            console.log(`✅ Application ${applicationId} marked as verified`);
            alert('Application marked as verified');
            this.filterByStatus(this.currentTab);
          },
          error: (error: any) => {
            console.error('❌ Error verifying application:', error);
            alert('Failed to mark application as verified. Please try again.');
          }
        });
    } else {
      alert('You can only mark applications from your registry as verified');
    }
  }

  // ========== SEARCH METHODS ==========
  onSearch(): void {
    if (!this.searchValue.trim()) {
      alert('Please enter a search value');
      return;
    }

    const searchTerm = this.searchValue.toLowerCase().trim();

    let filtered = this.applications.filter(app => {
      // Only show applications from the current user's registry
      if (app.registry !== this.currentUserRegistry) return false;

      switch (this.selectedSearchType) {
        case 'parcel':
          return app.parcelNo.toLowerCase().includes(searchTerm);
        case 'invoice':
          // Search in payment invoice number
          return app.payment?.invoice_number?.toLowerCase().includes(searchTerm) || false;
        case 'document':
          return app.referenceNo.toLowerCase().includes(searchTerm);
        case 'receipt':
          // Search in payment reference number
          return app.payment?.payment_reference?.toLowerCase().includes(searchTerm) || false;
        default:
          return true;
      }
    });

    this.filteredApplications = filtered;
    console.log(`Search completed: Found ${filtered.length} results for "${this.searchValue}"`);
  }

  onTableSearch(): void {
    const searchTerm = this.tableSearchValue.toLowerCase().trim();

    if (!searchTerm) {
      this.filterByStatus(this.currentTab);
      return;
    }

    let applicationsToSearch = this.applications.filter(app => app.registry === this.currentUserRegistry);

    if (this.currentTab !== 'registry') {
      applicationsToSearch = applicationsToSearch.filter(app => app.status === this.currentTab);
    }

    this.filteredApplications = applicationsToSearch.filter(app =>
      app.referenceNo.toLowerCase().includes(searchTerm) ||
      app.parcelNo.toLowerCase().includes(searchTerm) ||
      app.dateSubmitted.toLowerCase().includes(searchTerm) ||
      app.timeElapsed.toLowerCase().includes(searchTerm) ||
      app.applicantName?.toLowerCase().includes(searchTerm) ||
      app.county?.toLowerCase().includes(searchTerm) ||
      app.registry?.toLowerCase().includes(searchTerm) ||
      app.assignedRegistrar?.toLowerCase().includes(searchTerm) ||
      app.purpose?.toLowerCase().includes(searchTerm) ||
      false
    );
  }

  // ========== FILTER METHODS ==========
  filterByStatus(status: ApplicationStatus): void {
    this.currentTab = status;

    let filtered = this.applications.filter(app => app.registry === this.currentUserRegistry);

    if (status === 'unassigned') {
      filtered = filtered.filter(app => app.status === 'unassigned');
    } else if (status === 'ongoing') {
      filtered = filtered.filter(app => app.status === 'ongoing');
    } else if (status === 'completed') {
      filtered = filtered.filter(app => app.status === 'completed');
    } else if (status === 'verified') {
      filtered = filtered.filter(app => app.status === 'verified');
    }
    this.filteredApplications = filtered;
    this.tableSearchValue = '';
  }

  // ========== COUNT METHODS ==========
  getStatusCount(status: ApplicationStatus): number {
    const registryApplications = this.applications.filter(app => app.registry === this.currentUserRegistry);

    switch (status) {
      case 'unassigned':
        return registryApplications.filter(app => app.status === 'unassigned').length;
      case 'ongoing':
        return registryApplications.filter(app => app.status === 'ongoing').length;
      case 'completed':
        return registryApplications.filter(app => app.status === 'completed').length;
      case 'verified':
        return registryApplications.filter(app => app.status === 'verified').length;
      case 'registry':
        return registryApplications.length;
      default:
        return registryApplications.length;
    }
  }

  // ========== PERMISSION METHODS ==========
  canAssignRegistrar(application: Application): boolean {
    // Check if registrar is truly unassigned
    const isTrulyUnassigned =
      (!application.assignedRegistrar ||
       application.assignedRegistrar === 'Not assigned' ||
       application.assignedRegistrar === '') &&
      (!application.assignedRegistrarId || application.assignedRegistrarId === null);

    const result = this.currentUserRole === 'is_registrar_in_charge' &&
           application.registry === this.currentUserRegistry &&
           application.status === 'unassigned' &&
           isTrulyUnassigned;
    return result;
  }

  canMarkCompleted(application: Application): boolean {
    return this.currentUserRole === 'is_registrar_in_charge' &&
           application.registry === this.currentUserRegistry &&
           application.status === 'ongoing';
  }

  canMarkVerified(application: Application): boolean {
    return this.currentUserRole === 'is_registrar_in_charge' &&
           application.registry === this.currentUserRegistry &&
           (application.status === 'ongoing' || application.status === 'completed');
  }

  getRegistrarsForCurrentRegistry(): Registrar[] {
    if (!this.registrars || this.registrars.length === 0) {
      return [];
    }

    // Filter registrars by current user's registry
    const filteredRegistrars = this.registrars.filter(registrar =>
      registrar.registry === this.currentUserRegistry &&
      registrar.role === 'is_registrar'
    );


    return filteredRegistrars;
  }

  // ========== UTILITY METHODS ==========
  setUserRole(role: UserRole, userName: string): void {
    this.currentUserRole = role;
    this.currentUserName = userName;
    this.filterByStatus(this.currentTab);
  }

  clearSearch(): void {
    this.searchValue = '';
    this.tableSearchValue = '';
    this.currentRegistry = 'all';
    this.filterByStatus(this.currentTab);
  }

  viewApplicationDetails(application: Application): void {
    console.log('=== NAVIGATION DEBUG ===');
    console.log('Application:', application);
    console.log('Application ID:', application.id);
    console.log('Target URL:', `/application-details/${application.id}`);

    this.router.navigate(['/application-details', application.id])
      .then(success => {
        console.log('Navigation result:', success);
        if (!success) {
          console.error('Navigation failed - route not found or guard blocked');
        }
      })
      .catch(error => {
        console.error('Navigation error:', error);
      });
  }

  setTab(status: ApplicationStatus): void {
    this.filterByStatus(status);
  }

  getStatusDisplay(status: ApplicationStatus): string {
    switch (status) {
      case 'unassigned':
        return 'Unassigned Applications';
      case 'ongoing':
        return 'Ongoing Applications';
      case 'completed':
        return 'Completed Applications';
      case 'verified':
        return 'Verified Applications';
      case 'registry':
        return 'All Registry Applications';
      default:
        return 'Applications';
    }
  }

  getStatusColor(status: ApplicationStatus): string {
    switch (status) {
      case 'unassigned': return 'warning';
      case 'ongoing': return 'primary';
      case 'completed': return 'success';
      case 'verified': return 'info';
      case 'registry': return 'secondary';
      default: return 'primary';
    }
  }

  switchToRegistrarRole(): void {
    console.log('🔄 Switching to individual registrar role');

    // Update user role using AuthService
    this.authService.setCurrentUserRole('is_registrar');

    // Update local component state
    this.currentUserRole = 'is_registrar';
    this.currentUserName = 'Individual Registrar';

    console.log('✅ Switched to registrar role');

    // Navigate to registrar dashboard
    this.router.navigate(['/registrar-dashboard']);
  }

  switchToRegistrarInChargeRole(): void {

    // Update user role using AuthService
    this.authService.setCurrentUserRole('is_registrar_in_charge');

    // Update local component state
    this.currentUserRole = 'is_registrar_in_charge';
    this.currentUserName = 'Registry Registrar In Charge';

    // Navigate to registrar in charge dashboard
    this.router.navigate(['/registrarInCharge']);
  }

  // Retry loading applications
  retryLoadApplications(): void {
    this.loadApplications();
  }

  // Download certificate
  downloadCertificate(application: Application): void {
    if (application.certificate?.signed_file) {
      // Create a temporary link to download the file
      const link = document.createElement('a');
      link.href = application.certificate.signed_file;
      link.download = `certificate-${application.referenceNo}.pdf`;
      link.click();
    } else {
      alert('No certificate available for download');
    }
  }

  // View payment details
  viewPaymentDetails(application: Application): void {
    if (application.payment) {
      alert(`Payment Details:\nAmount: ${application.payment.amount}\nInvoice: ${application.payment.invoice_number}\nReference: ${application.payment.payment_reference}\nPaid: ${application.payment.paid_at}`);
    } else {
      alert('No payment information available');
    }
  }

  // View reviews
  viewReviews(application: Application): void {
    if (application.reviews && application.reviews.length > 0) {
      const reviewText = application.reviews.map(review =>
        `Reviewer: ${review.reviewer_name || `User ${review.reviewer}`}\nDate: ${review.created_at}\nComment: ${review.comment}`
      ).join('\n\n');
      alert(`Reviews for ${application.referenceNo}:\n\n${reviewText}`);
    } else {
      alert('No reviews available for this application');
    }
  }

  // Debug method
  debugAssignmentPermission(application: Application): void {
    console.log('🔍 DEBUG canAssignRegistrar for application:', application.referenceNo);
    console.log('Application details:', {
      id: application.id,
      referenceNo: application.referenceNo,
      status: application.status,
      registry: application.registry,
      assignedRegistrar: application.assignedRegistrar,
      assignedRegistrarId: application.assignedRegistrarId
    });

    // console.log('User details:', {
    //   currentUserRole: this.currentUserRole,
    //   currentUserRegistry: this.currentUserRegistry,
    //   requiredRole: 'is_registrar_in_charge'
    // });

    const conditions = {
      hasCorrectRole: this.currentUserRole === 'is_registrar_in_charge',
      sameRegistry: application.registry === this.currentUserRegistry,
      isUnassigned: application.status === 'unassigned',
      noAssignedRegistrar: !application.assignedRegistrar && !application.assignedRegistrarId
    };
  }

}
