import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { EmployeeApiService } from '../../../superadmin/employees/services/employee-api.service'; // Sesuaikan path menuju service Superadmin
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-manager-employee-list',
  standalone: false,
  templateUrl: './employee-list.component.html',
  styleUrls: ['./employee-list.component.scss']
})
export class EmployeeListComponent implements OnInit, OnDestroy {

  employees: any[] = [];
  filteredEmployees: any[] = [];
  paginatedEmployees: any[] = [];
  isLoading: boolean = true;

  currentPage: number = 1;
  pageSize: number = 10;
  totalPages: number = 1;

  searchKeyword: string = '';
  searchTimeout: any;
  filterDept: string = '';
  filterPosisi: string = '';
  departments: string[] = [];
  positions: string[] = [];

  toastMessage: string = '';
  toastType: 'success' | 'error' = 'success';
  toastTimer: any;

  isDetailOpen: boolean = false;
  selectedEmployeeDetail: any = null;

  constructor(
    private employeeApi: EmployeeApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  ngOnDestroy(): void {
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
    if (this.toastTimer) clearTimeout(this.toastTimer);
  }

  loadData(): void {
    this.isLoading = true;
    this.employeeApi.getAll().subscribe({
      next: (res: any) => {
        this.employees = res.data || res;
        this.extractFilters();
        this.applyFilter();
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('Error fetching employees', err);
        this.showToast('Gagal memuat data karyawan.', 'error');
        this.isLoading = false;
      }
    });
  }

  extractFilters(): void {
    const depts = new Set(this.employees.map(e => e.dept).filter(d => !!d));
    this.departments = Array.from(depts).sort();

    const pos = new Set(this.employees.map(e => e.posisi).filter(p => !!p));
    this.positions = Array.from(pos).sort();
  }

  onSearchDebounce(): void {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.applyFilter();
    }, 300);
  }

  applyFilter(): void {
    let temp = this.employees;

    if (this.searchKeyword) {
      const keyword = this.searchKeyword.toLowerCase();
      temp = temp.filter(e => 
        e.nama_lengkap?.toLowerCase().includes(keyword) || 
        e.nik_karyawan?.toLowerCase().includes(keyword) ||
        e.nik_ktp?.toLowerCase().includes(keyword)
      );
    }

    if (this.filterDept) {
      temp = temp.filter(e => e.dept === this.filterDept);
    }
    if (this.filterPosisi) {
      temp = temp.filter(e => e.posisi === this.filterPosisi);
    }

    this.filteredEmployees = temp;
    this.totalPages = Math.ceil(this.filteredEmployees.length / this.pageSize) || 1;
    this.currentPage = 1;
    this.updatePagination();
  }

  resetFilter(): void {
    this.searchKeyword = '';
    this.filterDept = '';
    this.filterPosisi = '';
    this.applyFilter();
  }

  updatePagination(): void {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    this.paginatedEmployees = this.filteredEmployees.slice(startIndex, startIndex + this.pageSize);
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    for (let i = 1; i <= this.totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }

  openDetailModal(emp: any): void {
    this.selectedEmployeeDetail = emp;
    this.isDetailOpen = true;
  }

  exportData(): void {
    this.showToast('Mempersiapkan file Excel...', 'success');
    
    this.employeeApi.export().subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Laporan_Karyawan_${new Date().getTime()}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      },
      error: (err: any) => this.showToast('Gagal mendownload data.', 'error')
    });
  }

  showToast(message: string, type: 'success' | 'error'): void {
    this.toastMessage = message;
    this.toastType = type;
    
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.closeToast();
    }, 4000);
  }

  closeToast(): void {
    this.toastMessage = '';
  }
}