// import { Component, OnInit } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { Router } from '@angular/router';
// import { ApplicationService } from '../../services/application.service';
// import { AuthService } from '../../auth/auth.service';
// import { Application } from '../../shared/interfaces/application';

// @Component({
//   selector: 'app-previous-works',
//   standalone: true,
//   imports: [CommonModule],
//   templateUrl: './previous-works.component.html',
//   styleUrls: ['./previous-works.component.css']
// })
// export class PreviousWorksComponent implements OnInit {
//   applications: Application[] = [];
//   isLoading: boolean = true;
//   error: string = '';
//   currentUserRole: string = '';
//   currentUserName: string = '';

//   constructor(
//     private applicationService: ApplicationService,
//     private authService: AuthService,
//     public router: Router
//   ) {}

//   ngOnInit(): void {
//     this.currentUserRole = this.authService.getCurrentUserRole();
//     this.currentUserName = this.authService.getCurrentUserName();
//     this.loadPreviousWorks();
//   }

//   loadPreviousWorks(): void {
//     this.isLoading = true;
//     this.error = '';

//     if (this.currentUserRole === 'is_registrar') {
//       this.applicationService.getRegistrarAssignedApplications().subscribe({
//         next: (response: any) => {
//           console.log('📦 Previous works response:', response);

//           let applicationsArray = [];
//           if (Array.isArray(response)) {
//             applicationsArray = response;
//           } else if (response && response.results && Array.isArray(response.results)) {
//             applicationsArray = response.results;
//           }

//           // Filter only completed applications
//           this.applications = applicationsArray.filter((app: any) =>
//             app.status === 'completed' || app.status === 'verified'
//           );

//           this.isLoading = false;
//           console.log('✅ Previous works loaded:', this.applications.length);
//         },
//         error: (error: any) => {
//           console.error('❌ Error loading previous works:', error);
//           this.error = 'Failed to load previous works. Please try again.';
//           this.isLoading = false;
//         }
//       });
//     } else if (this.currentUserRole === 'is_registrar_in_charge') {
//       this.applicationService.getRegistrarInChargeApplications().subscribe({
//         next: (response: any) => {
//           console.log('📦 Previous works response (Registrar In Charge):', response);

//           let applicationsArray = [];
//           if (Array.isArray(response)) {
//             applicationsArray = response;
//           } else if (response && response.results && Array.isArray(response.results)) {
//             applicationsArray = response.results;
//           }

//           // Filter only completed applications
//           this.applications = applicationsArray.filter((app: any) =>
//             app.status === 'completed' || app.status === 'verified'
//           );

//           this.isLoading = false;
//           console.log('✅ Previous works loaded:', this.applications.length);
//         },
//         error: (error: any) => {
//           console.error('❌ Error loading previous works:', error);
//           this.error = 'Failed to load previous works. Please try again.';
//           this.isLoading = false;
//         }
//       });
//     } else {
//       this.error = 'Unauthorized access';
//       this.isLoading = false;
//     }
//   }

//   viewApplicationDetails(application: Application): void {
//     this.router.navigate(['/application-details', application.id]);
//   }

//   downloadCertificate(application: Application): void {
//     const certificateFile = application.certificate?.signed_file;
//     if (certificateFile) {
//       const link = document.createElement('a');
//       link.href = certificateFile;
//       const referenceNo = application.referenceNo || application.reference_number || 'unknown';
//       link.download = `certificate-${referenceNo}.pdf`;
//       link.target = '_blank';
//       document.body.appendChild(link);
//       link.click();
//       document.body.removeChild(link);
//     } else {
//       alert('No certificate available for download');
//     }
//   }

//   // NEW METHOD: View supporting document
//   viewSupportingDocument(application: Application): void {
//     // Check if supporting document exists in the application data
//     // The field name might be 'supporting_document', 'registration_document', or similar
//     const supportingDoc = (application as any).supporting_document ||
//                           (application as any).registration_document ||
//                           (application as any).supportingDoc;

//     if (supportingDoc) {
//       const link = document.createElement('a');
//       link.href = supportingDoc;
//       link.target = '_blank';
//       document.body.appendChild(link);
//       link.click();
//       document.body.removeChild(link);
//     } else {
//       alert('No supporting document available for this application');
//     }
//   }

//   // Alternative: If you need to fetch supporting document from API
//   fetchSupportingDocument(application: Application): void {
//     this.isLoading = true;
//     // Assuming you have an endpoint to get supporting documents
//     this.applicationService.getSupportingDocument(application.id).subscribe({
//       next: (response: any) => {
//         if (response && response.document_url) {
//           const link = document.createElement('a');
//           link.href = response.document_url;
//           link.target = '_blank';
//           document.body.appendChild(link);
//           link.click();
//           document.body.removeChild(link);
//         } else {
//           alert('No supporting document found');
//         }
//         this.isLoading = false;
//       },
//       error: (error) => {
//         console.error('Error fetching supporting document:', error);
//         alert('Failed to load supporting document');
//         this.isLoading = false;
//       }
//     });
//   }

