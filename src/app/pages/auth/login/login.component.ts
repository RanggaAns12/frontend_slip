import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthApiService } from './services/auth-api.service'; // Pastikan path import benar

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
})
export class LoginComponent {
  // Variabel untuk Binding Form
  loginData = { username: '', password: '' };
  
  // State Loading & Error
  isLoading = false;
  errorMessage = '';
  showPassword = false;

  constructor(
    private authApi: AuthApiService,
    private router: Router
  ) {}

  // Toggle Show/Hide Password
  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  // Fungsi Login
  onLogin() {
    // 1. Validasi Input di awal
    if (!this.loginData.username || !this.loginData.password) {
      this.errorMessage = 'Username dan Password wajib diisi';
      return;
    }

    // 2. Set Loading State
    this.isLoading = true;
    this.errorMessage = '';

    // 3. Panggil API Login
    this.authApi.login(this.loginData).subscribe({
      
      // SUKSES LOGIN
      next: (response: any) => {
        this.isLoading = false;
        
        // Debugging Response Backend
        console.log('✅ Response Login:', response); 

        // A. Validasi Token (Wajib Ada)
        const token = response.access_token || response.token || response.data?.token;

        if (!token) {
            this.errorMessage = 'Login gagal: Token tidak ditemukan di response server.';
            console.error('Struktur Response Salah:', response);
            return;
        }

        localStorage.setItem('auth_token', token);

        
        // C. Ambil Data User (Safe Navigation)
        const user = response.user; 
        const role = user?.role; // Ambil role dengan aman

        // D. Simpan User Data jika ada
        if (user) {
          localStorage.setItem('user_data', JSON.stringify(user));
          if (role) {
            localStorage.setItem('user_role', role);
          }
        } else {
          console.warn('⚠️ Data User kosong di response login');
        }

        // E. Redirect Logic (Berdasarkan Role)
        console.log('🔀 Redirecting user with role:', role);

        if (role === 'superadmin') {
          this.router.navigate(['/superadmin/dashboard']);
        } else if (role === 'admin-hrd') {
          this.router.navigate(['/hrd/dashboard']);
        } else {
          // Fallback Default (Jika role tidak dikenali atau null)
          // Kita paksa ke superadmin dashboard dulu untuk testing dev
          console.warn('⚠️ Role tidak dikenali, memaksa redirect ke dashboard superadmin');
          this.router.navigate(['/superadmin/dashboard']); 
        }
      },

      // ERROR LOGIN
      error: (error: any) => { // Tambahkan tipe :any biar TypeScript aman
        this.isLoading = false;
        console.error('❌ Login Error:', error);

        // Handling Error Message dari Backend Laravel
        if (error.status === 401) {
          this.errorMessage = 'Username atau Password salah.';
        } else if (error.status === 403) {
          this.errorMessage = 'Akun Anda dinonaktifkan atau tidak memiliki akses.';
        } else if (error.status === 0) {
          this.errorMessage = 'Gagal terhubung ke server. Periksa koneksi backend (Laravel mati / CORS blocked).';
        } else if (error.status === 422) {
          // Error Validasi Laravel (misal format email salah)
          this.errorMessage = error.error?.message || 'Data input tidak valid.';
        } else {
          // Error Lainnya
          this.errorMessage = error.error?.message || 'Terjadi kesalahan sistem. Coba lagi nanti.';
        }
      }
    });
  }
}
