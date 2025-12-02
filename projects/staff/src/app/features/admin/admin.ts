import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
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

// Enhanced interfaces for hierarchical structure
export interface County {
  id: number;
  name: string;
  code: string;
  registries: Registry[];
  countyRegistrar?: string; // Registrar in charge of the county
}

export interface Registry {
  id: number;
  name: string;
  code: string;
  countyId: number;
  registryRegistrar?: string; // Registrar in charge at registry level
  registrars: string[]; // List of registrars under this registry
}

export interface Application {
  id: number;
  referenceNo: string;
  parcelNo: string;
  dateSubmitted: string;
  timeElapsed: string;
  status: 'unassigned' | 'ongoing' | 'completed'; // Added unassigned status
  applicantName?: string;
  applicantEmail?: string;
  applicantPhone?: string;
  county: string;
  registry: string;
  assignedCountyRegistrar?: string;
  assignedRegistryRegistrar?: string;
  assignedRegistrar?: string;
  location?: string;
  area?: string;
  purpose?: string;
  documents?: string[];
  currentStage?: string;
  nextStage?: string;
  estimatedCompletion?: string;
  notes?: string;
}

// Type for search configuration
type SearchType = 'county' | 'registry' |'invoice' | 'parcel' |  'document' | 'receipt';
type ApplicationStatus = 'unassigned' | 'ongoing' | 'completed' | 'county' | 'registry';
type UserRole = 'admin' | 'county_registrar' | 'registry_registrar' | 'registrar';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
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
  ],
  templateUrl: './admin.html',
  styleUrls: ['./admin.css']
})
export class Admin {
  // Search form properties
  selectedSearchType: SearchType = 'invoice';
  inputLabel: string = 'Enter Invoice Number';
  inputPlaceholder: string = 'Enter Invoice Number';
  searchValue: string = '';

  // Table search property
  tableSearchValue: string = '';

  // Table columns
  displayedColumns: string[] = ['referenceNo', 'parcelNo', 'dateSubmitted', 'timeElapsed', 'actions'];

  // Hierarchical filtering properties
  currentCounty: string = 'all';
  currentRegistry: string = 'all';
  availableCounties: County[] = [];
  availableRegistries: Registry[] = [];
  currentUserRole: UserRole = 'admin';
  currentUserName: string = 'System Admin';

  // Configuration for search types
  searchConfig: Record<SearchType, { label: string; placeholder: string }> = {
    invoice: { label: 'Enter Invoice Number', placeholder: 'Enter Invoice Number' },
    registry: { label: 'Enter Registry', placeholder: 'Enter Registry' },
    parcel: { label: 'Enter Parcel Number', placeholder: 'Enter Parcel Number' },
    county: { label: 'Enter County', placeholder: 'Enter County' },
    document: { label: 'Enter Document Number', placeholder: 'Enter Document Number' },
    receipt: { label: 'Enter Receipt Number', placeholder: 'Enter Receipt Number' }
  };

  // Sample counties with registries
  counties: County[] = [
    {
      id: 1,
      name: 'Nairobi',
      code: '047',
      countyRegistrar: 'John Maina',
      registries: [
        { id: 1, name: 'Nairobi Central', code: 'NBI-CENT', countyId: 1, registryRegistrar: 'Mary Wanjiku', registrars: ['David Kimani', 'Sarah Otieno'] },
        { id: 2, name: 'Nairobi East', code: 'NBI-EAST', countyId: 1, registryRegistrar: 'James Kariuki', registrars: ['Grace Mwende', 'Peter Ndungu'] },
        { id: 3, name: 'Westlands', code: 'NBI-WEST', countyId: 1, registryRegistrar: 'Alice Njeri', registrars: ['Michael Ochieng', 'Lucy Akinyi'] }
      ]
    },
    {
      id: 2,
      name: 'Mombasa',
      code: '001',
      countyRegistrar: 'Ahmed Hassan',
      registries: [
        { id: 4, name: 'Mombasa Central', code: 'MBA-CENT', countyId: 2, registryRegistrar: 'Fatima Ali', registrars: ['Omar Said', 'Aisha Mohammed'] },
        { id: 5, name: 'Nyali', code: 'MBA-NYAL', countyId: 2, registryRegistrar: 'Salim Juma', registrars: ['Halima Abdi', 'Yusuf Bakari'] }
      ]
    },
    {
      id: 3,
      name: 'Kisumu',
      code: '042',
      countyRegistrar: 'Paul Otieno',
      registries: [
        { id: 6, name: 'Kisumu Central', code: 'KSM-CENT', countyId: 3, registryRegistrar: 'Jane Achieng', registrars: ['Robert Owino', 'Esther Adhiambo'] },
        { id: 7, name: 'Milimani', code: 'KSM-MILI', countyId: 3, registryRegistrar: 'Thomas Okoth', registrars: ['Susan Atieno', 'Brian Omondi'] }
      ]
    }
  ];

