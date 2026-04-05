import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { SearchService } from '../../services/search.service';

@Component({
  selector: 'app-verify-search',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatDividerModule
  ],
  templateUrl: './verify-search.component.html',
  styleUrl: './verify-search.component.scss'
})
export class VerifySearchComponent {
  reference = '';
  isLoading = false;
  searchData: any = null;
  showDetails = false;
  notFound = false;

  constructor(private searchService: SearchService) { }

  search(): void {
    if (!this.reference.trim()) {
      return;
    }

    this.isLoading = true;
    this.notFound = false;
    this.searchData = null;
    this.showDetails = false;

    // Replace with your actual API call
    this.searchService.verifyApplication(this.reference).subscribe({
      next: (result) => {
        this.isLoading = false;
        // console.log(" Check Output", result)
        if (result) {
          this.searchData = result;
        } else {
          this.notFound = true;
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.notFound = true;
        console.error('Search error:', error);
      }
    });
  }

  viewDetails(): void {
    this.showDetails = true;
  }

  backToSummary(): void {
    this.showDetails = false;
  }

  clear(): void {
    this.reference = '';
    this.searchData = null;
    this.notFound = false;
    this.showDetails = false;
  }

  newSearch(): void {
    this.clear();
  }
  
  get isWithin6Months(): boolean {
    if (this.searchData?.status !== 'completed') return false;
    if (!this.searchData?.payment?.paid_at) return false;

    const filedDate = new Date(this.searchData.payment.paid_at);
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - 6);

    return filedDate >= cutoffDate;
  }
}