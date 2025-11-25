// services/application.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { map, catchError, tap, switchMap, expand, reduce, filter } from 'rxjs/operators';
import { AuthService } from "../auth/auth.service";

export interface ApiApplication {
  id: number;
  reference_number: string;
  parcel_number: string;
  purpose: string;
  county: string;
  registry: string;
  status: string;
  submitted_at: string;
  assigned_to?: number;
  user?: {
    normal?: {
      id: number;
      username: string;
      first_name: string;
      last_name: string;
      email: string;
    };
    registrar?: {
      id: number;
      username: string;
      first_name: string;
      last_name: string;
      email: string;
    };
    admin?: any;
    registrar_in_charge?: any;
  };
  certificate?: {
    signed_file: string;
    uploaded_at: string;
  };
}

export interface Registrar {
  id: number;
  name: string;
  username: string;
  email?: string;
  county: string;
  registry: string;
  role: string;
  first_name?: string;
  last_name?: string;
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

  getApplicationsByStatus(status: string): Observable<ApiResponse> {
    const params = new HttpParams().set('status', status);
    return this.http.get<ApiResponse>(`${this.apiUrl}/registrar-in-charge/submitted`, { params });
  }

  assignApplication(applicationId: number, registrarId: number): Observable<any> {
    console.log('📤 Assigning application:', { applicationId, registrarId });

    return this.http.post(
      `${this.apiUrl}/registrar-in-charge/assign/${applicationId}`,
      {
        registrar_id: registrarId
      },
      {
        headers: this.authService.getAuthHeaders()
      }
    ).pipe(
      tap(response => {
        console.log('✅ Assignment successful:', response);
      }),
      catchError(error => {
        console.error('❌ Assignment failed:', error);
        console.error('🔍 Error details:', error.error);
        return throwError(() => error);
      })
    );
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

  private getAllUsersRecursive(url?: string, allUsers: any[] = []): Observable<any[]> {
    const requestUrl = url || `${this.apiUrl}/users`;

    return this.http.get<UserResponse>(requestUrl).pipe(
      switchMap(response => {
        const accumulatedUsers = [...allUsers, ...(response.results || [])];

        if (response.next) {
          // If there's a next page, recursively call this method
          return this.getAllUsersRecursive(response.next, accumulatedUsers);
        } else {
          // No more pages, return all accumulated users
          console.log('📄 Pagination complete - Total users:', accumulatedUsers.length);
          return of(accumulatedUsers);
        }
      }),
      catchError(error => {
        console.error('❌ Error in recursive pagination:', error);
        return of(allUsers); // Return whatever we've collected so far
      })
    );
  }

  getAvailableRegistrars(currentUserRegistry: string): Observable<Registrar[]> {
    console.log('🔄 getAvailableRegistrars - ENHANCED DEBUG VERSION:');
    console.log('Requested registry:', currentUserRegistry);

    return this.http.get<UserResponse>(`${this.apiUrl}/users`).pipe(
      map(users => {
        console.log('👥 RAW API RESPONSE - ALL USERS:', users);
        console.log('📊 Total users in response:', users.results?.length || 0);

        // Log all users for debugging
        if (users.results && users.results.length > 0) {
          users.results.forEach((user: any, index: number) => {
            console.log(`User ${index + 1}:`, {
              id: user.id,
              username: user.username,
              role: user.role,
              roleType: typeof user.role,
              registry: user.registry,
              county: user.county,
              first_name: user.first_name,
              last_name: user.last_name
            });
          });
        } else {
          console.log('❌ No users returned from API');
          return [];
        }

        // Filter for registrar role
        const allRegistrars = users.results.filter(user => {
          const isRegistrar = user.role === 'is_registrar';
          console.log(`Checking user ${user.username}: role=${user.role}, isRegistrar=${isRegistrar}`);
          return isRegistrar;
        });

        console.log('👥 ALL REGISTRARS FOUND (any registry):', allRegistrars);
        console.log('📊 Total registrars found:', allRegistrars.length);

        if (allRegistrars.length === 0) {
          console.log('❌ No users with role "is_registrar" found');
          console.log('Available roles:', [...new Set(users.results.map((user: any) => user.role))]);
          return [];
        }

        console.log('🎯 Applying registry filter:', {
          requiredRegistry: currentUserRegistry,
          availableRegistries: [...new Set(allRegistrars.map(r => r.registry))]
        });

        // Filter by registry
        const filteredRegistrars = allRegistrars.filter(user => {
          const registryMatch = user.registry === currentUserRegistry;
          console.log(`Checking registrar ${user.username}: registry=${user.registry}, matches=${registryMatch}`);
          return registryMatch;
        });

        console.log('✅ FINAL FILTERED REGISTRARS:', filteredRegistrars);
        console.log('📊 Final count:', filteredRegistrars.length);

        if (filteredRegistrars.length === 0) {
          console.log('❌ No registrars found for registry:', currentUserRegistry);
          console.log('Available registrars with their registries:');
          allRegistrars.forEach(registrar => {
            console.log(`  - ${registrar.username}: ${registrar.registry}`);
          });
        }

        const mappedReg = filteredRegistrars.map(user => ({
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

        return mappedReg;
      }),
      catchError(error => {
        console.error('❌ Error loading users from /users endpoint:', error);
        return of([]);
      })
    );
  }

  debugAllRoles(): Observable<void> {
    return this.http.get<UserResponse>(`${this.apiUrl}/users`).pipe(
      map(users => {
        console.log('🎭 ===== COMPLETE ROLE DEBUG =====');

        users.results.forEach((user: any, index: number) => {
          console.log(`👤 User ${index + 1}:`, {
            id: user.id,
            username: user.username,
            role: user.role,
            roleType: typeof user.role,
            roleValue: `"${user.role}"`,
            registry: user.registry,
            county: user.county,
            first_name: user.first_name,
            last_name: user.last_name
          });
        });

        const uniqueRoles = [...new Set(users.results.map((user: any) => user.role))];
        console.log('🏷️ UNIQUE ROLES FOUND IN SYSTEM:', uniqueRoles);
        console.log('🔍 Unique roles as strings:', uniqueRoles.map(role => `"${role}"`));

        const roleCounts: {[key: string]: number} = {};
        users.results.forEach((user: any) => {
          roleCounts[user.role] = (roleCounts[user.role] || 0) + 1;
        });
        console.log('📊 USER COUNT BY ROLE:', roleCounts);

        console.log('🎭 ===== END ROLE DEBUG =====');
      }),
      catchError(error => {
        console.error('❌ Error debugging roles:', error);
        return of(undefined);
      })
    );
  }

  approveApplication(applicationId: number, formData: FormData): Observable<any> {
    console.log('📤 Approving application with certificate:', applicationId);

    return this.http.post(
      `${this.apiUrl}/registrar/approve/${applicationId}/`,
      formData,
      {
        headers: this.authService.getAuthHeaders().delete('Content-Type')
      }
    ).pipe(
      tap(response => {
        console.log('✅ Application approved successfully:', response);
      }),
      catchError(error => {
        console.error('❌ Approval failed:', error);
        return throwError(() => error);
      })
    );
  }

  rejectApplication(applicationId: number, rejectData: {comment: string}): Observable<any> {
    console.log('📤 Rejecting application:', applicationId);

    // FIX: Remove the trailing slash to match Django URL pattern
    const url = `${this.apiUrl}/registrar/reject/${applicationId}`;

    console.log('🎯 Calling URL:', url);

    const requestData = {
      comment: rejectData.comment
    };

    return this.http.post(
      url,  // Use the URL without trailing slash
      requestData,
      {
        headers: this.authService.getAuthHeaders()
      }
    ).pipe(
      tap(response => {
        console.log('✅ Application rejected successfully:', response);
      }),
      catchError(error => {
        console.error('❌ Rejection failed:', error);
        console.log('🔍 Error details:', {
          status: error.status,
          statusText: error.statusText,
          url: error.url,
          error: error.error
        });
        return throwError(() => error);
      })
    );
  }

  getRegistrarAssignedApplications(): Observable<ApiResponse> {
    console.log('📞 Calling: /registrar/assigned');
    return this.http.get<ApiResponse>(`${this.apiUrl}/registrar/assigned`, {
      headers: this.authService.getAuthHeaders()
    }).pipe(
      tap(response => {
        console.log('✅ Registrar assigned apps response:', response);
      }),
      catchError(error => {
        console.error('❌ Registrar assigned apps error:', error);
        return throwError(() => error);
      })
    );
  }

  getUserDetails(userId: number): Observable<any> {
    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get(`${this.apiUrl}/users/${userId}`, { headers });
  }

  // UPDATED: Certificate upload with correct URL (no trailing slash)
  // Temporary workaround in application.service.ts
uploadCertificate(applicationId: number, file: File, comment: string = ''): Observable<any> {
  return new Observable(observer => {
    const reader = new FileReader();

    reader.onload = () => {
      const base64Data = reader.result as string;
      // Remove the data:application/pdf;base64, prefix
      const cleanBase64 = base64Data.split(',')[1];

      const jsonPayload = {
        signed_file: cleanBase64,
        comment: comment.trim() || 'Certificate uploaded'
      };

      const url = `${this.apiUrl}/registrar/approve/${applicationId}`;

      this.http.post(url, jsonPayload, {
        headers: this.authService.getAuthHeaders().set('Content-Type', 'application/json')
      }).subscribe({
        next: (response) => {
          console.log('✅ Certificate uploaded successfully (base64 method):', response);
          observer.next(response);
          observer.complete();
        },
        error: (error) => {
          console.error('❌ Base64 upload failed:', error);
          observer.error(new Error('Backend cannot handle file uploads. Please contact support.'));
        }
      });
    };

    reader.onerror = () => {
      observer.error(new Error('Failed to read file'));
    };

    reader.readAsDataURL(file);
  });
}

  // File sanitization method
  private sanitizePdfFileName(file: File): File {
    // Clean the filename of any special characters that might cause issues
    const cleanName = file.name
      .replace(/[^\w\s.-]/g, '') // Remove special characters except dots, dashes, and underscores
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .toLowerCase();

    // If the filename changed, create a new File object with the clean name
    if (cleanName !== file.name) {
      console.log('🔄 Sanitized filename:', { original: file.name, clean: cleanName });
      return new File([file], cleanName, { type: file.type });
    }

    return file;
  }

  // File validation method
  private validateCertificateFile(file: File): string | null {
    const allowedTypes = ['application/pdf']; // Only PDFs allowed
    const maxSize = 10 * 1024 * 1024; // 10MB

    console.log('🔍 Validating file:', {
      name: file.name,
      type: file.type,
      size: file.size
    });

    // Check file type
    if (!allowedTypes.includes(file.type)) {
      return 'Invalid file type. Only PDF files are accepted for certificates.';
    }

    // Check file size
    if (file.size > maxSize) {
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      return `File size (${fileSizeMB}MB) exceeds maximum limit of 10MB.`;
    }

    // Check if file is empty
    if (file.size === 0) {
      return 'File cannot be empty.';
    }

    // Check file extension
    const fileExtension = file.name.toLowerCase().split('.').pop();
    if (fileExtension !== 'pdf') {
      return 'File must have .pdf extension.';
    }

    // Check for problematic characters in filename
    const problematicChars = /[^a-zA-Z0-9._-]/g;
    if (problematicChars.test(file.name.replace(/\s/g, ''))) {
      return 'Filename contains special characters that may cause issues. Please rename the file to use only letters, numbers, underscores, dots, and dashes.';
    }

    return null; // No errors
  }

  // Backend error parsing method
  private parseBackendError(error: HttpErrorResponse): string {
    console.log('🔍 RAW ERROR ANALYSIS:', {
      status: error.status,
      statusText: error.statusText,
      error: error.error,
      url: error.url
    });

    if (error.status === 404) {
      return `Endpoint not found: ${error.url}. Please check the URL configuration.`;
    } else if (error.status === 400) {
      // Check if it's the specific UTF-8 decoding error
      if (typeof error.error === 'string' && error.error.includes('utf-8') && error.error.includes('decode')) {
        return 'The backend is trying to parse the PDF file as JSON. This indicates a backend configuration issue. Please contact the backend developer.';
      }

      // Check for specific backend validation errors
      if (error.error?.signed_file) {
        return `File error: ${error.error.signed_file.join(', ')}`;
      } else if (error.error?.comment) {
        return `Comment error: ${error.error.comment.join(', ')}`;
      } else if (error.error?.detail) {
        return error.error.detail;
      } else if (error.error?.error) {
        return error.error.error;
      } else if (typeof error.error === 'string') {
        return error.error;
      } else {
        return 'Invalid request. Please check the file and try again.';
      }
    } else if (error.status === 413) {
      return 'File too large. Please choose a smaller file (max 10MB).';
    } else if (error.status === 415) {
      return 'Unsupported file type. Only PDF files are accepted.';
    } else if (error.status >= 500) {
      return 'Server error. Please try again later.';
    } else {
      return 'Upload failed. Please check your connection and try again.';
    }
  }

  // Debug method for backend expectations
  debugBackendExpectations(applicationId: number): void {
    console.log('🔍 Debugging backend expectations...');

    // Test with different field names
    const testCases = [
      { fieldName: 'signed_file', description: 'What backend expects' },
      { fieldName: 'certificate', description: 'What we were using' },
      { fieldName: 'file', description: 'Generic field name' }
    ];

    testCases.forEach(testCase => {
      const formData = new FormData();
      const testFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      formData.append(testCase.fieldName, testFile);
      formData.append('comment', 'Test comment');

      console.log(`🔄 Testing with field: "${testCase.fieldName}"`);

      this.http.post(
        `${this.apiUrl}/registrar/approve/${applicationId}`,
        formData,
        { headers: this.authService.getAuthHeaders() }
      ).subscribe({
        next: (response) => {
          console.log(`✅ SUCCESS with field: "${testCase.fieldName}"`, response);
        },
        error: (error) => {
          console.log(`❌ FAILED with field: "${testCase.fieldName}":`, error.status, error.error?.detail || error.message);
        }
      });
    });
  }

  // URL discovery method
  discoverApproveUrl(applicationId: number): void {
    console.log('🔍 Discovering correct approve URL...');

    const testUrls = [
      `${this.apiUrl}/registrar/approve/${applicationId}/`,  // With trailing slash
      `${this.apiUrl}/registrar/approve/${applicationId}`,   // Without trailing slash
    ];

    testUrls.forEach(url => {
      console.log(`🔄 Testing URL: ${url}`);

      // Test with a simple GET request first to see if endpoint exists
      this.http.get(url, {
        headers: this.authService.getAuthHeaders()
      }).subscribe({
        next: (response) => {
          console.log(`✅ URL EXISTS: ${url}`, response);
        },
        error: (error) => {
          console.log(`❌ URL NOT FOUND: ${url} - ${error.status} ${error.statusText}`);
        }
      });
    });
  }

  private formatUserName(user: any): string {
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    } else if (user.name) {
      return user.name;
    } else {
      return user.username;
    }
  }

  discoverAvailableEndpoints(): void {
    console.log('🔍 DISCOVERING AVAILABLE ENDPOINTS');

    const testEndpoints = [
      '/api/v1/registrar/reject/',
      '/api/v1/registrar/reject/41/',
      '/api/v1/registrar/reject',
      '/api/v1/registrar/',
      '/api/v1/registrar/assigned/',
      '/api/v1/registrar-in-charge/',
      '/api/v1/applications/'
    ];

    testEndpoints.forEach(endpoint => {
      const fullUrl = `https://odipojames.pythonanywhere.com${endpoint}`;
      console.log(`🔄 Testing: ${fullUrl}`);

      this.http.get(fullUrl, {
        headers: this.authService.getAuthHeaders()
      }).subscribe({
        next: () => {
          console.log(`✅ ${endpoint} - EXISTS`);
        },
        error: (error) => {
          console.log(`❌ ${endpoint} - ${error.status} ${error.statusText}`);
        }
      });
    });
  }
}
