// import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
// import { Router } from '@angular/router';
// import { MatCardModule } from '@angular/material/card';
// import { MatButtonModule } from '@angular/material/button';
// import { MatIconModule } from '@angular/material/icon';
// import { MatInputModule } from '@angular/material/input';
// import { MatFormFieldModule } from '@angular/material/form-field';
// import { MatSlideToggleModule } from '@angular/material/slide-toggle';
// import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
// import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
// import { AuthService } from '../../../auth/auth.service';
// import { ApplicationService } from '../../../services/application.service';

// @Component({
//   selector: 'app-profile',
//   standalone: true,
//   imports: [
//     CommonModule,
//     FormsModule,
//     ReactiveFormsModule,
//     MatCardModule,
//     MatButtonModule,
//     MatIconModule,
//     MatInputModule,
//     MatFormFieldModule,
//     MatSlideToggleModule,
//     MatSnackBarModule,
//     MatProgressSpinnerModule
//   ],
//   templateUrl: './profile.component.html',
//   styleUrls: ['./profile.component.css']
// })
// export class ProfileComponent implements OnInit, AfterViewInit {
//   @ViewChild('signatureCanvas', { static: false }) signatureCanvas!: ElementRef<HTMLCanvasElement>;

//   user: any = null;
//   hasSignature: boolean = false;
//   isUploading: boolean = false;
//   uploadError: string = '';

//   // Canvas drawing properties
//   private drawing = false;
//   private ctx!: CanvasRenderingContext2D;

//   passwordForm: FormGroup;

//   // Canvas dimension limits (matching backend)
//   private readonly MAX_WIDTH = 300;
//   private readonly MAX_HEIGHT = 100;
//   private readonly MAX_SIZE_KB = 200;

//   constructor(
//     private authService: AuthService,
//     private applicationService: ApplicationService,
//     private snackBar: MatSnackBar,
//     private fb: FormBuilder,
//     private router: Router
//   ) {
//     console.log('🏗️ ProfileComponent constructor called');

//     this.passwordForm = this.fb.group({
//       current_password: ['', Validators.required],
//       password: ['', [Validators.required, Validators.minLength(8)]],
//       passwordconfirm: ['', Validators.required]
//     }, { validator: this.passwordMatchValidator });
//   }

//   ngOnInit(): void {
//     console.log('🔄 ProfileComponent ngOnInit started');
//     this.loadUserData();
//     this.debugLocalStorage();
//   }

//   ngAfterViewInit(): void {
//     console.log('🎨 ProfileComponent ngAfterViewInit - initializing canvas');
//     setTimeout(() => {
//       this.initCanvas();
//     });
//   }

//   private debugLocalStorage(): void {
//     console.log('📦 ===== LOCAL STORAGE DEBUG =====');
//     const currentUser = localStorage.getItem('currentUser');
//     console.log('currentUser raw:', currentUser);

//     if (currentUser) {
//       try {
//         const user = JSON.parse(currentUser);
//         console.log('currentUser parsed:', user);
//         console.log('id_no:', user.id_no);
//         console.log('signature:', user.signature ? 'Present' : 'Not present');
//       } catch (e) {
//         console.error('Error parsing currentUser:', e);
//       }
//     }
//   }

//   passwordMatchValidator(g: FormGroup) {
//     return g.get('password')?.value === g.get('passwordconfirm')?.value
//       ? null : { mismatch: true };
//   }

//   loadUserData(): void {
//     console.log('👤 Loading user data from AuthService');
//     this.user = this.authService.currentUserValue;
//     this.hasSignature = !!this.user?.signature;
//     console.log('👤 Has signature:', this.hasSignature);
//   }

//   initCanvas(): void {
//     console.log('🎨 Initializing signature canvas');
//     const canvas = this.signatureCanvas?.nativeElement;

//     if (canvas) {
//       // Force dimensions to be correct
//       if (canvas.width !== this.MAX_WIDTH || canvas.height !== this.MAX_HEIGHT) {
//         console.warn(`Fixing canvas dimensions from ${canvas.width}x${canvas.height} to ${this.MAX_WIDTH}x${this.MAX_HEIGHT}`);
//         canvas.width = this.MAX_WIDTH;
//         canvas.height = this.MAX_HEIGHT;
//       }

