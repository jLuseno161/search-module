import { Component, OnInit } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { CommonModule } from '@angular/common';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { MatDivider } from '@angular/material/divider';
import { MatIcon } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { ActivatedRoute, Router } from '@angular/router';

export interface Invoice {
  id: number;
  date: string;
  paymentFor: string;
  amount: string;
  balance: string;
  status: string;
}

@Component({
  selector: 'app-search-application',
  standalone: true,
  imports: [
    MatCard,
    MatCardContent,
    MatPaginator,
    MatTableModule,
    MatTabsModule,
    CommonModule,
    MatCardHeader,
    MatCardTitle,
    MatDivider,
    MatIcon,
  ],
  templateUrl: './search-application.component.html',
  styleUrl: './search-application.component.scss'
})
export class SearchApplicationComponent implements OnInit {
  displayedColumns: string[] = ['id', 'date', 'paymentFor', 'amount', 'balance', 'status', 'actions'];
  dataSource: MatTableDataSource<Invoice>;

  invoices: Invoice[] = [
    {
      id: 10,
      date: 'Feb',
      paymentFor: 'Search Fee',
      amount: 'Ksh. 2,050.00',
      balance: 'Ksh. 2,050.00',
      status: 'Pending'
    },
  ];
  pageSize = 10;
  currentPage = 0;
  totalItems = this.invoices.length;

  applicationId: string = '';
  applicationStatus: string = '';
  applicationData: any;

  constructor(private route: ActivatedRoute, private router: Router) {
    this.dataSource = new MatTableDataSource(this.invoices);
  }

  ngOnInit() {
    //Handling null values with default empty strings
    this.applicationId = this.route.snapshot.paramMap.get('id') || '';
    this.applicationStatus = this.route.snapshot.data['status'] || '';

    this.loadApplicationData();
  }

  private loadApplicationData() {
    // console.log(`Loading application ${this.applicationId} with status ${this.applicationStatus}`);
    if (this.applicationId && this.applicationStatus) {
      this.applicationData = {
        id: this.applicationId,
        status: this.applicationStatus,
      };
    }
  }

  // getStatusClass(status: string): string {
  //   return status === 'Pending' ? 'status-pending' : 'status-paid';
  // }

  payNow(invoice: Invoice): void {
    console.log('Pay invoice:', invoice);
  }

  viewInvoice(invoice: Invoice): void {
    console.log('View invoice details:', invoice);
  }

  onMockPayment(): void {
    console.log('Mock payment initiated');
  }

  onPageChange(event: any): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
  }
}