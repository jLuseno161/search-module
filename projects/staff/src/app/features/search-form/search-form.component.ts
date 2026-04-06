// import { Component, Input, Output, EventEmitter, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
// import { MatCardModule } from '@angular/material/card';
// import { MatFormFieldModule } from '@angular/material/form-field';
// import { MatInputModule } from '@angular/material/input';
// import { MatButtonModule } from '@angular/material/button';
// import { MatDatepickerModule } from '@angular/material/datepicker';
// import { MatNativeDateModule } from '@angular/material/core';
// import { MatSelectModule } from '@angular/material/select';
// import { MatIconModule } from '@angular/material/icon';
// import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
// import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
// import { AuthService } from '../../auth/auth.service';
// import { PdfGeneratorService } from '../../services/pdf-generator.service';
// import { ApplicationService, ApiApplication, ApiResponse } from '../../services/application.service';
// @Component({
//   selector: 'app-search',
//   standalone: true,
//   imports: [
//     CommonModule,
//     FormsModule,
//     ReactiveFormsModule,
//     MatCardModule,
//     MatFormFieldModule,
//     MatInputModule,
//     MatButtonModule,
//     MatDatepickerModule,
//     MatNativeDateModule,
//     MatSelectModule,
//     MatIconModule,
//     MatSnackBarModule,
//     MatProgressSpinnerModule
//   ],
//   templateUrl: './search-form.component.html',
//   styleUrls: ['./search-form.component.css']
// })
// export class SearchComponent implements OnInit, AfterViewInit {
//   @Input() applicationId!: number;
//   @Input() parcelNumber!: string;
//   @Input() referenceNumber!: string;
//   @Input() applicantName: string = '';
//   @Input() applicantId: number = 0;
//   @Input() applicantEmail: string = '';
//   @Input() applicantPhone: string = '';
//   @Input() county: string = '';
//   @Input() registry: string = '';
//   @Input() purpose: string = '';
//   @Input() searchType: string = 'parcel search';

//   @Output() formSubmitted = new EventEmitter<any>();
//   @Output() previewRequested = new EventEmitter<any>();
//   @Output() nextToUpload = new EventEmitter<any>();
//   @Output() cancelled = new EventEmitter<void>();

//   @ViewChild('signatureCanvas', { static: true }) signatureCanvas!: ElementRef<HTMLCanvasElement>;

//   searchForm: FormGroup;
//   private drawing = false;
//   private ctx!: CanvasRenderingContext2D;
//   currentUser: any = null;
//   hasSignature: boolean = false;
//   isGenerating: boolean = false;
//   isSaved: boolean = false;
//   generatedCertificateData: any = null;

//   constructor(
//     private fb: FormBuilder,
//     private authService: AuthService,
//     private pdfGeneratorService: PdfGeneratorService,
//     private snackBar: MatSnackBar
//   ) {
//     this.searchForm = this.fb.group({
//       referenceNumber: [{ value: '', disabled: true }],
//       parcelNumber: [{ value: '', disabled: true }],
//       purpose: [{ value: '', disabled: true }],
//       applicantName: [{ value: '', disabled: true }],
//       applicantEmail: [{ value: '', disabled: true }],
//       applicantId: [{ value: '', disabled: true }],
//       applicantPhone: [{ value: '', disabled: true }],
//       IdNumber: [{ value: '', disabled: true }],
//       searchDate: ['', Validators.required],
//       landSize: ['', Validators.required],
//       holdingType: ['', Validators.required],
//       folio: [''],
//       rent: [''],
//       term: [''],
//       nature_of_title: [''],
//       inhibitions: [''],
//       remarks: [''],
//       signature: [''],
//       owners: this.fb.array([])
//     });
//   }

//   // Getter for owners FormArray
//   get ownersArray(): FormArray {
//     return this.searchForm.get('owners') as FormArray;
//   }

//   ngOnInit() {
//     console.log('📥 SearchComponent received inputs:', {
//       applicationId: this.applicationId,
//       referenceNumber: this.referenceNumber,
//       parcelNumber: this.parcelNumber,
//       applicantName: this.applicantName
//     });