//       console.log('✅ Canvas dimensions:', canvas.width, 'x', canvas.height);
//       this.ctx = canvas.getContext('2d')!;

//       // Configure drawing style
//       this.ctx.strokeStyle = '#000';
//       this.ctx.lineWidth = 2;
//       this.ctx.lineCap = 'round';
//       this.ctx.lineJoin = 'round';

//       // Fill with white background
//       this.ctx.fillStyle = 'white';
//       this.ctx.fillRect(0, 0, canvas.width, canvas.height);

//       console.log('✅ Canvas context initialized');
//     } else {
//       console.error('❌ Canvas element not found!');
//     }
//   }

//   startDrawing(event: MouseEvent): void {
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

//   draw(event: MouseEvent): void {
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

//   stopDrawing(): void {
//     this.drawing = false;
//   }

//   clearSignature(): void {
//     console.log('🧹 Clearing signature canvas');
//     const canvas = this.signatureCanvas.nativeElement;

//     // Ensure dimensions are correct
//     if (canvas.width !== this.MAX_WIDTH || canvas.height !== this.MAX_HEIGHT) {
//       canvas.width = this.MAX_WIDTH;
//       canvas.height = this.MAX_HEIGHT;
//     }

//     this.ctx.clearRect(0, 0, canvas.width, canvas.height);
//     this.ctx.fillStyle = 'white';
//     this.ctx.fillRect(0, 0, canvas.width, canvas.height);
//     this.uploadError = '';
//     console.log('✅ Canvas cleared');
//   }

//   isCanvasEmpty(): boolean {
//     const canvas = this.signatureCanvas.nativeElement;
//     const imageData = this.ctx.getImageData(0, 0, canvas.width, canvas.height);

//     // Check for non-white pixels (white is 255,255,255)
//     for (let i = 0; i < imageData.data.length; i += 4) {
//       const r = imageData.data[i];
//       const g = imageData.data[i+1];
//       const b = imageData.data[i+2];
//       if (r !== 255 || g !== 255 || b !== 255) {
//         return false; // Found a drawing
//       }
//     }
//     return true; // Empty canvas
//   }

//   saveSignature(): void {
//     console.log('💾 Saving signature');
//     this.uploadError = '';
//     const canvas = this.signatureCanvas.nativeElement;

//     // Force correct dimensions
//     if (canvas.width !== this.MAX_WIDTH || canvas.height !== this.MAX_HEIGHT) {
//       console.warn(`Fixing dimensions before save`);
//       canvas.width = this.MAX_WIDTH;
//       canvas.height = this.MAX_HEIGHT;
//       this.initCanvas();
//     }

//     // Check if canvas has drawing
//     if (this.isCanvasEmpty()) {
//       this.snackBar.open('Please draw your signature first', 'Close', { duration: 3000 });
//       return;
//     }

//     // Convert to blob
//     canvas.toBlob((blob) => {
//       if (!blob) {
//         this.snackBar.open('Failed to create signature image', 'Close', { duration: 3000 });
//         return;
//       }

//       // Check file size
//       const sizeKB = blob.size / 1024;
//       if (sizeKB > this.MAX_SIZE_KB) {
//         this.snackBar.open(`Signature too large: ${sizeKB.toFixed(2)}KB. Max ${this.MAX_SIZE_KB}KB`, 'Close', { duration: 5000 });
//         return;
//       }

//       // Upload
//       const formData = new FormData();
//       formData.append('signature', blob, 'signature.png');

//       this.isUploading = true;
//       this.applicationService.uploadRegistrarSignature(formData).subscribe({
//         next: (response: any) => {
//           this.isUploading = false;
//           this.snackBar.open('Signature uploaded successfully!', 'Close', { duration: 3000 });

//           // Update local user data
//           if (this.user) {
//             this.user.signature = response.signature;
//             this.hasSignature = true;
//             const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
//             currentUser.signature = response.signature;
//             localStorage.setItem('currentUser', JSON.stringify(currentUser));
//             this.authService['currentUserSubject'].next(currentUser);
//           }
//         },
//         error: (error) => {
//           this.isUploading = false;
//           console.error('Upload failed:', error);

