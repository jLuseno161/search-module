// In services/statistics.service.ts
import { Injectable } from '@angular/core';
import { Application, Payment } from '../shared/interfaces/application';

export interface RegistrarStats {
  registrar_id: number;
  registrar_name: string;
  total_searches: number;
  completed_applications: number;
  verified_applications: number;
  rejected_applications: number;
  average_processing_time: number;
  applications_assigned: number;
  completion_rate: number;
}

export interface TimeRangeStats {
  period: string;
  start_date: Date;
  end_date: Date;
  total_searches: number;
  total_applications: number;
  completed: number;
  verified: number;
  pending: number;
  rejected: number;
  registrars: RegistrarStats[];
}

export interface DailyStats {
  date: string;
  searches: number;
  applications: number;
  completed: number;
  verified: number;
  assigned: number;
}

@Injectable({
  providedIn: 'root'
})
export class StatisticsService {

  constructor() { }

  // Helper method to safely get application date
  private getApplicationDate(app: Application): Date | null {
    // Check if payment exists and has paid_at
    if (app.payment && typeof app.payment === 'object' && 'paid_at' in app.payment) {
      const paidAt = (app.payment as any).paid_at;
      if (paidAt) {
        return new Date(paidAt);
      }
    }

    // Fallback to submitted_at
    if (app.submitted_at) {
      return new Date(app.submitted_at);
    }

    return null;
  }

  // Calculate statistics from applications data
  calculateStatistics(
    applications: Application[],
    registrars: any[],
    startDate: Date,
    endDate: Date,
    periodName: string
  ): TimeRangeStats {

    // Filter applications within date range
    const filteredApps = applications.filter(app => {
      const appDate = this.getApplicationDate(app);
      if (!appDate) return false;
      return appDate >= startDate && appDate <= endDate;
    });

    // Calculate totals
    const totalApplications = filteredApps.length;
    const completed = filteredApps.filter(app => app.status === 'completed').length;
    const verified = filteredApps.filter(app => app.status === 'verified').length;
    const rejected = filteredApps.filter(app => app.status === 'rejected').length;
    const pending = filteredApps.filter(app =>
      app.status === 'pending' || app.status === 'submitted' || app.status === 'unassigned'
    ).length;

    // Calculate total searches
    const totalSearches = this.calculateTotalSearches(filteredApps);

    // Calculate registrar statistics
    const registrarStats = this.calculateRegistrarStats(filteredApps, registrars);

    return {
      period: periodName,
      start_date: startDate,
      end_date: endDate,
      total_searches: totalSearches,
      total_applications: totalApplications,
      completed: completed,
      verified: verified,
      pending: pending,
      rejected: rejected,
      registrars: registrarStats
    };
  }

  private calculateTotalSearches(applications: Application[]): number {
    // Each status change counts as a search/action
    return applications.filter(app =>
      app.status !== 'pending' && app.status !== 'submitted' && app.status !== 'unassigned'
    ).length;
  }

  private calculateRegistrarStats(applications: Application[], registrars: any[]): RegistrarStats[] {
    const statsMap = new Map<number, RegistrarStats>();

    // Initialize stats for each registrar
    registrars.forEach(registrar => {
      statsMap.set(registrar.id, {
        registrar_id: registrar.id,
        registrar_name: registrar.name || registrar.username,
        total_searches: 0,
        completed_applications: 0,
        verified_applications: 0,
        rejected_applications: 0,
        average_processing_time: 0,
        applications_assigned: 0,
        completion_rate: 0
      });
    });

    // Track processing times per registrar
    const processingTimes = new Map<number, number[]>();

    // Process each application
    applications.forEach(app => {
      if (app.assigned_to) {
        const registrarId = app.assigned_to;
        const stats = statsMap.get(registrarId);

        if (stats) {
          stats.applications_assigned++;

          // Count as search/action if application has been processed
          if (app.status !== 'pending' && app.status !== 'submitted' && app.status !== 'unassigned') {
            stats.total_searches++;
          }

          if (app.status === 'completed') {
            stats.completed_applications++;
          }

          if (app.status === 'verified') {
            stats.verified_applications++;
          }

          if (app.status === 'rejected') {
            stats.rejected_applications++;
          }

          // Calculate processing time
          const submittedDate = this.getApplicationDate(app);
          const completedDate = app.certificate?.uploaded_at ? new Date(app.certificate.uploaded_at) : null;

          if (completedDate && submittedDate) {
            const daysDiff = Math.ceil((completedDate.getTime() - submittedDate.getTime()) / (1000 * 3600 * 24));
            if (daysDiff > 0) {
              if (!processingTimes.has(registrarId)) {
                processingTimes.set(registrarId, []);
              }
              processingTimes.get(registrarId)!.push(daysDiff);
            }
          }
        }
      }
    });

    // Calculate average processing times and completion rates
    for (const [registrarId, stats] of statsMap.entries()) {
      const times = processingTimes.get(registrarId) || [];
      if (times.length > 0) {
        stats.average_processing_time = times.reduce((a, b) => a + b, 0) / times.length;
      }

      stats.completion_rate = stats.applications_assigned > 0
        ? (stats.completed_applications / stats.applications_assigned) * 100
        : 0;
    }

    return Array.from(statsMap.values()).filter(s => s.applications_assigned > 0);
  }

  // Calculate daily statistics
  calculateDailyStats(
    applications: Application[],
    days: number = 30
  ): DailyStats[] {
    const dailyMap = new Map<string, DailyStats>();
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Initialize all dates in range
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      dailyMap.set(dateStr, {
        date: dateStr,
        searches: 0,
        applications: 0,
        completed: 0,
        verified: 0,
        assigned: 0
      });
    }

    // Process applications
    applications.forEach(app => {
      const appDate = this.getApplicationDate(app);
      if (!appDate) return;

      const dateStr = appDate.toISOString().split('T')[0];
      const daily = dailyMap.get(dateStr);

      if (daily) {
        daily.applications++;

        if (app.status === 'completed') {
          daily.completed++;
        }
        if (app.status === 'verified') {
          daily.verified++;
        }
        if (app.assigned_to) {
          daily.assigned++;
        }
        if (app.status !== 'pending' && app.status !== 'submitted' && app.status !== 'unassigned') {
          daily.searches++;
        }
      }
    });

    return Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  }

  // Get top performing registrars
  getTopPerformers(registrarStats: RegistrarStats[], limit: number = 5): RegistrarStats[] {
    return [...registrarStats]
      .sort((a, b) => b.completion_rate - a.completion_rate)
      .slice(0, limit);
  }

  // Get monthly summary
  getMonthlySummary(applications: Application[], year: number, month: number): any {
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);

    const monthApps = applications.filter(app => {
      const appDate = this.getApplicationDate(app);
      if (!appDate) return false;
      return appDate >= startDate && appDate <= endDate;
    });

    return {
      month: `${year}-${String(month + 1).padStart(2, '0')}`,
      total: monthApps.length,
      completed: monthApps.filter(a => a.status === 'completed').length,
      verified: monthApps.filter(a => a.status === 'verified').length,
      rejected: monthApps.filter(a => a.status === 'rejected').length,
      pending: monthApps.filter(a => a.status === 'pending' || a.status === 'submitted' || a.status === 'unassigned').length
    };
  }
}
