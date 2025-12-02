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
    // Check if user is logged in
    if (this.authService.isLoggedIn()) {
      const user = this.authService.currentUserValue;

      // If trying to access login page while logged in, redirect to appropriate dashboard
      if (route.routeConfig?.path === 'login') {
        this.redirectToRoleDashboard(user?.role || 'user');
        return false;
      }

      // Check if route has role restrictions
      if (route.data['roles'] && user) {
        const userRole = user.role; // Don't lowercase - keep original case
        const allowedRoles = route.data['roles'] as string[];
        console.log('🔍 Role check for /registrar-dashboard:', {
                userRole,
                allowedRoles,
                hasAccess: allowedRoles.includes(userRole),
                routePath: route.routeConfig?.path,
                routeData: route.data
              });
        // Check if user has required role
        if (!allowedRoles.includes(userRole)) {
          this.redirectToRoleDashboard(userRole);
          return false;
        }
      }

      // User is authenticated and has required role (if any)
      return true;
    }


    if (route.routeConfig?.path === 'login') {
      return true;
    }

    this.router.navigate(['/login']);
    return false;
  }

  private redirectToRoleDashboard(userRole: string): void {
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
