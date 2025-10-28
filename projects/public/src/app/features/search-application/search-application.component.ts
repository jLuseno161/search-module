import { Component, OnInit } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { CommonModule } from '@angular/common';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { MatDivider } from '@angular/material/divider';
import { MatIcon } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { Router } from '@angular/router';
import { Invoice, Document } from '../../interfaces/search';
import { SearchService } from '../../services/search.service';

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
  //Application details table
  displayedColumns1: string[] = ['id', 'parcel_number', 'status', 'exists', 'verified', 'actions'];
  appDataSource: MatTableDataSource<any>;

  //Invoices table
  displayedColumns: string[] = ['id', 'date', 'paymentFor', 'amount', 'balance', 'status', 'actions'];
  dataSource: MatTableDataSource<Invoice>;

  invoice: Invoice;
  pageSize = 10;
  currentPage = 0;
  totalItems = 1;

  //fetch application data
  applicationData: any = {};
  documents: Document[] = [];


  //on pay
  selectedInvoice: any = null;

  constructor(private searchService: SearchService, private router: Router) {
    // Initialize with empty invoice, to populate on ngOnInit
    this.invoice = {} as Invoice;

    this.dataSource = new MatTableDataSource([this.invoice]);
    this.appDataSource = new MatTableDataSource<any>([]);
  }

  ngOnInit() {
    this.applicationData = history.state?.applicationData || {};
    this.createInvoice();

    this.appDataSource.data = [this.applicationData];
  }

  private createInvoice() {
    this.invoice = {
      id: this.applicationData.id,
      date: new Date(this.applicationData.submitted_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }),
      paymentFor: 'Search Fee',
      amount: '500',
      balance: '500',
      status: this.applicationData.status
    };

    // Update data source invoice
    this.dataSource = new MatTableDataSource([this.invoice]);
  }

  payNow(invoice: any) {
    if (this.selectedInvoice?.id === invoice.id) {
      this.selectedInvoice = null; // Close
    } else {
      this.selectedInvoice = invoice; // Open 
    }
  }

  viewInvoice(invoice: Invoice): void {
    console.log('View invoice details:', invoice);
  }

  onMockPayment() {
    if (this.selectedInvoice) {

      const phone = prompt('Please enter your phone number:');

      if (!phone || !this.isValidPhone(phone)) {
        alert(phone ? 'Please enter a valid phone number' : 'Phone number is required');
        return;
      }
      const paymentData = {
        phone: '0712603434',
      };

      this.searchService.makePayment(this.applicationData.id, paymentData).subscribe({
        next: (response) => {
          const referenceNo = this.applicationData.reference_number
          alert(`Payment successful for application no REG/SRCH/${referenceNo}`);

          this.selectedInvoice = null;
          // console.log('Payment response:', response);
          this.router.navigate(['application-details']);
        },
        error: (error) => {
          console.error(error);
          alert('Payment failed. Please try again.');
        }
      });
    }
  }

  //Validate phone number
  private isValidPhone(phone: string): boolean {
    const phoneRegex = /^[0-9]{10,12}$/;
    return phoneRegex.test(phone.replace(/\s+/g, ''));
  }

  //Disable action buttons in search status table(Application details)
  isActionDisabled(status: string): boolean {
    return ['pending', 'submitted', 'rejected'].includes(status?.toLowerCase());
  }

  downloadCertificate() {
    this.searchService.downloadSearchResult(this.applicationData.id).subscribe({
      next: (response: any) => {
        const fileUrl = response.signed_file;

        if (fileUrl) {
          window.open(fileUrl, '_blank') //opens file in new tab
        } else {
          console.error('No file URL found in response');
        }
      },
      error: (error) => {
        console.log('Download failed:', error);
      }
    });
  }

  onPageChange(event: any): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
  }
}