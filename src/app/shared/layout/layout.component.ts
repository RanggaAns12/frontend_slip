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
  private timerId: any;

  constructor(public layoutService: LayoutService) {}

  ngOnInit(): void {
    this.loadUserName();
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

  private loadUserName(): void {
    const userJson = localStorage.getItem('user_data');
    if (userJson) {
      try {
        const userObj = JSON.parse(userJson);
        this.userName = userObj.name || userObj.nama_lengkap || userObj.username || 'Admin';
      } catch (e) {}
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
