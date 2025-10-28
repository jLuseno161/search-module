import { Routes } from '@angular/router';
import { AllSearchComponent } from '../../../public/src/app/features/all-search/all-search.component';
import { LoginComponent } from '../../../public/src/app/features/auth/login/login.component';
import { NewApplicationComponent } from '../../../public/src/app/features/new-application/new-application.component';
import { SearchApplicationComponent } from '../../../public/src/app/features/search-application/search-application.component';

export const routes: Routes = [
    {
        path: '',
        redirectTo: '',
        pathMatch: 'full'
    },
    {
        path: '',
        component: LoginComponent
    },
    {
        path: 'new-application',
        component: NewApplicationComponent
    },
    {
        path: 'search-application',
        component: AllSearchComponent
    },
    //     { 
    //     path: 'ongoing/:id', 
    //     component: SearchApplicationComponent, 
    //     data: { status: 'ongoing' } 
    // },
    {
        path: 'search-application/pending/:id',
        component: SearchApplicationComponent,
        data: { status: 'pending' }
    },
    {
        path: 'search-application/completed/:id',
        component: SearchApplicationComponent,
        data: { status: 'completed' }
    },
    {
        path: 'search-application/submitted/:id',
        component: SearchApplicationComponent,
        data: { status: 'submitted' }
    },
        {
        path: 'search-application/rejected/:id',
        component: SearchApplicationComponent,
        data: { status: 'rejected' }
    }
];