//           let errorMessage = 'Failed to upload signature. ';
//           if (error.error?.error) {
//             errorMessage += error.error.error;
//           } else if (error.error?.detail) {
//             errorMessage += error.error.detail;
//           } else {
//             errorMessage += 'Please try again.';
//           }

//           this.uploadError = errorMessage;
//           this.snackBar.open(errorMessage, 'Close', { duration: 5000 });
//         }
//       });
//     }, 'image/png');
//   }

//   resetSignature(): void {
//     if (confirm('Clear the canvas to draw a new signature?')) {
//       this.clearSignature();
//       this.uploadError = '';
//       this.snackBar.open('Canvas cleared. Draw your new signature and click Save.', 'Close', { duration: 3000 });
//     }
//   }

//   changePassword(): void {
//     if (this.passwordForm.valid) {
//       const passwordData = this.passwordForm.value;

//       if (passwordData.password !== passwordData.passwordconfirm) {
//         this.snackBar.open('New password and confirm password do not match', 'Close', { duration: 3000 });
//         return;
//       }

//       this.applicationService.changePassword(passwordData).subscribe({
//         next: (response) => {
//           this.snackBar.open('Password changed successfully!', 'Close', { duration: 3000 });
//           this.passwordForm.reset();
//         },
//         error: (error) => {
//           console.error('Password change failed:', error);
//           let errorMessage = 'Failed to change password. ';
//           if (error.error?.current_password) {
//             errorMessage += error.error.current_password.join(', ');
//           } else if (error.error?.password) {
//             errorMessage += error.error.password.join(', ');
//           } else {
//             errorMessage += 'Please try again.';
//           }
//           this.snackBar.open(errorMessage, 'Close', { duration: 5000 });
//         }
//       });
//     } else {
//       this.passwordForm.markAllAsTouched();
//       this.snackBar.open('Please fill all required fields correctly', 'Close', { duration: 3000 });
//     }
//   }
//   // In application.service.ts
// // checkUserSignature(): Observable<{has_signature: boolean, signature_url?: string}> {
// //   return this.http.get<{has_signature: boolean, signature_url?: string}>(
// //     `${this.apiUrl}/users/me/signature-status/`,
// //     { headers: this.authService.getAuthHeaders() }
// //   ).pipe(
// //     catchError(error => {
// //       console.error('Error checking signature:', error);
// //       return of({has_signature: false});
// //     })
// //   );
// // }
// }

