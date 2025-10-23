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

  constructor(private http: HttpClient) { }

  login(formData: any): Observable<any> {
    return this.http.post<any>(`${this.authUrl}/login`, formData)
      .pipe(
        tap((response: any) => {
          if (response.access) {
            this.setToken(response.access)
          }
        })
      )
  }
}
