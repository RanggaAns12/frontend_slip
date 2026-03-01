import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router'; // Wajib agar router-outlet & routerLink jalan

// Import Komponen Super Admin Lama
import { LayoutComponent } from './layout/layout.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { NavbarComponent } from './navbar/navbar.component';

// Import Komponen HRD Baru
import { SidebarHrdComponent } from './sidebar-hrd/sidebar-hrd.component';
import { LayoutHrdComponent } from './layout-hrd/layout-hrd.component';

@NgModule({
  declarations: [
    LayoutComponent,
    SidebarComponent,
    NavbarComponent,
    SidebarHrdComponent, // <-- DAFTARKAN
    LayoutHrdComponent   // <-- DAFTARKAN
  ],
  imports: [
    CommonModule,
    RouterModule 
  ],
  exports: [
    LayoutComponent,
    SidebarComponent,
    NavbarComponent,
    SidebarHrdComponent, // <-- EXPORT
    LayoutHrdComponent   // <-- EXPORT
  ]
})
export class SharedModule { }
