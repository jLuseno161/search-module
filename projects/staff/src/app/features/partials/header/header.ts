import { Component, OnInit } from '@angular/core';
import { AuthService, User } from '../../../auth/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [],
  templateUrl: './header.html',
  styleUrl: './header.css'
})
export class Header {
  // Add these properties
  currentUser: User | null = null;
  currentDateTime: string = '';

  constructor(
    private router: Router,
    private authService: AuthService // Inject AuthService
  ) { }

  ngOnInit(): void {
    // Get current user from auth service
    this.currentUser = this.authService.currentUserValue;

    // Update date and time initially and every second
    this.updateDateTime();
    setInterval(() => this.updateDateTime(), 1000);
  }

  private updateDateTime(): void {
    const now = new Date();
    this.currentDateTime = now.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']); // Redirect to login page
  }

}
