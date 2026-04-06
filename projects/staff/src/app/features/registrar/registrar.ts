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
import { ApplicationService, ApiApplication, ApiResponse } from '../../services/application.service';
import { Application } from '../../shared/interfaces/application';

// Type for search configuration
type SearchType = 'invoice' | 'parcel' | 'document' | 'receipt';
type ApplicationStatus = 'ongoing' | 'completed' | 'rejected' | 'returned';

@Component({
  selector: 'app-registrar',
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
  templateUrl: './registrar.html',
  styleUrls: ['./registrar.css']
})
export class Registrar implements OnInit {
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
  currentTab: ApplicationStatus = 'ongoing';
  currentUserName: string = 'Individual Registrar';
  currentUserRegistry: string = '';
  currentUserRole: string = '';
  filteredApplications: Application[] = [];

  // API data properties
  apiApplications: ApiApplication[] = [];
  applications: Application[] = [];
  isLoading: boolean = false;
  error: string = '';

  // Add registrar data
  registrars: any[] = [];
  isRegistrarsLoading: boolean = false;

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
    this.currentUserName = this.authService.getCurrentUserName();
    this.currentUserRegistry = this.authService.getCurrentUserRegistry();
    this.currentUserRole = this.authService.getCurrentUserRole();
  }

  ngOnInit(): void {
    this.loadRegistrars();
    this.loadApplications();
  }

  // ========== API METHODS ==========
  loadApplications(): void {
  this.isLoading = true;
  this.error = '';

  this.applicationService.getRegistrarAssignedApplications()
    .subscribe({
      next: (response: any) => {
        console.log('📦 Full API Response:', response);

        // Handle both response formats
        let applicationsArray = [];

        if (Array.isArray(response)) {
          // If response is directly an array
          applicationsArray = response;
          console.log('✅ Response is an array with', applicationsArray.length, 'applications');
        } else if (response && response.results && Array.isArray(response.results)) {
          // If response has a results property
          applicationsArray = response.results;
          console.log('✅ Response has results array with', applicationsArray.length, 'applications');
        } else {
          console.error('❌ Unexpected response format:', response);
          applicationsArray = [];
        }

        this.apiApplications = applicationsArray;
        this.isLoading = false;
        console.log('✅ Applications loaded from API:', this.apiApplications);

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


  private loadRegistrars(): void {
    this.isRegistrarsLoading = true;

    this.applicationService.getAvailableRegistrars(this.currentUserRegistry).subscribe({
      next: (registrars: any[]) => {
        this.registrars = registrars;
        this.isRegistrarsLoading = false;
        console.log('✅ Registrars loaded for registrar dashboard:', this.registrars);
      },
      error: (error: any) => {
        this.isRegistrarsLoading = false;
        console.error('❌ Error loading registrars:', error);
        this.registrars = [];
      }
    });
  }

private mapApiToLocalApplications(): void {
  if (!this.apiApplications || !Array.isArray(this.apiApplications)) {
    console.warn('⚠️ No applications to map or invalid format:', this.apiApplications);
    this.applications = [];
    this.filteredApplications = [];
    return;
  }

  this.applications = this.apiApplications.map(apiApp => {
    console.log('🔍 Processing API Application:', apiApp);

    // Extract paid_at from payment object (FIXED)
    let paidAtValue = null;
    if (apiApp.payment && apiApp.payment.paid_at) {
      paidAtValue = apiApp.payment.paid_at;
    }

    // Calculate time elapsed from paid_at
    let timeElapsed = 'Unknown';
    if (paidAtValue) {
      timeElapsed = this.calculateTimeElapsed(paidAtValue);
    } else {
      timeElapsed = 'Not paid yet';
    }

    // Handle applicant as object
    let applicantName = 'Unknown Applicant';
    let applicantId = 0;
    let applicantIdNo = 0;

    if (apiApp.applicant && typeof apiApp.applicant === 'object') {
      const applicant = apiApp.applicant;
      applicantName = applicant.username ||
                     `${applicant.first_name || ''} ${applicant.last_name || ''}`.trim() ||
                     'Applicant';
      applicantId = applicant.id || 0;
      applicantIdNo = applicant.id_no || 0;
    }

    // Handle assigned_to as object
    let assignedToUsername = 'Not assigned';
    let assignedToId: number | null = null;

    if (apiApp.assigned_to && typeof apiApp.assigned_to === 'object') {
      const assignedRegistrar = apiApp.assigned_to;
      assignedToUsername = assignedRegistrar.username || 'Not assigned';
      assignedToId = assignedRegistrar.id;
    } else if (apiApp.assigned_to && typeof apiApp.assigned_to === 'number') {
      assignedToId = apiApp.assigned_to;
      assignedToUsername = `Registrar #${assignedToId}`;
    }

    // Create certificate info if exists
    let certificateInfo = undefined;
    if (apiApp.certificate && apiApp.certificate.signed_file) {
      certificateInfo = {
        signed_file: apiApp.certificate.signed_file,
        uploaded_at: this.formatDate(apiApp.certificate.uploaded_at)
      };
    }

    const application: Application = {
      id: apiApp.id,
      id_no: applicantIdNo,
      reference_number: apiApp.reference_number,
      parcel_number: apiApp.parcel_number,
      purpose: apiApp.purpose,
      county: apiApp.county,
      registry: apiApp.registry,
      status: apiApp.status,
      submitted_at: apiApp.submitted_at,
      assigned_to: assignedToId,
      assigned_to_username: assignedToUsername,
      applicant: applicantId,
      paid_at: paidAtValue,
      paid_at_formatted: paidAtValue ? this.formatDate(paidAtValue) : 'Not paid',  // FIXED
      time_elapsed: timeElapsed,
      referenceNo: apiApp.reference_number,
      parcelNo: apiApp.parcel_number,
      applicantName: applicantName,
      applicantId: applicantId,
      applicantIdNo: applicantIdNo,
      certificate: certificateInfo,
      applicantObject: apiApp.applicant,
      assignedToObject: apiApp.assigned_to
    };

    return application;
  });

  console.log('✅ Total mapped applications:', this.applications.length);
  this.filterByStatus(this.currentTab);
}
private formatDate(dateString: string | null | undefined): string {
  if (!dateString) {
    return 'N/A';
  }

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    return 'Invalid date';
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

  // ========== SEARCH TYPE CHANGE METHOD ==========
  onSearchTypeChange(): void {
    const config = this.searchConfig[this.selectedSearchType];
    if (config) {
      this.inputLabel = config.label;
      this.inputPlaceholder = config.placeholder;
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
      // Use safe access with fallbacks
      const referenceNo = app.referenceNo || app.reference_number || '';
      const parcelNo = app.parcelNo || app.parcel_number || '';
      const applicantName = app.applicantName || '';

      switch (this.selectedSearchType) {
        case 'parcel':
          return parcelNo.toLowerCase().includes(searchTerm);
        case 'invoice':
          return referenceNo.toLowerCase().includes(searchTerm);
        case 'document':
          return referenceNo.toLowerCase().includes(searchTerm);
        case 'receipt':
          return referenceNo.toLowerCase().includes(searchTerm);
        default:
          return true;
      }
    });

    // Apply status filter
    filtered = filtered.filter(app => this.getFrontendStatus(app.status) === this.currentTab);
    this.filteredApplications = filtered;
    console.log(`Search completed: Found ${filtered.length} results for "${this.searchValue}"`);
  }

  onTableSearch(): void {
    const searchTerm = this.tableSearchValue.toLowerCase().trim();

    if (!searchTerm) {
      this.filterByStatus(this.currentTab);
      return;
    }

    this.filteredApplications = this.applications
      .filter(app => this.getFrontendStatus(app.status) === this.currentTab)
      .filter(app => {
        // Safe access with fallbacks for all searchable fields
        const referenceNo = app.referenceNo || app.reference_number || '';
        const parcelNo = app.parcelNo || app.parcel_number || '';
        const dateSubmitted = app.paid_at_formatted || '';
        const timeElapsed = app.time_elapsed || '';
        const applicantName = app.applicantName || '';
        const county = app.county || '';
        const registry = app.registry || '';
        const purpose = app.purpose || '';

        return (
          referenceNo.toLowerCase().includes(searchTerm) ||
          parcelNo.toLowerCase().includes(searchTerm) ||
          dateSubmitted.toLowerCase().includes(searchTerm) ||
          timeElapsed.toLowerCase().includes(searchTerm) ||
          applicantName.toLowerCase().includes(searchTerm) ||
          county.toLowerCase().includes(searchTerm) ||
          registry.toLowerCase().includes(searchTerm) ||
          purpose.toLowerCase().includes(searchTerm)
        );
      });
  }

  // ========== FILTER METHODS ==========
  filterByStatus(status: ApplicationStatus): void {
    this.currentTab = status;
    this.filteredApplications = this.applications.filter(app => this.getFrontendStatus(app.status) === status);
    this.tableSearchValue = '';
  }

  // Helper to map backend status to frontend status
  private getFrontendStatus(backendStatus: string): ApplicationStatus {
    const statusMap: Record<string, ApplicationStatus> = {
      'assigned': 'ongoing',
      'completed': 'completed',
      'rejected': 'rejected',
      'returned': 'returned'
    };
    return statusMap[backendStatus] || 'ongoing';
  }

  // ========== COUNT METHODS ==========
  getStatusCount(status: ApplicationStatus): number {
    return this.applications.filter(app => this.getFrontendStatus(app.status) === status).length;
  }

  // ========== UTILITY METHODS ==========
  clearSearch(): void {
    this.searchValue = '';
    this.tableSearchValue = '';
    this.filterByStatus(this.currentTab);
  }

  viewApplicationDetails(application: Application): void {
    console.log('Navigating to application details:', application.id);

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
      case 'ongoing':
        return 'Ongoing Applications';
      case 'completed':
        return 'Completed Applications';
      case 'rejected':
        return 'Rejected Applications';
      case 'returned':
        return 'Returned Applications';
      default:
        return 'Applications';
    }
  }

  // ========== APPLICATION ACTIONS ==========
  approveApplication(applicationId: number): void {
    console.log('Approving application:', applicationId);

    // Redirect to application details for certificate upload
    this.router.navigate(['/application-details', applicationId]);
  }

  rejectApplication(applicationId: number): void {
    console.log('Rejecting application:', applicationId);

    const rejectReason = prompt('Please enter rejection reason:');
    if (rejectReason && rejectReason.trim()) {
      const rejectData = { comment: rejectReason.trim() };

      this.applicationService.rejectApplication(applicationId, rejectData).subscribe({
        next: (response) => {
          console.log('Application rejected:', response);
          alert('Application rejected successfully!');
          // Reload applications to reflect the change
          this.loadApplications();
        },
        error: (error) => {
          console.error('Error rejecting application:', error);

          let errorMessage = 'Failed to reject application. Please try again.';
          if (error.error && error.error.error) {
            errorMessage = error.error.error;
          } else if (error.error && error.error.detail) {
            errorMessage = error.error.detail;
          }
          alert(errorMessage);
        }
      });
    }
  }

  // Download certificate for completed applications
  downloadCertificate(application: Application): void {
    const certificateFile = application.certificate?.signed_file;
    if (certificateFile) {
      // Create a temporary link to download the file
      const link = document.createElement('a');
      link.href = certificateFile;
      const referenceNo = application.referenceNo || application.reference_number || 'unknown';
      link.download = `certificate-${referenceNo}.pdf`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      alert('No certificate available for download');
    }
  }

  // Check if application can be approved (only ongoing/assigned applications)
  canApproveApplication(application: Application): boolean {
    return application.status === 'assigned';
  }

  // Check if application can be rejected (only ongoing/assigned applications)
  canRejectApplication(application: Application): boolean {
    return application.status === 'assigned';
  }

  // Check if certificate can be downloaded (only completed applications)
  canDownloadCertificate(application: Application): boolean {
    return application.status === 'completed' && !!application.certificate?.signed_file;
  }

  // Get status badge class for table display
  getStatusBadgeClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'submitted':
      case 'assigned':
      case 'pending':
        return 'badge bg-warning text-dark';
      case 'completed':
      case 'verified':
        return 'badge bg-success';
      case 'rejected':
        return 'badge bg-danger';
      default:
        return 'badge bg-secondary';
    }
  }

  // Safe getter for table display
  getReferenceNo(application: Application): string {
    return application.referenceNo || application.reference_number || 'N/A';
  }

  getParcelNo(application: Application): string {
    return application.parcelNo || application.parcel_number || 'N/A';
  }

  getApplicantName(application: Application): string {
    return application.applicantName || 'Unknown Applicant';
  }

  // Retry loading applications
  retryLoadApplications(): void {
    this.loadApplications();
  }

  // Logout method
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

}
