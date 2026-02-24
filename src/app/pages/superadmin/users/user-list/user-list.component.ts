import { Component, OnInit } from '@angular/core';
import { UserApiService } from '../services/user-api.service';

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss']
})
export class UserListComponent implements OnInit {

  userList: any[] = [];
  filteredList: any[] = [];
  isLoading = false;

  filterSearch = '';

  showFormModal = false;
  isEditMode = false;
  isSaving = false;
  editUserId: number | string | null = null;
  isEditingSuperAdmin = false;

  userForm: any = {
    name: '',
    username: '',
    password: '',
    role_id: '',
    is_active: true
  };

  showPassword = false;

  showDeleteModal = false;
  isDeleting = false;
  deleteId: number | string | null = null;

  toastMessage = '';
  toastType: 'success' | 'error' = 'success';

  roleOptions = [
    { id: 1, name: 'superadmin', label: 'Super Admin' },
    { id: 2, name: 'admin-hrd', label: 'Admin HRD' },
  ];

  constructor(private userApi: UserApiService) { }

  ngOnInit(): void {
    this.loadData();
  }

  showToast(message: string, type: 'success' | 'error') {
    this.toastMessage = message;
    this.toastType = type;
    setTimeout(() => { this.toastMessage = ''; }, 3500);
  }

  loadData(): void {
    this.isLoading = true;
    this.userApi.getAll().subscribe({
      next: (res: any) => {
        this.userList = res.data || res;
        this.applyFilter();
        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.showToast('Gagal memuat data user', 'error');
        this.isLoading = false;
      }
    });
  }

  applyFilter() {
    const keyword = this.filterSearch.toLowerCase().trim();
    if (!keyword) {
      this.filteredList = [...this.userList];
    } else {
      this.filteredList = this.userList.filter(u =>
        u.name?.toLowerCase().includes(keyword) ||
        u.username?.toLowerCase().includes(keyword) ||
        u.role?.name?.toLowerCase().includes(keyword)
      );
    }
  }

  onSearchChange() {
    this.applyFilter();
  }

  getIsActive = (user: any) => user.is_active === true || user.is_active === 1 || user.is_active === '1';
  getIsNotActive = (user: any) => user.is_active === false || user.is_active === 0 || user.is_active === '0' || user.is_active === null;

  isSuperAdmin(user: any): boolean {
    return user?.role?.name?.toLowerCase() === 'superadmin' || user?.username?.toLowerCase() === 'superadmin';
  }

  openCreateModal() {
    this.isEditMode = false;
    this.editUserId = null;
    this.isEditingSuperAdmin = false;
    this.userForm = { name: '', username: '', password: '', role_id: '', is_active: true };
    this.showPassword = false;
    this.showFormModal = true;
  }

  openEditModal(user: any) {
    this.isEditMode = true;
    this.editUserId = user.id;
    this.isEditingSuperAdmin = this.isSuperAdmin(user);

    this.userForm = {
      name: user.name,
      username: user.username,
      password: '', 
      role_id: user.role?.id || user.role_id,
      is_active: user.is_active
    };
    this.showPassword = false;
    this.showFormModal = true;
  }

  saveUser() {
    if (!this.userForm.name || !this.userForm.username || !this.userForm.role_id) {
      this.showToast('Nama, Username, dan Role wajib diisi!', 'error');
      return;
    }

    this.isSaving = true;

    const payload: any = {
      name: this.userForm.name,
      username: this.userForm.username,
      role_id: this.userForm.role_id,
      is_active: this.userForm.is_active
    };

    if (this.userForm.password) {
      payload.password = this.userForm.password;
    }

    const request = this.isEditMode
      ? this.userApi.update(this.editUserId!, payload)
      : this.userApi.create({ ...payload, password: this.userForm.password });

    request.subscribe({
      next: (res: any) => {
        this.isSaving = false;
        this.showFormModal = false;
        this.loadData();
        this.showToast(this.isEditMode ? 'User berhasil diperbarui!' : 'User berhasil ditambahkan!', 'success');

        // ============================================================
        // FIX: PAKSA BUAT LOCALSTORAGE JIKA EDIT DIRI SENDIRI / SUPERADMIN
        // ============================================================
        if (this.isEditMode) {
            
            // Kita asumsikan orang yang mengedit ini adalah si Superadmin yang sedang login
            // (Karena saat ini backend Mas belum mengirim data 'user' saat login)
            if (this.isEditingSuperAdmin || this.userForm.username === 'superadmin' || this.editUserId == 1) {
                
                // 1. Buat Payload Palsu persis seperti yang diharapkan Sidebar!
                const freshUserData = {
                    id: this.editUserId,
                    name: this.userForm.name, // NAMA BARU YANG DIKETIK
                    username: this.userForm.username,
                    role: { name: 'superadmin' }, // Agar sidebar tahu role nya
                    role_id: this.userForm.role_id
                };

                // 2. TEMBAK LANGSUNG KE LOCAL STORAGE!
                localStorage.setItem('user_data', JSON.stringify(freshUserData));
                localStorage.setItem('user', JSON.stringify(freshUserData));

                console.log('✅ LocalStorage berhasil dipancing:', freshUserData);

                // 3. Reload Halaman 
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            }
        }
        // ============================================================
      },
      error: (err) => {
        console.error(err);
        this.isSaving = false;
        const msg = err?.error?.errors ? Object.values(err.error.errors).flat().join(', ') : (err?.error?.message || 'Terjadi kesalahan saat menyimpan.');
        this.showToast(msg as string, 'error');
      }
    });
  }

  openDeleteModal(id: number | string) {
    this.deleteId = id;
    this.showDeleteModal = true;
  }

  confirmDelete() {
    if (!this.deleteId) return;
    this.isDeleting = true;
    this.userApi.delete(this.deleteId).subscribe({
      next: () => {
        this.isDeleting = false;
        this.showDeleteModal = false;
        this.deleteId = null;
        this.loadData();
        this.showToast('User berhasil dihapus!', 'success');
      },
      error: (err) => {
        console.error(err);
        this.isDeleting = false;
        this.showDeleteModal = false;
        this.showToast(err?.error?.message || 'Gagal menghapus user.', 'error');
      }
    });
  }

  getRoleBadgeClass(roleName: string): string {
    switch (roleName?.toLowerCase()) {
      case 'superadmin': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'admin-hrd':  return 'bg-blue-50 text-blue-700 border-blue-200';
      default:           return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  }

  getRoleLabel(roleName: string): string {
    switch (roleName?.toLowerCase()) {
      case 'superadmin': return 'Super Admin';
      case 'admin-hrd':  return 'Admin HRD';
      default:           return roleName || 'Tanpa Role';
    }
  }
}
