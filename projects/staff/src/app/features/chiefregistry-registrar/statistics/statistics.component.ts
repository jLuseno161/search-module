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
  templateUrl: './statistics.component.html',
  styleUrls: ['./statistics.component.css']
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
