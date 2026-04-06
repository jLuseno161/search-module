import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { AuthService } from "../auth/auth.service";
import { Application, Registrar } from '../shared/interfaces/application';

export interface ApiApplication {
  id: number;
  id_no: number;
  reference_number: string;
  parcel_number: string;
  purpose: string;
  payment?: {
    id: number;
    amount: string;
    invoice_number: string;
    payment_reference: string;
    merchant_request_id: string;
    paid_at: string;  // This is the payment date
  };
  dateSubmitted?: string;
  county: string;
  registry: string;
  status: string;
  submitted_at: string;
  assigned_to?: any;
  applicant?: any;
  user?: {
    normal?: {
      id_no: number,
      id: number;
      username: string;
      first_name: string;
      last_name: string;
      email: string;
    };
  };
  certificate?: {
    signed_file: string;
    uploaded_at: string;
  };
}

export interface ApiResponse {
  count: number;
  next: string;
  previous: string;
  results: ApiApplication[];
}

export interface UserResponse {
  count: number;
  next: string;
  previous: string;
  results: Registrar[];
}

export interface SignatureResponse {
  message: string;
  signature: string;
}

export interface SignatureStatusResponse {
  has_signature: boolean;
  signature_url?: string;
}

export interface ErrorResponse {
  error?: string;
  detail?: string;
  signature?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class ApplicationService {
  private apiUrl = 'https://arthuronama.pythonanywhere.com/api/v1';

  constructor(private http: HttpClient, private authService: AuthService) {}

  // ========== APPLICATION METHODS ==========

  getRegistrarInChargeApplications(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.apiUrl}/registrar-in-charge/submitted`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  assignApplication(applicationId: number, registrarId: number): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/registrar-in-charge/assign/${applicationId}`,
      { registrar_id: registrarId },
      { headers: this.authService.getAuthHeaders() }
    ).pipe(
      tap(response => console.log('✅ Assignment successful:', response)),
      catchError(error => {
        console.error('❌ Assignment failed:', error);
        return throwError(() => error);
      })
    );
  }

  getRegistrarAssignedApplications(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.apiUrl}/registrar/assigned`, {
      headers: this.authService.getAuthHeaders()
    }).pipe(
      tap(response => console.log('✅ Registrar assigned apps response:', response)),
      catchError(error => {
        console.error('❌ Registrar assigned apps error:', error);
        return throwError(() => error);
      })
    );
  }

  // ========== REGISTRAR METHODS ==========
// In application.service.ts - Update getAvailableRegistrars method

getAvailableRegistrars(currentUserRegistry: string): Observable<Registrar[]> {
  console.log('🔍 Fetching registrars for registry:', currentUserRegistry);

  return this.http.get<UserResponse>(`${this.apiUrl}/users`).pipe(
    map(users => {
      console.log('👥 Full API response for users:', users);

      // Handle different response structures
      let usersArray = [];
      if (users && users.results && Array.isArray(users.results)) {
        usersArray = users.results;
      } else if (Array.isArray(users)) {
        usersArray = users;
      } else {
        console.log('❌ No users array found in response');
        return [];
      }

      console.log('👥 All users from API:', usersArray);

      // Check the structure of first user to see what fields are available
      if (usersArray.length > 0) {
        console.log('📋 First user structure:', Object.keys(usersArray[0]));
        console.log('📋 First user data:', usersArray[0]);
      }

      const filteredRegistrars = usersArray.filter(user => {
        // Check for role in different possible locations
        const userRole = user.role || user.user_role || user.roles?.[0] || (user as any).user_type;

        // Check if user is a registrar (based on roles array or role field)
        let isRegistrar = false;

        // Check if roles array exists and contains 'is_registrar'
        if (user.roles && Array.isArray(user.roles)) {
          isRegistrar = user.roles.includes('is_registrar');
        }
        // Check if role field equals 'is_registrar'
        else if (userRole === 'is_registrar') {
          isRegistrar = true;
        }

        // Also check if user has any of these role indicators
        const hasRegistrarRole = userRole === 'is_registrar' ||
                                (user.roles && user.roles.includes('is_registrar')) ||
                                user.user_type === 'registrar';

        const matchesRegistry = user.registry === currentUserRegistry;

        console.log(`User ${user.username}: role=${userRole}, roles=${user.roles}, isRegistrar=${hasRegistrarRole}, registry=${user.registry}, matches=${hasRegistrarRole && matchesRegistry}`);

        return hasRegistrarRole && matchesRegistry;
      });

      console.log(`✅ Found ${filteredRegistrars.length} registrars for registry: ${currentUserRegistry}`);
      console.log('Filtered registrars:', filteredRegistrars);

      return filteredRegistrars.map(user => ({
        id: user.id,
        name: this.formatUserName(user),
        username: user.username,
        email: user.email,
        county: user.county,
        registry: user.registry,
        role: user.role || (user.roles && user.roles[0]) || 'is_registrar',
        first_name: user.first_name,
        last_name: user.last_name
      }));
    }),
    catchError(error => {
      console.error('❌ Error loading registrars:', error);
      return of([]);
    })
  );
}

// In application.service.ts
uploadCertificate(applicationId: number, formData: FormData): Observable<any> {
  console.log(formData);
  const url = `${this.apiUrl}/registrar/approve/${applicationId}`;
  console.log(url);
  return this.http.post(url, formData, {
    headers: this.authService.getAuthHeaders().delete('Content-Type')
  }).pipe(
    tap(response => {
      console.log('✅ Certificate uploaded successfully:', response);
    }),
    catchError((error: HttpErrorResponse) => {

      return throwError(() => error);
    })
  );
}
  rejectApplication(applicationId: number, rejectData: {comment: string}): Observable<any> {
    const url = `${this.apiUrl}/registrar/reject/${applicationId}`;
    const requestData = { comment: rejectData.comment };

    return this.http.post(url, requestData, {
      headers: this.authService.getAuthHeaders()
    }).pipe(
      tap(response => console.log('✅ Application rejected successfully:', response)),
      catchError(error => {
        console.error('❌ Rejection failed:', error);
        return throwError(() => error);
      })
    );
  }

  returnApplication(applicationId: number, returnData: {comment: string}): Observable<any> {
    const url = `${this.apiUrl}/registrar/return/${applicationId}`;

    return this.http.post(url, returnData, {
      headers: this.authService.getAuthHeaders()
    }).pipe(
      tap(response => console.log('✅ Application returned successfully:', response)),
      catchError(error => {
        console.error('❌ Return failed:', error);
        return throwError(() => error);
      })
    );
  }

  // ========== SIGNATURE METHODS ==========

  uploadRegistrarSignature(formData: FormData): Observable<SignatureResponse> {
    const url = `${this.apiUrl}/users/me/signature/`;

    console.log('📤 Uploading signature to:', url);

    return this.http.post<SignatureResponse>(url, formData, {
      headers: this.authService.getAuthHeaders().delete('Content-Type')
    }).pipe(
      tap(response => {
        console.log('✅ Signature uploaded successfully:', response);
        const currentUser = localStorage.getItem('currentUser');
        if (currentUser && response.signature) {
          const user = JSON.parse(currentUser);
          user.signature = response.signature;
          localStorage.setItem('currentUser', JSON.stringify(user));
          this.authService['currentUserSubject'].next(user);
        }
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('❌ Signature upload failed:', error);

        let errorMessage = 'Failed to upload signature. ';

        if (error.status === 400) {
          if (error.error?.signature) {
            errorMessage += error.error.signature.join(', ');
          } else if (error.error?.error) {
            errorMessage += error.error.error;
          } else if (error.error?.detail) {
            errorMessage += error.error.detail;
          } else {
            errorMessage += 'Invalid file. Please ensure dimensions are 300x100px and size is under 200KB.';
          }
        } else if (error.status === 401) {
          errorMessage += 'Please login again.';
        } else if (error.status === 403) {
          errorMessage += 'You don\'t have permission to upload a signature.';
        } else {
          errorMessage += 'Please try again.';
        }

        return throwError(() => new Error(errorMessage));
      })
    );
  }

  checkRegistrarSignature(registrarId: number): Observable<SignatureStatusResponse> {
    return this.http.get<SignatureStatusResponse>(`${this.apiUrl}/users/${registrarId}/signature-status/`, {
      headers: this.authService.getAuthHeaders()
    }).pipe(
      catchError(error => {
        console.error('Error checking signature:', error);
        return of({has_signature: false});
      })
    );
  }

  removeRegistrarSignature(): Observable<any> {
    return this.http.delete(`${this.apiUrl}/users/me/signature/`, {
      headers: this.authService.getAuthHeaders()
    }).pipe(
      tap(response => console.log('✅ Signature removed:', response)),
      catchError(error => {
        console.error('❌ Signature removal failed:', error);
        return throwError(() => error);
      })
    );
  }

  // ========== PASSWORD METHODS ==========

  changePassword(passwordData: {current_password: string, password: string, passwordconfirm: string}): Observable<any> {
    return this.http.post(`${this.apiUrl}/change-password/`, passwordData, {
      headers: this.authService.getAuthHeaders()
    }).pipe(
      tap(response => console.log('✅ Password changed:', response)),
      catchError(error => {
        console.error('❌ Password change failed:', error);
        return throwError(() => error);
      })
    );
  }

  // ========== HELPER METHODS ==========

  private formatUserName(user: any): string {
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    } else if (user.name) {
      return user.name;
    } else {
      return user.username;
    }
  }

  completeApplication(applicationId: number): Observable<any> {
    return this.http.patch(`${this.apiUrl}/applications/${applicationId}/`, {
      status: 'completed'
    });
  }

  verifyApplication(applicationId: number): Observable<any> {
    return this.http.patch(`${this.apiUrl}/applications/${applicationId}/`, {
      status: 'verified'
    });
  }
  // In application.service.ts
saveCertificate(certificateData: any): Observable<any> {
  const formData = new FormData();

  // Append all fields to FormData
  Object.keys(certificateData).forEach(key => {
    if (key === 'certificate_pdf' && certificateData[key] instanceof Blob) {
      formData.append('certificate_pdf', certificateData[key], `certificate_${certificateData.referenceNumber}.pdf`);
    } else if (certificateData[key] !== null && certificateData[key] !== undefined) {
      formData.append(key, certificateData[key].toString());
    }
  });

  const url = `${this.apiUrl}/certificates/save/`;

  return this.http.post(url, formData, {
    headers: this.authService.getAuthHeaders().delete('Content-Type')
  }).pipe(
    tap(response => {
      console.log('✅ Certificate saved to backend:', response);
    }),
    catchError((error: HttpErrorResponse) => {
      console.error('❌ Save certificate failed:', error);
      return throwError(() => error);
    })
  );
}

// Also add method to get certificate by application
getCertificateByApplication(applicationId: number): Observable<any> {
  const url = `${this.apiUrl}/certificates/application/${applicationId}/`;
  return this.http.get(url, {
    headers: this.authService.getAuthHeaders()
  });
}
// Get completed applications (historical works) for a registrar
getRegistrarHistoricalApplications(): Observable<any> {
  return this.http.get(`${this.apiUrl}/registrar/completed`, {
    headers: this.authService.getAuthHeaders()
  }).pipe(
    tap(response => console.log('✅ Historical applications response:', response)),
    catchError(error => {
      console.error('❌ Error fetching historical applications:', error);
      return throwError(() => error);
    })
  );
}

// Alternative: Get applications by status
getApplicationsByStatus(status: string): Observable<any> {
  return this.http.get(`${this.apiUrl}/registrar/applications?status=${status}`, {
    headers: this.authService.getAuthHeaders()
  }).pipe(
    catchError(error => {
      console.error(`❌ Error fetching ${status} applications:`, error);
      return throwError(() => error);
    })
  );
}
// Get supporting document for an application
getSupportingDocument(applicationId: number): Observable<any> {
  return this.http.get(`${this.apiUrl}/applications/${applicationId}/supporting-document`, {
    headers: this.authService.getAuthHeaders()
  }).pipe(
    tap(response => console.log('✅ Supporting document response:', response)),
    catchError(error => {
      console.error('❌ Error fetching supporting document:', error);
      return throwError(() => error);
    })
  );
}

// Alternative: Get all documents for an application
getApplicationDocuments(applicationId: number): Observable<any> {
  return this.http.get(`${this.apiUrl}/applications/${applicationId}/documents`, {
    headers: this.authService.getAuthHeaders()
  }).pipe(
    catchError(error => {
      console.error('❌ Error fetching documents:', error);
      return throwError(() => error);
    })
  );
}
}
