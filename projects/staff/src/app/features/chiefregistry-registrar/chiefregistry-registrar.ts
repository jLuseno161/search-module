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

// Type for search configuration
type SearchType = 'invoice' | 'parcel' | 'document' | 'receipt';
type ApplicationStatus = 'unassigned' | 'submitted' | 'completed' | 'verified' | 'registry';
type UserRole = 'is_registrar' | 'is_registrar_in_charge';
type AssignmentStrategy = 'round-robin' | 'load-balancing' | 'random';

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

  // Current state properties
  currentTab: ApplicationStatus = 'unassigned';
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

  // Auto-assignment properties
  autoAssignEnabled: boolean = true;
  assignmentStrategy: AssignmentStrategy = 'round-robin';
  lastAssignedRegistrarIndex: number = -1;

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
  }

  ngOnInit(): void {
    this.loadApplications();
    this.loadRegistrars();
  }

  // ========== AUTO-ASSIGNMENT METHODS ==========
  toggleAutoAssignment(): void {
    this.autoAssignEnabled = !this.autoAssignEnabled;
    console.log(`Auto-assignment ${this.autoAssignEnabled ? 'enabled' : 'disabled'}`);

    if (this.autoAssignEnabled) {
      setTimeout(() => {
        this.autoAssignUnassignedApplications();
      }, 500);
    }
  }

  private autoAssignUnassignedApplications(): void {
    if (!this.autoAssignEnabled) return;

    const unassignedApps = this.applications.filter(app =>
      app.status === 'unassigned' &&
      app.registry === this.currentUserRegistry
    );

    console.log(`Found ${unassignedApps.length} unassigned applications for auto-assignment`);

    if (unassignedApps.length > 0) {
      setTimeout(() => {
        unassignedApps.forEach((app, index) => {
          setTimeout(() => {
            this.autoAssignRegistrar(app.id);
          }, index * 1000);
        });
      }, 1000);
    }
  }

  private autoAssignRegistrar(applicationId: number): void {
    if (!this.autoAssignEnabled) return;

    const availableRegistrars = this.getRegistrarsForCurrentRegistry();
    if (availableRegistrars.length === 0) return;

    let registrarId: number;

    switch (this.assignmentStrategy) {
      case 'round-robin':
        registrarId = this.roundRobinAssignment(availableRegistrars);
        break;
      case 'load-balancing':
        registrarId = this.loadBalancingAssignment(availableRegistrars);
        break;
      case 'random':
        registrarId = this.randomAssignment(availableRegistrars);
        break;
      default:
        registrarId = this.roundRobinAssignment(availableRegistrars);
    }

    this.assignToRegistrar(applicationId, registrarId, true);
  }

  private roundRobinAssignment(registrars: Registrar[]): number {
    this.lastAssignedRegistrarIndex = (this.lastAssignedRegistrarIndex + 1) % registrars.length;
    return registrars[this.lastAssignedRegistrarIndex].id;
  }

  private loadBalancingAssignment(registrars: Registrar[]): number {
    const assignmentCounts = this.calculateCurrentWorkload(registrars);
    const leastBusyRegistrar = registrars.reduce((prev, current) =>
      assignmentCounts[prev.id] < assignmentCounts[current.id] ? prev : current
    );
    return leastBusyRegistrar.id;
  }

  private randomAssignment(registrars: Registrar[]): number {
    const randomIndex = Math.floor(Math.random() * registrars.length);
    return registrars[randomIndex].id;
  }

  private calculateCurrentWorkload(registrars: Registrar[]): { [registrarId: number]: number } {
    const workloads: { [registrarId: number]: number } = {};
    registrars.forEach(registrar => {
      workloads[registrar.id] = 0;
    });
    this.applications.forEach(app => {
      if (app.status === 'submitted' && app.assignedRegistrarId) {
        workloads[app.assignedRegistrarId] = (workloads[app.assignedRegistrarId] || 0) + 1;
      }
    });
    return workloads;
  }

  // Manual reassignment method
  manualReassign(applicationId: number, registrarId: string): void {
    if (!registrarId) return;
    this.assignToRegistrar(applicationId, parseInt(registrarId, 10), false);
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
          this.mapApiToLocalApplications();
        },
        error: (error: any) => {
          this.isLoading = false;
          this.error = 'Failed to load applications. Please try again.';
          console.error('Error loading applications:', error);
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
          console.error('Error loading registrars:', error);
        }
      });
  }

  // private mapApiToLocalApplications(): void {
  //   if (this.registrars.length === 0) {
  //     setTimeout(() => {
  //       this.mapApiToLocalApplications();
  //     }, 500);
  //     return;
  //   }

  //   this.applications = this.apiApplications.map(apiApp => {
  //     const statusMap: Record<string, 'unassigned' | 'submitted' | 'completed' | 'verified' | 'rejected'> = {
  //       'pending': 'unassigned',
  //       'submitted': 'unassigned',
  //       'assigned': 'submitted',
  //       'verified': 'verified',
  //       'completed': 'completed',
  //       'rejected': 'rejected'
  //     };

  //     const frontendStatus = statusMap[apiApp.status] || 'unassigned';
  //     const applicant = apiApp.user?.normal;

  //     let applicantName = 'Unknown Applicant';
  //     let applicantId = 0;

  //     if (applicant) {
  //       applicantName = `${applicant.first_name || ''} ${applicant.last_name || ''}`.trim() || applicant.username || 'Applicant';
  //       applicantId = applicant.id || 0;
  //     }

  //     let assignedRegistrarName = 'Not assigned';
  //     let assignedRegistrarId = null;

  //     if (apiApp.assigned_to) {
  //       const assignedRegistrar = this.registrars.find(reg => reg.id === apiApp.assigned_to);
  //       if (assignedRegistrar) {
  //         assignedRegistrarName = assignedRegistrar.username;
  //         assignedRegistrarId = apiApp.assigned_to;
  //       } else {
  //         assignedRegistrarName = 'Assigned (Unknown)';
  //         assignedRegistrarId = apiApp.assigned_to;
  //       }
  //     }

  //     const application: Application = {
  //       id: apiApp.id,
  //       referenceNo: apiApp.reference_number,
  //       parcelNo: apiApp.parcel_number,
  //       dateSubmitted: this.formatDate(apiApp.submitted_at),
  //       timeElapsed: this.calculateTimeElapsed(apiApp.submitted_at),
  //       status: frontendStatus,
  //       applicantName: applicantName,
  //       applicantId: applicantId,
  //       county: apiApp.county,
  //       registry: apiApp.registry,
  //       assignedRegistrar: assignedRegistrarName,
  //       assignedRegistrarId: assignedRegistrarId,
  //       purpose: apiApp.purpose,
  //       submitted_at: apiApp.submitted_at,
  //       certificate: apiApp.certificate ? {
  //         signed_file: apiApp.certificate.signed_file,
  //         uploaded_at: this.formatDate(apiApp.certificate.uploaded_at)
  //       } : undefined,
  //       reviews: []
  //     };

  //     return application;
  //   });

  //   this.filterByStatus(this.currentTab);
  //   setTimeout(() => {
  //     this.autoAssignUnassignedApplications();
  //   }, 1000);
  // }
