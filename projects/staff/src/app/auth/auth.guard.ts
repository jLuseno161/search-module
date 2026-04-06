// src/app/auth/auth.guard.ts
import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    console.log('🔍 AuthGuard checking route:', route.routeConfig?.path);
    console.log('User logged in?', this.authService.isLoggedIn());
    console.log('Current user role:', this.authService.getCurrentUserRole());

    if (this.authService.isLoggedIn()) {
      const userRole = this.authService.getCurrentUserRole();

      if (route.routeConfig?.path === 'login') {
        this.redirectToRoleDashboard(userRole);
        return false;
      }

      if (route.data['roles']) {
        const userRoles = this.authService.getUserRoles();
        const allowedRoles = route.data['roles'] as string[];

        console.log('🔍 Role check:', {
          userRoles,
          allowedRoles,
          routePath: route.routeConfig?.path
        });

        const hasRequiredRole = userRoles.some(role => allowedRoles.includes(role));

        if (!hasRequiredRole) {
          console.warn('⛔ User does not have required role');
          this.redirectToRoleDashboard(userRole);
          return false;
        }
      }

      return true;
    }

    if (route.routeConfig?.path === 'login') {
      return true;
    }

    console.log('⛔ Not logged in, redirecting to login');
    this.router.navigate(['/login']);
    return false;
  }

  private redirectToRoleDashboard(userRole: string): void {
    console.log('Redirecting based on role:', userRole);

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
        this.router.navigate(['/login']);
    }
  }
}
