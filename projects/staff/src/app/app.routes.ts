import { Routes } from '@angular/router';
import { Login } from './auth/login/login';
import { UnauthorizedComponent } from './unauthorized/unauthorized';
import { Admin } from './features/admin/admin';
import { Registrar } from './features/registrar/registrar';
import { ChiefRegistryRegistrar } from './features/chiefregistry-registrar/chiefregistry-registrar';
import { ApplicationDetails } from './features/application-details/application-details';
import { ProfileComponent } from '../app/features/profile/profile/profile.component';
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
  {
    path: 'admin-dashboard',
    component: Admin,
    canActivate: [AuthGuard],
    data: { roles: ['admin', 'superuser'] }
  },
  {
    path: 'registrarInCharge',
    component: ChiefRegistryRegistrar,
    canActivate: [AuthGuard],
    data: { roles: ['is_registrar_in_charge'] }
  },
  {
    path: 'registrar-dashboard',
    component: Registrar,
    canActivate: [AuthGuard],
    data: { roles: ['is_registrar'] }
  },
  {
    path: 'application-details/:id',
    component: ApplicationDetails,
    canActivate: [AuthGuard],
    data: { roles: ['is_registrar', 'is_registrar_in_charge'] }
  },
  {
    path: 'profile',
    component: ProfileComponent,
    canActivate: [AuthGuard],
    data: { roles: ['is_registrar', 'is_registrar_in_charge', 'admin'] }
  },
  // Add these if you have components for these routes
  // {
  //   path: 'dashboard',
  //   component: DashboardComponent,
  //   canActivate: [AuthGuard]
  // },
  // {
  //   path: 'applications',
  //   component: ApplicationsComponent,
  //   canActivate: [AuthGuard]
  // },
  // {
  //   path: 'flag-parcel',
  //   component: FlagParcelComponent,
  //   canActivate: [AuthGuard]
  // },
  // {
  //   path: 'user-guide',
  //   component: UserGuideComponent,
  //   canActivate: [AuthGuard]
  // },
  // ... etc for all sidebar links
  {
    path: '**',
    redirectTo: '/login'
  }
];
