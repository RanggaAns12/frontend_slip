import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { LayoutService } from '../../services/layout.service';
import { ProfileApiService } from '../../pages/superadmin/profile/services/profile-api.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-navbar',
  standalone: false,
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit, OnDestroy {
  userName: string = '';
  userInitials: string = '';
  greeting: string = '';
  currentTime: Date = new Date();
  
  private timer: any;
  private profileSub!: Subscription;

  constructor(
    public layoutService: LayoutService,
    private router: Router,
    private profileApi: ProfileApiService // Inject Profile Service
  ) {}

  ngOnInit(): void {
    this.updateTimeAndGreeting();
    this.timer = setInterval(() => {
      this.updateTimeAndGreeting();
    }, 60000); // Update waktu setiap 1 menit

    this.loadUser();

    // DENGARKAN PERUBAHAN PROFIL
    this.profileSub = this.profileApi.profileUpdated.subscribe((updatedUser: any) => {
      this.userName = updatedUser.name;
      this.userInitials = this.getInitials(updatedUser.name);
    });
  }

  updateTimeAndGreeting(): void {
    this.currentTime = new Date();
    const hour = this.currentTime.getHours();

    if (hour >= 5 && hour < 11) {
      this.greeting = 'Selamat Pagi';
    } else if (hour >= 11 && hour < 15) {
      this.greeting = 'Selamat Siang';
    } else if (hour >= 15 && hour < 18) {
      this.greeting = 'Selamat Sore';
    } else {
      this.greeting = 'Selamat Malam';
    }
  }

  loadUser(): void {
    const localUserStr = localStorage.getItem('user');
    if (localUserStr) {
      const user = JSON.parse(localUserStr);
      this.userName = user.name || 'Admin';
      this.userInitials = this.getInitials(this.userName);
    }
  }

  getInitials(name: string): string {
    if (!name) return 'A';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  ngOnDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }
    if (this.profileSub) {
      this.profileSub.unsubscribe();
    }
  }
}
