import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { EmployeeApiService } from '../../../superadmin/employees/services/employee-api.service'; // Sesuaikan path menuju service Superadmin
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-manager-employee-list',
  templateUrl: './employee-list.component.html',
  styles: [`
    .hide-scrollbar::-webkit-scrollbar { display: none; }
    .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

    .animate-fade-in { animation: fadeIn 0.5s ease-out; }
    .animate-fade-in-up { animation: fadeInUp 0.6s ease-out; }
    .animate-slide-in-right { animation: slideInRight 0.5s ease-out; }
    .animate-scale-up { animation: scaleUp 0.3s ease-out; }
    
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes slideInRight { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
    @keyframes scaleUp { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
  `]
})
export class EmployeeListComponent implements OnInit, OnDestroy {
  
  // === 1. DATA STATE ===
  allEmployees: any[] = [];      
  filteredEmployees: any[] = []; 
  paginatedEmployees: any[] = []; 
  isLoading = false;

  // === 2. FILTER STATE ===
  searchKeyword = '';
  filterDept = '';
  filterPosisi = '';
  departments: string[] = [];
  positions: string[] = [];

  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>(); 

  // === 3. PAGINATION STATE ===
  currentPage = 1;
  pageSize = 25;
  totalPages = 1;

  // === 4. UI STATE (TOAST) ===
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';
  toastTimeout: any;

  constructor(
    private employeeApi: EmployeeApiService, 
    private router: Router
  ) {}

  ngOnInit(): void { 
    this.loadEmployees(); 

    this.searchSubject.pipe(
      debounceTime(400),       
      distinctUntilChanged(),  
      takeUntil(this.destroy$) 
    ).subscribe(searchTerm => {
      this.searchKeyword = searchTerm;
      this.applyFilter();      
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ==========================================
  // DATA LOADING & FILTERING
  // ==========================================
  loadEmployees() {
    this.isLoading = true;
    this.employeeApi.getAll().subscribe({
      next: (res: any) => {
        this.isLoading = false;
        this.allEmployees = res.data || [];
        this.extractFilterOptions();
        this.applyFilter();
      },
      error: (err) => {
        this.isLoading = false;
        this.showToast('Gagal memuat data dari server', 'error');
        console.error(err);
      }
    });
  }

  extractFilterOptions() {
    this.departments = [...new Set(this.allEmployees.map(e => e.dept).filter(d => d))].sort();
    this.positions = [...new Set(this.allEmployees.map(e => e.posisi).filter(p => p))].sort();
  }

  onSearch(event: any) {
    const value = event.target.value;
    this.searchSubject.next(value);
  }

  applyFilter() {
    let temp = [...this.allEmployees];

    if (this.searchKeyword) {
      const key = this.searchKeyword.toLowerCase();
      temp = temp.filter(e => 
        (e.nama_lengkap && e.nama_lengkap.toLowerCase().includes(key)) || 
        (e.nik_karyawan && e.nik_karyawan.toLowerCase().includes(key))
      );
    }

    if (this.filterDept) temp = temp.filter(e => e.dept === this.filterDept);
    if (this.filterPosisi) temp = temp.filter(e => e.posisi === this.filterPosisi);

    this.filteredEmployees = temp;
    
    this.totalPages = Math.ceil(this.filteredEmployees.length / this.pageSize) || 1;
    this.changePage(1); 
  }

  resetFilter() {
    this.searchKeyword = '';
    this.filterDept = '';
    this.filterPosisi = '';
    
    const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;
    if (searchInput) searchInput.value = '';

    this.applyFilter();
  }

  // ==========================================
  // PAGINATION LOGIC
  // ==========================================
  changePage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    const start = (page - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.paginatedEmployees = this.filteredEmployees.slice(start, end);
  }

  getPageNumbers(): number[] {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, this.currentPage - 2);
    let end = Math.min(this.totalPages, start + maxVisible - 1);
    
    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  // ==========================================
  // EXPORT EXCEL LOGIC
  // ==========================================
  exportData() {
    this.employeeApi.export().subscribe({
      next: (blob: any) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Data_Karyawan_${new Date().toISOString().slice(0,10)}.xlsx`;
        document.body.appendChild(a);
        a.click();
        
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        this.showToast('File Excel berhasil didownload', 'success');
      },
      error: (err) => {
        console.error(err);
        this.showToast('Gagal download Excel', 'error');
      }
    });
  }

  // ==========================================
  // NAVIGATION (READ ONLY)
  // ==========================================
  viewDetail(id: number) { 
    this.router.navigate(['/manager/employees/detail', id]); // 👈 PERBAIKAN RUTE KE MANAGER
  }
  
  goToFullDatabase() { 
    // Jika Manager punya halaman database lengkap
    this.router.navigate(['/manager/employees/database']); 
  }

  // ==========================================
  // TOAST HELPER
  // ==========================================
  showToast(msg: string, type: 'success' | 'error') {
    this.toastMessage = msg;
    this.toastType = type;
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => { this.toastMessage = ''; }, 3000);
  }
  
  closeToast() { this.toastMessage = ''; }
}