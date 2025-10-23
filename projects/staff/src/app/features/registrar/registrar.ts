// src/app/features/registrar/registrar.component.ts
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
type ApplicationStatus = 'ongoing' | 'completed' | 'rejected';

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

    console.log('👤 Registrar initialized:', {
      name: this.currentUserName,
      registry: this.currentUserRegistry,
      role: this.currentUserRole
    });
  }

  ngOnInit(): void {
    console.log('🚀 Registrar Dashboard Component Initialized');
    console.log('👤 Current user:', {
      name: this.currentUserName,
      registry: this.currentUserRegistry,
      role: this.currentUserRole
    });
    this.loadApplications();
  }

  // ========== API METHODS ==========
  loadApplications(): void {
    this.isLoading = true;
    this.error = '';

    this.applicationService.getRegistrarAssignedApplications()
      .subscribe({
        next: (response: ApiResponse) => {
          this.apiApplications = response.results;
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

  private mapApiToLocalApplications(): void {
    this.applications = this.apiApplications.map(apiApp => {
      // Map backend status to frontend status for individual registrars
      const statusMap: Record<string, 'ongoing' | 'completed' | 'rejected'> = {
        'assigned': 'ongoing',
        'completed': 'completed',
        'rejected': 'rejected'
      };

      const frontendStatus = statusMap[apiApp.status] || 'ongoing';

      // Extract user information based on your API structure with safe access
      const applicant = apiApp.user?.normal; // Applicant is normal user
      const assignedRegistrar = apiApp.user?.registrar; // Assigned registrar

      // Handle applicant data
      let applicantName = 'Unknown Applicant';
      let applicantId = 0;
      
      if (applicant) {
        applicantName = `${applicant.first_name || ''} ${applicant.last_name || ''}`.trim() || applicant.username || 'Applicant';
        applicantId = applicant.id || 0;
      }

      // Handle assigned registrar data
      const assignedToUsername = assignedRegistrar?.username || 'Not assigned';
      const assignedToId = assignedRegistrar?.id;

      // Create complete application object with all properties
      const application: Application = {
        // Backend properties
        id: apiApp.id,
        reference_number: apiApp.reference_number,
        parcel_number: apiApp.parcel_number,
        purpose: apiApp.purpose,
        county: apiApp.county,
        registry: apiApp.registry,
        status: apiApp.status as any,
        submitted_at: apiApp.submitted_at,
        assigned_to: assignedToId,
        assigned_to_username: assignedToUsername,
        applicant: applicant,
        
        // Frontend display properties
        dateSubmitted: this.formatDate(apiApp.submitted_at),
        timeElapsed: this.calculateTimeElapsed(apiApp.submitted_at),
        
        // Table compatibility properties
        referenceNo: apiApp.reference_number,
        parcelNo: apiApp.parcel_number,
        applicantName: applicantName,
        applicantId: applicantId,
        certificate: apiApp.certificate ? {
          signed_file: apiApp.certificate.signed_file,
          uploaded_at: this.formatDate(apiApp.certificate.uploaded_at)
        } : undefined
      };

      return application;
    });

    console.log('✅ Mapped applications:', this.applications);
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
        const dateSubmitted = app.dateSubmitted || '';
        const timeElapsed = app.timeElapsed || '';
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
      'rejected': 'rejected'
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