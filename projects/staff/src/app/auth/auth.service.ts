// src/app/auth/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';

export interface User {
  id?: number;
  id_no: number | string;    // Required, comes from DB
  username: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  role?: string;
  roles?: string[];
  county: string;
  registry: string;
  is_active?: boolean;
  phone_number?: string;
  signature?: string | null;
}

interface LoginResponse {
  user: User;
  token: string;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_BASE_URL = 'https://arthuronama.pythonanywhere.com/api/v1';
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser: Observable<User | null>;

  constructor(private http: HttpClient) {
    this.currentUserSubject = new BehaviorSubject<User | null>(
      this.getStoredUser()
    );
    this.currentUser = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  public get token(): string | null {
    return localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
  }

  login(username: string, password: string): Observable<any> {
    console.log('Attempting login to:', `${this.API_BASE_URL}/login`);

    const loginPayload = {
      username: username,
      password: password
    };

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });

    return this.http.post<any>(`${this.API_BASE_URL}/login`, loginPayload, { headers })
      .pipe(
        tap(response => {
          console.log('Raw login response:', response);
          console.log('User roles from backend:', response.user?.roles);
          console.log('✅ User stored with ID number:', response.user.id_no);
        }),
        map(response => {
          let userData: User;
          let token: string;

          if (response.access) {
            token = response.access;

            if (response.user) {
              // Transform the user data to include both role and roles
              const backendUser = response.user;
              userData = {
                id: backendUser.id,
                id_no: backendUser.id_no,
                username: backendUser.username,
                email: backendUser.email,
                first_name: backendUser.first_name,
                last_name: backendUser.last_name,
                role: backendUser.roles?.[0] || 'user', // Take first role as primary
                roles: backendUser.roles || [], // Keep the full array
                county: backendUser.county || '',
                registry: backendUser.registry || '',
                is_active: backendUser.is_active,
                phone_number: backendUser.phone_number,
                signature: backendUser.signature
              };
            } else {
              userData = this.createUserFromToken(username, response.access);
            }

            if (response.refresh) {
              localStorage.setItem('refreshToken', response.refresh);
            }
          } else if (response.token) {
            token = response.token;
            userData = response.user || this.createUserFromToken(username, token);
          } else if (response.user && response.token) {
            userData = response.user;
            token = response.token;
          } else {
            token = response.token || response.access_token;
            userData = response.user || response;
          }

          const loginResponse = {
            user: userData,
            token: token
          };

          this.storeAuthData(loginResponse);
          this.currentUserSubject.next(userData);

          console.log('Processed user data:', userData);
          console.log('User role:', userData.role);
          console.log('User roles array:', userData.roles);
          console.log('✅ User stored with ID number:', userData.id_no);

          return loginResponse;
        }),
        catchError(error => {
          console.error('AuthService login error:', error);
          throw error;
        })
      );
  }

  // Get user profile from backend
  getUserProfile(): Observable<User> {
    return this.http.get<User>(`${this.API_BASE_URL}/user/profile/`, {
      headers: this.getAuthHeaders()
    });
  }

  private createUserFromToken(username: string, token: string): User {
    // Create a basic user object, then fetch real data
    const tempUser: User = {
      id_no: 0,
      username: username,
      role: 'user',
      roles: ['user'],
      county: '',
      registry: '',
      first_name: username,
      email: `${username}@example.com`
    };

    // Fetch real user data from backend
    this.getUserProfile().subscribe({
      next: (userProfile) => {
        this.currentUserSubject.next(userProfile);
        this.storeAuthData({ user: userProfile, token: token });
      },
      error: (error) => {
        console.error('Failed to fetch user profile:', error);
      }
    });

    return tempUser;
  }

  logout(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userRoles');
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('currentUser');

    this.currentUserSubject.next(null);
    console.log('User logged out successfully');
  }

  isLoggedIn(): boolean {
    const token = this.token;
    const hasUser = !!this.currentUserValue;

    if (token && !hasUser) {
      const storedUser = this.getStoredUser();
      if (storedUser) {
        this.currentUserSubject.next(storedUser);
        return true;
      }
    }

    return !!token && hasUser;
  }

  private storeAuthData(response: any): void {
    if (response.token) {
      localStorage.setItem('authToken', response.token);
    }
    if (response.user) {
      localStorage.setItem('currentUser', JSON.stringify(response.user));

      // Also store the role separately for easy access
      if (response.user.role) {
        localStorage.setItem('userRole', response.user.role);
      }

      // Store roles array if present
      if (response.user.roles) {
        localStorage.setItem('userRoles', JSON.stringify(response.user.roles));
      }
    }
  }

  private getStoredUser(): User | null {
    const userStr = localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        // Ensure we have both role and roles for compatibility
        if (user.roles && !user.role) {
          user.role = user.roles[0];
        }
        if (user.role && !user.roles) {
          user.roles = [user.role];
        }
        return user;
      } catch (e) {
        console.error('Error parsing stored user:', e);
      }
    }
    return null;
  }

  testLoginEndpoint(): Observable<any> {
    return this.http.options(`${this.API_BASE_URL}/login`);
  }

  getAuthHeaders(): HttpHeaders {
    const token = this.token;
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  // ========== ROLE METHODS ==========

  getCurrentUserRole(): string {
    const user = this.currentUserValue;
    if (user) {
      // If we have roles array, use first role
      if (user.roles && user.roles.length > 0) {
        return user.roles[0];
      }
      // Fallback to single role
      if (user.role) {
        return user.role;
      }
    }

    // Check localStorage
    const storedRole = localStorage.getItem('userRole');
    if (storedRole) {
      return storedRole;
    }

    const storedUser = this.getStoredUser();
    if (storedUser) {
      if (storedUser.roles && storedUser.roles.length > 0) {
        return storedUser.roles[0];
      }
      return storedUser.role || '';
    }

    return 'is_registrar_in_charge'; // Default for testing
  }

  getUserRoles(): string[] {
    const user = this.currentUserValue;
    if (user && user.roles) {
      return user.roles;
    }

    const rolesString = localStorage.getItem('userRoles');
    if (rolesString) {
      try {
        return JSON.parse(rolesString);
      } catch (e) {
        console.error('Error parsing roles:', e);
      }
    }

    const storedUser = this.getStoredUser();
    if (storedUser && storedUser.roles) {
      return storedUser.roles;
    }

    const singleRole = localStorage.getItem('userRole');
    return singleRole ? [singleRole] : [];
  }

  hasRole(role: string): boolean {
    const roles = this.getUserRoles();
    return roles.includes(role);
  }

  getCurrentUserName(): string {
    const user = this.currentUserValue;
    if (user) {
      return user.first_name && user.last_name
        ? `${user.first_name} ${user.last_name}`
        : user.username;
    }

    const storedUser = this.getStoredUser();
    if (storedUser) {
      return storedUser.first_name && storedUser.last_name
        ? `${storedUser.first_name} ${storedUser.last_name}`
        : storedUser.username;
    }

    return 'Chief Registrar'; // Default for testing
  }

  getCurrentUserRegistry(): string {
    const user = this.currentUserValue;
    if (user && user.registry) {
      return user.registry;
    }

    const storedUser = this.getStoredUser();
    if (storedUser && storedUser.registry) {
      return storedUser.registry;
    }

    return 'Nairobi Central'; // Default for testing
  }

  getCurrentUserId(): number {
    const userData = localStorage.getItem('currentUser');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        return user.id || 1;
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }
    return 1; // Default fallback
  }

  isAuthenticated(): boolean {
    return this.isLoggedIn();
  }

  // For testing only
  setTestUserData(role: string = 'is_registrar_in_charge', registry: string = 'Nairobi Central'): void {
    const testUser: User = {
      username: 'test_user',
      first_name: 'Test',
      id_no: 323,
      last_name: 'User',
      role: role,
      roles: [role],
      county: 'Nairobi',
      registry: registry,
      email: 'test@example.com'
    };

    localStorage.setItem('currentUser', JSON.stringify(testUser));
    localStorage.setItem('userRole', role);
    localStorage.setItem('userRoles', JSON.stringify([role]));
    this.currentUserSubject.next(testUser);
    console.log('🧪 Test user data set:', { role, registry });
  }
}
