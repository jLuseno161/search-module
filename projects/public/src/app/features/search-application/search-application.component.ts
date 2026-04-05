import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
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
import Swal from 'sweetalert2';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { HttpClient } from '@angular/common/http';
import html2pdf from 'html2pdf.js';

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

  //Documents table
  documentsDataSource = new MatTableDataSource<Document>([]);
  documentColumns: string[] = ['no', 'document', 'action'];

  invoice: Invoice;
  pageSize = 10;
  currentPage = 0;
  totalItems = 1;

  //fetch application data
  applicationData: any = {};
  documents: Document[] = [];

  //on pay
  selectedInvoice: any = null;

  //Generate Invoice/Receipt
  @ViewChild('invoiceContent') invoiceContent!: ElementRef;
  @ViewChild('receiptContent') receiptContent!: ElementRef;
  selectedInvoiceNumber: string = '';
  selectedInvoiceDate: string = '';
  selectedService: string = '';
  selectedAmount: string = '';
  selectedBalance: string = '';
  selectedStatusClass: string = '';
  selectedStatusText: string = '';
  
  selectedReceiptNumber: string = '';
  selectedReceiptDate: string = '';
  selectedInvoiceId: string = '';
  selectedInvoiceDateForReceipt: string = '';
  selectedServiceForReceipt: string = '';
  selectedAmountPaid: string = '';
  selectedTransactionId: string = '';

  constructor(private searchService: SearchService, private http: HttpClient, private router: Router) {
    this.invoice = {} as Invoice;
    this.dataSource = new MatTableDataSource([this.invoice]);
    this.appDataSource = new MatTableDataSource<any>([]);
  }

  ngOnInit() {
    this.applicationData = history.state?.applicationData || {};
    this.createInvoice();

    // Add exists property to the application data for the table
    const tableData = {
      ...this.applicationData,
      exists: !!(this.applicationData.certificate && this.applicationData.certificate.id)
    };

    this.appDataSource.data = [tableData];

    // Populate documents table
    if (this.applicationData.ownership_document) {
      const docName = this.applicationData.ownership_document.split('/').pop();
      this.documents = [{
        id: 1,
        name: docName,
        file: null,
        url: this.applicationData.ownership_document

      }];
      this.documentsDataSource.data = this.documents;
      // this.nextDocumentId = 2;
    }
  }

  //Displaying Invoices and Receipts
  viewDocument(document: Document) {
    if (document.file) {
      const fileURL = URL.createObjectURL(document.file);
      window.open(fileURL, '_blank');
    } else if (document.url) {
      // window.open(document.url, '_blank');
      this.http.get(document.url, { responseType: 'blob' }).subscribe(blob => {
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, '_blank');
      });
    }
  }

  private createInvoice() {
    this.invoice = {
      id: this.applicationData.id,
      date: new Date(this.applicationData.submitted_at || this.applicationData.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }),
      paymentFor: 'Search Fee',
      amount: '1050',
      balance: '1050',
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
    this.selectedInvoiceNumber = `INV-${invoice.id}-${new Date().getFullYear()}`;
    this.selectedInvoiceDate = invoice.date;
    this.selectedService = invoice.paymentFor;
    this.selectedAmount = invoice.amount;
    this.selectedBalance = invoice.balance;

    const hasPayment = this.applicationData?.payment &&
      this.applicationData.payment.result_code === '0';
    const paymentStatus = hasPayment ? 'completed' : 'pending';

    // const paymentStatus = invoice.status === 'completed' || invoice.balance === '0' ? 'completed' :
    //   invoice.status === 'submitted' ? 'submitted' : 'pending';

    this.selectedStatusClass = paymentStatus;
    this.selectedStatusText = paymentStatus === 'completed' ? 'Payment Completed' : 'Pending Payment';

    // Allow Angular to update the DOM
    setTimeout(() => {
      this.openAsPDF(this.invoiceContent.nativeElement, `Invoice-${invoice.id}`);
    });
  }

  async viewReceipt(paymentData: any): Promise<void> {
    console.log('Viewing receipt for invoice:', paymentData);
    this.selectedReceiptNumber = `RCP-${paymentData.payment.payment_reference}`;
    this.selectedReceiptDate = paymentData.payment.paid_at ?
      new Date(paymentData.payment.paid_at).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
      }) : 'Not Available';
    this.selectedInvoiceId = `INV-${paymentData.payment.invoice_number}`;
    this.selectedInvoiceDateForReceipt = this.invoice.date;
    this.selectedServiceForReceipt = this.invoice.paymentFor;
    this.selectedAmountPaid = paymentData.payment.amount;
    this.selectedTransactionId = paymentData.payment.mpesa_receipt_number;

    // Allow Angular to update the DOM
    setTimeout(() => {
      this.openAsPDF(this.receiptContent.nativeElement, `Receipt-${paymentData.payment.id}`);
    });
  }

  private openAsPDF(element: HTMLElement, fileName: string): void {
    const options = {
      margin: 10,
      filename: `${fileName}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2, logging: false, useCORS: true, letterRendering: true },
      jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
    };

    html2pdf()
      .from(element)
      .set(options)
      .outputPdf('blob')
      .then((pdfBlob: Blob) => {
        const blobUrl = URL.createObjectURL(pdfBlob);
        window.open(blobUrl, '_blank');
        setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
      })
      .catch((error: any) => console.error('PDF generation failed:', error));
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
      text: `Are you sure you want to proceed with payment for application ${this.applicationData.reference_number}?`,
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
        text: `Payment completed for ${this.applicationData.reference_number}`,
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

  //application details buttons
  isActionDisabled(element: any): boolean {
    const isPending = ['pending', 'submitted', 'rejected'].includes(element?.status?.toLowerCase());
    const parcelNotFound = element?.exists === false;

    return isPending || parcelNotFound;
  }

  viewSearchCertificate() {
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
          console.log('View failed:', error);
        }
      });
    }
  }

  isReturnedApplication(): boolean {
    const status = this.applicationData?.status?.toLowerCase();
    return status === 'returned';
  }
  editApplication() {
    this.router.navigate(['/new-application'], {
      queryParams: {
        id: this.applicationData.id,
        mode: 'edit'
      },
      state: {
        applicationData: this.applicationData
      }
    });
  }

  getRemarks() {
    // Get the most recent or last made remark
    const reviews = this.applicationData.reviews || [];
    const review = reviews.length > 0 ? reviews.reduce((latest: any, current: any) => {
      return new Date(current.created_at) > new Date(latest.created_at) ? current : latest;
    }) : null;

    const isRejected = this.applicationData.status?.toLowerCase() === 'rejected';
    const isReturned = this.applicationData.status?.toLowerCase() === 'returned';
    const isCompleted = this.applicationData.status?.toLowerCase() === 'completed';
    const hasCertificate = !!this.applicationData.certificate?.id;
    const isParcelNotFound = isCompleted && !hasCertificate;

    return {
      // Status checks
      isRejected,
      isParcelNotFound,
      isReturned,
      showRemarks: isRejected || isParcelNotFound || isReturned,

      rejectionRemark: isRejected ? {
        comment: review?.comment,
        date: review?.created_at || new Date().toISOString()
      } : null,

      returnRemark: isReturned ? {
        comment: review?.comment || 'Application is returned.',
        date: review?.created_at || new Date().toISOString()
      } : null,

      parcelNotFoundRemark: isParcelNotFound ? {
        comment: review?.comment || 'The requested parcel number was not found in the registry records. Please verify the parcel number and resubmit the search request.',
        date: review?.created_at || new Date().toISOString()
      } : null
    };
  }

  downloadCertificate() {
    if (this.applicationData.certificate && this.applicationData.certificate.id) {
      const certificateId = this.applicationData.certificate.id;

      this.searchService.downloadSearchResult(certificateId).subscribe({
        next: (response: any) => {
          const fileUrl = response.signed_file;

          if (fileUrl) {
            const fullPath = fileUrl.split('/certificates/')[1];
            const fileName = fullPath.replace('cert_with_qr_', '');

            // Fetch the file as blob
            fetch(fileUrl)
              .then(res => res.blob())
              .then(blob => {
                const blobUrl = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = blobUrl;
                link.download = fileName;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(blobUrl);
              })
              .catch(error => console.error('Fetch failed:', error));
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