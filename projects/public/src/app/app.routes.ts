import { Routes } from '@angular/router';
import { AllSearchComponent } from '../../../public/src/app/features/all-search/all-search.component';
import { LoginComponent } from '../../../public/src/app/features/auth/login/login.component';
import { NewApplicationComponent } from '../../../public/src/app/features/new-application/new-application.component';
import { SearchApplicationComponent } from '../../../public/src/app/features/search-application/search-application.component';
import { authGuard } from './guard/auth.guard';
import { guestGuard } from './guard/guest.guard';

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