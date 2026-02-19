import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { LayoutService } from '../../services/layout.service'; // Import Service Baru

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html'
  // Tidak perlu standalone: true jika masuk SharedModule
})
export class SidebarComponent implements OnInit {

  // Data User
  userName: string = 'Admin';
  userRole: string = 'Administrator';
  userInitials: string = 'AD';
  userRoles: string[] = [];

  constructor(
    public layoutService: LayoutService, // Public agar bisa diakses HTML
    public router: Router
  ) {}

  ngOnInit(): void {
    this.loadUserData();
  }

  private loadUserData(): void {
    const userJson = localStorage.getItem('user_data'); // Sesuaikan key localstorage login
    
    if (userJson) {
      try {
        const userObj = JSON.parse(userJson);

        // Nama
        this.userName = userObj.name || userObj.nama_lengkap || userObj.username || 'Admin';

        // Role
        this.userRole = userObj.role || userObj.jabatan || 'Administrator';

        // Multi-roles logic
        if (Array.isArray(userObj.roles)) {
          this.userRoles = userObj.roles.map((r: any) => String(r).toLowerCase());
        } else if (userObj.role) {
          this.userRoles = [String(userObj.role).toLowerCase()];
        }

      } catch (e) {
        console.warn('Gagal parse user JSON', e);
      }
    } 
    
    this.generateInitials(this.userName);
  }

  private generateInitials(name: string): void {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      this.userInitials = (parts[0][0] + parts[1][0]).toUpperCase();
    } else if (parts.length === 1) {
      this.userInitials = parts[0].substring(0, 2).toUpperCase();
    } else {
      this.userInitials = 'AD';
    }
  }

  logout(): void {
    if(confirm('Apakah Anda yakin ingin keluar?')) {
        localStorage.clear();
        this.router.navigate(['/auth/login']);
    }
  }

  hasRole(roles: string[]): boolean {
    if (!this.userRoles || this.userRoles.length === 0) return false;
    const lower = this.userRoles.map(r => r.toLowerCase());
    return roles.some(r => lower.includes(r.toLowerCase()));
  }
}
