import { Component, OnInit } from '@angular/core';
import { LayoutService } from '../../services/layout.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit {
  
  // Variabel dinamis yang akan di-bind ke HTML
  userName: string = 'Super Admin';
  userRole: string = 'Super Admin';
  userInitials: string = 'S';

  constructor(
    public layoutService: LayoutService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // 1. Panggil fungsi ini saat sidebar pertama kali muncul / direfresh
    this.loadUserData();
  }

  loadUserData(): void {
    // 2. BACA DARI LOCAL STORAGE (Tadi Mas tidak pakai ini, makanya statis!)
    const userStr = localStorage.getItem('user_data') || localStorage.getItem('user'); 
    
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        
        // --- 3A. SET NAMA LENGKAP ---
        this.userName = user.name || 'Super Admin';
        
        // --- 3B. SET INISIAL (Huruf Pertama) ---
        this.userInitials = this.userName.charAt(0).toUpperCase();

        // --- 3C. SET ROLE ---
        if (user.role?.name) {
          this.userRole = user.role.name;
        } else if (user.role_id === 1 || user.username === 'superadmin') {
          this.userRole = 'Super Admin';
        } else if (user.role_id === 2 || user.username === 'admin-hrd') {
          this.userRole = 'Admin HRD';
        } else {
          this.userRole = user.role || 'Super Admin';
        }

      } catch (e) {
        console.error('Gagal membaca data dari LocalStorage', e);
        this.setFallbackUser();
      }
    } else {
      // Jika LocalStorage kosong, jalankan ini
      this.setFallbackUser();
      
      // KARENA KITA TAHU JSON RESPONSE BACKEND-NYA, KITA BISA PANGGIL API GET USER KE-1 DI SINI (OPSIONAL)
      // Tapi kita biarkan saja dulu, karena localStorage sekarang akan otomatis terisi saat klik "Simpan".
    }
  }

  setFallbackUser(): void {
    this.userName = 'Super Admin';
    this.userRole = 'Super Admin';
    this.userInitials = 'S';
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
}