  // Sample applications data - Start with unassigned applications
  applications: Application[] = [
    {
      id: 1,
      referenceNo: 'REG/SRCH/NO6NJXZE7G',
      parcelNo: 'NAIROBI/BLOCK82/2190',
      dateSubmitted: 'Sep 17, 2025',
      timeElapsed: '19 days',
      status: 'unassigned',
      applicantName: 'John Kamau',
      county: 'Nairobi',
      registry: 'Nairobi Central'
    },
    {
      id: 2,
      referenceNo: 'REG/SRCH/RQEI6BSV83',
      parcelNo: 'NAIROBI/BLOCK45/1234',
      dateSubmitted: 'Jul 22, 2025',
      timeElapsed: '2 months',
      status: 'unassigned',
      applicantName: 'Mary Wanjiku',
      county: 'Nairobi',
      registry: 'Nairobi East'
    },
    {
      id: 3,
      referenceNo: 'REG/SRCH/MWE06GL2YN',
      parcelNo: 'MOMBASA/BLOCK12/5678',
      dateSubmitted: 'May 27, 2025',
      timeElapsed: '4 months',
      status: 'unassigned',
      applicantName: 'Ahmed Hassan',
      county: 'Mombasa',
      registry: 'Mombasa Central'
    },
    {
      id: 4,
      referenceNo: 'REG/SRCH/LN1456GORU',
      parcelNo: 'NAIROBI/BLOCK23/9876',
      dateSubmitted: 'Apr 28, 2025',
      timeElapsed: '5 months',
      status: 'ongoing',
      applicantName: 'James Omondi',
      county: 'Nairobi',
      registry: 'Westlands',
      assignedCountyRegistrar: 'John Maina',
      assignedRegistryRegistrar: 'Alice Njeri',
      assignedRegistrar: 'Michael Ochieng'
    },
    {
      id: 5,
      referenceNo: 'REG/SRCH/OZO2YKWBLL',
      parcelNo: 'KISUMU/BLOCK34/5432',
      dateSubmitted: 'Apr 17, 2025',
      timeElapsed: '6 months',
      status: 'completed',
      applicantName: 'Sarah Atieno',
      county: 'Kisumu',
      registry: 'Kisumu Central',
      assignedCountyRegistrar: 'Paul Otieno',
      assignedRegistryRegistrar: 'Jane Achieng',
      assignedRegistrar: 'Robert Owino'
    },
    {
      id: 6,
      referenceNo: 'REG/SRCH/NEW1234567',
      parcelNo: 'NAIROBI/BLOCK99/9999',
      dateSubmitted: 'Oct 1, 2025',
      timeElapsed: '5 days',
      status: 'unassigned',
      applicantName: 'Peter Mwangi',
      county: 'Nairobi',
      registry: 'Nairobi Central'
    }
  ];

  // Filtered data
  filteredApplications: Application[] = [...this.applications];
  currentTab: ApplicationStatus = 'unassigned';

  constructor(private router: Router) {
    this.filterByStatus('unassigned');
    this.availableCounties = this.counties;
    this.updateAvailableRegistries();
  }

  // ========== ASSIGNMENT METHODS ==========

  assignToCountyRegistrar(applicationId: number, countyRegistrar: string): void {
    if (!countyRegistrar || countyRegistrar === '') return;

    if (this.currentUserRole !== 'admin') {
      alert('Only administrators can assign county registrars');
      return;
    }

    const application = this.applications.find(app => app.id === applicationId);
    if (application) {
      application.assignedCountyRegistrar = countyRegistrar;

      // Change status from unassigned to ongoing
      if (application.status === 'unassigned') {
        application.status = 'ongoing';
      }

      console.log(`Admin assigned application ${applicationId} to county registrar: ${countyRegistrar}`);
      alert(`Application assigned to ${countyRegistrar} and moved to Ongoing`);

      // Refresh the current view
      this.filterByStatus(this.currentTab);
    }
  }

  assignToRegistryRegistrar(applicationId: number, registryRegistrar: string): void {
    if (!registryRegistrar || registryRegistrar === '') return;

    const application = this.applications.find(app => app.id === applicationId);

    if (!application) return;

    // Check permissions
    if (this.currentUserRole !== 'county_registrar' && this.currentUserRole !== 'admin') {
      alert('Only county registrars can assign registry registrars');
      return;
    }

    // Verify the county registrar is assigned to this application
    if (this.currentUserRole === 'county_registrar' &&
        application.assignedCountyRegistrar !== this.currentUserName) {
      alert('You can only assign applications that are assigned to you');
      return;
    }

    application.assignedRegistryRegistrar = registryRegistrar;
    console.log(`County registrar assigned application ${applicationId} to registry registrar: ${registryRegistrar}`);
    alert(`Application assigned to ${registryRegistrar} at registry level`);

    this.filterByStatus(this.currentTab);
  }

