import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/internal/Observable';
import { environment } from '../../environments/environment';
import { tap } from 'rxjs/internal/operators/tap';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private authUrl = `${environment.apiBaseUrl}`;
  private authToken: string | null = null;
  private currentUserData: any;

  setToken(token: string) {
    this.authToken = token;
    localStorage.setItem('auth_token', token)
  }

  getToken(): string | null {
    if (!this.authToken && typeof localStorage !== 'undefined') {
      this.authToken = localStorage.getItem('auth_token');
    }
    return this.authToken;
  }

  removeToken() {
    this.authToken = null;
    this.currentUserData = null;
    localStorage.removeItem('auth_token');
    localStorage.removeItem('current_user');
  }

  constructor(private http: HttpClient) { }

  isAuthenticated(): boolean {
    const token = this.getToken()
    return !!token; // Returns true if token exists, false otherwise
  }

  login(formData: any): Observable<any> {
    // this.removeToken();

    return this.http.post<any>(`${this.authUrl}/login`, formData)
      .pipe(
        tap((response: any) => {
          if (response.access) {
            this.setToken(response.access)
          }

          //get and save user data
          if (response.user) {
            localStorage.setItem('current_user', JSON.stringify(response.user));
            this.currentUserData = response.user;
          }
        })
      )
  }

  getUsers(): Observable<any> {
    return this.http.get(`${this.authUrl}/users`);
  }

  getCurrentUser(): any {
    // If in memory
    if (this.currentUserData) {
      return this.currentUserData;
    }

    // Or load from localStorage
    if (typeof localStorage !== 'undefined') {
      const userData = localStorage.getItem('current_user');
      if (userData) {
        this.currentUserData = JSON.parse(userData);
        return this.currentUserData;
      }
    }

    return null;
  }

  logout() {
    this.removeToken();
  }
}
