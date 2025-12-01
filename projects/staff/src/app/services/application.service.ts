import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { AuthService } from "../auth/auth.service";
import { Application, Registrar } from '../shared/interfaces/application';

export interface ApiApplication {
  id: number;
  reference_number: string;
  parcel_number: string;
  purpose: string;
  county: string;
  registry: string;
  status: string;
  submitted_at: string;
  assigned_to?: any; // Can be object or number
  applicant?: any; // Can be object or number
  user?: {
    normal?: {
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

@Injectable({
  providedIn: 'root'
})
export class ApplicationService {
  private apiUrl = 'https://odipojames.pythonanywhere.com/api/v1';

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

  getAvailableRegistrars(currentUserRegistry: string): Observable<Registrar[]> {
    return this.http.get<UserResponse>(`${this.apiUrl}/users`).pipe(
      map(users => {
        console.log('👥 Loading registrars for registry:', currentUserRegistry);

        if (!users.results || users.results.length === 0) {
          console.log('❌ No users returned from API');
          return [];
        }

        // Filter for registrar role and matching registry
        const filteredRegistrars = users.results.filter(user =>
          user.role === 'is_registrar' &&
          user.registry === currentUserRegistry
        );

        console.log(`✅ Found ${filteredRegistrars.length} registrars for registry: ${currentUserRegistry}`);

        return filteredRegistrars.map(user => ({
          id: user.id,
          name: this.formatUserName(user),
          username: user.username,
          email: user.email,
          county: user.county,
          registry: user.registry,
          role: user.role,
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

  // ========== CERTIFICATE METHODS ==========

  uploadCertificate(applicationId: number, file: File, comment: string = ''): Observable<any> {
    const formData = new FormData();
    formData.append('signed_file', file);
    formData.append('comment', comment.trim() || 'Certificate uploaded');

    const url = `${this.apiUrl}/registrar/approve/${applicationId}`;

    return this.http.post(url, formData, {
      headers: this.authService.getAuthHeaders().delete('Content-Type')
    }).pipe(
      tap(response => {
        console.log('✅ Certificate uploaded successfully:', response);
      }),
      catchError(error => {
        console.error('❌ Certificate upload failed:', error);

        let errorMessage = 'Upload failed. ';
        if (error.error?.signed_file) {
          errorMessage += `File error: ${error.error.signed_file.join(', ')}`;
        } else if (error.error?.detail) {
          errorMessage += error.error.detail;
        } else if (error.error?.error) {
          errorMessage += error.error.error;
        } else {
          errorMessage += 'Please try again.';
        }

        return throwError(() => new Error(errorMessage));
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

  // Optional completion methods (if your backend supports them)
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
}
