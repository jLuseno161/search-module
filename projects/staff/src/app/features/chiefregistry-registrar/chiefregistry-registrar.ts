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
import { Application, Registrar } from '../../shared/interfaces/application';
import { StatisticsComponent } from './statistics/statistics.component';

// Type for search configuration
type SearchType = 'parcel' | 'document';
type ApplicationStatus = 'submitted' | 'returned' | 'rejected' |'completed' | 'registry' | 'statistics';
type UserRole = 'is_registrar' | 'is_registrar_in_charge';

@Component({
  selector: 'app-chief-registry-registrar',
  standalone: true,
  imports: [
    CommonModule,
    HttpClientModule,
    StatisticsComponent,
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
  selectedSearchType: SearchType = 'parcel';
  inputLabel: string = 'Enter Parcel Number';
  inputPlaceholder: string = 'Enter Parcel Number';
  searchValue: string = '';

  // Table search property
  tableSearchValue: string = '';

  // Current state properties
  currentTab: ApplicationStatus = 'submitted';
  currentUserRole: UserRole = 'is_registrar_in_charge';
  currentUserName: string = 'Chief Registrar';
  currentUserRegistry: string = 'Nairobi Central';
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
    parcel: { label: 'Enter Parcel Number', placeholder: 'Enter Parcel Number' },
    document: { label: 'Enter Document Number', placeholder: 'Enter Document Number' }
  };

  constructor(
    private router: Router,
    private authService: AuthService,
    private applicationService: ApplicationService
  ) {
    this.currentUserRole = this.authService.getCurrentUserRole() as UserRole;
    this.currentUserName = this.authService.getCurrentUserName();
    this.currentUserRegistry = this.authService.getCurrentUserRegistry();
  }

  ngOnInit(): void {
    this.loadApplications();
    this.loadRegistrars();
  }

  // ========== API METHODS ==========
  loadApplications(): void {
    this.isLoading = true;
    this.error = '';

    console.log('🔄 Loading applications...');

    this.applicationService.getRegistrarInChargeApplications()
      .subscribe({
        next: (response: any) => {
          console.log('📦 Full API Response:', response);

          let applicationsArray = [];

          if (Array.isArray(response)) {
            applicationsArray = response;
            console.log('✅ Response is an array with', applicationsArray.length, 'applications');
          } else if (response && response.results && Array.isArray(response.results)) {
            applicationsArray = response.results;
            console.log('✅ Response has results array with', applicationsArray.length, 'applications');
          } else {
            console.error('❌ Unexpected response format:', response);
            applicationsArray = [];
          }

          this.apiApplications = applicationsArray;
          console.log('📋 Applications count:', this.apiApplications.length);

          if (this.apiApplications.length > 0) {
            console.log('🔍 All fields in first application:', Object.keys(this.apiApplications[0]));
            console.log('📋 Full first application object:', this.apiApplications[0]);
          }

          // Call mapping function
          this.mapApiToLocalApplications();
        },
        error: (error: any) => {
          console.error('❌ Error loading applications:', error);
          this.error = 'Failed to load applications. Please try again.';
          this.isLoading = false;
          this.applications = [];
          this.filteredApplications = [];
        }
      });
  }

  loadRegistrars(): void {
    this.isRegistrarsLoading = true;
    this.applicationService.getAvailableRegistrars(this.currentUserRegistry)
      .subscribe({
        next: (registrars: any[]) => {
          this.registrars = Array.isArray(registrars) ? registrars : [];
          this.isRegistrarsLoading = false;

          if (this.registrars.length === 0) {
            console.warn('⚠️ No registrars found for registry:', this.currentUserRegistry);
          } else {
            console.log('✅ Registrars loaded:', this.registrars.length);
          }
        },
        error: (error: any) => {
          this.isRegistrarsLoading = false;
          this.registrars = [];
          console.error('Error loading registrars:', error);
        }
      });
  }
private mapApiToLocalApplications(): void {
  try {
    console.log('🔄 Starting to map applications...');

    if (!this.apiApplications || this.apiApplications.length === 0) {
      console.warn('⚠️ No applications to map');
      this.applications = [];
      this.filteredApplications = [];
      this.isLoading = false;
      return;
    }

    this.applications = this.apiApplications.map(apiApp => {
      try {
        // ONLY use payment.paid_at - no fallbacks
        let paymentDate: string | null = null;

        // Check if payment exists and has paid_at
        if (apiApp.payment && typeof apiApp.payment === 'object' && 'paid_at' in apiApp.payment) {
          paymentDate = (apiApp.payment as any).paid_at;
          console.log(`💰 Payment date for app ${apiApp.id}: ${paymentDate}`);
        } else {
          console.warn(`⚠️ No payment.paid_at found for app ${apiApp.id}`);
        }

        // Format the date for display
        const formattedDate = paymentDate ? this.formatDate(paymentDate) : 'Payment pending';
        const timeElapsed = paymentDate ? this.calculateTimeElapsed(paymentDate) : 'Unknown';

        // Get applicant info
        const applicant = apiApp.applicant || apiApp.user?.normal;
        let applicantName = 'Unknown Applicant';
        let applicantId = 0;
        let applicantIdNo = 0;

        if (applicant && typeof applicant === 'object') {
          applicantName = `${applicant.first_name || ''} ${applicant.last_name || ''}`.trim() ||
                         applicant.username || 'Applicant';
          applicantId = applicant.id || 0;
          applicantIdNo = applicant.id_no || 0;
        }

        // Handle assigned_to (can be object or number)
        let assignedRegistrarName = 'Not assigned';
        let assignedRegistrarId: number | null = null;

        if (apiApp.assigned_to) {
          if (typeof apiApp.assigned_to === 'object' && apiApp.assigned_to !== null) {
            assignedRegistrarId = (apiApp.assigned_to as any).id;
            assignedRegistrarName = (apiApp.assigned_to as any).username || 'Assigned Registrar';
          } else if (typeof apiApp.assigned_to === 'number') {
            assignedRegistrarId = apiApp.assigned_to;
            const assignedRegistrar = this.registrars.find(reg => reg.id === assignedRegistrarId);
            if (assignedRegistrar) {
              assignedRegistrarName = assignedRegistrar.username;
            }
          }
        }

        // Map API status to UI display status
        let displayStatus = apiApp.status;
        if (displayStatus === 'assigned') {
          displayStatus = 'submitted';
        } else if (displayStatus === 'submitted' || displayStatus === 'pending') {
          displayStatus = 'submitted';
        }

        // Create payment object
        let paymentObj = undefined;
        if (apiApp.payment && typeof apiApp.payment === 'object') {
          const payment = apiApp.payment as any;
          paymentObj = {
            id: payment.id,
            amount: payment.amount,
            invoice_number: payment.invoice_number,
            payment_reference: payment.payment_reference,
            merchant_request_id: payment.merchant_request_id,
            paid_at: payment.paid_at
          };
        }

        // Create the Application object
        const application: Application = {
          id: apiApp.id,
          id_no: applicantIdNo,
          reference_number: apiApp.reference_number,
          parcel_number: apiApp.parcel_number,
          purpose: apiApp.purpose,
          county: apiApp.county,
          registry: apiApp.registry,
          status: displayStatus,
          submitted_at: apiApp.submitted_at,
          assigned_to: assignedRegistrarId,
          applicant: applicantId,
          payment: paymentObj,

          // SET THE PAYMENT PROPERTIES HERE
          paid_at: paymentDate,  // Add this line - store raw date
          paid_at_formatted: formattedDate,  // Add this line - store formatted date
          time_elapsed: timeElapsed,

          referenceNo: apiApp.reference_number,
          parcelNo: apiApp.parcel_number,
          applicantName: applicantName,
          applicantId: applicantId,
          applicantIdNo: applicantIdNo,
          assignedRegistrar: assignedRegistrarName,
          assignedRegistrarId: assignedRegistrarId,
          certificate: apiApp.certificate ? {
            signed_file: apiApp.certificate.signed_file,
            uploaded_at: this.formatDate(apiApp.certificate.uploaded_at)
          } : undefined,
        };

        return application;
      } catch (mapError) {
        console.error(`❌ Error mapping application ${apiApp.id}:`, mapError);
        return null;
      }
    }).filter(app => app !== null) as Application[];

    console.log('✅ Applications mapped successfully:', this.applications.length);

    if (this.applications.length > 0) {
      console.log('📋 First mapped application:', this.applications[0]);
    }

    // Set loading to false AFTER successful mapping
    this.isLoading = false;

    // Now filter applications
    this.filterByStatus(this.currentTab);

  } catch (error) {
    console.error('❌ Fatal error in mapApiToLocalApplications:', error);
    this.error = 'Error processing applications. Please refresh.';
    this.isLoading = false;
  }
}
  // private mapApiToLocalApplications(): void {
  //   try {
  //     console.log('🔄 Starting to map applications...');

  //     if (!this.apiApplications || this.apiApplications.length === 0) {
  //       console.warn('⚠️ No applications to map');
  //       this.applications = [];
  //       this.filteredApplications = [];
  //       this.isLoading = false;
  //       return;
  //     }

  //     this.applications = this.apiApplications.map(apiApp => {
  //       try {
  //         // ONLY use payment.paid_at - no fallbacks
  //         let paymentDate: string | null = null;

  //         // Check if payment exists and has paid_at
  //         if (apiApp.payment && typeof apiApp.payment === 'object' && 'paid_at' in apiApp.payment) {
  //           paymentDate = (apiApp.payment as any).paid_at;
  //           console.log(`💰 Payment date for app ${apiApp.id}: ${paymentDate}`);
  //         } else {
  //           console.warn(`⚠️ No payment.paid_at found for app ${apiApp.id}`);
  //         }

  //         // Format the date for display
  //         const formattedDate = paymentDate ? this.formatDate(paymentDate) : 'Payment pending';
  //         const timeElapsed = paymentDate ? this.calculateTimeElapsed(paymentDate) : 'Unknown';

  //         // Get applicant info
  //         const applicant = apiApp.applicant || apiApp.user?.normal;
  //         let applicantName = 'Unknown Applicant';
  //         let applicantId = 0;
  //         let applicantIdNo = 0;

  //         if (applicant && typeof applicant === 'object') {
  //           applicantName = `${applicant.first_name || ''} ${applicant.last_name || ''}`.trim() ||
  //                          applicant.username || 'Applicant';
  //           applicantId = applicant.id || 0;
  //           applicantIdNo = applicant.id_no || 0;
  //         }

  //         // Handle assigned_to (can be object or number)
  //         let assignedRegistrarName = 'Not assigned';
  //         let assignedRegistrarId: number | null = null;

  //         if (apiApp.assigned_to) {
  //           if (typeof apiApp.assigned_to === 'object' && apiApp.assigned_to !== null) {
  //             assignedRegistrarId = (apiApp.assigned_to as any).id;
  //             assignedRegistrarName = (apiApp.assigned_to as any).username || 'Assigned Registrar';
  //           } else if (typeof apiApp.assigned_to === 'number') {
  //             assignedRegistrarId = apiApp.assigned_to;
  //             const assignedRegistrar = this.registrars.find(reg => reg.id === assignedRegistrarId);
  //             if (assignedRegistrar) {
  //               assignedRegistrarName = assignedRegistrar.username;
  //             }
  //           }
  //         }

  //         // Map API status to UI display status
  //         let displayStatus = apiApp.status;
  //         if (displayStatus === 'assigned') {
  //           displayStatus = 'ongoing';
  //         } else if (displayStatus === 'submitted' || displayStatus === 'pending') {
  //           displayStatus = 'submitted';
  //         }

  //         // Create payment object
  //         let paymentObj = undefined;
  //         if (apiApp.payment && typeof apiApp.payment === 'object') {
  //           const payment = apiApp.payment as any;
  //           paymentObj = {
  //             id: payment.id,
  //             amount: payment.amount,
  //             invoice_number: payment.invoice_number,
  //             payment_reference: payment.payment_reference,
  //             merchant_request_id: payment.merchant_request_id,
  //             paid_at: payment.paid_at
  //           };
  //         }

  //         // Create the Application object
  //         const application: Application = {
  //           id: apiApp.id,
  //           id_no: applicantIdNo,
  //           reference_number: apiApp.reference_number,
  //           parcel_number: apiApp.parcel_number,
  //           purpose: apiApp.purpose,
  //           county: apiApp.county,
  //           registry: apiApp.registry,
  //           status: displayStatus,
  //           submitted_at: apiApp.submitted_at,
  //           assigned_to: assignedRegistrarId,
  //           applicant: applicantId,
  //           payment: paymentObj,
  //           //dateSubmitted: formattedDate,
  //           time_elapsed: timeElapsed,
  //           referenceNo: apiApp.reference_number,
  //           parcelNo: apiApp.parcel_number,
  //           applicantName: applicantName,
  //           applicantId: applicantId,
  //           applicantIdNo: applicantIdNo,
  //           assignedRegistrar: assignedRegistrarName,
  //           assignedRegistrarId: assignedRegistrarId,
  //           certificate: apiApp.certificate ? {
  //             signed_file: apiApp.certificate.signed_file,
  //             uploaded_at: this.formatDate(apiApp.certificate.uploaded_at)
  //           } : undefined,
  //        //   reviews: apiApp.reviews || []
  //         };

  //         return application;
  //       } catch (mapError) {
  //         console.error(`❌ Error mapping application ${apiApp.id}:`, mapError);
  //         return null;
  //       }
  //     }).filter(app => app !== null) as Application[];

  //     console.log('✅ Applications mapped successfully:', this.applications.length);

  //     if (this.applications.length > 0) {
  //       console.log('📋 First mapped application:', this.applications[0]);
  //     }

  //     // Set loading to false AFTER successful mapping
  //     this.isLoading = false;

  //     // Now filter applications
  //     this.filterByStatus(this.currentTab);

  //   } catch (error) {
  //     console.error('❌ Fatal error in mapApiToLocalApplications:', error);
  //     this.error = 'Error processing applications. Please refresh.';
  //     this.isLoading = false;
  //   }
  // }

  private formatDate(dateString: string): string {
    if (!dateString) {
      return 'Payment pending';
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
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  }

  private calculateTimeElapsed(dateString: string): string {
    if (!dateString) {
      return 'Unknown';
    }

    try {
      const submitted = new Date(dateString);
      if (isNaN(submitted.getTime())) {
        return 'Unknown';
      }

      const now = new Date();
      const diffTime = Math.abs(now.getTime() - submitted.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return '1 day ago';
      if (diffDays < 30) return `${diffDays} days ago`;
      if (diffDays < 365) {
        const months = Math.floor(diffDays / 30);
        return `${months} month${months !== 1 ? 's' : ''} ago`;
      }
      const years = Math.floor(diffDays / 365);
      return `${years} year${years !== 1 ? 's' : ''} ago`;
    } catch (error) {
      console.error('Error calculating time elapsed:', error);
      return 'Unknown';
    }
  }

  // ========== ASSIGNMENT METHODS ==========
  manualReassign(applicationId: number, registrarId: string): void {
    if (!registrarId) return;
    this.assignToRegistrar(applicationId, parseInt(registrarId, 10));
  }

  assignToRegistrar(applicationId: number, registrarId: number): void {
    const registrar = this.registrars.find(r => r.id === registrarId);

    if (!registrar) {
      alert('Selected registrar not found.');
      return;
    }

    this.applicationService.assignApplication(applicationId, registrarId)
      .subscribe({
        next: (response: any) => {
          console.log('Assignment successful:', response);
          alert(`Application successfully assigned to ${registrar.username}`);
          this.loadApplications();
        },
        error: (error: any) => {
          console.error('Assignment failed:', error);
          alert(`Failed to assign application: ${error.message}`);
        }
      });
  }

  markAsCompleted(applicationId: number): void {
    const application = this.applications.find(app => app.id === applicationId);
    if (!application) return;

    if (this.currentUserRole === 'is_registrar_in_charge' && application.registry === this.currentUserRegistry) {
      this.applicationService.completeApplication(applicationId)
        .subscribe({
          next: () => {
            alert('Application marked as completed');
            this.loadApplications();
          },
          error: (error: any) => {
            alert('Failed to mark application as completed.');
            console.error('Error completing application:', error);
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
          next: () => {
            alert('Application marked as verified');
            this.loadApplications();
          },
          error: (error: any) => {
            alert('Failed to mark application as verified.');
            console.error('Error verifying application:', error);
          }
        });
    } else {
      alert('You can only mark applications from your registry as verified');
    }
  }

  // ========== SEARCH METHODS ==========
  onSearchTypeChange(): void {
    const config = this.searchConfig[this.selectedSearchType];
    if (config) {
      this.inputLabel = config.label;
      this.inputPlaceholder = config.placeholder;
    }
  }

  onSearch(): void {
    if (!this.searchValue.trim()) {
      alert('Please enter a search value');
      return;
    }

    const searchTerm = this.searchValue.toLowerCase().trim();
    let filtered = this.applications.filter(app => {
      if (app.registry?.toLowerCase() !== this.currentUserRegistry?.toLowerCase()) return false;

      const parcelNo = app.parcelNo || app.parcel_number || '';
      const referenceNo = app.referenceNo || app.reference_number || '';

      switch (this.selectedSearchType) {
        case 'parcel':
          return parcelNo.toLowerCase().includes(searchTerm);
        case 'document':
          return referenceNo.toLowerCase().includes(searchTerm);
        default:
          return true;
      }
    });

    this.filteredApplications = filtered;
  }

  onTableSearch(): void {
    const searchTerm = this.tableSearchValue.toLowerCase().trim();
    if (!searchTerm) {
      this.filterByStatus(this.currentTab);
      return;
    }

    let applicationsToSearch = this.applications.filter(app =>
      app.registry?.toLowerCase() === this.currentUserRegistry?.toLowerCase()
    );

    if (this.currentTab !== 'registry' && this.currentTab !== 'statistics') {
      applicationsToSearch = applicationsToSearch.filter(app => {
        if (this.currentTab === 'submitted') {
          return app.status === 'submitted';
        } else if (this.currentTab === 'returned') {
          return app.status === 'returned';
        } else if (this.currentTab === 'completed') {
          return app.status === 'completed';
        } else if (this.currentTab === 'rejected') {
          return app.status === 'rejected';
        }
        return true;
      });
    }

    this.filteredApplications = applicationsToSearch.filter(app => {
      const referenceNo = app.referenceNo || app.reference_number || '';
      const parcelNo = app.parcelNo || app.parcel_number || '';
      const applicantName = app.applicantName || '';
      const county = app.county || '';
      const registry = app.registry || '';
      const assignedRegistrar = app.assignedRegistrar || '';
      const purpose = app.purpose || '';

      return (
        referenceNo.toLowerCase().includes(searchTerm) ||
        parcelNo.toLowerCase().includes(searchTerm) ||
        (app.time_elapsed || '').toLowerCase().includes(searchTerm) ||
        applicantName.toLowerCase().includes(searchTerm) ||
        county.toLowerCase().includes(searchTerm) ||
        registry.toLowerCase().includes(searchTerm) ||
        assignedRegistrar.toLowerCase().includes(searchTerm) ||
        purpose.toLowerCase().includes(searchTerm)
      );
    });
  }

  // ========== FILTER METHODS ==========
  filterByStatus(status: ApplicationStatus): void {
    this.currentTab = status;

    // If statistics tab, don't filter applications
    if (status === 'statistics') {
      this.filteredApplications = [];
      return;
    }

    let filtered = this.applications.filter(app => {
      const appRegistry = app.registry?.toLowerCase().trim();
      const userRegistry = this.currentUserRegistry?.toLowerCase().trim();
      return appRegistry === userRegistry;
    });

    console.log(`🔍 Filtering by status: ${status}`);
    console.log(`User registry: "${this.currentUserRegistry}"`);
    console.log(`Total applications in registry: ${filtered.length}`);

    switch (status) {
      case 'submitted':
        filtered = filtered.filter(app => app.status === 'submitted');
        break;
      case 'returned':
        filtered = filtered.filter(app => app.status === 'returned');
        break;
      case 'completed':
        filtered = filtered.filter(app => app.status === 'completed');
        break;
      case 'rejected':
        filtered = filtered.filter(app => app.status === 'rejected');
        break;
      case 'registry':
        // Keep all filtered applications
        break;
    }

    console.log(`✅ After status filter: ${filtered.length} applications`);
    this.filteredApplications = filtered;
    this.tableSearchValue = '';
  }

  getStatusCount(status: ApplicationStatus): number {
    // For statistics tab, return 0
    if (status === 'statistics') return 0;

    const registryApplications = this.applications.filter(app => {
      const appRegistry = app.registry?.toLowerCase().trim();
      const userRegistry = this.currentUserRegistry?.toLowerCase().trim();
      return appRegistry === userRegistry;
    });

    switch (status) {
      case 'submitted':
        return registryApplications.filter(app => app.status === 'submitted').length;
      case 'returned':
        return registryApplications.filter(app => app.status === 'returned').length;
      case 'completed':
        return registryApplications.filter(app => app.status === 'completed').length;
      case 'rejected':
        return registryApplications.filter(app => app.status === 'rejected').length;
      case 'registry':
        return registryApplications.length;
      default:
        return 0;
    }
  }

  // ========== PERMISSION METHODS ==========
  canReassign(application: Application): boolean {
    return this.currentUserRole === 'is_registrar_in_charge' &&
           application.registry === this.currentUserRegistry &&
           application.status === 'submitted' &&
           !!application.assigned_to;
  }

  canMarkCompleted(application: Application): boolean {
    return this.currentUserRole === 'is_registrar_in_charge' &&
           application.registry === this.currentUserRegistry &&
           application.status === 'submitted';
  }

  canMarkVerified(application: Application): boolean {
    return this.currentUserRole === 'is_registrar_in_charge' &&
           application.registry === this.currentUserRegistry &&
           application.status === 'completed';
  }

  getRegistrarsForCurrentRegistry(): Registrar[] {
    if (!this.registrars || this.registrars.length === 0) {
      return [];
    }
    return this.registrars.filter(registrar =>
      registrar.registry?.toLowerCase() === this.currentUserRegistry?.toLowerCase() &&
      registrar.role === 'is_registrar'
    );
  }

  // ========== UTILITY METHODS ==========
  clearSearch(): void {
    this.searchValue = '';
    this.tableSearchValue = '';
    this.filterByStatus(this.currentTab);
  }

  viewApplicationDetails(application: Application): void {
    this.router.navigate(['/application-details', application.id]);
  }

  setTab(status: ApplicationStatus): void {
    this.filterByStatus(status);
  }

  retryLoadApplications(): void {
    this.loadApplications();
  }
}
