import { Routes } from '@angular/router';
import { AllSearchComponent } from './features/all-search/all-search.component';
import { LoginComponent } from './features/auth/login/login.component';
import { NewApplicationComponent } from './features/new-application/new-application.component';
import { SearchApplicationComponent } from './features/search-application/search-application.component';
import { authGuard } from './guards/auth.guard';
import { guestGuard } from './guards/guest.guard';

export const routes: Routes = [
    {
        path: 'login',
        component: LoginComponent,
        canActivate: [guestGuard]
    },
    {
        path: '',
        redirectTo: 'search-application',
        pathMatch: 'full'
    },
    {
        path: 'search-application',
        component: AllSearchComponent,
        canActivate: [authGuard]
    },
    {
        path: 'search-application/pending/:id',
        component: SearchApplicationComponent,
        data: { status: 'pending' },
        canActivate: [authGuard]
    },
    {
        path: 'search-application/completed/:id',
        component: SearchApplicationComponent,
        data: { status: 'completed' },
        canActivate: [authGuard]
    },
    {
        path: 'search-application/submitted/:id',
        component: SearchApplicationComponent,
        data: { status: 'submitted' },
        canActivate: [authGuard]
    },
    {
        path: 'search-application/rejected/:id',
        component: SearchApplicationComponent,
        data: { status: 'rejected' },
        canActivate: [authGuard]
    },
    {
        path: 'new-application',
        component: NewApplicationComponent,
        canActivate: [authGuard]
    },
    // Wildcard route (handle 404)
    {
        path: '**',
        redirectTo: 'search-application'
    }
];
