import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { LayoutService } from '../../services/layout.service'; // Pastikan path ini benar
import { Subscription } from 'rxjs';

// 👇 Import ProfileApiService (sesuaikan path-nya jika berbeda, biasanya pakai service yang sama dengan superadmin)
import { ProfileApiService } from '../../pages/superadmin/profile/services/profile-api.service';

@Component({
  selector: 'app-sidebar-hrd',
  standalone: false,
  templateUrl: './sidebar-hrd.component.html',
  styleUrls: ['./sidebar-hrd.component.scss']
})
export class SidebarHrdComponent implements OnInit, OnDestroy {
  
  // Variabel dinamis yang akan di-bind ke HTML
  userName: string = 'Admin HRD';
  userRole: string = 'Admin HRD';
  userInitials: string = 'H';

  private profileSub!: Subscription; // 👈 Variabel untuk menangkap sinyal

  constructor(
    public layoutService: LayoutService,
    private router: Router,
    private profileApi: ProfileApiService // 👈 Inject service di sini
  ) {}

  ngOnInit(): void {
    // Load saat pertama kali
    this.loadUserData();

    // 👇 DENGARKAN PERUBAHAN NAMA DARI HALAMAN PROFIL
    this.profileSub = this.profileApi.profileUpdated.subscribe((updatedUser: any) => {
      // Update Nama & Inisial seketika
      this.userName = updatedUser.name;
      this.userInitials = this.userName.charAt(0).toUpperCase();
      
      // Update role jika ada
      if (updatedUser.role?.name) {
        this.userRole = updatedUser.role.name;
      } else {
        this.userRole = updatedUser.role || 'Admin HRD';
      }
    });
  }

  loadUserData(): void {
    // Ambil data menggunakan key 'user_data' atau 'user'
    const userStr = localStorage.getItem('user_data') || localStorage.getItem('user'); 
    
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        
        // --- SET NAMA LENGKAP ---
        this.userName = user.name || 'Admin HRD';
        
        // --- SET INISIAL ---
        this.userInitials = this.userName.charAt(0).toUpperCase();

        // --- SET ROLE ---
        if (user.role?.name) {
          this.userRole = user.role.name;
        } else if (user.role_id === 2 || user.username === 'admin-hrd' || user.username === 'adminhrd') {
          this.userRole = 'Admin HRD';
        } else {
          this.userRole = user.role || 'Admin HRD';
        }

      } catch (e) {
        console.error('Gagal membaca data dari LocalStorage', e);
      }
    }
  }

  logout(): void {
    // Hapus bersih local storage
    localStorage.removeItem('auth_token');
    localStorage.removeItem('token');
    localStorage.removeItem('user_data');
    localStorage.removeItem('user');
    localStorage.removeItem('user_role');
    
    // Redirect ke login
    this.router.navigate(['/auth/login']);
  }

  // Wajib dibersihkan agar memori browser tidak berat
  ngOnDestroy(): void {
    if (this.profileSub) {
      this.profileSub.unsubscribe();
    }
  }
}
