import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../auth/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.css']
})
export class Sidebar {
  expandedMenus: { [key: string]: boolean } = {};

  constructor(
    public authService: AuthService,
    private router: Router
  ) { }

  toggleCollapse(menuId: string): void {
    this.expandedMenus[menuId] = !this.expandedMenus[menuId];
  }

  logout(event: Event): void {
    event.preventDefault();
    if (confirm('Are you sure you want to logout?')) {
      this.authService.logout();
      this.router.navigate(['/login']);
    }
  }
}
