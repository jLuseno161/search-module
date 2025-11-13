import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-invoice-modal',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatDialogModule],
  template: `
    <div class="header">
      <h2>Invoice Details</h2>
      <button mat-icon-button (click)="onClose()"><mat-icon>close</mat-icon></button>
    </div>

    <div class="content">
      <div class="top">
        <div>
          <h3>Ministry of Lands & Physical Planning</h3>
          <p>Ardhi House, 1st Ngong Avenue</p>
          <p>P.O. Box 30450-00100, Nairobi, Kenya</p>
        </div>
        <div class="invoice-title">
          <h3>INVOICE</h3>
          <p>#{{ invoiceNumber }}</p>
        </div>
      </div>

      <div class="invoice-details">
        <div class="row"><span>Date:</span><span>{{ data.date }}</span></div>
        <div class="row"><span>Service:</span><span>{{ data.paymentFor }}</span></div>
        <div class="row"><span>Amount Due:</span><span class="amount">KSh {{ data.amount }}</span></div>
        <div class="row"><span>Balance:</span><span>KSh {{ data.balance }}</span></div>
        <div class="row status">
          <span>Status:</span>
          <span class="status-badge {{ paymentStatus }}">
            <mat-icon>{{ getStatusIcon() }}</mat-icon>
            {{ getStatusText() }}
          </span>
        </div>
      </div>
    </div>

    <div class="actions">
      <button mat-stroked-button (click)="onClose()">Close</button>
      <button mat-raised-button color="primary" (click)="printInvoice()">
        <mat-icon>print</mat-icon>Print
      </button>
    </div>
  `,
  styles: [`
    .header { display: flex; justify-content: space-between; align-items: center; padding: 16px 24px 0; border-bottom: 1px solid #e0e0e0; margin-bottom: 16px; }
    .content { padding: 0 24px; max-width: 100%; box-sizing: border-box; }
    .top { display: flex; justify-content: space-between; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 2px solid #8B4513; }
    .invoice-title { text-align: right; }
    .invoice-title h3 { margin: 0; color: #8B4513; font-size: 20px; }
    .invoice-details { display: flex; flex-direction: column; gap: 12px; }
    .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f5f5f5; }
    .amount { font-weight: 500; color: #d32f2f; }
    .status-badge { padding: 6px 12px; border-radius: 4px; font-size: 12px; display: flex; align-items: center; gap: 4px; }
    .completed { background: #e8f5e8; color: #2e7d32; }
    .submitted { background: #e3f2fd; color: #1976d2; }
    .pending { background: #fff3e0; color: #ef6c00; }
    .pay-btn { text-align: center; margin-top: 16px; }
    .actions { padding: 16px 24px; border-top: 1px solid #e0e0e0; display: flex; justify-content: flex-end; gap: 8px; }
  `]
})
export class InvoiceModalComponent implements OnInit {
  invoiceNumber = '';
  paymentStatus: 'completed' | 'submitted' | 'pending' = 'pending';

  constructor(public dialogRef: MatDialogRef<InvoiceModalComponent>, @Inject(MAT_DIALOG_DATA) public data: any) { }

  ngOnInit(): void {
    this.invoiceNumber = `INV-${this.data.id}-${new Date().getFullYear()}`;
    this.paymentStatus = this.data.status === 'completed' || this.data.balance === '0' ? 'completed' :
      this.data.status === 'submitted' ? 'submitted' : 'pending';
  }

  getStatusIcon(): string {
    return this.paymentStatus === 'completed' ? 'check_circle' :
      this.paymentStatus === 'submitted' ? 'pending_actions' : 'schedule';
  }

  getStatusText(): string {
    return this.paymentStatus === 'completed' ? 'Payment Completed' :
      this.paymentStatus === 'submitted' ? 'Payment Submitted' : 'Pending Payment';
  }

  initiatePayment(): void { console.log('Payment initiated:', this.data.id); }
  onClose(): void { this.dialogRef.close(); }
  printInvoice(): void { window.print(); }
}