import { Component, HostListener } from '@angular/core';
import { LayoutService } from '../../services/layout.service'; // Sesuaikan path jika berbeda

@Component({
  selector: 'app-layout-hrd',
  standalone: false,
  templateUrl: './layout-hrd.component.html',
  styleUrls: ['./layout-hrd.component.scss']
})
export class LayoutHrdComponent {
  
  constructor(public layoutService: LayoutService) {}

  // Menutup sidebar mobile saat layar di-resize ke ukuran desktop
  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    if (event.target.innerWidth >= 1024) {
      if (this.layoutService.isMobileSidebarOpen()) {
        this.layoutService.toggleMobileSidebar();
      }
    }
  }

  // Fungsi untuk overlay gelap (menutup sidebar saat overlay diklik di mobile)
  closeMobileSidebar() {
    if (this.layoutService.isMobileSidebarOpen()) {
      this.layoutService.toggleMobileSidebar();
    }
  }
}
