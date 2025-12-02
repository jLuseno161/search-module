// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { Login } from './auth/login/login';
import { UnauthorizedComponent } from './unauthorized/unauthorized';

import { Admin } from './features/admin/admin';
import { Registrar } from './features/registrar/registrar';
import { ChiefRegistryRegistrar } from './features/chiefregistry-registrar/chiefregistry-registrar';
// import { Dashboard } from './features/dashboard/dashboard';
import { ApplicationDetails } from './features/application-details/application-details';
// In app.routes.ts

import { AuthGuard } from './auth/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    component: Login
  },
  {
    path: 'unauthorized',
    component: UnauthorizedComponent
  },
  // Admin routes
  {
    path: 'admin-dashboard',
    component: Admin,
    canActivate: [AuthGuard],
    data: { roles: ['admin', 'superuser'] }
  },
  // Chief Registrar (Registrar in Charge) - ONLY this role
  {
    path: 'registrarInCharge',
    component: ChiefRegistryRegistrar,
    canActivate: [AuthGuard],
    data: { roles: ['is_registrar_in_charge'] }
  },
  // Individual Registrar - ONLY this role
  {
    path: 'registrar-dashboard',
    component: Registrar,
    canActivate: [AuthGuard],
    data: { roles: ['is_registrar'] }
  },
  // Application Details - accessible to both registrar roles
  {
    path: 'application-details/:id',
    component: ApplicationDetails,
    canActivate: [AuthGuard],
    data: { roles: ['is_registrar', 'is_registrar_in_charge'] }
  },
  {
    path: '**',
    redirectTo: '/login'
  }
];
