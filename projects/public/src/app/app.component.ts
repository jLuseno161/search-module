import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { PublicDashboardComponent } from './features/public-dashboard/public-dashboard.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    PublicDashboardComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})

export class AppComponent implements OnInit {
  title = 'public';

  showDashboard = false;

  constructor(private router: Router) { }

  ngOnInit() {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.updateDashboardVisibility(event.url);
      }
    });

    // Initialize with current URL
    this.updateDashboardVisibility(this.router.url);
  }

  private updateDashboardVisibility(url: string): void {
    this.showDashboard = !url.includes('/login') && !url.includes('/signup')     // Hide dash for login and signup
  }
}