import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router'; // Wajib agar router-outlet & routerLink jalan

// Import Komponen Super Admin & Manager
import { LayoutComponent } from './layout/layout.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { NavbarComponent } from './navbar/navbar.component';
import { SidebarManagerComponent } from './sidebar-manager/sidebar-manager.component';

// Import Komponen HRD
import { SidebarHrdComponent } from './sidebar-hrd/sidebar-hrd.component';
import { LayoutHrdComponent } from './layout-hrd/layout-hrd.component';

@NgModule({
  declarations: [
    LayoutComponent,
    SidebarComponent,
    NavbarComponent,
    SidebarHrdComponent,
    LayoutHrdComponent,
    SidebarManagerComponent   // <-- 1. Didaftarkan di sini
  ],
  imports: [
    CommonModule,             // <-- 2. Ini yang menyelesaikan error ngClass
    RouterModule              // <-- 3. Ini yang menyelesaikan error routerLink
  ],
  exports: [
    LayoutComponent,
    SidebarComponent,
    NavbarComponent,
    SidebarHrdComponent,
    LayoutHrdComponent,
    SidebarManagerComponent   // <-- 4. WAJIB diexport agar bisa dipakai di luar atau di layout
  ]
})
export class SharedModule { }