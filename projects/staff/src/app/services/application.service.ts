// services/application.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { map, catchError, tap, switchMap, expand, reduce } from 'rxjs/operators';
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

  // getAvailableRegistrars(currentUserRegistry: string): Observable<Registrar[]> {
  //   return this.http.get<UserResponse>(`${this.apiUrl}/users`).pipe(
  //     map(users => {
  //       console.log('🔄 getAvailableRegistrars - Detailed Debug:');

  //       const allRegistrars = users.results.filter(user => user.role === 'is_registrar');
  //       console.log('👥 ALL is_registrar users (any registry):', allRegistrars);

  //       console.log('🎯 Filter Criteria:', {
  //         requiredRole: 'is_registrar',
  //         requiredRegistry: currentUserRegistry,
  //         currentUserRegistry: currentUserRegistry
  //       });

  //       const registrars = users.results.filter(user =>
  //         user.role === 'is_registrar' &&
  //         user.registry === currentUserRegistry
  //       );

  //       console.log('✅ Filtered registrars:', registrars);

  //       if (registrars.length === 0) {
  //         console.log('❌ No registrars found. Possible reasons:');
  //         console.log('   - No users with role "is_registrar"');
  //         console.log('   - Registry mismatch (looking for:', currentUserRegistry, ')');
  //         console.log('   - Users have different registry values');

  //         const registrarRegistries = allRegistrars.map(r => r.registry);
  //         console.log('   - Actual registrar registries:', [...new Set(registrarRegistries)]);
  //       }

  //       const mappedReg = registrars.map(user => ({
  //         id: user.id,
  //         name: this.formatUserName(user),
  //         username: user.username,
  //         email: user.email,
  //         county: user.county,
  //         registry: user.registry,
  //         role: user.role,
  //         first_name: user.first_name,
  //         last_name: user.last_name
  //       }));

  //       return mappedReg;
  //     }),
  //     catchError(error => {
  //       console.error('❌ Error loading users from /users endpoint:', error);
  //       return of([]);
  //     })
  //   );
  // }
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
        console.log('🔍 DETAILED USER ANALYSIS:');
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

    return this.http.post(
      `${this.apiUrl}/registrar/reject/${applicationId}/`,
      rejectData,
      {
        headers: this.authService.getAuthHeaders()
      }
    ).pipe(
      tap(response => {
        console.log('✅ Application rejected successfully:', response);
      }),
      catchError(error => {
        console.error('❌ Rejection failed:', error);
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

  uploadCertificate(applicationId: number, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('signed_file', file); // Must use 'signed_file' as field name

    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.post(
      `${this.apiUrl}/registrar/approve/${applicationId}`,
      formData,
      { headers }
    ).pipe(
      tap(response => console.log('✅ Certificate upload successful:', response)),
      catchError((error: HttpErrorResponse) => {
        console.error('❌ Certificate upload failed:', error);
        return throwError(() => error);
      })
    );
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

}