//     this.currentUser = this.authService.currentUserValue;
//     this.hasSignature = !!this.currentUser?.signature;
//     this.isSaved = false;

//     const today = new Date().toISOString().split('T')[0];

//     this.searchForm.patchValue({
//       referenceNumber: this.referenceNumber,
//       parcelNumber: this.parcelNumber,
//       purpose: this.purpose,
//       applicantName: this.applicantName,
//       applicantEmail: this.applicantEmail,
//       applicantId: this.applicantId,
//       applicantPhone: this.applicantPhone,
//       IdNumber: this.applicantId,
//       searchDate: today
//     });

//     // Initialize with one owner
//     this.addOwner();
//   }

//   ngAfterViewInit() {
//     this.initCanvas();
//     if (this.hasSignature && this.currentUser?.signature) {
//       this.loadSignatureFromProfile();
//     }
//   }

//   // ========== OWNER MANAGEMENT METHODS ==========
//   addOwner(): void {
//     this.ownersArray.push(this.fb.control('', Validators.required));
//   }

//   removeOwner(index: number): void {
//     if (this.ownersArray.length > 1) {
//       this.ownersArray.removeAt(index);
//     }
//   }

//   getOwnersList(): string[] {
//     return this.ownersArray.value.filter((owner: string) => owner && owner.trim());
//   }

//   trackByIndex(index: number, item: any): number {
//     return index;
//   }

//   // ========== SIGNATURE METHODS ==========
//   initCanvas() {
//     const canvas = this.signatureCanvas?.nativeElement;
//     if (canvas) {
//       this.ctx = canvas.getContext('2d')!;
//       this.ctx.strokeStyle = '#000';
//       this.ctx.lineWidth = 2;
//       this.ctx.lineCap = 'round';
//       this.ctx.lineJoin = 'round';
//       this.ctx.fillStyle = 'white';
//       this.ctx.fillRect(0, 0, canvas.width, canvas.height);
//     }
//   }

//   loadSignatureFromProfile() {
//     const canvas = this.signatureCanvas?.nativeElement;
//     if (!canvas || !this.currentUser?.signature) return;

//     const signatureUrl = this.getFullSignatureUrl(this.currentUser.signature);
//     const img = new Image();
//     img.crossOrigin = 'Anonymous';

//     img.onload = () => {
//       this.ctx.clearRect(0, 0, canvas.width, canvas.height);
//       this.ctx.fillStyle = 'white';
//       this.ctx.fillRect(0, 0, canvas.width, canvas.height);
//       this.ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

//       canvas.toBlob((blob) => {
//         if (blob) {
//           const reader = new FileReader();
//           reader.onloadend = () => {
//             this.searchForm.patchValue({ signature: reader.result as string });
//           };
//           reader.readAsDataURL(blob);
//         }
//       }, 'image/png');
//     };
//     img.src = signatureUrl;
//   }

//   private getFullSignatureUrl(signaturePath: string): string {
//     if (!signaturePath) return '';
//     if (signaturePath.startsWith('http') || signaturePath.startsWith('data:')) {
//       return signaturePath;
//     }
//     if (signaturePath.startsWith('/')) {
//       return `https://arthuronama.pythonanywhere.com${signaturePath}`;
//     }
//     return `https://arthuronama.pythonanywhere.com/media/${signaturePath}`;
//   }

//   startDrawing(event: MouseEvent) {
//     this.drawing = true;
//     const canvas = this.signatureCanvas.nativeElement;
//     const rect = canvas.getBoundingClientRect();
//     const scaleX = canvas.width / rect.width;
//     const scaleY = canvas.height / rect.height;
//     const x = (event.clientX - rect.left) * scaleX;
//     const y = (event.clientY - rect.top) * scaleY;
//     this.ctx.beginPath();
//     this.ctx.moveTo(x, y);
//   }

