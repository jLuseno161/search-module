import { Routes } from '@angular/router';
import { AllSearchComponent } from '../../../public/src/app/features/all-search/all-search.component';
import { LoginComponent } from '../../../public/src/app/features/auth/login/login.component';
import { NewApplicationComponent } from '../../../public/src/app/features/new-application/new-application.component';
import { SearchApplicationComponent } from '../../../public/src/app/features/search-application/search-application.component';
// import { LoginComponent } from './components/auth/login/login.component';
// import { NewApplicationComponent } from './components/new-application/new-application.component';
// import { AllSearchComponent } from './components/all-search/all-search.component';
// import { SearchApplicationComponent } from './components/search-application/search-application.component';

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
        path: 'pending/:id',
        component: SearchApplicationComponent,
        data: { status: 'pending' }
    },
    {
        path: 'completed/:id',
        component: SearchApplicationComponent,
        data: { status: 'completed' }
    }
];
