import { Component, OnInit  } from '@angular/core';
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

// ✅ ADD MISSING Application interface
export interface Application {
  id: number;
  referenceNo: string;
  parcelNo: string;
  dateSubmitted: string;
  timeElapsed: string;
  status: 'ongoing' | 'completed';
  applicantName?: string;
  applicantEmail?: string;
  applicantPhone?: string;
  county?: string;
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
type SearchType = 'invoice' | 'parcel' | 'county' | 'document' | 'receipt';
type ApplicationStatus = 'ongoing' | 'completed';

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
    MatTableModule, // ✅ ADD THIS MISSING IMPORT
  ],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class Dashboard {
  // Search form properties
  selectedSearchType: SearchType = 'invoice';
  inputLabel: string = 'Enter Invoice Number';
  inputPlaceholder: string = 'Enter Invoice Number';
  searchValue: string = '';

  // Table search property
  tableSearchValue: string = '';

  // Table columns - ✅ ADD THIS PROPERTY
  displayedColumns: string[] = ['referenceNo', 'parcelNo', 'dateSubmitted', 'timeElapsed', 'actions'];

  // Configuration for search types
  searchConfig: Record<SearchType, { label: string; placeholder: string }> = {
    invoice: { label: 'Enter Invoice Number', placeholder: 'Enter Invoice Number' },
    parcel: { label: 'Enter Parcel Number', placeholder: 'Enter Parcel Number' },
    county: { label: 'Enter County', placeholder: 'Enter County' },
    document: { label: 'Enter Document Number', placeholder: 'Enter Document Number' },
    receipt: { label: 'Enter Receipt Number', placeholder: 'Enter Receipt Number' }
  };

  // Sample data with more details
  applications: Application[] = [
    {
      id: 1,
      referenceNo: 'REG/SRCH/NO6NJXZE7G',
      parcelNo: 'NAIROBI/BLOCK82/210',
      dateSubmitted: 'Sep 17, 2025',
      timeElapsed: '19 days',
      status: 'ongoing',
      applicantName: 'John Kamau',
      applicantEmail: 'john.kamau@email.com',
      applicantPhone: '+254712345678',
      county: 'Nairobi',
      location: 'Westlands',
      area: '0.5 acres',
      purpose: 'Residential Development',
      documents: ['Survey Report', 'Title Deed', 'ID Copy'],
      currentStage: 'Document Verification',
      nextStage: 'Site Inspection',
      estimatedCompletion: 'Nov 30, 2025',
      notes: 'Application is pending site inspection scheduling.'
    },
    {
      id: 2,
      referenceNo: 'REG/SRCH/RQEI6BSV83',
      parcelNo: 'NAIROBI/BLOCK45/1234',
      dateSubmitted: 'Jul 22, 2025',
      timeElapsed: '2 months',
      status: 'ongoing',
      applicantName: 'Mary Wanjiku',
      applicantEmail: 'mary.w@email.com',
      applicantPhone: '+254723456789',
      county: 'Nairobi',
      location: 'Karen',
      area: '2.0 acres',
      purpose: 'Commercial Building',
      documents: ['Title Deed', 'Business Permit', 'Architectural Plans'],
      currentStage: 'Approval Pending',
      nextStage: 'Final Approval',
      estimatedCompletion: 'Oct 15, 2025',
      notes: 'Waiting for environmental impact assessment.'
    },
    {
      id: 3,
      referenceNo: 'REG/SRCH/MWE06GL2YN',
      parcelNo: 'MOMBASA/BLOCK12/5678',
      dateSubmitted: 'May 27, 2025',
      timeElapsed: '4 months',
      status: 'ongoing',
      applicantName: 'Ahmed Hassan',
      applicantEmail: 'ahmed.h@email.com',
      applicantPhone: '+254734567890',
      county: 'Mombasa',
      location: 'Nyali',
      area: '1.5 acres',
      purpose: 'Hotel Construction',
      documents: ['Title Deed', 'Construction Permit', 'Environmental Certificate'],
      currentStage: 'Final Review',
      nextStage: 'Approval',
      estimatedCompletion: 'Aug 30, 2025',
      notes: 'All documents submitted and under final review.'
    },
    {
      id: 4,
      referenceNo: 'REG/SRCH/LN1456GORU',
      parcelNo: 'NAIROBI/BLOCK23/9876',
      dateSubmitted: 'Apr 28, 2025',
      timeElapsed: '5 months',
      status: 'completed',
      applicantName: 'James Omondi',
      applicantEmail: 'james.o@email.com',
      applicantPhone: '+254745678901',
      county: 'Nairobi',
      location: 'Embakasi',
      area: '0.25 acres',
      purpose: 'Residential Plot',
      documents: ['Title Deed', 'ID Copy', 'Payment Receipt'],
      currentStage: 'Completed',
      nextStage: 'N/A',
      estimatedCompletion: 'Jun 15, 2025',
      notes: 'Application successfully processed and approved.'
    },
    {
      id: 5,
      referenceNo: 'REG/SRCH/OZO2YKWBLL',
      parcelNo: 'KISUMU/BLOCK34/5432',
      dateSubmitted: 'Apr 17, 2025',
      timeElapsed: '6 months',
      status: 'completed',
      applicantName: 'Sarah Atieno',
      applicantEmail: 'sarah.a@email.com',
      applicantPhone: '+254756789012',
      county: 'Kisumu',
      location: 'Milimani',
      area: '3.0 acres',
      purpose: 'Agricultural Land',
      documents: ['Title Deed', 'Land Use Plan', 'Agricultural Permit'],
      currentStage: 'Completed',
      nextStage: 'N/A',
      estimatedCompletion: 'May 30, 2025',
      notes: 'Land registration completed successfully.'
    }
  ];

  // Filtered data
  filteredApplications: Application[] = [...this.applications];
  currentTab: ApplicationStatus = 'ongoing';

  constructor(private router: Router) {
    this.filterByStatus('ongoing');
  }

  // Method to handle search type change
  onSearchTypeChange(): void {
    const config = this.searchConfig[this.selectedSearchType];
    if (config) {
      this.inputLabel = config.label;
      this.inputPlaceholder = config.placeholder;
    }
  }

  // Main search function
  onSearch(): void {
    if (!this.searchValue.trim()) {
      alert('Please enter a search value');
      return;
    }

    const searchTerm = this.searchValue.toLowerCase().trim();

    // Filter based on selected search type
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
        default:
          return true;
      }
    });

    // Apply status filter on top of search
    filtered = filtered.filter(app => app.status === this.currentTab);
    this.filteredApplications = filtered;

    console.log(`Search completed: Found ${filtered.length} results for "${this.searchValue}"`);
  }

  // Table search function (searches within the table)
  onTableSearch(): void {
    const searchTerm = this.tableSearchValue.toLowerCase().trim();

    if (!searchTerm) {
      this.filterByStatus(this.currentTab);
      return;
    }

    this.filteredApplications = this.applications.filter(app =>
      app.status === this.currentTab && (
        app.referenceNo.toLowerCase().includes(searchTerm) ||
        app.parcelNo.toLowerCase().includes(searchTerm) ||
        app.dateSubmitted.toLowerCase().includes(searchTerm) ||
        app.timeElapsed.toLowerCase().includes(searchTerm) ||
        app.applicantName?.toLowerCase().includes(searchTerm) ||
        app.county?.toLowerCase().includes(searchTerm) ||
        false
      )
    );
  }

  // Filter by status (ongoing/completed)
  filterByStatus(status: ApplicationStatus): void {
    this.currentTab = status;
    this.filteredApplications = this.applications.filter(app => app.status === status);
    this.tableSearchValue = ''; // Clear table search when switching tabs
  }

  // Clear search
  clearSearch(): void {
    this.searchValue = '';
    this.tableSearchValue = '';
    this.filterByStatus(this.currentTab);
  }

  // Get badge count for tabs
  getStatusCount(status: ApplicationStatus): number {
    return this.applications.filter(app => app.status === status).length;
  }

  // In dashboard.component.ts - change the method name
 viewApplicationDetails(application: Application): void {
    console.log('Navigating to application details:', application.id);

    // Simple alert to test
    alert(`Navigating to: ${application.referenceNo}`);

    // Navigate to details page
    this.router.navigate(['/dashboard/registrar/application-details', application.id])
      .then(success => {
        console.log('Navigation successful:', success);
      })
      .catch(error => {
        console.error('Navigation error:', error);
      });
  }
  // Remove duplicate methods - keep only one navigation method
  setTab(status: ApplicationStatus): void {
    this.filterByStatus(status);
  }

  // Get status color for badges
  getStatusColor(status: ApplicationStatus): string {
    return status === 'ongoing' ? 'accent' : 'primary';
  }

  // Get status display text
  getStatusDisplay(status: ApplicationStatus): string {
    return status === 'ongoing' ? 'Ongoing Applications' : 'Completed Applications';
  }
}