private mapApiToLocalApplications(): void {
  if (this.registrars.length === 0) {
    setTimeout(() => {
      this.mapApiToLocalApplications();
    }, 500);
    return;
  }

  this.applications = this.apiApplications.map(apiApp => {
    const statusMap: Record<string, 'unassigned' | 'submitted' | 'completed' | 'verified' | 'rejected'> = {
      'pending': 'unassigned',
      'submitted': 'unassigned',
      'assigned': 'submitted',
      'verified': 'verified',
      'completed': 'completed',
      'rejected': 'rejected'
    };

    const frontendStatus = statusMap[apiApp.status] || 'unassigned';
    const applicant = apiApp.user?.normal;

    let applicantName = 'Unknown Applicant';
    let applicantId = 0;

    if (applicant) {
      applicantName = `${applicant.first_name || ''} ${applicant.last_name || ''}`.trim() || applicant.username || 'Applicant';
      applicantId = applicant.id || 0;
    }

    let assignedRegistrarName = 'Not assigned';
    let assignedRegistrarId = null;

    if (apiApp.assigned_to) {
      const assignedRegistrar = this.registrars.find(reg => reg.id === apiApp.assigned_to);
      if (assignedRegistrar) {
        assignedRegistrarName = assignedRegistrar.username;
        assignedRegistrarId = apiApp.assigned_to;
      } else {
        assignedRegistrarName = 'Assigned (Unknown)';
        assignedRegistrarId = apiApp.assigned_to;
      }
    }

    // Create the Application object with ALL required properties
    const application: Application = {
      // REQUIRED properties from Application interface
      id: apiApp.id,
      reference_number: apiApp.reference_number,
      parcel_number: apiApp.parcel_number,
      purpose: apiApp.purpose,
      county: apiApp.county,
      registry: apiApp.registry,
      status: apiApp.status, // Use the backend status here
      submitted_at: apiApp.submitted_at,
      assigned_to: assignedRegistrarId,
      applicant: applicantId,

      // Optional display properties (not in interface)
      dateSubmitted: this.formatDate(apiApp.submitted_at),
      timeElapsed: this.calculateTimeElapsed(apiApp.submitted_at),

      // For table compatibility (alias properties)
      referenceNo: apiApp.reference_number,
      parcelNo: apiApp.parcel_number,
      applicantName: applicantName,
      applicantId: applicantId,

      // Additional properties needed for your component
      assignedRegistrar: assignedRegistrarName,
      assignedRegistrarId: assignedRegistrarId,

      certificate: apiApp.certificate ? {
        signed_file: apiApp.certificate.signed_file,
        uploaded_at: this.formatDate(apiApp.certificate.uploaded_at)
      } : undefined,
      reviews: []
    };

    return application;
  });

  this.filterByStatus(this.currentTab);
  setTimeout(() => {
    this.autoAssignUnassignedApplications();
  }, 1000);
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

  // ========== ASSIGNMENT METHODS ==========
  assignToRegistrar(applicationId: number, registrarId: number, isAutoAssignment: boolean = false): void {
    const registrar = this.registrars.find(r => r.id === registrarId);

    if (!registrar) {
      if (!isAutoAssignment) {
        alert('Selected registrar not found.');
      }
      return;
    }

    this.applicationService.assignApplication(applicationId, registrarId)
      .subscribe({
        next: (response: any) => {
          console.log('Assignment successful:', response);
          if (!isAutoAssignment) {
            alert(`Application successfully assigned to ${registrar.username}`);
          }
          this.loadApplications();
        },
        error: (error: any) => {
          console.error('Assignment failed:', error);
          if (!isAutoAssignment) {
            alert(`Failed to assign application: ${error.message}`);
          }
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

// In the search method:
onSearch(): void {
  if (!this.searchValue.trim()) {
    alert('Please enter a search value');
    return;
  }

  const searchTerm = this.searchValue.toLowerCase().trim();
  let filtered = this.applications.filter(app => {
    if (app.registry !== this.currentUserRegistry) return false;

    // Use safe access with fallbacks
    const parcelNo = app.parcelNo || app.parcel_number || '';
    const invoiceNumber = app.payment?.invoice_number || '';
    const referenceNo = app.referenceNo || app.reference_number || '';
    const receiptNumber = app.payment?.payment_reference || '';

    switch (this.selectedSearchType) {
      case 'parcel':
        return parcelNo.toLowerCase().includes(searchTerm);
      case 'invoice':
        return invoiceNumber.toLowerCase().includes(searchTerm);
      case 'document':
        return referenceNo.toLowerCase().includes(searchTerm);
      case 'receipt':
        return receiptNumber.toLowerCase().includes(searchTerm);
      default:
        return true;
    }
  });

  this.filteredApplications = filtered;
}

// In the table search method:
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

  this.filteredApplications = applicationsToSearch.filter(app => {
    // Safe access with fallbacks
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
      (app.dateSubmitted || '').toLowerCase().includes(searchTerm) ||
      (app.timeElapsed || '').toLowerCase().includes(searchTerm) ||
      applicantName.toLowerCase().includes(searchTerm) ||
      county.toLowerCase().includes(searchTerm) ||
      registry.toLowerCase().includes(searchTerm) ||
      assignedRegistrar.toLowerCase().includes(searchTerm) ||
      purpose.toLowerCase().includes(searchTerm)
    );
  });
}

  // onTableSearch(): void {
  //   const searchTerm = this.tableSearchValue.toLowerCase().trim();
  //   if (!searchTerm) {
  //     this.filterByStatus(this.currentTab);
  //     return;
  //   }

  //   let applicationsToSearch = this.applications.filter(app => app.registry === this.currentUserRegistry);
  //   if (this.currentTab !== 'registry') {
  //     applicationsToSearch = applicationsToSearch.filter(app => app.status === this.currentTab);
  //   }

  //   this.filteredApplications = applicationsToSearch.filter(app =>
  //     app.referenceNo.toLowerCase().includes(searchTerm) ||
  //     app.parcelNo.toLowerCase().includes(searchTerm) ||
  //     app.dateSubmitted.toLowerCase().includes(searchTerm) ||
  //     app.timeElapsed.toLowerCase().includes(searchTerm) ||
  //     app.applicantName?.toLowerCase().includes(searchTerm) ||
  //     app.county?.toLowerCase().includes(searchTerm) ||
  //     app.registry?.toLowerCase().includes(searchTerm) ||
  //     app.assignedRegistrar?.toLowerCase().includes(searchTerm) ||
  //     app.purpose?.toLowerCase().includes(searchTerm) ||
  //     false
  //   );
  // }

  // ========== FILTER METHODS ==========
  filterByStatus(status: ApplicationStatus): void {
    this.currentTab = status;
    let filtered = this.applications.filter(app => app.registry === this.currentUserRegistry);

    if (status === 'unassigned') {
      filtered = filtered.filter(app => app.status === 'unassigned');
    } else if (status === 'submitted') {
      filtered = filtered.filter(app => app.status === 'submitted');
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
      case 'submitted':
        return registryApplications.filter(app => app.status === 'submitted').length;
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
  canReassign(application: Application): boolean {
    return this.currentUserRole === 'is_registrar_in_charge' &&
           application.registry === this.currentUserRegistry &&
           application.status === 'submitted' &&
           !!application.assignedRegistrarId;
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
      registrar.registry === this.currentUserRegistry &&
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
