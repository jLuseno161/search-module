// import { Component, OnInit } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { Router } from '@angular/router';

// // Import the same interfaces from your admin component
// export interface Application {
//   id: number;
//   referenceNo: string;
//   parcelNo: string;
//   dateSubmitted: string;
//   timeElapsed: string;
//   status: 'unassigned' | 'assigned_to_county' | 'assigned_to_registry' | 'assigned_to_registrar' | 'completed';
//   applicantName?: string;
//   applicantEmail?: string;
//   applicantPhone?: string;
//   county: string;
//   registry: string;
//   assignedChiefCountyRegistrar?: string;
//   assignedChiefRegistryRegistrar?: string;
//   assignedRegistrar?: string;
//   location?: string;
//   area?: string;
//   purpose?: string;
//   documents?: string[];
//   currentStage?: string;
//   nextStage?: string;
//   estimatedCompletion?: string;
//   notes?: string;
// }

// export interface County {
//   id: number;
//   name: string;
//   code: string;
//   chiefCountyRegistrar: string;
//   registries: Registry[];
// }

// export interface Registry {
//   id: number;
//   name: string;
//   code: string;
//   countyId: number;
//   chiefRegistryRegistrar: string;
//   availableRegistrars: string[];
// }

// @Component({
//   selector: 'app-chief-county-registrar',
//   standalone: true,
//   imports: [CommonModule, FormsModule],
//   templateUrl: './chief-county-registrar.html',
//   styleUrls: ['./chief-county-registrar.css']
// })
// export class ChiefCountyRegistrar implements OnInit {
//   // Current logged-in chief county registrar (in real app, this would come from auth service)
//   currentChiefCountyRegistrar: string = 'John Maina'; // Nairobi Chief County Registrar
//   currentCounty: string = 'Nairobi';

//   // Sample data - in real app, this would come from a service
//   counties: County[] = [
//     {
//       id: 1,
//       name: 'Nairobi',
//       code: '047',
//       chiefCountyRegistrar: 'John Maina',
//       registries: [
//         {
//           id: 1,
//           name: 'Nairobi Central',
//           code: 'NBI-CENT',
//           countyId: 1,
//           chiefRegistryRegistrar: 'Mary Wanjiku',
//           availableRegistrars: ['David Kimani', 'Sarah Otieno', 'Mike Omondi']
//         },
//         {
//           id: 2,
//           name: 'Nairobi East',
//           code: 'NBI-EAST',
//           countyId: 1,
//           chiefRegistryRegistrar: 'James Kariuki',
//           availableRegistrars: ['Grace Mwende', 'Peter Ndungu', 'Lucy Akinyi']
//         },
//         {
//           id: 3,
//           name: 'Westlands',
//           code: 'NBI-WEST',
//           countyId: 1,
//           chiefRegistryRegistrar: 'Alice Njeri',
//           availableRegistrars: ['Michael Ochieng', 'Lucy Akinyi']
//         }
//       ]
//     },
//     {
//       id: 2,
//       name: 'Mombasa',
//       code: '001',
//       chiefCountyRegistrar: 'Ahmed Hassan',
//       registries: [
//         {
//           id: 4,
//           name: 'Mombasa Central',
//           code: 'MBA-CENT',
//           countyId: 2,
//           chiefRegistryRegistrar: 'Fatima Ali',
//           availableRegistrars: ['Omar Said', 'Aisha Mohammed']
//         }
//       ]
//     }
//   ];

//   // Applications data - only applications assigned to this chief county registrar
//   allApplications: Application[] = [
//     {
//       id: 1,
//       referenceNo: 'REG/SRCH/NO6NJXZE7G',
//       parcelNo: 'NAIROBI/BLOCK82/2190',
//       dateSubmitted: 'Sep 17, 2025',
//       timeElapsed: '19 days',
//       status: 'assigned_to_county',
//       applicantName: 'John Kamau',
//       county: 'Nairobi',
//       registry: 'Nairobi Central',
//       assignedChiefCountyRegistrar: 'John Maina' // Assigned to Nairobi Chief
//     },
//     {
//       id: 2,
//       referenceNo: 'REG/SRCH/RQEI6BSV83',
//       parcelNo: 'NAIROBI/BLOCK45/1234',
//       dateSubmitted: 'Jul 22, 2025',
//       timeElapsed: '2 months',
//       status: 'assigned_to_county',
//       applicantName: 'Mary Wanjiku',
//       county: 'Nairobi',
//       registry: 'Nairobi East',
//       assignedChiefCountyRegistrar: 'John Maina' // Assigned to Nairobi Chief
//     },
//     {
//       id: 3,
//       referenceNo: 'REG/SRCH/MWE06GL2YN',
//       parcelNo: 'MOMBASA/BLOCK12/5678',
//       dateSubmitted: 'May 27, 2025',
//       timeElapsed: '4 months',
//       status: 'assigned_to_county',
//       applicantName: 'Ahmed Hassan',
//       county: 'Mombasa',
//       registry: 'Mombasa Central',
//       assignedChiefCountyRegistrar: 'Ahmed Hassan' // Assigned to Mombasa Chief
//     },
//     {
//       id: 4,
//       referenceNo: 'REG/SRCH/LN1456GORU',
//       parcelNo: 'NAIROBI/BLOCK23/9876',
//       dateSubmitted: 'Apr 28, 2025',
//       timeElapsed: '5 months',
//       status: 'assigned_to_registry',
//       applicantName: 'James Omondi',
//       county: 'Nairobi',
//       registry: 'Westlands',
//       assignedChiefCountyRegistrar: 'John Maina',
//       assignedChiefRegistryRegistrar: 'Alice Njeri'
//     }
//   ];

