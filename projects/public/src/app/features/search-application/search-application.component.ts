import { Component, OnInit } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { CommonModule } from '@angular/common';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { MatDivider } from '@angular/material/divider';
import { MatIcon, MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { Router } from '@angular/router';
import { Invoice, Document } from '../../interfaces/search';
import { SearchService } from '../../services/search.service';
import { AuthService } from '../../services/auth.service';
import Swal from 'sweetalert2';
import { MatButtonModule } from '@angular/material/button';
import { CdkOverlayOrigin } from "@angular/cdk/overlay";
import { InvoiceModalComponent } from '../modals/invoice.component';
import { MatDialog } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { ReceiptModalComponent } from '../modals/receipt.component';

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
    MatButtonModule,
     MatMenuModule,    
    MatButtonModule,  
    MatIconModule  
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

  //user
  currentUser: any;

  //fetch application data
  applicationData: any = {};
  documents: Document[] = [];


  //on pay
  selectedInvoice: any = null;

  constructor(private searchService: SearchService, private router: Router, private authService: AuthService, private dialog: MatDialog) {
    // Initialize with empty invoice, to populate on ngOnInit
    this.invoice = {} as Invoice;

    this.dataSource = new MatTableDataSource([this.invoice]);
    this.appDataSource = new MatTableDataSource<any>([]);

    const user = this.authService.getCurrentUser();
    if (user) {
      this.currentUser = user || 'User';
    }
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
    
    this.dialog.open(InvoiceModalComponent, {
      width: '500px',
      data: invoice
    });
  }

viewReceipt(invoice: Invoice): void {
    console.log('Viewing receipt for invoice:', invoice);
    
    // Open the receipt modal
    this.dialog.open(ReceiptModalComponent, {
      width: '550px',
      maxWidth: '90vw',
      data: invoice
    });
  }
  async onMockPayment() {
    if (!this.selectedInvoice) return;

    // Get phone number
    const { value: phone } = await Swal.fire({
      title: 'Enter Phone Number',
      input: 'text',
      inputPlaceholder: 'Enter your phone number',
      showCancelButton: true,
      confirmButtonColor: '#8B4513',
      cancelButtonColor: '#aeb5bbff',
      confirmButtonText: 'Pay',
      cancelButtonText: 'Cancel',
      inputValidator: (value) => !value ? 'Phone number is required!' : !this.isValidPhone(value) ? 'Invalid phone number!' : null
    });

    // If user cancelled or closed the dialog
    if (!phone) return;

    // Confirm payment
    const confirmed = await Swal.fire({
      title: 'Confirm Payment',
      text: `Are you sure you want to proceed with payment for application REG/SRCH/${this.applicationData.reference_number}?`,
      // text: `Pay for application REG/SRCH/${this.applicationData.reference_number}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#8B4513',
      cancelButtonColor: '#aeb5bbff',
      confirmButtonText: 'Yes, Pay',
      cancelButtonText: 'Cancel'
    });

    // If user confirms payment
    if (!confirmed.isConfirmed) return;

    // Loading
    Swal.fire({
      title: 'Processing...',
      text: 'Initiating payment',
      icon: 'info',
      showConfirmButton: false,
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    // Process payment
    const paymentData = { phone: phone };

    this.searchService.makePayment(this.applicationData.id, paymentData).subscribe({
      next: (response) => {
        Swal.close();
        this.confirmPaymentReceipt();
      },
      error: (error) => {
        Swal.close();
        Swal.fire({
          title: 'Payment Failed',
          text: 'Please try again',
          icon: 'error',
          confirmButtonColor: '#8B4513'
        });
      }
    });
  }

  //Validate phone number
  private isValidPhone(phone: string): boolean {
    const phoneRegex = /^[0-9]{10,12}$/;
    return phoneRegex.test(phone.replace(/\s+/g, ''));
  }

  //confirm payment receipt
  private async confirmPaymentReceipt() {
    const receiptConfirmed = await Swal.fire({
      title: 'Check Your Phone',
      text: 'Payment sent to your phone. Did you complete the payment?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#8B4513',
      cancelButtonColor: '#aeb5bbff',
      confirmButtonText: 'Yes, Done',
      cancelButtonText: 'No'
    });

    if (receiptConfirmed.isConfirmed) {
      await Swal.fire({
        title: 'Success!',
        text: `Payment completed for REG/SRCH/${this.applicationData.reference_number}`,
        icon: 'success',
        confirmButtonColor: '#8B4513'
      });

      this.selectedInvoice = null;
      this.router.navigate(['application-details']);
    } else {
      await Swal.fire({
        title: 'Pending',
        text: 'Please complete payment on your phone',
        icon: 'info',
        confirmButtonColor: '#8B4513'
      });
    }
  }

  //Disable action buttons in search status table(Application details)
  isActionDisabled(status: string): boolean {
    return ['pending', 'submitted', 'rejected'].includes(status?.toLowerCase());
  }

  downloadCertificate() {
    if (this.applicationData.certificate && this.applicationData.certificate.id) {
      const certificateId = this.applicationData.certificate.id;
      // console.log('Using certificate ID:', certificateId);

      this.searchService.downloadSearchResult(certificateId).subscribe({
        next: (response: any) => {
          const fileUrl = response.signed_file;
          // console.log('File URL:', fileUrl);
          if (fileUrl) {
            window.open(fileUrl, '_blank');
          } else {
            console.error('No file URL found in response');
          }
        },
        error: (error) => {
          console.log('Download failed:', error);
        }
      });
    } 
  }

  onPageChange(event: any): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
  }
}