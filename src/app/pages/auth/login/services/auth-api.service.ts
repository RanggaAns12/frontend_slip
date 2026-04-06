import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthApiService {
  // Gunakan URL dari Environment
  private apiUrl = `${environment.apiUrl}/auth`; 

  constructor(private http: HttpClient) {}

  // Login
  login(credentials: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, credentials);
  }

  // ==========================================
  // UTILITY FUNCTIONS (TAMBAHAN BARU)
  // ==========================================

  // Simpan data autentikasi (Dipanggil di login.component.ts saat berhasil login)
  saveAuthData(token: string, user: any): void {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  }

  // Ambil token untuk Interceptor
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  // Ambil object user lengkap
  getUser(): any | null {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      return JSON.parse(userStr);
    }
    return null;
  }

  // Ambil role (Sangat berguna untuk fitur menyembunyikan tombol di HTML)
  getUserRole(): string {
    const user = this.getUser();
    
    // Asumsi: Di response Laravel, role tersimpan di properti user.role atau user.role.slug
    // Pastikan ini sesuai dengan bentuk JSON dari API Mas ya.
    // Jika bentuknya berupa string langsung, bisa pakai `user?.role`
    return user?.role?.slug || user?.role || ''; 
  }

  // Cek apakah user sudah login
  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  // ==========================================

  // Logout
  logout(): Observable<any> {
    // Hapus spesifik item agar lebih aman
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Kirim request ke backend untuk invalidasi token (Opsional tapi Recommended)
    return this.http.post(`${this.apiUrl}/logout`, {}).pipe(
      tap(() => {
        // Double check clear
        localStorage.clear();
      })
    );
  }
}