//   // Filtered applications - only those assigned to current chief county registrar
//   applications: Application[] = [];
//   filteredApplications: Application[] = [];

//   // Search and filter properties
//   searchValue: string = '';
//   selectedRegistry: string = 'all';
//   selectedStatus: string = 'all';

//   // Available registries for the current county
//   availableRegistries: Registry[] = [];

//   constructor(private router: Router) {}

//   ngOnInit(): void {
//     this.loadApplicationsForCurrentChief();
//     this.loadAvailableRegistries();
//   }

//   // Load only applications assigned to the current chief county registrar
//   private loadApplicationsForCurrentChief(): void {
//     this.applications = this.allApplications.filter(app =>
//       app.assignedChiefCountyRegistrar === this.currentChiefCountyRegistrar &&
//       app.county === this.currentCounty
//     );
//     this.filteredApplications = [...this.applications];
//   }

//   // Load registries available in the current county
//   private loadAvailableRegistries(): void {
//     const currentCounty = this.counties.find(c => c.name === this.currentCounty);
//     this.availableRegistries = currentCounty ? currentCounty.registries : [];
//   }

//   // Get chief registry registrars for the current county
//   getChiefRegistryRegistrars(): string[] {
//     return this.availableRegistries.map(registry => registry.chiefRegistryRegistrar)
//                                   .filter((name, index, self) => self.indexOf(name) === index);
//   }

//   // Assign application to chief registry registrar
//   assignToChiefRegistryRegistrar(applicationId: number, chiefRegistryRegistrar: string): void {
//     if (!chiefRegistryRegistrar || chiefRegistryRegistrar === '') return;

//     const application = this.applications.find(app => app.id === applicationId);
//     if (application) {
//       application.assignedChiefRegistryRegistrar = chiefRegistryRegistrar;
//       application.status = 'assigned_to_registry';

//       console.log(`Assigned application ${applicationId} to chief registry registrar: ${chiefRegistryRegistrar}`);
//       alert(`Application assigned to Chief Registry Registrar ${chiefRegistryRegistrar}`);

//       this.applyFilters(); // Refresh the view
//     }
//   }

//   // Search applications
//   onSearch(): void {
//     this.applyFilters();
//   }

//   // Apply all filters
//   applyFilters(): void {
//     let filtered = this.applications;

//     // Apply search filter
//     if (this.searchValue.trim()) {
//       const searchTerm = this.searchValue.toLowerCase().trim();
//       filtered = filtered.filter(app =>
//         app.referenceNo.toLowerCase().includes(searchTerm) ||
//         app.parcelNo.toLowerCase().includes(searchTerm) ||
//         app.applicantName?.toLowerCase().includes(searchTerm) ||
//         app.registry?.toLowerCase().includes(searchTerm) ||
//         false
//       );
//     }

//     // Apply registry filter
//     if (this.selectedRegistry !== 'all') {
//       filtered = filtered.filter(app => app.registry === this.selectedRegistry);
//     }

//     // Apply status filter
//     if (this.selectedStatus !== 'all') {
//       filtered = filtered.filter(app => app.status === this.selectedStatus);
//     }

//     this.filteredApplications = filtered;
//   }

//   // Clear all filters
//   clearFilters(): void {
//     this.searchValue = '';
//     this.selectedRegistry = 'all';
//     this.selectedStatus = 'all';
//     this.filteredApplications = [...this.applications];
//   }

//   // Get count by status
//   getStatusCount(status: string): number {
//     if (status === 'all') return this.applications.length;
//     return this.applications.filter(app => app.status === status).length;
//   }

//   // Get display text for status
//   getStatusDisplay(status: string): string {
//     const statusMap: { [key: string]: string } = {
//       'assigned_to_county': 'Pending Registry Assignment',
//       'assigned_to_registry': 'Assigned to Registry Chief',
//       'assigned_to_registrar': 'Assigned to Registrar',
//       'completed': 'Completed'
//     };
//     return statusMap[status] || status;
//   }

//   // Get status color
//   getStatusColor(status: string): string {
//     const colorMap: { [key: string]: string } = {
//       'assigned_to_county': 'warning',
//       'assigned_to_registry': 'info',
//       'assigned_to_registrar': 'success',
//       'completed': 'secondary'
//     };
//     return colorMap[status] || 'primary';
//   }

//   // Check if application can be assigned (only assigned_to_county status)
//   canAssignToRegistryChief(application: Application): boolean {
//     return application.status === 'assigned_to_county' && !application.assignedChiefRegistryRegistrar;
//   }

//   // View application details
//   viewApplicationDetails(application: Application): void {
//     console.log('Viewing application details:', application.id);
//     // Navigate to details page
//     this.router.navigate(['/dashboard/chief-county-registrar/application-details', application.id]);
//   }
// }
