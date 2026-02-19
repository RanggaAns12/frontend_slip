import { Component, OnInit, OnDestroy } from '@angular/core';
import { LayoutService } from '../../services/layout.service'; // Pastikan path benar

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  // styleUrls: ['./navbar.component.scss'] // Uncomment jika ada file scss
})
export class NavbarComponent implements OnInit, OnDestroy {
  
  // Variable yang dibutuhkan HTML
  greeting: string = 'Selamat Datang';
  userName: string = 'Admin';
  userInitials: string = 'AD';
  currentTime: Date = new Date();
  
  private timerId: any;

  // Inject LayoutService agar bisa dipanggil di HTML (layoutService.toggle...)
  constructor(public layoutService: LayoutService) {}

  ngOnInit(): void {
    this.loadUserData();
    this.updateClockAndGreeting();
    
    // Update jam setiap 30 detik
    this.timerId = setInterval(() => this.updateClockAndGreeting(), 30000);
  }

  ngOnDestroy(): void {
    if (this.timerId) clearInterval(this.timerId);
  }

  // Logic Jam & Salam
  private updateClockAndGreeting(): void {
    this.currentTime = new Date();
    const h = this.currentTime.getHours();
    
    if (h >= 4 && h < 11) this.greeting = 'Selamat Pagi';
    else if (h >= 11 && h < 15) this.greeting = 'Selamat Siang';
    else if (h >= 15 && h < 18) this.greeting = 'Selamat Sore';
    else this.greeting = 'Selamat Malam';
  }

  // Logic Ambil Nama User dari LocalStorage
  private loadUserData(): void {
    const userJson = localStorage.getItem('user_data');
    
    if (userJson) {
      try {
        const userObj = JSON.parse(userJson);
        this.userName = userObj.name || userObj.nama_lengkap || userObj.username || 'Admin';
      } catch (e) {
        console.warn('Gagal parse user data', e);
      }
    } else {
      // Fallback jika json kosong
      this.userName = localStorage.getItem('username') || 'Admin';
    }

    this.generateInitials(this.userName);
  }

  // Generate Inisial (Contoh: "Budi Santoso" -> "BS")
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
}