  assignToRegistrar(applicationId: number, registrar: string): void {
    if (!registrar || registrar === '') return;

    const application = this.applications.find(app => app.id === applicationId);

    if (!application) return;

    // Check permissions
    if (this.currentUserRole !== 'registry_registrar' && this.currentUserRole !== 'admin') {
      alert('Only registry registrars can assign individual registrars');
      return;
    }

    // Verify the registry registrar is assigned to this application
    if (this.currentUserRole === 'registry_registrar' &&
        application.assignedRegistryRegistrar !== this.currentUserName) {
      alert('You can only assign applications that are assigned to your registry');
      return;
    }

    application.assignedRegistrar = registrar;
    console.log(`Registry registrar assigned application ${applicationId} to registrar: ${registrar}`);
    alert(`Application assigned to ${registrar}`);

    this.filterByStatus(this.currentTab);
  }

  markAsCompleted(applicationId: number): void {
    const application = this.applications.find(app => app.id === applicationId);
    if (application) {
      application.status = 'completed';
      console.log(`Application ${applicationId} marked as completed`);
      alert('Application marked as completed');
      this.filterByStatus(this.currentTab);
    }
  }

  // ========== FILTER AND SEARCH METHODS ==========

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
      switch (this.selectedSearchType) {
        case 'parcel':
          return app.parcelNo.toLowerCase().includes(searchTerm);
        case 'invoice':
        case 'document':
        case 'receipt':
          return app.referenceNo.toLowerCase().includes(searchTerm);
        case 'county':
          return app.county?.toLowerCase().includes(searchTerm) || false;
        case 'registry':
          return app.registry?.toLowerCase().includes(searchTerm) || false;
        default:
          return true;
      }
    });

    filtered = this.applyHierarchicalFilters(filtered);
    this.filteredApplications = filtered;
    console.log(`Search completed: Found ${filtered.length} results for "${this.searchValue}"`);
  }

  onTableSearch(): void {
    const searchTerm = this.tableSearchValue.toLowerCase().trim();

    if (!searchTerm) {
      this.filterByStatus(this.currentTab);
      return;
    }

    let applicationsToSearch = this.applications;

    if (this.currentTab !== 'county' && this.currentTab !== 'registry') {
      applicationsToSearch = this.applications.filter(app => app.status === this.currentTab);
    }

    applicationsToSearch = this.applyHierarchicalFilters(applicationsToSearch);

    this.filteredApplications = applicationsToSearch.filter(app =>
      app.referenceNo.toLowerCase().includes(searchTerm) ||
      app.parcelNo.toLowerCase().includes(searchTerm) ||
      app.dateSubmitted.toLowerCase().includes(searchTerm) ||
      app.timeElapsed.toLowerCase().includes(searchTerm) ||
      app.applicantName?.toLowerCase().includes(searchTerm) ||
      app.county?.toLowerCase().includes(searchTerm) ||
      app.registry?.toLowerCase().includes(searchTerm) ||
      app.assignedCountyRegistrar?.toLowerCase().includes(searchTerm) ||
      app.assignedRegistryRegistrar?.toLowerCase().includes(searchTerm) ||
      app.assignedRegistrar?.toLowerCase().includes(searchTerm) ||
      false
    );
  }

  filterByStatus(status: ApplicationStatus): void {
    this.currentTab = status;

    let filtered = this.applications;

    if (status === 'unassigned' || status === 'ongoing' || status === 'completed') {
      filtered = this.applications.filter(app => app.status === status);
    }

    if (status === 'county' || status === 'registry') {
      filtered = this.applyHierarchicalFilters(filtered);
    }

    this.filteredApplications = filtered;
    this.tableSearchValue = '';
  }

  private applyHierarchicalFilters(applications: Application[]): Application[] {
    let filtered = applications;

    if (this.currentCounty !== 'all') {
      filtered = filtered.filter(app => app.county === this.currentCounty);
    }

    if (this.currentRegistry !== 'all' && this.currentCounty !== 'all') {
      filtered = filtered.filter(app => app.registry === this.currentRegistry);
    }

    return filtered;
  }

  filterByCounty(countyName: string): void {
    this.currentCounty = countyName;
    this.currentRegistry = 'all';
    this.updateAvailableRegistries();
    this.filterByStatus(this.currentTab);
  }

  filterByRegistry(registryName: string): void {
    this.currentRegistry = registryName;
    this.filterByStatus(this.currentTab);
  }

  updateAvailableRegistries(): void {
    if (this.currentCounty === 'all') {
      this.availableRegistries = [];
    } else {
      const selectedCounty = this.counties.find(c => c.name === this.currentCounty);
      this.availableRegistries = selectedCounty ? selectedCounty.registries : [];
    }
  }

  // ========== COUNT AND DISPLAY METHODS ==========

  getStatusCount(status: ApplicationStatus): number {
    let applications = this.applications;

    if (status === 'county' || status === 'registry') {
      applications = this.applyHierarchicalFilters(applications);
    }

    switch (status) {
      case 'unassigned':
        return applications.filter(app => app.status === 'unassigned').length;
      case 'ongoing':
        return applications.filter(app => app.status === 'ongoing').length;
      case 'completed':
        return applications.filter(app => app.status === 'completed').length;
      case 'county':
        return applications.filter(app => app.assignedCountyRegistrar).length;
      case 'registry':
        return applications.filter(app => app.assignedRegistryRegistrar).length;
      default:
        return applications.length;
    }
  }

  getCountyCount(countyName: string): number {
    if (countyName === 'all') return this.applications.length;
    return this.applications.filter(app => app.county === countyName).length;
  }

  getRegistryCount(registryName: string): number {
    if (registryName === 'all') {
      return this.currentCounty === 'all'
        ? this.applications.length
        : this.applications.filter(app => app.county === this.currentCounty).length;
    }
    return this.applications.filter(app => app.registry === registryName).length;
  }

  getStatusDisplay(status: ApplicationStatus): string {
    switch (status) {
      case 'unassigned':
        return 'Unassigned Applications';
      case 'ongoing':
        return 'Ongoing Applications';
      case 'completed':
        return 'Completed Applications';
      case 'county':
        return this.currentCounty === 'all'
          ? 'All County Applications'
          : `${this.currentCounty} County Applications`;
      case 'registry':
        return this.getRegistryDisplayText();
      default:
        return 'Applications';
    }
  }

  private getRegistryDisplayText(): string {
    if (this.currentCounty === 'all') return 'All Registry Applications';
    if (this.currentRegistry === 'all') return `${this.currentCounty} Registry Applications`;
    return `${this.currentRegistry} Applications`;
  }

  // ========== PERMISSION AND UTILITY METHODS ==========

  canAssignCountyRegistrar(application: Application): boolean {
    return this.currentUserRole === 'admin' &&
           application.status === 'unassigned' &&
           !application.assignedCountyRegistrar;
  }

  canAssignRegistryRegistrar(application: Application): boolean {
    return (this.currentUserRole === 'admin' ||
           (this.currentUserRole === 'county_registrar' &&
            application.assignedCountyRegistrar === this.currentUserName)) &&
           application.status === 'ongoing' &&
           !application.assignedRegistryRegistrar;
  }

  canAssignRegistrar(application: Application): boolean {
    return (this.currentUserRole === 'admin' ||
           (this.currentUserRole === 'registry_registrar' &&
            application.assignedRegistryRegistrar === this.currentUserName)) &&
           application.status === 'ongoing' &&
           !application.assignedRegistrar;
  }

  getCountyRegistrars(): string[] {
    return this.counties.map(county => county.countyRegistrar)
                       .filter((name, index, self) => name && self.indexOf(name) === index) as string[];
  }

  getRegistryRegistrarsForCounty(countyName: string): string[] {
    const county = this.counties.find(c => c.name === countyName);
    if (!county) return [];

    return county.registries.map(registry => registry.registryRegistrar)
                           .filter(registrar => registrar !== undefined) as string[];
  }

  getRegistrarsForRegistry(registryName: string): string[] {
    for (const county of this.counties) {
      for (const registry of county.registries) {
        if (registry.name === registryName) {
          return registry.registrars;
        }
      }
    }
    return [];
  }

  setUserRole(role: UserRole, userName: string): void {
    this.currentUserRole = role;
    this.currentUserName = userName;
    console.log(`User role changed to: ${role}, User: ${userName}`);
    this.filterByStatus(this.currentTab);
  }

  clearSearch(): void {
    this.searchValue = '';
    this.tableSearchValue = '';
    this.currentCounty = 'all';
    this.currentRegistry = 'all';
    this.updateAvailableRegistries();
    this.filterByStatus(this.currentTab);
  }

  viewApplicationDetails(application: Application): void {
    console.log('Navigating to application details:', application.id);
    this.router.navigate(['/dashboard/registrar/application-details', application.id])
      .then(success => {
        console.log('Navigation successful:', success);
      })
      .catch(error => {
        console.error('Navigation error:', error);
      });
  }

  setTab(status: ApplicationStatus): void {
    this.filterByStatus(status);
  }

  getStatusColor(status: ApplicationStatus): string {
    switch (status) {
      case 'unassigned': return 'warning';
      case 'ongoing': return 'danger';
      case 'completed': return 'secondary';
      case 'county': return 'info';
      case 'registry': return 'primary';
      default: return 'primary';
    }
  }
}
