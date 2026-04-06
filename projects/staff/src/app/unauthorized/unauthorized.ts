// src/app/auth/unauthorized/unauthorized.component.ts
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="unauthorized-container">
      <div class="error-content">
        <h1>403</h1>
        <h2>Access Denied</h2>
        <p>You don't have permission to access this page.</p>
        <p *ngIf="authService.currentUserValue" class="user-info">
          Logged in as: <strong>{{ authService.currentUserValue.username }}</strong>
          ({{ getUserRole() }})
        </p>
        <button (click)="goToDashboard()" class="btn-primary">
          Go to Dashboard
        </button>
        <button (click)="logout()" class="btn-secondary">
          Logout
        </button>
      </div>
    </div>
  `,
  styles: [`
    .unauthorized-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background-color: #f5f5f5;
    }
    .error-content {
      text-align: center;
      background: white;
      padding: 2rem;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    h1 {
      font-size: 4rem;
      color: #dc3545;
      margin: 0;
    }
    h2 {
      color: #333;
      margin: 0.5rem 0;
    }
    .user-info {
      color: #666;
      margin: 1rem 0;
    }
    .btn-primary {
      background: #007bff;
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      margin: 0.5rem;
      border-radius: 4px;
      cursor: pointer;
    }
    .btn-secondary {
      background: #6c757d;
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      margin: 0.5rem;
      border-radius: 4px;
      cursor: pointer;
    }
  `]
})
export class UnauthorizedComponent {
  constructor(
    public authService: AuthService,
    private router: Router
  ) { }

  // Helper method to safely get user role
  getUserRole(): string {
    const user = this.authService.currentUserValue;
    if (!user) return 'unknown';

    // Handle both role and roles array
    if (user.roles && user.roles.length > 0) {
      return user.roles[0];
    }
    return user.role || 'unknown';
  }

  goToDashboard() {
    const user = this.authService.currentUserValue;
    if (user) {
      // Safely get the role - FIX FOR LINE 87
      const userRole = this.getUserRole();
      this.navigateBasedOnRole(userRole);
    } else {
      this.router.navigate(['/login']);
    }
  }

  private navigateBasedOnRole(userRole: string): void {
    // Use exact role values from Django backend
    switch (userRole) {
      case 'admin':
      case 'superuser':
        this.router.navigate(['/admin-dashboard']);
        break;
      case 'is_registrar_in_charge':
        this.router.navigate(['/registrarInCharge']);
        break;
      case 'is_registrar':
        this.router.navigate(['/registrar-dashboard']);
        break;
      default:
        console.log('Unknown role, redirecting to login:', userRole);
        this.router.navigate(['/login']);
    }
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
