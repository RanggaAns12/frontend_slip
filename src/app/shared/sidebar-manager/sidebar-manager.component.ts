import { Component, OnInit, OnDestroy } from '@angular/core';
import { LayoutService } from '../../services/layout.service';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ProfileApiService } from '../../pages/superadmin/profile/services/profile-api.service';

@Component({
  selector: 'app-sidebar-manager',
  standalone: false,
  templateUrl: './sidebar-manager.component.html',
  styleUrls: ['./sidebar-manager.component.scss']
})
export class SidebarManagerComponent implements OnInit, OnDestroy {
  
  // Variabel dinamis
  userName: string = 'Manager';
  userRole: string = 'Manager';
  userInitials: string = 'M';

  private profileSub!: Subscription;

  constructor(
    public layoutService: LayoutService,
    private router: Router,
    private profileApi: ProfileApiService
  ) {}

  ngOnInit(): void {
    this.loadUserData();

    this.profileSub = this.profileApi.profileUpdated.subscribe((updatedUser: any) => {
      this.userName = updatedUser.name;
      this.userInitials = this.userName.charAt(0).toUpperCase();
      this.processRole(updatedUser);
    });
  }

  loadUserData(): void {
    const userStr = localStorage.getItem('user_data') || localStorage.getItem('user'); 
    
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        this.userName = user.name || 'Manager';
        this.userInitials = this.userName.charAt(0).toUpperCase();
        this.processRole(user);
      } catch (e) {
        console.error('Gagal membaca data dari LocalStorage', e);
        this.setFallbackUser();
      }
    } else {
      this.setFallbackUser();
    }
  }

  processRole(user: any): void {
    if (user.role?.name) {
      this.userRole = user.role.name;
    } else {
      this.userRole = user.role || 'Manager';
    }
  }

  setFallbackUser(): void {
    this.userName = 'Manager';
    this.userRole = 'Manager';
    this.userInitials = 'M';
  }

  logout(): void {
    localStorage.clear();
    this.router.navigate(['/auth/login']);
  }

  ngOnDestroy(): void {
    if (this.profileSub) {
      this.profileSub.unsubscribe();
    }
  }
}