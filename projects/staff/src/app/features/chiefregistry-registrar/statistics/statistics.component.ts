// In features/chiefregistry-registrar/statistics/statistics.component.ts
import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { StatisticsService, TimeRangeStats, RegistrarStats, DailyStats } from '../../../services/statistics.service';
import { Application, Registrar } from '../../../shared/interfaces/application';

type TimeRange = 'month' | '3months' | '6months' | 'year' | 'custom';

@Component({
  selector: 'app-statistics',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatSelectModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatIconModule,
    MatTooltipModule
  ],
  template: `
    <div class="statistics-container">
      <!-- Header -->
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h4 class="mb-0">
          <i class="bi bi-graph-up me-2"></i>Registry Statistics
        </h4>
        <button class="btn btn-outline-success btn-sm" (click)="exportToCSV()" [disabled]="isLoading">
          <i class="bi bi-download me-1"></i>Export Report
        </button>
      </div>

      <!-- Time Range Selector -->
      <div class="card mb-4">
        <div class="card-body">
          <div class="row g-3 align-items-end">
            <div class="col-md-3">
              <label class="form-label fw-semibold">Time Range</label>
              <select class="form-select" [(ngModel)]="selectedTimeRange" (change)="onTimeRangeChange()">
                <option value="month">Last Month</option>
                <option value="3months">Last 3 Months</option>
                <option value="6months">Last 6 Months</option>
                <option value="year">Last Year</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>
            <div class="col-md-3" *ngIf="selectedTimeRange === 'custom'">
              <label class="form-label fw-semibold">Start Date</label>
              <input type="date" class="form-control" [(ngModel)]="customStartDate" (change)="calculateStatistics()">
            </div>
            <div class="col-md-3" *ngIf="selectedTimeRange === 'custom'">
              <label class="form-label fw-semibold">End Date</label>
              <input type="date" class="form-control" [(ngModel)]="customEndDate" (change)="calculateStatistics()">
            </div>
            <div class="col-md-3">
              <button class="btn btn-primary w-100" (click)="calculateStatistics()" [disabled]="isLoading">
                <i class="bi bi-arrow-repeat me-1"></i>Refresh Stats
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="isLoading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p class="mt-2 text-muted">Calculating statistics...</p>
      </div>

      <!-- Statistics Content -->
      <div *ngIf="!isLoading && statistics">
        <!-- Summary Cards -->
        <div class="row mb-4">
          <div class="col-md-3">
            <div class="card bg-primary text-white">
              <div class="card-body">
                <div class="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 class="mb-1">Total Applications</h6>
                    <h3 class="mb-0">{{ statistics.total_applications | number }}</h3>
                  </div>
                  <i class="bi bi-files fs-1"></i>
                </div>
                <small class="text-white-50">{{ statistics.period }}</small>
              </div>
            </div>
          </div>
          <div class="col-md-3">
            <div class="card bg-success text-white">
              <div class="card-body">
                <div class="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 class="mb-1">Completed</h6>
                    <h3 class="mb-0">{{ statistics.completed | number }}</h3>
                  </div>
                  <i class="bi bi-check-circle fs-1"></i>
                </div>
                <small class="text-white-50">{{ getCompletionRate() }}% completion rate</small>
              </div>
            </div>
          </div>
          <div class="col-md-3">
            <div class="card bg-info text-white">
              <div class="card-body">
                <div class="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 class="mb-1">Verified</h6>
                    <h3 class="mb-0">{{ statistics.verified | number }}</h3>
                  </div>
                  <i class="bi bi-shield-check fs-1"></i>
                </div>
                <small class="text-white-50">{{ getVerificationRate() }}% verified</small>
              </div>
            </div>
          </div>
          <div class="col-md-3">
            <div class="card bg-warning text-dark">
              <div class="card-body">
                <div class="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 class="mb-1">Pending</h6>
                    <h3 class="mb-0">{{ statistics.pending | number }}</h3>
                  </div>
                  <i class="bi bi-clock-history fs-1"></i>
                </div>
                <small class="text-dark-50">Awaiting processing</small>
              </div>
            </div>
          </div>
        </div>

        <!-- Registrar Performance Table -->
        <div class="card mb-4" *ngIf="statistics.registrars.length > 0">
          <div class="card-header bg-light">
            <h5 class="mb-0">
              <i class="bi bi-people me-2"></i>Registrar Performance
            </h5>
          </div>
          <div class="card-body p-0">
            <div class="table-responsive">
              <table class="table table-hover mb-0">
                <thead class="table-light">
                  <tr>
                    <th>Registrar</th>
                    <th class="text-center">Assigned</th>
                    <th class="text-center">Searches</th>
                    <th class="text-center">Completed</th>
                    <th class="text-center">Verified</th>
                    <th class="text-center">Rejected</th>
                    <th class="text-center">Avg. Time (days)</th>
                    <th class="text-center">Completion Rate</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let registrar of statistics.registrars">
                    <td>
                      <strong>{{ registrar.registrar_name }}</strong>
                    </td>
                    <td class="text-center">{{ registrar.applications_assigned }}</td>
                    <td class="text-center">
                      <span class="badge bg-primary">{{ registrar.total_searches }}</span>
                    </td>
                    <td class="text-center">
                      <span class="badge bg-success">{{ registrar.completed_applications }}</span>
                    </td>
                    <td class="text-center">
                      <span class="badge bg-info">{{ registrar.verified_applications }}</span>
                    </td>
                    <td class="text-center">
                      <span class="badge bg-danger">{{ registrar.rejected_applications }}</span>
                    </td>
                    <td class="text-center">
                      <span class="badge bg-secondary">{{ registrar.average_processing_time | number:'1.1-1' }}</span>
                    </td>
                    <td class="text-center">
                      <div class="progress" style="height: 20px;">
                        <div class="progress-bar bg-success"
                             [style.width]="registrar.completion_rate + '%'"
                             role="progressbar"
                             [attr.aria-valuenow]="registrar.completion_rate"
                             aria-valuemin="0"
                             aria-valuemax="100">
                          {{ registrar.completion_rate | number:'1.0-0' }}%
                        </div>
                      </div>
                    </td>
                  </tr>
                </tbody>
                <tfoot class="table-light">
                  <tr>
                    <th>Total/Average</th>
                    <th class="text-center">{{ getTotalAssigned() }}</th>
                    <th class="text-center">{{ getTotalSearches() }}</th>
                    <th class="text-center">{{ getTotalCompleted() }}</th>
                    <th class="text-center">{{ getTotalVerified() }}</th>
                    <th class="text-center">{{ getTotalRejected() }}</th>
                    <th class="text-center">{{ getAverageProcessingTime() | number:'1.1-1' }}</th>
                    <th class="text-center">{{ getOverallCompletionRate() }}%</th>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        <!-- Daily Trends -->
        <div class="card" *ngIf="dailyStats && dailyStats.length > 0">
          <div class="card-header bg-light">
            <h5 class="mb-0">
              <i class="bi bi-calendar-week me-2"></i>Daily Trends (Last 30 Days)
            </h5>
          </div>
          <div class="card-body p-0">
            <div class="table-responsive">
              <table class="table table-sm table-hover mb-0">
                <thead class="table-light">
                  <tr>
                    <th>Date</th>
                    <th class="text-center">Applications</th>
                    <th class="text-center">Searches</th>
                    <th class="text-center">Assigned</th>
                    <th class="text-center">Completed</th>
                    <th class="text-center">Verified</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let day of dailyStats">
                    <td>{{ day.date | date:'MMM dd, yyyy' }}</td>
                    <td class="text-center">{{ day.applications }}</td>
                    <td class="text-center">{{ day.searches }}</td>
                    <td class="text-center">{{ day.assigned }}</td>
                    <td class="text-center">{{ day.completed }}</td>
                    <td class="text-center">{{ day.verified }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- No Data Message -->
        <div *ngIf="statistics.registrars.length === 0" class="alert alert-info text-center">
          <i class="bi bi-info-circle me-2"></i>
          No statistics available for the selected time period.
        </div>
      </div>
    </div>
  `,
  styles: [`
    .statistics-container {
      padding: 20px;
    }
    .progress {
      background-color: #e9ecef;
      border-radius: 10px;
    }
    .progress-bar {
      border-radius: 10px;
      transition: width 0.3s ease;
    }
    .table th {
      font-weight: 600;
      border-top: none;
    }
    .card {
      box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
    }
  `]
})
export class StatisticsComponent implements OnInit, OnChanges {
  @Input() applications: Application[] = [];
  @Input() registrars: Registrar[] = [];
  @Input() registry: string = '';

