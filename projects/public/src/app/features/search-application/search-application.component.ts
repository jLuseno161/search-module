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
import { MatDialog } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { HttpClient } from '@angular/common/http';

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

  constructor(private searchService: SearchService, private http: HttpClient, private router: Router, private authService: AuthService) {
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

  async viewInvoice(invoice: any): Promise<void> {
    console.log('View invoice details:', invoice);

    const htmlContent = await this.generateInvoiceHTML(invoice);
    this.openInNewTab(htmlContent, `Invoice-${invoice.id}`);
  }

  async viewReceipt(paymentData: any): Promise<void> {
    console.log('Viewing receipt for invoice:', paymentData);

    const htmlContent = await this.generateReceiptHTML(paymentData.payment);
    this.openInNewTab(htmlContent, `Receipt-${paymentData.payment.id}`);
  }

  private async generateInvoiceHTML(invoice: any): Promise<string> {
    const template = await this.http.get('/assets/templates/invoice.html', {
      responseType: 'text'
    }).toPromise();

    const paymentStatus = invoice.status === 'completed' || invoice.balance === '0' ? 'completed' :
      invoice.status === 'submitted' ? 'submitted' : 'pending';

    const statusIcon = paymentStatus === 'completed' ? '✓' :
      paymentStatus === 'submitted' ? '⏳' : '⏰';

    const statusText = paymentStatus === 'completed' ? 'Payment Completed' :
      paymentStatus === 'submitted' ? 'Payment Submitted' : 'Pending Payment';

    return template!
      .replace(/{{INVOICE_NUMBER}}/g, `INV-${invoice.id}-${new Date().getFullYear()}`)
      .replace(/{{DATE}}/g, invoice.date)
      .replace(/{{SERVICE}}/g, invoice.paymentFor)
      .replace(/{{AMOUNT}}/g, invoice.amount)
      .replace(/{{BALANCE}}/g, invoice.balance)
      .replace(/{{STATUS_CLASS}}/g, paymentStatus)
      .replace(/{{STATUS_ICON}}/g, statusIcon)
      .replace(/{{STATUS_TEXT}}/g, statusText);
  }

  private async generateReceiptHTML(paymentData: any): Promise<string> {
    const template = await this.http.get('/assets/templates/receipt.html', {
      responseType: 'text'
    }).toPromise();

    const currentDate = paymentData.paid_at ?
      new Date(paymentData.paid_at).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
      }) : 'Not Available';;

    return template!
      .replace(/{{RECEIPT_NUMBER}}/g, `RCP-${paymentData.payment_reference}`)
      .replace(/{{RECEIPT_DATE}}/g, currentDate)
      .replace(/{{INVOICE_ID}}/g, `INV-${paymentData.invoice_number}`)
      .replace(/{{INVOICE_DATE}}/g, this.invoice.date)
      .replace(/{{SERVICE}}/g, this.invoice.paymentFor)
      .replace(/{{AMOUNT}}/g, paymentData.amount)
      .replace(/{{TRANSACTION_ID}}/g, paymentData.mpesa_receipt_number);
  }

  private openInNewTab(htmlContent: string, title: string): void {
    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write(htmlContent);
      newWindow.document.title = title;
      newWindow.document.close();
    }
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

  async viewSearchReport(): Promise<void> {
    console.log('Viewing search report for application:', this.applicationData);

    try {
      const htmlContent = await this.generateSearchReportHTML(this.applicationData);
      this.openInNewTab(htmlContent, `Land-Search-Report-${this.applicationData.reference_number}`);
    } catch (error) {
      console.error('Error generating search report:', error);
      // You can add a fallback modal here if needed
    }
  }

  private async generateSearchReportHTML(applicationData: any): Promise<string> {
    const template = await this.http.get('/assets/templates/land-search-report.html', {
      responseType: 'text'
    }).toPromise();

    // Use available data from applicationData, leave empty if not available
    const titleNumber = applicationData.parcel_number || 'Not Available';
    const referenceNumber = applicationData.reference_number || 'N/A';
    const searchDate = applicationData.submitted_at ?
      new Date(applicationData.submitted_at).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
      }) : 'Not Available';;
    const location = applicationData.county || 'Not Specified';
    const parcelSize = applicationData.size || 'Not Specified';
    const landTenure = applicationData.tenure_type || 'Not Specified';
    const ownerName = applicationData.owner_name || 'Not Available';
    const ownerId = applicationData.id || 'Not Available';
    const registrationDate = applicationData.registration_date || 'Not Available';

    // Mock encumbrances data - to replace with actual data
    const hasEncumbrances = applicationData.has_encumbrances || false;
    const encumbrances = applicationData.encumbrances || [];

    let encumbrancesSection = '';
    if (hasEncumbrances && encumbrances.length > 0) {
      const encumbrancesHTML = encumbrances.map((enc: any) => `
      <div style="margin-bottom: 8px;">
        <strong>${enc.type || 'Encumbrance'}:</strong> ${enc.description || 'No description available'}<br>
        <small>Registered: ${enc.date || 'Date not specified'}</small>
      </div>
    `).join('');

      encumbrancesSection = `
      <div class="warning">
        <strong>WARNING: ENCUMBRANCES REGISTERED</strong>
        <div style="margin-top: 10px;">
          ${encumbrancesHTML}
        </div>
      </div>
    `;
    } else {
      encumbrancesSection = `
      <div class="clear">
        <strong>✓ NO REGISTERED ENCUMBRANCES</strong>
        <p style="margin: 5px 0 0 0;">This property is free from any registered caveats, charges, or restrictions.</p>
      </div>
    `;
    }

    return template!
      .replace(/{{TITLE_NUMBER}}/g, titleNumber)
      .replace(/{{REFERENCE_NUMBER}}/g, referenceNumber)
      .replace(/{{SEARCH_DATE}}/g, searchDate)
      .replace(/{{LOCATION}}/g, location)
      .replace(/{{PARCEL_SIZE}}/g, parcelSize)
      .replace(/{{LAND_TENURE}}/g, landTenure)
      .replace(/{{OWNER_NAME}}/g, ownerName)
      .replace(/{{OWNER_ID}}/g, ownerId)
      .replace(/{{REGISTRATION_DATE}}/g, registrationDate)
      .replace(/{{HAS_ENCUMBRANCES}}/g, hasEncumbrances.toString())
      .replace(/{{GENERATED_DATE}}/g, new Date().toLocaleDateString())
      .replace('{{#if HAS_ENCUMBRANCES}}', '')
      .replace('{{else}}', '')
      .replace('{{/if}}', '')
      .replace('{{#each ENCUMBRANCES}}', '')
      .replace('{{/each}}', '')
      .replace('{{ENCUMBRANCES_SECTION}}', encumbrancesSection);
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