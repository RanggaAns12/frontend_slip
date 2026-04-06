import { Component, OnDestroy, OnInit } from '@angular/core';
import { LayoutService } from '../../services/layout.service'; // Sesuaikan path

@Component({
  selector: 'app-layout', // Selector tetap app-layout biar gak ubah banyak file
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss'] // Jika ada scss
})
export class LayoutComponent implements OnInit, OnDestroy {
  
  currentTime: Date = new Date();
  greeting: string = 'Selamat Datang';
  userName: string = 'Admin';
  userInitials: string = 'AD';
  
  // 👇 TAMBAHAN: Variabel untuk mendeteksi apakah yang login adalah Manager
  isManager: boolean = false; 

  private timerId: any;

  constructor(public layoutService: LayoutService) {}

  ngOnInit(): void {
    this.loadUserData(); // Nama fungsi saya ubah sedikit agar lebih relevan
    this.updateClockAndGreeting();
    this.timerId = setInterval(() => this.updateClockAndGreeting(), 30000); // Update tiap 30 detik
  }

  ngOnDestroy(): void {
    if (this.timerId) clearInterval(this.timerId);
  }

  private updateClockAndGreeting(): void {
    this.currentTime = new Date();
    const h = this.currentTime.getHours();
    if (h >= 4 && h < 11) this.greeting = 'Selamat Pagi';
    else if (h >= 11 && h < 15) this.greeting = 'Selamat Siang';
    else if (h >= 15 && h < 18) this.greeting = 'Selamat Sore';
    else this.greeting = 'Selamat Malam';
  }

  private loadUserData(): void {
    // Membaca data user dari local storage
    const userJson = localStorage.getItem('user_data') || localStorage.getItem('user');
    
    if (userJson) {
      try {
        const userObj = JSON.parse(userJson);
        
        // 1. Set Nama
        this.userName = userObj.name || userObj.nama_lengkap || userObj.username || 'Admin';
        
        // 2. 👇 TAMBAHAN: Pengecekan Role Manager
        let role = '';
        if (userObj.role?.name) {
          role = userObj.role.name; // Jika formatnya objek (role.name)
        } else if (typeof userObj.role === 'string') {
          role = userObj.role; // Jika formatnya langsung string
        }

        // Cek apakah string role mengandung kata 'manager' (dibuat huruf kecil semua agar aman)
        if (role.toLowerCase().includes('manager')) {
          this.isManager = true;
        } else {
          this.isManager = false;
        }

      } catch (e) {
        console.error('Gagal membaca data user:', e);
      }
    } 
    
    this.generateInitials(this.userName);
  }

  private generateInitials(name: string) {
    const parts = name.trim().split(' ');
    this.userInitials = parts.length >= 2 
      ? (parts[0][0] + parts[1][0]).toUpperCase() 
      : parts[0].substring(0, 2).toUpperCase();
  }
}