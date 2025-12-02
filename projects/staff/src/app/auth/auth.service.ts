// src/app/auth/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';

export interface User {
  id?: number;
  username: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  role: string;
  county: string;
  registry: string;
  is_active?: boolean;
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
  private readonly API_BASE_URL = 'https://odipojames.pythonanywhere.com/api/v1';

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
    return this.http.post<any>(`${this.API_BASE_URL}/login`, loginPayload)
      .pipe(
        tap(response => {
          console.log('Raw login response:', response);
        }),
        map(response => {
          let userData: User;
          let token: string;

          if (response.access) {
            // JWT token response format
            token = response.access;

            if (response.user) {
              userData = response.user;
            } else {
              // If no user data in response, fetch it from user profile endpoint
              userData = this.createUserFromToken(username, response.access);
            }

            if (response.refresh) {
              localStorage.setItem('refreshToken', response.refresh);
            }
          }
          else if (response.token) {
            token = response.token;
            userData = response.user || this.createUserFromToken(username, token);
          }
          else if (response.user && response.token) {
            userData = response.user;
            token = response.token;
          }
          else {
            token = response.token || response.access_token;
            userData = response.user || response;
          }

          const loginResponse = {
            user: userData,
            token: token
          };

          this.storeAuthData(loginResponse);
          this.currentUserSubject.next(userData);
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

  // Update the createUserFromToken to fetch real data
  private createUserFromToken(username: string, token: string): User {
    // Create a basic user object, then fetch real data
    const tempUser: User = {
      username: username,
      role: 'user',
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

  // Remove hardcoded mappings - rely on backend data
  private determineRoleFromUsername(username: string): string {
    return 'user'; // Backend will provide actual role
  }

  logout(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('refreshToken');
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
    }
  }

  private getStoredUser(): User | null {
    const userStr = localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser');
    return userStr ? JSON.parse(userStr) : null;
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

  // ========== SIMPLE METHODS FOR TESTING ==========

  getCurrentUserRole(): string {
    const user = this.currentUserValue;
    if (user) {
      // console.log('🔐 Current user role from service:', user.role);
      return user.role;
    }

    // Fallback to stored user or default
    const storedUser = this.getStoredUser();
    if (storedUser) {
      // console.log('🔐 Current user role from storage:', storedUser.role);
      return storedUser.role;
    }

    // console.log('🔐 No user found, returning default role');
    return 'is_registrar_in_charge'; // Default for testing
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
      // console.log('🔐 Current user registry from service:', user.registry);
      return user.registry;
    }

    const storedUser = this.getStoredUser();
    if (storedUser && storedUser.registry) {
      // console.log('🔐 Current user registry from storage:', storedUser.registry);
      return storedUser.registry;
    }

    // console.log('🔐 No registry found, returning default');
    return 'Nairobi Central'; // Default for testing
  }

  isAuthenticated(): boolean {
    return this.isLoggedIn();
  }

  // Add this method for role switching
  setCurrentUserRole(role: string): void {
    const currentUser = this.currentUserValue || this.getStoredUser();
    if (currentUser) {
      // Update the user's role
      currentUser.role = role;

      // Update storage
      localStorage.setItem('currentUser', JSON.stringify(currentUser));

      // Update the BehaviorSubject
      this.currentUserSubject.next(currentUser);

      console.log('✅ User role updated to:', role);
    } else {
      console.warn('⚠️ No current user found to update role');
    }
  }

  // Optional: Method to set test data for development
  setTestUserData(role: string = 'is_registrar_in_charge', registry: string = 'Nairobi Central'): void {
    const testUser: User = {
      username: 'test_user',
      first_name: 'Test',
      last_name: 'User',
      role: role,
      county: 'Nairobi',
      registry: registry,
      email: 'test@example.com'
    };

    localStorage.setItem('currentUser', JSON.stringify(testUser));
    this.currentUserSubject.next(testUser);
    console.log('🧪 Test user data set:', { role, registry });
  }
  // Add this method to your auth.service.ts
getCurrentUserId(): number {
  // If you have a currentUser observable or property, extract the ID from there
  // Example if you have user data stored:
  const userData = localStorage.getItem('currentUser');
  if (userData) {
    const user = JSON.parse(userData);
    return user.id;
  }

  // Or if you have a currentUser observable:
  // return this.currentUser.value?.id || 1;

  return 1; // Default fallback
}
}