//   draw(event: MouseEvent) {
//     if (!this.drawing) return;
//     event.preventDefault();
//     const canvas = this.signatureCanvas.nativeElement;
//     const rect = canvas.getBoundingClientRect();
//     const scaleX = canvas.width / rect.width;
//     const scaleY = canvas.height / rect.height;
//     const x = (event.clientX - rect.left) * scaleX;
//     const y = (event.clientY - rect.top) * scaleY;
//     this.ctx.lineTo(x, y);
//     this.ctx.stroke();
//     this.ctx.beginPath();
//     this.ctx.moveTo(x, y);
//   }

//   stopDrawing() {
//     this.drawing = false;
//   }

//   clearSignature() {
//     const canvas = this.signatureCanvas.nativeElement;
//     this.ctx.clearRect(0, 0, canvas.width, canvas.height);
//     this.ctx.fillStyle = 'white';
//     this.ctx.fillRect(0, 0, canvas.width, canvas.height);
//     this.searchForm.patchValue({ signature: '' });
//     this.snackBar.open('Signature cleared', 'Close', { duration: 2000 });
//   }

//   saveSignature() {
//     const canvas = this.signatureCanvas.nativeElement;
//     canvas.toBlob((blob) => {
//       if (!blob) {
//         this.snackBar.open('Failed to create signature', 'Close', { duration: 2000 });
//         return;
//       }
//       if (blob.size > 200 * 1024) {
//         this.snackBar.open('Signature too large (max 200KB)', 'Close', { duration: 3000 });
//         return;
//       }
//       const reader = new FileReader();
//       reader.onloadend = () => {
//         this.searchForm.patchValue({ signature: reader.result as string });
//         this.snackBar.open('Signature saved', 'Close', { duration: 2000 });
//       };
//       reader.readAsDataURL(blob);
//     }, 'image/png');
//   }

//   // ========== CERTIFICATE METHODS ==========
//   async onSaveCertificate() {
//     if (this.searchForm.valid) {
//       const formValue = this.searchForm.getRawValue();
//       const ownersList = this.getOwnersList();

//       if (!formValue.signature) {
//         this.snackBar.open('Please save your signature first', 'Close', { duration: 3000 });
//         return;
//       }

//       if (ownersList.length === 0) {
//         this.snackBar.open('Please add at least one owner', 'Close', { duration: 3000 });
//         return;
//       }

//       this.isGenerating = true;

//       try {
//         const certificateData = {
//           ...formValue,
//           owners: ownersList,
//           owner_names: ownersList.join(', '),
//           proprietor: ownersList.length > 1 ? ownersList.join(' & ') : ownersList[0],
//           applicationId: this.applicationId,
//           applicantName: this.applicantName,
//           applicantEmail: this.applicantEmail,
//           applicantPhone: this.applicantPhone,
//           IdNumber: this.applicantId,
//           registrarName: this.currentUser?.username || 'Registrar',
//           registry: this.registry,
//           county: this.county
//         };

//         const pdf = await this.pdfGeneratorService.generateSearchCertificate(
//           certificateData,
//           this.currentUser?.username || 'Registrar',
//           this.registry,
//           this.county
//         );

//         const pdfBlob = pdf.output('blob');

//         const metadata = {
//           applicationId: this.applicationId,
//           referenceNumber: this.referenceNumber,
//           generatedAt: new Date().toISOString(),
//           size: pdfBlob.size,
//           hasSignature: !!formValue.signature,
//           owners: ownersList,
//           formData: certificateData
//         };

//         localStorage.setItem(`certificate_meta_${this.applicationId}`, JSON.stringify(metadata));

//         this.generatedCertificateData = {
//           blob: pdfBlob,
//           data: certificateData,
//           generatedAt: new Date(),
//           referenceNumber: this.referenceNumber,
//           metadataKey: `certificate_meta_${this.applicationId}`
//         };

//         this.isSaved = true;
//         this.isGenerating = false;

//         this.snackBar.open('✓ Certificate saved! Ready for approval.', 'Close', {
//           duration: 5000,
//           panelClass: 'success-snackbar'
//         });

