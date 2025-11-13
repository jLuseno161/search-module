import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
    selector: 'app-receipt-modal',
    standalone: true,
    imports: [CommonModule, MatButtonModule, MatIconModule, MatDialogModule],
    template: `
    <div class="header">
      <h2>Payment Receipt</h2>
      <button mat-icon-button (click)="onClose()"><mat-icon>close</mat-icon></button>
    </div>

    <div class="content">
      <div class="receipt-header">
        <div>
          <h3>Ministry of Lands & Physical Planning</h3>
          <p>Ardhi House, 1st Ngong Avenue</p>
          <p>P.O. Box 30450-00100, Nairobi, Kenya</p>
          <p>Email: info&#64;lands.go.ke</p>
          <p>Phone: +254 700 000 000</p>
        </div>
        <div class="receipt-title">
          <h1>OFFICIAL RECEIPT</h1>
          <p>Receipt #{{ receiptNumber }}</p>
        </div>
      </div>

      <div class="receipt-details">
        <div class="section">
          <h4>Payment Details</h4>
          <div class="row"><span>Receipt Date:</span><span>{{ currentDate }}</span></div>
          <div class="row"><span>Original Invoice:</span><span>#{{ data.id }}</span></div>
          <div class="row"><span>Invoice Date:</span><span>{{ data.date }}</span></div>
        </div>

        <div class="section">
          <h4>Payment Information</h4>
          <div class="row"><span>Service:</span><span>{{ data.paymentFor }}</span></div>
          <div class="row"><span>Amount Paid:</span><span class="amount">KSh {{ data.amount }}</span></div>
          <div class="row"><span>Payment Method:</span><span>M-PESA</span></div>
          <div class="row"><span>Transaction ID:</span><span class="txn">{{ transactionId }}</span></div>
        </div>

        <div class="status">
          <mat-icon>check_circle</mat-icon>
          <span>Payment Completed Successfully</span>
        </div>

        <div class="footer">
          <p>This is an official receipt for payment made.</p>
          <p>Please keep this receipt for your records.</p>
        </div>
      </div>
    </div>

    <div class="actions">
      <button mat-stroked-button (click)="onClose()">Close</button>
      <button mat-raised-button color="primary" (click)="printReceipt()">
        <mat-icon>print</mat-icon>Print
      </button>
    </div>
  `,
    styles: [`
    .header { display: flex; justify-content: space-between; align-items: center; padding: 16px 24px 0; border-bottom: 1px solid #e0e0e0; margin-bottom: 16px; }
    .content { padding: 0 24px; min-width: 500px; }
    .receipt-header { display: flex; justify-content: space-between; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 2px solid #8B4513; }
    .receipt-title { text-align: right; }
    .receipt-title h1 { margin: 0; color: #8B4513; font-size: 20px; }
    .section { margin-bottom: 20px; }
    .section h4 { color: #8B4513; margin-bottom: 12px; border-bottom: 1px solid #eee; padding-bottom: 4px; }
    .row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #f5f5f5; }
    .amount { font-weight: 500; color: #2e7d32; }
    .txn { font-family: monospace; background: #f5f5f5; padding: 2px 6px; border-radius: 4px; }
    .status { background: #e8f5e8; color: #2e7d32; padding: 12px; border-radius: 8px; display: flex; align-items: center; gap: 8px; margin: 20px 0; }
    .footer { background: #f9f9f9; padding: 12px; border-radius: 4px; margin-top: 20px; font-size: 12px; color: #666; font-style: italic;
 }
    .actions { padding: 16px 24px; border-top: 1px solid #e0e0e0; display: flex; justify-content: flex-end; gap: 8px; }
    
    @media print { .actions, .modal-header button { display: none !important; } }
  `]
})
export class ReceiptModalComponent implements OnInit {
    receiptNumber = '';
    transactionId = '';
    currentDate = '';

    constructor(public dialogRef: MatDialogRef<ReceiptModalComponent>, @Inject(MAT_DIALOG_DATA) public data: any) { }

    ngOnInit(): void {
        this.currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        this.receiptNumber = `RCP-${this.data.id}-${dateStr}`;
        this.transactionId = `TXN-${this.data.id}-${new Date().getTime().toString().slice(-6)}`;
    }

    onClose(): void { this.dialogRef.close(); }
    printReceipt(): void { window.print(); }
}