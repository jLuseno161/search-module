// src/app/auth/login/login.component.ts
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class Login implements OnInit {
  username = '';
  password = '';
  showPassword = false;
  loginError = '';
  isLoading = false;
  apiStatus = 'unknown';

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    // Test login endpoint on component load
    this.testLoginEndpoint();

    // Redirect if already logged in
    if (this.authService.isLoggedIn() && this.authService.currentUserValue) {
      this.navigateBasedOnRole(this.authService.currentUserValue.role);
    }
  }

  testLoginEndpoint() {
    this.apiStatus = 'testing';
    this.authService.testLoginEndpoint().subscribe({
      next: () => {
        this.apiStatus = 'online';
        console.log('Login endpoint is accessible');
      },
      error: (error) => {
        // Even if OPTIONS fails, the endpoint might still work for POST
        this.apiStatus = 'unknown';
        console.log('OPTIONS check failed, but POST might work:', error);
      }
    });
  }

  login() {
    this.loginError = '';
    this.isLoading = true;

    if (!this.username.trim() || !this.password.trim()) {
      this.loginError = 'Please enter both username and password';
      this.isLoading = false;
      return;
    }

    console.log('Attempting login to:', this.username);

    // Set timeout for API request
    const timeout = setTimeout(() => {
      if (this.isLoading) {
        this.isLoading = false;
        this.loginError = 'Request timeout. The server might be slow or unavailable.';
      }
    }, 15000);

    this.authService.login(this.username, this.password)
      .subscribe({
        next: (response) => {
          clearTimeout(timeout);
          this.isLoading = false;
          console.log('Login successful! Full response:', response);

          if (response && response.user) {
            this.navigateBasedOnRole(response.user.role);
          } else {
            this.loginError = 'Invalid response format from server';
          }
        },
        error: (error) => {
          clearTimeout(timeout);
          this.isLoading = false;
          this.handleLoginError(error);
        }
      });
  }

private navigateBasedOnRole(userRole: string): void {
  console.log('Navigating based on role:', userRole);

  // Use exact role values from Django backend
  switch (userRole) {
    case 'admin':
    case 'superuser':
      this.router.navigate(['/admin-dashboard']);
      break;
    case 'is_registrar_in_charge': // Exact Django role value
      this.router.navigate(['/registrarInCharge']);
      break;
    case 'is_registrar': // Exact Django role value
      this.router.navigate(['/registrar-dashboard']);
      break;
    default:
      console.warn('Unknown role, redirecting to login:', userRole);
      this.router.navigate(['/login']);
  }
}

  private handleLoginError(error: any): void {
    console.error('Detailed login error:', error);
    console.log('Error response body:', error.error);

    // Network errors
    if (error.status === 0) {
      this.loginError = 'Cannot connect to server. Please check your internet connection and ensure the server is running.';
    }
    // Client errors
    else if (error.status === 400) {
      this.loginError = 'Invalid request. Please check your input.';
    } else if (error.status === 401) {
      this.loginError = 'Invalid username or password.';
    } else if (error.status === 403) {
      this.loginError = 'Access forbidden. Please check your credentials.';
    } else if (error.status === 404) {
      this.loginError = 'Login endpoint not found.';
    } else if (error.status >= 400 && error.status < 500) {
      this.loginError = `Client error: ${error.status} ${error.statusText}`;
    }
    // Server errors
    else if (error.status >= 500) {
      this.loginError = 'Server error. Please try again later.';
    }
    // Other errors
    else {
      this.loginError = 'Login failed. Please try again.';
    }

    // Extract detailed error message from response
    if (error.error) {
      if (error.error.detail) {
        this.loginError = error.error.detail;
      } else if (error.error.message) {
        this.loginError = error.error.message;
      } else if (error.error.non_field_errors) {
        this.loginError = error.error.non_field_errors.join(', ');
      } else if (error.error.username) {
        this.loginError = `Username: ${error.error.username.join(', ')}`;
      } else if (error.error.password) {
        this.loginError = `Password: ${error.error.password.join(', ')}`;
      } else if (typeof error.error === 'string') {
        this.loginError = error.error;
      } else if (error.error.error) {
        this.loginError = error.error.error;
      }
    }
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  // Quick login for testing - try API first, then fallback to local
  quickLogin(testUser: string) {
    this.username = testUser;
    this.password = 'test@123';

    // Try API login first with test credentials
    this.login();
  }

  // Direct local auth fallback
  useLocalAuth() {
    const localUsers = {
      'admin': { password: '1234', role: 'admin' },
      // 'chief_county_registrar': { password: 'test@123', role: 'chief_county_registrar' },
      'registrarInCharge': { password: 'test@123', role: 'registrarInCharge' },
      'registrar': { password: 'registrar123', role: 'registrar' },
      'user': { password: 'user123', role: 'user' }
    };

    const user = localUsers[this.username as keyof typeof localUsers];
    if (user && user.password === this.password) {
      const userData = {
        username: this.username,
        role: user.role,
        county: 'default',
        registry: 'default',
        first_name: this.username.charAt(0).toUpperCase() + this.username.slice(1)
      };

      localStorage.setItem('currentUser', JSON.stringify(userData));
      localStorage.setItem('authToken', 'mock-token-' + Date.now());
      this.navigateBasedOnRole(user.role);
    } else {
      this.loginError = 'Local auth failed for test user';
    }
  }
}