import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../auth/auth.service';
import { ApplicationService, SignatureResponse } from '../../../services/application.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatSlideToggleModule,
    MatSnackBarModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit, AfterViewInit {
  @ViewChild('signatureCanvas', { static: false }) signatureCanvas!: ElementRef<HTMLCanvasElement>;

  user: any = null;
  hasSignature: boolean = false;
  isUploading: boolean = false;
  uploadError: string = '';

  // Canvas drawing properties
  private drawing = false;
  private ctx!: CanvasRenderingContext2D;

  passwordForm: FormGroup;

  // Canvas dimension limits (matching backend)
  private readonly MAX_WIDTH = 300;
  private readonly MAX_HEIGHT = 100;
  private readonly MAX_SIZE_KB = 200;

  constructor(
    private authService: AuthService,
    private applicationService: ApplicationService,
    private snackBar: MatSnackBar,
    private fb: FormBuilder,
    private router: Router
  ) {
    console.log('🏗️ ProfileComponent constructor called');

    this.passwordForm = this.fb.group({
      current_password: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(8)]],
      passwordconfirm: ['', Validators.required]
    }, { validator: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    console.log('🔄 ProfileComponent ngOnInit started');
    this.loadUserData();
    
    this.debugLocalStorage();
  }

  ngAfterViewInit(): void {
    console.log('🎨 ProfileComponent ngAfterViewInit - initializing canvas');
    setTimeout(() => {
      this.initCanvas();
    });
  }

  private debugLocalStorage(): void {
    console.log('📦 ===== LOCAL STORAGE DEBUG =====');
    const currentUser = localStorage.getItem('currentUser');
    console.log('currentUser raw:', currentUser);

    if (currentUser) {
      try {
        const user = JSON.parse(currentUser);
        console.log('currentUser parsed:', user);
        console.log('id_no:', user.id_no);
        console.log('signature:', user.signature ? 'Present' : 'Not present');
      } catch (e) {
        console.error('Error parsing currentUser:', e);
      }
    }
  }

  passwordMatchValidator(g: FormGroup) {
    return g.get('password')?.value === g.get('passwordconfirm')?.value
      ? null : { mismatch: true };
  }

 loadUserData(): void {
  console.log('👤 Loading user data from AuthService');
  this.user = this.authService.currentUserValue;
  this.hasSignature = !!this.user?.signature;

  // Add detailed debug logging
  console.log('👤 User object:', this.user);
  console.log('👤 User signature property:', this.user?.signature);
  console.log('👤 User signature type:', typeof this.user?.signature);
  console.log('👤 Has signature:', this.hasSignature);
  console.log('👤 User ID No:', this.user?.id_no);

  // Also check if signature exists in localStorage
  const storedUser = localStorage.getItem('currentUser');
  if (storedUser) {
    const parsedUser = JSON.parse(storedUser);
    console.log('👤 Stored user signature:', parsedUser.signature);
  }
}

  initCanvas(): void {
    console.log('🎨 Initializing signature canvas');
    const canvas = this.signatureCanvas?.nativeElement;

    if (canvas) {
      if (canvas.width !== this.MAX_WIDTH || canvas.height !== this.MAX_HEIGHT) {
        console.warn(`Fixing canvas dimensions from ${canvas.width}x${canvas.height} to ${this.MAX_WIDTH}x${this.MAX_HEIGHT}`);
        canvas.width = this.MAX_WIDTH;
        canvas.height = this.MAX_HEIGHT;
      }

      console.log('✅ Canvas dimensions:', canvas.width, 'x', canvas.height);
      this.ctx = canvas.getContext('2d')!;

      this.ctx.strokeStyle = '#000';
      this.ctx.lineWidth = 2;
      this.ctx.lineCap = 'round';
      this.ctx.lineJoin = 'round';

      this.ctx.fillStyle = 'white';
      this.ctx.fillRect(0, 0, canvas.width, canvas.height);

      console.log('✅ Canvas context initialized');
    } else {
      console.error('❌ Canvas element not found!');
    }
  }

  startDrawing(event: MouseEvent): void {
    this.drawing = true;
    const canvas = this.signatureCanvas.nativeElement;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;

    this.ctx.beginPath();
    this.ctx.moveTo(x, y);
  }

  draw(event: MouseEvent): void {
    if (!this.drawing) return;
    event.preventDefault();

    const canvas = this.signatureCanvas.nativeElement;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;

    this.ctx.lineTo(x, y);
    this.ctx.stroke();
    this.ctx.beginPath();
    this.ctx.moveTo(x, y);
  }

  stopDrawing(): void {
    this.drawing = false;
  }

  clearSignature(): void {
    console.log('🧹 Clearing signature canvas');
    const canvas = this.signatureCanvas.nativeElement;

    if (canvas.width !== this.MAX_WIDTH || canvas.height !== this.MAX_HEIGHT) {
      canvas.width = this.MAX_WIDTH;
      canvas.height = this.MAX_HEIGHT;
    }

    this.ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.ctx.fillStyle = 'white';
    this.ctx.fillRect(0, 0, canvas.width, canvas.height);
    this.uploadError = '';
    console.log('✅ Canvas cleared');
  }

  isCanvasEmpty(): boolean {
    const canvas = this.signatureCanvas.nativeElement;
    const imageData = this.ctx.getImageData(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < imageData.data.length; i += 4) {
      const r = imageData.data[i];
      const g = imageData.data[i+1];
      const b = imageData.data[i+2];
      if (r !== 255 || g !== 255 || b !== 255) {
        return false;
      }
    }
    return true;
  }

  saveSignature(): void {
    console.log('💾 Saving signature');
    this.uploadError = '';
    const canvas = this.signatureCanvas.nativeElement;

    if (canvas.width !== this.MAX_WIDTH || canvas.height !== this.MAX_HEIGHT) {
      console.warn(`Fixing dimensions before save`);
      canvas.width = this.MAX_WIDTH;
      canvas.height = this.MAX_HEIGHT;
      this.initCanvas();
    }

    if (this.isCanvasEmpty()) {
      this.snackBar.open('Please draw your signature first', 'Close', { duration: 3000 });
      return;
    }

    canvas.toBlob((blob) => {
      if (!blob) {
        this.snackBar.open('Failed to create signature image', 'Close', { duration: 3000 });
        return;
      }

      const sizeKB = blob.size / 1024;
      if (sizeKB > this.MAX_SIZE_KB) {
        this.snackBar.open(`Signature too large: ${sizeKB.toFixed(2)}KB. Max ${this.MAX_SIZE_KB}KB`, 'Close', { duration: 5000 });
        return;
      }

      const formData = new FormData();
      formData.append('signature', blob, 'signature.png');

      this.isUploading = true;

      this.applicationService.uploadRegistrarSignature(formData).subscribe({
        next: (response: SignatureResponse) => {
          console.log('✅ Signature upload response:', response);
          this.isUploading = false;
          this.snackBar.open(response.message || 'Signature uploaded successfully!', 'Close', { duration: 3000 });

          if (this.user) {
            this.user.signature = response.signature;
            this.hasSignature = true;

            const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
            currentUser.signature = response.signature;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));

            this.authService['currentUserSubject'].next(currentUser);

            console.log('✅ User data updated with new signature');
          }
        },
        error: (error) => {
          this.isUploading = false;
          console.error('❌ Signature upload failed:', error);

          let errorMessage = 'Failed to upload signature. ';

          if (error.error) {
            if (typeof error.error === 'string') {
              errorMessage += error.error;
            } else if (error.error.error) {
              errorMessage += error.error.error;
            } else if (error.error.detail) {
              errorMessage += error.error.detail;
            } else if (error.error.signature) {
              errorMessage += error.error.signature.join(', ');
            } else {
              errorMessage += 'Please ensure dimensions are 300x100px and size is under 200KB.';
            }
          } else {
            errorMessage += 'Please try again.';
          }

          this.uploadError = errorMessage;
          this.snackBar.open(errorMessage, 'Close', { duration: 5000 });
        }
      });
    }, 'image/png');
  }

  resetSignature(): void {
    if (confirm('Clear the canvas to draw a new signature?')) {
      this.clearSignature();
      this.uploadError = '';
      this.snackBar.open('Canvas cleared. Draw your new signature and click Save.', 'Close', { duration: 3000 });
    }
  }

  changePassword(): void {
    console.log('🔐 ===== CHANGE PASSWORD STARTED =====');

    if (this.passwordForm.valid) {
      const passwordData = this.passwordForm.value;

      if (passwordData.password !== passwordData.passwordconfirm) {
        this.snackBar.open('New password and confirm password do not match', 'Close', { duration: 3000 });
        return;
      }

      this.applicationService.changePassword(passwordData).subscribe({
        next: (response) => {
          console.log('✅ Password change response:', response);
          this.snackBar.open('Password changed successfully!', 'Close', { duration: 3000 });
          this.passwordForm.reset();
        },
        error: (error) => {
          console.error('❌ Password change failed:', error);

          let errorMessage = 'Failed to change password. ';
          if (error.error?.current_password) {
            errorMessage += error.error.current_password.join(', ');
          } else if (error.error?.password) {
            errorMessage += error.error.password.join(', ');
          } else if (error.error?.detail) {
            errorMessage += error.error.detail;
          } else {
            errorMessage += 'Please try again.';
          }

          this.snackBar.open(errorMessage, 'Close', { duration: 5000 });
        }
      });
    } else {
      this.passwordForm.markAllAsTouched();
      this.snackBar.open('Please fill all required fields correctly', 'Close', { duration: 3000 });
    }
  }
  getSignatureUrl(): string | null {
  if (!this.user?.signature) {
    return null;
  }

  const signature = this.user.signature;

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
    errorDiv.className = 'signature-error';
    errorDiv.innerHTML = `
      <mat-icon color="warning">error</mat-icon>
      <span>Failed to load signature. Please upload a new signature.</span>
    `;
    parent.appendChild(errorDiv);
  }

  this.snackBar.open('Failed to load signature image. Please upload a new signature.', 'Close', { duration: 5000 });
}
}
