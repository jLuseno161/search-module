import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatDivider } from '@angular/material/divider';
import { AuthService } from '../../services/auth.service';

interface MenuItem {
  icon: string;
  text: string;
  route: string;
  isActive: boolean;
}

@Component({
  selector: 'app-public-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatMenuModule,
    MatDivider,
    MatButtonModule],
  templateUrl: './public-dashboard.component.html',
  styleUrl: './public-dashboard.component.scss'
})


export class PublicDashboardComponent implements OnInit {

  currentDate = new Date();
  currentUser: any = null;
  notificationCount = 0;
  sidebarOpen = true;


  menuItems: MenuItem[] = [
    { icon: 'dashboard', text: 'Dashboard', route: '/search-application', isActive: true },
    { icon: 'apps', text: 'Services', route: '/services', isActive: false },
    { icon: 'home', text: 'My Properties', route: '/properties', isActive: false },
    { icon: 'payment', text: 'Ardhipay', route: '/payment', isActive: false },
    { icon: 'forum', text: 'Communication', route: '/communication', isActive: false },
    { icon: 'assessment', text: 'Resources', route: '/resources', isActive: false },
    { icon: 'notifications', text: 'Notifications', route: '/notifications', isActive: false },
    { icon: 'account_circle', text: 'Account', route: '/account', isActive: false }
  ];

  constructor(private router: Router, private authService: AuthService) { }

  ngOnInit() {
    ''
    // Update time every second
    setInterval(() => {
      this.currentDate = new Date();
    }, 1000);

    const user = this.authService.getCurrentUser();
    if (user) {
      // this.currentUser = user || 'User';
      this.currentUser = user; // Only set if user exists

    }
  }

  setActiveItem(selectedItem: MenuItem): void {
    this.menuItems.forEach(item => item.isActive = false);
    selectedItem.isActive = true;
    this.router.navigate([selectedItem.route]);
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  onProfileClick(event: MouseEvent): void {
    // Handled by mat-menu
    event.stopPropagation();
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  logout(): void {
    this.authService.logout()
    this.router.navigate(['/login']);
  }
}