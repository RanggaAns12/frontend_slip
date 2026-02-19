import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router'; // Penting buat routerLink

import { SidebarComponent } from './sidebar/sidebar.component';
import { NavbarComponent } from './navbar/navbar.component';
import { LayoutComponent } from './layout/layout.component';

@NgModule({
  declarations: [
    SidebarComponent,
    NavbarComponent,
    LayoutComponent
  ],
  imports: [
    CommonModule,
    RouterModule // Wajib import ini biar routerLink di sidebar jalan
  ],
  exports: [
    LayoutComponent, // Export Layout biar bisa dipanggil module lain
    SidebarComponent,
    NavbarComponent
  ]
})
export class SharedModule { }