//         this.formSubmitted.emit(certificateData);

//       } catch (error) {
//         console.error('❌ Error saving certificate:', error);
//         this.isGenerating = false;
//         this.snackBar.open('Failed to save certificate. Please try again.', 'Close', { duration: 5000 });
//       }
//     } else {
//       this.searchForm.markAllAsTouched();
//       this.snackBar.open('Please fill all required fields', 'Close', { duration: 3000 });
//     }
//   }

//   previewCertificate() {
//     if (this.generatedCertificateData && this.generatedCertificateData.blob) {
//       const pdfUrl = URL.createObjectURL(this.generatedCertificateData.blob);
//       window.open(pdfUrl, '_blank');
//       setTimeout(() => URL.revokeObjectURL(pdfUrl), 1000);
//       this.snackBar.open('Opening certificate preview...', 'Close', { duration: 2000 });
//     } else {
//       this.snackBar.open('Please save the certificate first', 'Close', { duration: 3000 });
//     }
//   }

//   goToUploadTab() {
//     if (this.isSaved && this.generatedCertificateData && this.generatedCertificateData.blob) {
//       const certificateFile = new File(
//         [this.generatedCertificateData.blob],
//         `certificate_${this.referenceNumber}.pdf`,
//         { type: 'application/pdf' }
//       );

//       this.nextToUpload.emit({
//         certificateFile: certificateFile,
//         certificateBlob: this.generatedCertificateData.blob,
//         applicationId: this.applicationId,
//         referenceNumber: this.referenceNumber,
//         certificateData: this.generatedCertificateData.data
//       });

//       console.log('✅ Certificate file prepared for upload:', {
//         fileName: certificateFile.name,
//         fileSize: `${(certificateFile.size / 1024).toFixed(2)} KB`,
//         fileType: certificateFile.type,
//         owners: this.getOwnersList()
//       });
//     } else {
//       this.snackBar.open('Please save the certificate first before proceeding', 'Close', { duration: 3000 });
//     }
//   }

//   onCancel() {
//     this.cancelled.emit();
//   }
// }
import { Component, Input, Output, EventEmitter, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../auth/auth.service';
import { PdfGeneratorService } from '../../services/pdf-generator.service';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSelectModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './search-form.component.html',
  styleUrls: ['./search-form.component.css']
})
export class SearchComponent implements OnInit {
  @Input() applicationId!: number;
  @Input() parcelNumber!: string;
  @Input() referenceNumber!: string;
  @Input() applicantName: string = '';
  @Input() applicantId: number = 0;
  @Input() applicantEmail: string = '';
  @Input() applicantPhone: string = '';
  @Input() county: string = '';
  @Input() registry: string = '';
  @Input() purpose: string = '';
  @Input() searchType: string = 'parcel search';

  @Output() formSubmitted = new EventEmitter<any>();
  @Output() previewRequested = new EventEmitter<any>();
  @Output() nextToUpload = new EventEmitter<any>();
  @Output() cancelled = new EventEmitter<void>();

