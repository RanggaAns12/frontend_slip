import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LayoutService {
  // Menggunakan Signal (Angular 17+) untuk performa reaktif yang lebih baik
  // false = Sidebar Lebar (Default), true = Sidebar Kecil (Icon Only)
  isSidebarCollapsed = signal<boolean>(false);
  
  // false = Sidebar Mobile Tutup, true = Sidebar Mobile Buka
  isMobileSidebarOpen = signal<boolean>(false);

  toggleSidebar() {
    this.isSidebarCollapsed.update(v => !v);
  }

  toggleMobileSidebar() {
    this.isMobileSidebarOpen.update(v => !v);
  }

  closeMobileSidebar() {
    this.isMobileSidebarOpen.set(false);
  }
}