//   formatDate(dateString: string | null | undefined): string {
//     if (!dateString) return 'N/A';
//     try {
//       const date = new Date(dateString);
//       return date.toLocaleDateString('en-US', {
//         year: 'numeric',
//         month: 'short',
//         day: 'numeric'
//       });
//     } catch {
//       return 'Invalid date';
//     }
//   }
// }
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';  // Add this import
import { ApplicationService } from '../../services/application.service';
import { AuthService } from '../../auth/auth.service';
import { Application } from '../../shared/interfaces/application';

@Component({
  selector: 'app-previous-works',
  standalone: true,
  imports: [CommonModule, FormsModule],  // Add FormsModule here
  templateUrl: './previous-works.component.html',
  styleUrls: ['./previous-works.component.css']
})
export class PreviousWorksComponent implements OnInit {
  applications: Application[] = [];
  filteredApplications: Application[] = [];  
  isLoading: boolean = true;
  error: string = '';
  currentUserRole: string = '';
  currentUserName: string = '';

  // Search properties
  searchTerm: string = '';
  selectedSearchType: string = 'reference';  // Default search type
  searchTypes = [
    { value: 'reference', label: 'Reference Number' },
    { value: 'parcel', label: 'Parcel Number' },
    { value: 'applicant', label: 'Applicant Name' },
    { value: 'status', label: 'Status' }
  ];

  constructor(
    private applicationService: ApplicationService,
    private authService: AuthService,
    public router: Router
  ) {}

  ngOnInit(): void {
    this.currentUserRole = this.authService.getCurrentUserRole();
    this.currentUserName = this.authService.getCurrentUserName();
    this.loadPreviousWorks();
  }

  loadPreviousWorks(): void {
    this.isLoading = true;
    this.error = '';

    if (this.currentUserRole === 'is_registrar') {
      this.applicationService.getRegistrarAssignedApplications().subscribe({
        next: (response: any) => {
          console.log('📦 Previous works response:', response);

          let applicationsArray = [];
          if (Array.isArray(response)) {
            applicationsArray = response;
          } else if (response && response.results && Array.isArray(response.results)) {
            applicationsArray = response.results;
          }

          // Filter only completed applications
          this.applications = applicationsArray.filter((app: any) =>
            app.status === 'completed' || app.status === 'verified'
          );

          this.filteredApplications = [...this.applications];  // Initialize filtered list
          this.isLoading = false;
          console.log('✅ Previous works loaded:', this.applications.length);
        },
        error: (error: any) => {
          console.error('❌ Error loading previous works:', error);
          this.error = 'Failed to load previous works. Please try again.';
          this.isLoading = false;
        }
      });
    } else if (this.currentUserRole === 'is_registrar_in_charge') {
      this.applicationService.getRegistrarInChargeApplications().subscribe({
        next: (response: any) => {
          console.log('📦 Previous works response (Registrar In Charge):', response);

          let applicationsArray = [];
          if (Array.isArray(response)) {
            applicationsArray = response;
          } else if (response && response.results && Array.isArray(response.results)) {
            applicationsArray = response.results;
          }

          // Filter only completed applications
          this.applications = applicationsArray.filter((app: any) =>
            app.status === 'completed' || app.status === 'verified'
          );

          this.filteredApplications = [...this.applications];  // Initialize filtered list
          this.isLoading = false;
          console.log('✅ Previous works loaded:', this.applications.length);
        },
        error: (error: any) => {
          console.error('❌ Error loading previous works:', error);
          this.error = 'Failed to load previous works. Please try again.';
          this.isLoading = false;
        }
      });
    } else {
      this.error = 'Unauthorized access';
      this.isLoading = false;
    }
  }

  // Search method
  onSearch(): void {
    if (!this.searchTerm.trim()) {
      // If search term is empty, show all applications
      this.filteredApplications = [...this.applications];
      return;
    }

    const searchTermLower = this.searchTerm.toLowerCase().trim();

    this.filteredApplications = this.applications.filter(app => {
      switch (this.selectedSearchType) {
        case 'reference':
          const referenceNo = (app.referenceNo || app.reference_number || '').toLowerCase();
          return referenceNo.includes(searchTermLower);

        case 'parcel':
          const parcelNo = (app.parcelNo || app.parcel_number || '').toLowerCase();
          return parcelNo.includes(searchTermLower);

        case 'applicant':
          const applicantName = (app.applicantName || '').toLowerCase();
          return applicantName.includes(searchTermLower);

        case 'status':
          const status = (app.status || '').toLowerCase();
          return status.includes(searchTermLower);

        default:
          return true;
      }
    });

    console.log(`🔍 Search completed: Found ${this.filteredApplications.length} results for "${this.searchTerm}"`);
  }

  // Clear search
  clearSearch(): void {
    this.searchTerm = '';
    this.filteredApplications = [...this.applications];
  }

  viewApplicationDetails(application: Application): void {
    this.router.navigate(['/application-details', application.id]);
  }

  downloadCertificate(application: Application): void {
    const certificateFile = application.certificate?.signed_file;
    if (certificateFile) {
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

  viewSupportingDocument(application: Application): void {
    const supportingDoc = (application as any).supporting_document ||
                          (application as any).registration_document ||
                          (application as any).supportingDoc;

    if (supportingDoc) {
      const link = document.createElement('a');
      link.href = supportingDoc;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      alert('No supporting document available for this application');
    }
  }

  formatDate(dateString: string | null | undefined): string {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Invalid date';
    }
  }
}