  searchForm: FormGroup;
  currentUser: any = null;
  hasSignature: boolean = false;
  isGenerating: boolean = false;
  isSaved: boolean = false;
  generatedCertificateData: any = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private pdfGeneratorService: PdfGeneratorService,
    private snackBar: MatSnackBar
  ) {
    this.searchForm = this.fb.group({
      referenceNumber: [{ value: '', disabled: true }],
      parcelNumber: [{ value: '', disabled: true }],
      purpose: [{ value: '', disabled: true }],
      applicantName: [{ value: '', disabled: true }],
      applicantEmail: [{ value: '', disabled: true }],
      applicantId: [{ value: '', disabled: true }],
      applicantPhone: [{ value: '', disabled: true }],
      IdNumber: [{ value: '', disabled: true }],
      searchDate: ['', Validators.required],
      landSize: ['', Validators.required],
      holdingType: ['', Validators.required],
      folio: [''],
      rent: [''],
      term: [''],
      nature_of_title: [''],
      inhibitions: [''],
      remarks: [''],
      signature: [''],
      owners: this.fb.array([])
    });
  }

  // Getter for owners FormArray
  get ownersArray(): FormArray {
    return this.searchForm.get('owners') as FormArray;
  }

  ngOnInit() {
    console.log('📥 SearchComponent received inputs:', {
      applicationId: this.applicationId,
      referenceNumber: this.referenceNumber,
      parcelNumber: this.parcelNumber,
      applicantName: this.applicantName
    });

    this.currentUser = this.authService.currentUserValue;
    this.hasSignature = !!this.currentUser?.signature;
    this.isSaved = false;

    const today = new Date().toISOString().split('T')[0];

    this.searchForm.patchValue({
      referenceNumber: this.referenceNumber,
      parcelNumber: this.parcelNumber,
      purpose: this.purpose,
      applicantName: this.applicantName,
      applicantEmail: this.applicantEmail,
      applicantId: this.applicantId,
      applicantPhone: this.applicantPhone,
      IdNumber: this.applicantId,
      searchDate: today
    });

    // Initialize with one owner
    this.addOwner();
  }

  // ========== OWNER MANAGEMENT METHODS ==========
  addOwner(): void {
    this.ownersArray.push(this.fb.control('', Validators.required));
  }

  removeOwner(index: number): void {
    if (this.ownersArray.length > 1) {
      this.ownersArray.removeAt(index);
    }
  }

  getOwnersList(): string[] {
    return this.ownersArray.value.filter((owner: string) => owner && owner.trim());
  }

  trackByIndex(index: number, item: any): number {
    return index;
  }

  // ========== SIGNATURE HELPER METHODS ==========
  getSignatureUrl(): string | null {
    if (!this.currentUser?.signature) {
      return null;
    }

    const signature = this.currentUser.signature;

    // If it's already a full URL starting with http
    if (signature.startsWith('http://') || signature.startsWith('https://')) {
      return signature;
    }

    // If it's a data URL (base64)
    if (signature.startsWith('data:')) {
      return signature;
    }

    // If it's a relative path starting with /media/ or /uploads/
    if (signature.startsWith('/')) {
      return `https://arthuronama.pythonanywhere.com${signature}`;
    }

    // If it's just a filename without path
    return `https://arthuronama.pythonanywhere.com/media/${signature}`;
  }

  handleSignatureImageError(event: any): void {
    console.error('Failed to load signature image from URL:', this.getSignatureUrl());
    event.target.style.display = 'none';

    // Show a fallback message
    const parent = event.target.parentElement;
    if (parent) {
      const errorDiv = document.createElement('div');
      errorDiv.className = 'text-danger mt-1';
      errorDiv.innerHTML = `
        <i class="bi bi-exclamation-triangle-fill me-1"></i>
        <small>Failed to load signature. Please upload a new signature in your profile.</small>
      `;
      parent.appendChild(errorDiv);
    }
  }

  // Helper method to convert image URL to base64
  async convertImageToBase64(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';

      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0);
        const base64 = canvas.toDataURL('image/png');
        resolve(base64);
      };

      img.onerror = () => {
        reject(new Error('Failed to load signature image'));
      };

      img.src = url;
    });
  }

  // ========== CERTIFICATE METHODS ==========
  async onSaveCertificate() {
    if (this.searchForm.valid) {
      const formValue = this.searchForm.getRawValue();
      const ownersList = this.getOwnersList();

      // Check if user has a signature in profile
      if (!this.hasSignature || !this.currentUser?.signature) {
        const snackBarRef = this.snackBar.open(
          'No signature found in your profile. Please upload your signature first.',
          'Go to Profile',
          {
            duration: 5000,
            panelClass: 'warning-snackbar'
          }
        );

        snackBarRef.onAction().subscribe(() => {
          // Navigate to profile when button is clicked
          window.location.href = '/profile';
        });
        return;
      }

      if (ownersList.length === 0) {
        this.snackBar.open('Please add at least one owner', 'Close', { duration: 3000 });
        return;
      }

      this.isGenerating = true;

      try {
        // Use the signature from profile
        const signatureUrl = this.getSignatureUrl();

        // Convert signature URL to base64 if needed
        let signatureBase64 = '';
        if (signatureUrl && signatureUrl.startsWith('data:')) {
          signatureBase64 = signatureUrl;
        } else if (signatureUrl) {
          // Fetch the signature image and convert to base64
          signatureBase64 = await this.convertImageToBase64(signatureUrl);
        }

        const certificateData = {
          ...formValue,
          owners: ownersList,
          owner_names: ownersList.join(', '),
          proprietor: ownersList.length > 1 ? ownersList.join(' & ') : ownersList[0],
          applicationId: this.applicationId,
          applicantName: this.applicantName,
          applicantEmail: this.applicantEmail,
          applicantPhone: this.applicantPhone,
          IdNumber: this.applicantId,
          registrarName: this.currentUser?.username || 'Registrar',
          registry: this.registry,
          county: this.county,
          signature: signatureBase64 // Use the signature from profile
        };

        const pdf = await this.pdfGeneratorService.generateSearchCertificate(
          certificateData,
          this.currentUser?.username || 'Registrar',
          this.registry,
          this.county
        );

        const pdfBlob = pdf.output('blob');

        const metadata = {
          applicationId: this.applicationId,
          referenceNumber: this.referenceNumber,
          generatedAt: new Date().toISOString(),
          size: pdfBlob.size,
          hasSignature: true,
          owners: ownersList,
          formData: certificateData
        };

        localStorage.setItem(`certificate_meta_${this.applicationId}`, JSON.stringify(metadata));

        this.generatedCertificateData = {
          blob: pdfBlob,
          data: certificateData,
          generatedAt: new Date(),
          referenceNumber: this.referenceNumber,
          metadataKey: `certificate_meta_${this.applicationId}`
        };

        this.isSaved = true;
        this.isGenerating = false;

        this.snackBar.open('✓ Certificate saved! Ready for approval.', 'Close', {
          duration: 5000,
          panelClass: 'success-snackbar'
        });

        this.formSubmitted.emit(certificateData);

      } catch (error) {
        console.error('❌ Error saving certificate:', error);
        this.isGenerating = false;
        this.snackBar.open('Failed to save certificate. Please try again.', 'Close', { duration: 5000 });
      }
    } else {
      this.searchForm.markAllAsTouched();
      this.snackBar.open('Please fill all required fields', 'Close', { duration: 3000 });
    }
  }

  previewCertificate() {
    if (this.generatedCertificateData && this.generatedCertificateData.blob) {
      const pdfUrl = URL.createObjectURL(this.generatedCertificateData.blob);
      window.open(pdfUrl, '_blank');
      setTimeout(() => URL.revokeObjectURL(pdfUrl), 1000);
      this.snackBar.open('Opening certificate preview...', 'Close', { duration: 2000 });
    } else {
      this.snackBar.open('Please save the certificate first', 'Close', { duration: 3000 });
    }
  }

  goToUploadTab() {
    if (this.isSaved && this.generatedCertificateData && this.generatedCertificateData.blob) {
      const certificateFile = new File(
        [this.generatedCertificateData.blob],
        `certificate_${this.referenceNumber}.pdf`,
        { type: 'application/pdf' }
      );

      this.nextToUpload.emit({
        certificateFile: certificateFile,
        certificateBlob: this.generatedCertificateData.blob,
        applicationId: this.applicationId,
        referenceNumber: this.referenceNumber,
        certificateData: this.generatedCertificateData.data
      });

      console.log('✅ Certificate file prepared for upload:', {
        fileName: certificateFile.name,
        fileSize: `${(certificateFile.size / 1024).toFixed(2)} KB`,
        fileType: certificateFile.type,
        owners: this.getOwnersList()
      });
    } else {
      this.snackBar.open('Please save the certificate first before proceeding', 'Close', { duration: 3000 });
    }
  }

  onCancel() {
    this.cancelled.emit();
  }
}
