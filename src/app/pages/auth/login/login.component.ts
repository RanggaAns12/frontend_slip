import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthApiService } from './services/auth-api.service'; // Pastikan path import benar

@Component({
  selector: 'app-login',
  standalone: false, // Jika Mas pakai arsitektur NgModule, pastikan ada ini atau tidak masalah dihapus jika tidak error
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
        const user = response.data?.user || response.user; 
        const role = user?.role; // Sekarang ini berbentuk object {id, name, slug} atau string

        // D. Simpan User Data jika ada
        if (user) {
          // KODE ASLI MAS:
          localStorage.setItem('user_data', JSON.stringify(user));
          
          // ==========================================
          // TAMBAHAN: Jaga-jaga buat sidebar baca dari key 'user'
          localStorage.setItem('user', JSON.stringify(user));
          // ==========================================

          // PERBAIKAN: Simpan slug role-nya saja sebagai string (Lebih kuat pengecekannya)
          if (role && role.slug) {
            localStorage.setItem('user_role', role.slug);
          } else if (role && role.name) {
            localStorage.setItem('user_role', role.name.toLowerCase().replace(' ', ''));
          } else if (user.role_id === 1) {
            localStorage.setItem('user_role', 'superadmin');
          } else if (user.role_id === 2) {
            localStorage.setItem('user_role', 'admin-hrd');
          }
        } else {
          console.warn('⚠️ Data User kosong di response login');
        }
// E. Redirect Logic (Berdasarkan Role Slug atau Role ID)
        // PERBAIKAN: Gunakan role?.slug, role?.name, atau fallback ke role_id
        let roleSlug = role?.slug || (role?.name ? role.name.toLowerCase().replace(' ', '') : '');
        
        // Jika dari object role tidak ketemu, fallback gunakan role_id
        if (!roleSlug && user?.role_id) {
            // Asumsi: ID 1 = Superadmin, ID 2 = Admin HRD, ID 5 = Manager (sesuai seeder)
            if (user.role_id === 1) roleSlug = 'superadmin';
            else if (user.role_id === 2) roleSlug = 'admin-hrd';
            else if (user.role_id === 5) roleSlug = 'manager';
        }

        console.log('🔀 Redirecting user with role:', roleSlug);

        // PERBAIKAN: Menambahkan rute khusus untuk Manager
        if (roleSlug === 'superadmin' || roleSlug === 'superadmin') { 
          this.router.navigate(['/superadmin/dashboard']).then(() => window.location.reload());
        } else if (roleSlug === 'admin-hrd' || roleSlug === 'adminhrd') {
          this.router.navigate(['/hrd/dashboard']).then(() => window.location.reload());
        } else if (roleSlug === 'manager') { // 👈 INI TAMBAHANNYA, MAS!
          this.router.navigate(['/manager/dashboard']).then(() => window.location.reload());
        } else {
          // Fallback Default (Jika role tidak dikenali)
          console.warn('⚠️ Role tidak dikenali, memaksa redirect ke halaman login ulang');
          this.errorMessage = 'Role Anda tidak dikenali oleh sistem.';
          this.authApi.logout().subscribe(); // Auto-logout jika role tidak jelas
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
