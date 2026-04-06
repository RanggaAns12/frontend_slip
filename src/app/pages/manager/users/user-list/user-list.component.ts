import { Component, OnInit } from '@angular/core';
import { UserApiService } from '../../../superadmin/users/services/user-api.service'; // Pastikan path ini benar mengarah ke service superadmin

@Component({
  selector: 'app-manager-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss']
})
export class UserListComponent implements OnInit {

  userList: any[] = [];
  filteredList: any[] = [];
  isLoading = false;

  filterSearch = '';

  toastMessage = '';
  toastType: 'success' | 'error' = 'success';

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

  getRoleAvatarColor(roleName: string): string {
    switch (roleName?.toLowerCase()) {
      case 'superadmin': return 'bg-purple-500';
      case 'admin-hrd':  return 'bg-blue-500';
      case 'manager':    return 'bg-amber-500';
      default:           return 'bg-gray-400';
    }
  }

  getRoleBadgeClass(roleName: string): string {
    switch (roleName?.toLowerCase()) {
      case 'superadmin': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'admin-hrd':  return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'manager':    return 'bg-amber-50 text-amber-700 border-amber-200'; 
      default:           return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  }

  getRoleLabel(roleName: string): string {
    switch (roleName?.toLowerCase()) {
      case 'superadmin': return 'Super Admin';
      case 'admin-hrd':  return 'Admin HRD';
      case 'manager':    return 'Manager';
      default:           return roleName || 'Tanpa Role';
    }
  }
}