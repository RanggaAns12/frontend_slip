import { Component, OnInit, OnDestroy } from '@angular/core';
import { LayoutService } from '../../services/layout.service';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ProfileApiService } from '../../pages/superadmin/profile/services/profile-api.service';

@Component({
  selector: 'app-sidebar',
  standalone: false,
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit, OnDestroy {
  
  // Variabel dinamis yang akan di-bind ke HTML
  userName: string = 'Super Admin';
  userRole: string = 'Super Admin';
  userInitials: string = 'S';

  // Variabel untuk ngIf menu
  isSuperAdmin: boolean = true; 
  isAdminHrd: boolean = false;

  private profileSub!: Subscription;

  constructor(
    public layoutService: LayoutService,
    private router: Router,
    private profileApi: ProfileApiService // 👈 Inject service di sini
  ) {}

  ngOnInit(): void {
    // Panggil fungsi ini saat sidebar pertama kali muncul / direfresh
    this.loadUserData();

    // 👇 DENGARKAN PERUBAHAN NAMA DARI HALAMAN PROFIL
    this.profileSub = this.profileApi.profileUpdated.subscribe((updatedUser: any) => {
      // Update Nama & Inisial saat itu juga tanpa reload
      this.userName = updatedUser.name;
      this.userInitials = this.userName.charAt(0).toUpperCase();
      
      // Update role jika diperlukan
      this.processRole(updatedUser);
    });
  }

  loadUserData(): void {
    // BACA DARI LOCAL STORAGE
    const userStr = localStorage.getItem('user_data') || localStorage.getItem('user'); 
    
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        
        // --- SET NAMA LENGKAP ---
        this.userName = user.name || 'Super Admin';
        
        // --- SET INISIAL (Huruf Pertama) ---
        this.userInitials = this.userName.charAt(0).toUpperCase();

        // --- PROSES ROLE ---
        this.processRole(user);

      } catch (e) {
        console.error('Gagal membaca data dari LocalStorage', e);
        this.setFallbackUser();
      }
    } else {
      // Jika LocalStorage kosong, jalankan ini
      this.setFallbackUser();
    }
  }

  // Fungsi baru untuk merapikan logika pengecekan role
  processRole(user: any): void {
    if (user.role?.name) {
      this.userRole = user.role.name;
    } else if (user.role_id === 1 || user.username === 'superadmin') {
      this.userRole = 'Super Admin';
    } else if (user.role_id === 2 || user.username === 'admin-hrd' || user.username === 'adminhrd') {
      this.userRole = 'Admin HRD';
    } else {
      this.userRole = user.role || 'Super Admin';
    }

    // Set Flag Boolean untuk Menu Sidebar HTML
    const roleLower = this.userRole.toLowerCase();
    
    if (roleLower.includes('super admin') || roleLower === 'superadmin' || user.role_id === 1) {
      this.isSuperAdmin = true;
      this.isAdminHrd = false;
    } else if (roleLower.includes('hrd') || roleLower === 'adminhrd' || roleLower === 'admin-hrd' || user.role_id === 2) {
      this.isSuperAdmin = false;
      this.isAdminHrd = true;
    }
  }

  setFallbackUser(): void {
    this.userName = 'Super Admin';
    this.userRole = 'Super Admin';
    this.userInitials = 'S';
    this.isSuperAdmin = true;
    this.isAdminHrd = false;
  }

  logout(): void {
    // Hapus bersih local storage
    localStorage.removeItem('auth_token');
    localStorage.removeItem('token');
    localStorage.removeItem('user_data');
    localStorage.removeItem('user');
    
    // Redirect ke login
    this.router.navigate(['/auth/login']);
  }

  // Penting untuk membersihkan memori saat komponen ditutup
  ngOnDestroy(): void {
    if (this.profileSub) {
      this.profileSub.unsubscribe();
    }
  }
}
