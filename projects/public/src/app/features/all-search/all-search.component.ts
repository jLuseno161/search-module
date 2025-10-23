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
    MatDivider
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

  allApplications: SearchApplication[] = [];
  dataSources: { [key: string]: MatTableDataSource<SearchApplication> } = {};

  constructor(private searchService: SearchService, private router: Router) { }

  ngOnInit() {
    this.tabs.forEach(tab => {
      this.dataSources[tab.status] = new MatTableDataSource<SearchApplication>([]);
    })

    this.searchService.getApplications().subscribe(
      {
        next: (response: any) => {
          this.allApplications = response.results;
          this.loadTabData('pending');
        },
        error: (error: any) => {
          console.log('No Data Fetched:', error);
        }
      });
  }

  onTabChange(event: any) {
    const selectedTab = this.tabs[event.index];
    this.loadTabData(selectedTab.status);
  }

  loadTabData(status: string) {
    const filteredData = this.allApplications.filter(app => app.status === status);
    this.dataSources[status].data = filteredData;
  }

  getDataSource(status: string): MatTableDataSource<SearchApplication> {
    if (!this.dataSources[status]) {
      this.dataSources[status] = new MatTableDataSource<SearchApplication>([]);
    }
    return this.dataSources[status];
  }

  getBadgeCount(status: string): number {
    return this.allApplications?.filter(app => app.status === status).length;
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

  viewApplication(appId: string, status: string) {
    console.log(`Navigating to ${status} application: ${appId}`);
    this.router.navigate([`${status}`, appId]);
  }
}