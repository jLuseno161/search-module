import { Component } from '@angular/core';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatFormField } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { SearchApplication } from '../../interfaces/search';
import { CommonModule } from '@angular/common';
import { MatInput } from '@angular/material/input';
import { MatBadgeModule } from '@angular/material/badge';
import { SearchService } from '../../services/search.service';
import { MatDivider } from "@angular/material/divider";
import { Router } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-all-search',
  standalone: true,
  imports: [
    MatTabsModule,
    MatCard,
    MatIcon,
    MatPaginator,
    MatFormField,
    MatCardContent,
    MatTableModule,
    CommonModule,
    MatInput,
    MatBadgeModule,
    MatDivider,
    MatProgressSpinnerModule,
    MatButtonModule
  ],
  templateUrl: './all-search.component.html',
  styleUrl: './all-search.component.scss'
})
export class AllSearchComponent {

  tabs = [
    { label: 'Pending', status: 'pending' },
    { label: 'Submitted', status: 'submitted' },
    { label: 'Completed', status: 'completed' },
    { label: 'Rejected', status: 'rejected' }
  ];

  displayedColumns: string[] = ['id', 'reference_number', 'date_created', 'elapsed', 'status', 'actions'];
  dataSources: { [key: string]: MatTableDataSource<SearchApplication> } = {};
  loadingStates: { [status: string]: boolean } = {};

  constructor(private searchService: SearchService, private router: Router) { }
  ngOnInit() {
    this.tabs.forEach(tab => {
      this.dataSources[tab.status] = new MatTableDataSource<SearchApplication>([]);
      this.loadingStates[tab.status] = false; // Initialize loading states
    });

    this.tabs.forEach(tab => {
      this.loadTabData(tab.status);
    });
  }

  onTabChange(event: { index: number }) {
    const selectedTab = this.tabs[event.index];
    this.loadTabData(selectedTab.status);
  }

  loadTabData(status: string) {
    this.loadingStates[status] = true;

    this.searchService.getApplications(status).subscribe({
      next: (response: any) => {
        this.dataSources[status].data = response.results;
        this.loadingStates[status] = false;
      },
      error: (error: any) => {
        console.log(error);
        this.loadingStates[status] = false;
      }
    });
  }

  // Checks loading state
  isLoading(status: string): boolean {
    return this.loadingStates[status];
  }

  getDataSource(status: string) {
    return this.dataSources[status];
  }

  getBadgeCount(status: string): number {
    return this.dataSources[status]?.data?.length || 0;
  }

  timeElapsed(date: string): string {
    const diff = Date.now() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);

    if (years > 0) return `${years} year${years > 1 ? 's' : ''} ago`;
    if (months > 0) return `${months} month${months > 1 ? 's' : ''} ago`;
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
  }

  createNewApplication() {
    this.router.navigate(['/new-application']);
  }

  viewApplication(application: any) {
    this.router.navigate(['search-application', application.status, application.id], {
      state: { applicationData: application },
    });
  }
}