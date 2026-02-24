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
        // Ambil dari response.data.token sesuai struktur JSON backend kita
        const token = response.data?.token || response.token || response.access_token;

        if (!token) {
            this.errorMessage = 'Login gagal: Token tidak ditemukan di response server.';
            console.error('Struktur Response Salah:', response);
            return;
        }

        localStorage.setItem('auth_token', token);
        
        // C. Ambil Data User (PERBAIKAN: Harus ambil dari response.data.user)
        const user = response.data?.user; 
        const role = user?.role; // Sekarang ini berbentuk object {id, name, slug}

        // D. Simpan User Data jika ada
        if (user) {
          // KODE ASLI MAS:
          localStorage.setItem('user_data', JSON.stringify(user));
          
          // ==========================================
          // TAMBAHAN: Jaga-jaga buat sidebar baca dari key 'user'
          localStorage.setItem('user', JSON.stringify(user));
          // ==========================================

          // PERBAIKAN: Simpan slug role-nya saja sebagai string
          if (role && role.slug) {
            localStorage.setItem('user_role', role.slug);
          }
        } else {
          console.warn('⚠️ Data User kosong di response login');
        }

        // E. Redirect Logic (Berdasarkan Role Slug)
        // PERBAIKAN: Gunakan role?.slug karena role sekarang adalah object
        const roleSlug = role?.slug;
        console.log('🔀 Redirecting user with role:', roleSlug);

        // PERBAIKAN: Tambahkan trick "Sapu Jagat" reload() agar sidebar dinamis langsung ter-update
        if (roleSlug === 'superadmin') {
          this.router.navigate(['/superadmin/dashboard']).then(() => window.location.reload());
        } else if (roleSlug === 'admin-hrd') {
          this.router.navigate(['/hrd/dashboard']).then(() => window.location.reload());
        } else {
          // Fallback Default (Jika role tidak dikenali atau null)
          // Kita paksa ke superadmin dashboard dulu untuk testing dev
          console.warn('⚠️ Role tidak dikenali, memaksa redirect ke dashboard superadmin');
          this.router.navigate(['/superadmin/dashboard']).then(() => window.location.reload()); 
        }
      },

      // ERROR LOGIN
      error: (error: any) => { 
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
          // PERBAIKAN: Handling Error Validasi Laravel (ValidationException) 
          // Laravel Validation biasanya ada di error.error.errors
          const validationErrors = error.error?.errors;
          if (validationErrors && validationErrors.username) {
              this.errorMessage = validationErrors.username[0]; // Menampilkan "Username atau password salah." dari controller
          } else {
              this.errorMessage = error.error?.message || 'Data input tidak valid.';
          }
        } else {
          // Error Lainnya
          this.errorMessage = error.error?.message || 'Terjadi kesalahan sistem. Coba lagi nanti.';
        }
      }
    });
  }
}
