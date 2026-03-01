import { Component, OnInit } from '@angular/core';
import { ProfileApiService } from './services/profile-api.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-profile',
  standalone: false,
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  
  isLoading: boolean = false;
  isSavingProfile: boolean = false;
  isSavingPassword: boolean = false;

  // Hapus email dari profileData
  profileData = {
    name: '',
    role: 'Admin'
  };

  passwordData = {
    current_password: '',
    new_password: '',
    new_password_confirmation: ''
  };

  constructor(private profileApi: ProfileApiService) {}

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile() {
    this.isLoading = true;
    
    this.profileApi.getProfile().subscribe({
      next: (res: any) => {
        if (res.status === 'success') {
          this.profileData.name = res.data.name;
          this.profileData.role = res.data.role?.name || res.data.role || 'Admin';
        }
        this.isLoading = false;
      },
      error: (err: any) => {
        this.isLoading = false;
        
        // Cek LocalStorage menggunakan key 'user_data' ATAU 'user'
        const localUserStr = localStorage.getItem('user_data') || localStorage.getItem('user');
        if (localUserStr) {
          try {
            const parsed = JSON.parse(localUserStr);
            this.profileData.name = parsed.name || '';
            this.profileData.role = parsed.role?.name || parsed.role || 'Admin';
          } catch (e) {
            console.error('Error parsing local storage user', e);
          }
        }
      }
    });
  }

  updateProfile() {
    // Validasi hanya mengecek nama
    if (!this.profileData.name) {
      Swal.fire('Perhatian', 'Nama tidak boleh kosong!', 'warning');
      return;
    }

    this.isSavingProfile = true;
    // Kirim hanya nama
    this.profileApi.updateProfile({ name: this.profileData.name }).subscribe({
      next: (res: any) => {
        this.isSavingProfile = false;
        
        // 👇 PERBAIKAN: Cari tahu key apa yang dipakai ('user_data' atau 'user')
        const userKey = localStorage.getItem('user_data') ? 'user_data' : 'user';
        const localUserStr = localStorage.getItem(userKey);
        
        if (localUserStr) {
          const localUser = JSON.parse(localUserStr);
          localUser.name = this.profileData.name; // Update nama
          
          // Simpan kembali ke LocalStorage dengan key yang tepat
          localStorage.setItem(userKey, JSON.stringify(localUser));

          // 👇 TEMBAKKAN SINYAL KE SIDEBAR DAN NAVBAR
          this.profileApi.profileUpdated.next(localUser);
        }

        Swal.fire({ 
          toast: true, 
          position: 'top-end', 
          icon: 'success', 
          title: 'Profil berhasil diperbarui!', 
          showConfirmButton: false, 
          timer: 3000 
        });
      },
      error: (err: any) => {
        this.isSavingProfile = false;
        Swal.fire('Gagal', err.error?.message || 'Terjadi kesalahan sistem.', 'error');
      }
    });
  }

  updatePassword() {
    if (!this.passwordData.current_password || !this.passwordData.new_password || !this.passwordData.new_password_confirmation) {
      Swal.fire('Perhatian', 'Semua kolom password harus diisi!', 'warning');
      return;
    }

    if (this.passwordData.new_password !== this.passwordData.new_password_confirmation) {
      Swal.fire('Perhatian', 'Konfirmasi password baru tidak cocok!', 'warning');
      return;
    }

    if (this.passwordData.new_password.length < 8) {
      Swal.fire('Perhatian', 'Password baru minimal 8 karakter!', 'warning');
      return;
    }

    this.isSavingPassword = true;
    this.profileApi.updatePassword(this.passwordData).subscribe({
      next: (res: any) => {
        this.isSavingPassword = false;
        this.passwordData = { current_password: '', new_password: '', new_password_confirmation: '' }; 
        Swal.fire('Berhasil!', 'Password akun Anda berhasil diubah.', 'success');
      },
      error: (err: any) => {
        this.isSavingPassword = false;
        Swal.fire('Gagal', err.error?.message || 'Password saat ini salah atau terjadi kesalahan.', 'error');
      }
    });
  }

  getInitials(name: string): string {
    if (!name) return 'A';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
}
