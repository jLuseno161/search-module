import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { Footer } from './features/partials/footer/footer';
import { Header } from './features/partials/header/header';
import { Sidebar } from './features/partials/sidebar/sidebar';
// import { Footer } from './features/registrar/partials/footer/footer';
// import { Header } from './features/registrar/partials/header/header';
// import { Sidebar } from './features/registrar/partials/sidebar/sidebar';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    Sidebar,
    Header,
    Footer
  ],
  template: `
  <main>
    <div class="app-container">
      <!-- Show sidebar only on non-login pages -->
      <app-sidebar *ngIf="!isLoginPage()"></app-sidebar>

      <div class="main-wrapper" [class.full-width]="isLoginPage()">
        <!-- Show header only on non-login pages -->
        <app-header *ngIf="!isLoginPage()"></app-header>

        <main class="main-content">
          <router-outlet></router-outlet>
        </main>

        <!-- Show footer only on non-login pages -->
        <app-footer *ngIf="!isLoginPage()"></app-footer>
      </div>
    </div>
  </main>
  `,
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'staff';
  constructor(private router: Router) { }
  // protected readonly title = signal('search');

  isLoginPage(): boolean {
    return this.router.url === '/login' || this.router.url === '/';
  }
}