  selectedTimeRange: TimeRange = 'month';
  customStartDate: string = '';
  customEndDate: string = '';
  isLoading: boolean = false;
  statistics: TimeRangeStats | null = null;
  dailyStats: DailyStats[] = [];

  constructor(private statisticsService: StatisticsService) {}

  ngOnInit(): void {
    this.setDefaultDates();
    this.calculateStatistics();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['applications'] || changes['registrars']) {
      this.calculateStatistics();
    }
  }

  setDefaultDates(): void {
    const end = new Date();
    const start = new Date();
    start.setMonth(start.getMonth() - 1);
    this.customStartDate = start.toISOString().split('T')[0];
    this.customEndDate = end.toISOString().split('T')[0];
  }

  onTimeRangeChange(): void {
    if (this.selectedTimeRange !== 'custom') {
      this.calculateStatistics();
    }
  }

  calculateStatistics(): void {
    if (!this.applications || this.applications.length === 0) {
      console.warn('No applications to calculate statistics');
      return;
    }

    this.isLoading = true;

    setTimeout(() => {
      let startDate: Date;
      let endDate: Date = new Date();
      let periodName: string = '';

      // Filter applications for current registry
      const registryApps = this.applications.filter(app =>
        app.registry?.toLowerCase() === this.registry?.toLowerCase()
      );

      switch (this.selectedTimeRange) {
        case 'month':
          startDate = new Date();
          startDate.setMonth(startDate.getMonth() - 1);
          periodName = 'Last Month';
          break;
        case '3months':
          startDate = new Date();
          startDate.setMonth(startDate.getMonth() - 3);
          periodName = 'Last 3 Months';
          break;
        case '6months':
          startDate = new Date();
          startDate.setMonth(startDate.getMonth() - 6);
          periodName = 'Last 6 Months';
          break;
        case 'year':
          startDate = new Date();
          startDate.setFullYear(startDate.getFullYear() - 1);
          periodName = 'Last Year';
          break;
        case 'custom':
          startDate = new Date(this.customStartDate);
          endDate = new Date(this.customEndDate);
          periodName = `${this.customStartDate} to ${this.customEndDate}`;
          break;
        default:
          startDate = new Date();
          startDate.setMonth(startDate.getMonth() - 1);
          periodName = 'Last Month';
      }

      // Calculate statistics
      this.statistics = this.statisticsService.calculateStatistics(
        registryApps,
        this.registrars,
        startDate,
        endDate,
        periodName
      );

      // Calculate daily stats
      this.dailyStats = this.statisticsService.calculateDailyStats(registryApps, 30);

      this.isLoading = false;
    }, 100);
  }

  exportToCSV(): void {
    if (!this.statistics) return;

    const csvData: any[] = [];

    // Add header
    csvData.push(['Registrar Statistics Report']);
    csvData.push(['Period:', this.statistics.period]);
    csvData.push(['Generated:', new Date().toLocaleString()]);
    csvData.push([]);
    csvData.push(['Summary']);
    csvData.push(['Total Applications', this.statistics.total_applications]);
    csvData.push(['Completed', this.statistics.completed]);
    csvData.push(['Verified', this.statistics.verified]);
    csvData.push(['Pending', this.statistics.pending]);
    csvData.push(['Rejected', this.statistics.rejected]);
    csvData.push([]);
    csvData.push(['Registrar Performance']);
    csvData.push(['Registrar', 'Assigned', 'Searches', 'Completed', 'Verified', 'Rejected', 'Avg Days', 'Completion Rate']);

    this.statistics.registrars.forEach(reg => {
      csvData.push([
        reg.registrar_name,
        reg.applications_assigned,
        reg.total_searches,
        reg.completed_applications,
        reg.verified_applications,
        reg.rejected_applications,
        reg.average_processing_time.toFixed(1),
        `${reg.completion_rate.toFixed(1)}%`
      ]);
    });

    // Convert to CSV string
    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `registry_statistics_${this.registry}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  getCompletionRate(): number {
    if (!this.statistics || this.statistics.total_applications === 0) return 0;
    return Math.round((this.statistics.completed / this.statistics.total_applications) * 100);
  }

  getVerificationRate(): number {
    if (!this.statistics || this.statistics.total_applications === 0) return 0;
    return Math.round((this.statistics.verified / this.statistics.total_applications) * 100);
  }

  getTotalAssigned(): number {
    return this.statistics?.registrars.reduce((sum, r) => sum + r.applications_assigned, 0) || 0;
  }

  getTotalSearches(): number {
    return this.statistics?.registrars.reduce((sum, r) => sum + r.total_searches, 0) || 0;
  }

  getTotalCompleted(): number {
    return this.statistics?.registrars.reduce((sum, r) => sum + r.completed_applications, 0) || 0;
  }

  getTotalVerified(): number {
    return this.statistics?.registrars.reduce((sum, r) => sum + r.verified_applications, 0) || 0;
  }

  getTotalRejected(): number {
    return this.statistics?.registrars.reduce((sum, r) => sum + r.rejected_applications, 0) || 0;
  }

  getAverageProcessingTime(): number {
    const registrarsWithData = this.statistics?.registrars.filter(r => r.average_processing_time > 0) || [];
    if (registrarsWithData.length === 0) return 0;
    const total = registrarsWithData.reduce((sum, r) => sum + r.average_processing_time, 0);
    return total / registrarsWithData.length;
  }

  getOverallCompletionRate(): number {
    const totalAssigned = this.getTotalAssigned();
    const totalCompleted = this.getTotalCompleted();
    if (totalAssigned === 0) return 0;
    return Math.round((totalCompleted / totalAssigned) * 100);
  }
}
