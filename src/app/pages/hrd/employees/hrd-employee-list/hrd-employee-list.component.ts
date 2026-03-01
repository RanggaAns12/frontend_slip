import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { EmployeeApiService } from '../../../superadmin/employees/services/employee-api.service';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-hrd-employee-list',
  standalone: false,
  templateUrl: './hrd-employee-list.component.html',
  styleUrls: ['./hrd-employee-list.component.scss']
})
export class HrdEmployeeListComponent implements OnInit {

  // Data Karyawan
  employees: any[] = [];
  filteredEmployees: any[] = [];
  paginatedEmployees: any[] = [];
  isLoading: boolean = true;

  // Pagination
  currentPage: number = 1;
  pageSize: number = 10;
  totalPages: number = 1;

  // Fitur Filter & Pencarian
  searchKeyword: string = '';
  searchTimeout: any;
  filterDept: string = '';
  filterPosisi: string = '';
  departments: string[] = [];
  positions: string[] = [];

  // Toast Notifikasi
  toastMessage: string = '';
  toastType: 'success' | 'error' = 'success';
  toastTimer: any;

  // Modal State (Form Create/Edit & Detail)
  isFormOpen: boolean = false;
  isDetailOpen: boolean = false;
  selectedEmployeeForm: any = null; // Menyimpan data untuk Edit atau Detail

  // Modal Delete
  showDeleteModal: boolean = false;
  employeeToDelete: any = null;

  // Modal Import Excel
  showImportModal: boolean = false;
  selectedFile: File | null = null;
  isLoadingSheets: boolean = false;
  sheetNames: string[] = [];
  selectedSheet: string = '';
  isProcessing: boolean = false;

  constructor(
    private employeeApi: EmployeeApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  // ==========================================
  // 1. DATA FETCHING & FILTERING
  // ==========================================
  
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

  onSearch(event: any): void {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.searchKeyword = event.target.value;
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
    const searchInput = document.getElementById('searchInput') as HTMLInputElement;
    if (searchInput) searchInput.value = '';

    this.filterDept = '';
    this.filterPosisi = '';
    this.applyFilter();
  }

  // ==========================================
  // 2. PAGINATION
  // ==========================================
  
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

  // ==========================================
  // 3. NAVIGATION & CRUD ACTIONS (MODAL)
  // ==========================================

  openCreateModal(): void {
    this.selectedEmployeeForm = null;
    this.isFormOpen = true;
  }

  openEditModal(emp: any): void {
    this.selectedEmployeeForm = { ...emp }; // Clone data agar langsung terisi di form
    this.isFormOpen = true;
  }

  openDetailModal(emp: any): void {
    this.selectedEmployeeForm = emp;
    this.isDetailOpen = true;
  }

  saveEmployee(data: any): void {
    if (data.id) {
      // Proses Update (Edit)
      this.employeeApi.update(data.id, data).subscribe({
        next: () => {
          this.showToast('Data karyawan berhasil diperbarui.', 'success');
          this.isFormOpen = false;
          this.loadData();
        },
        error: (err: any) => {
          console.error(err);
          this.showToast('Gagal memperbarui data.', 'error');
        }
      });
    } else {
      // Proses Create (Tambah Baru)
      this.employeeApi.create(data).subscribe({
        next: () => {
          this.showToast('Karyawan baru berhasil ditambahkan.', 'success');
          this.isFormOpen = false;
          this.loadData();
        },
        error: (err: any) => {
          console.error(err);
          this.showToast('Gagal menambahkan karyawan.', 'error');
        }
      });
    }
  }

  goToFullDatabase(): void {
    this.showToast('Fitur tabel penuh segera hadir.', 'success');
  }

  // ==========================================
  // 4. MODAL DELETE
  // ==========================================
  
  confirmDelete(emp: any): void {
    this.employeeToDelete = emp;
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.employeeToDelete = null;
  }

  deleteEmployee(): void {
    if (!this.employeeToDelete) return;

    this.employeeApi.delete(this.employeeToDelete.id).subscribe({
      next: () => {
        this.showToast(`Data ${this.employeeToDelete.nama_lengkap} berhasil dihapus.`, 'success');
        this.closeDeleteModal();
        this.loadData();
      },
      error: (err: any) => {
        console.error(err);
        this.showToast('Gagal menghapus data karyawan.', 'error');
        this.closeDeleteModal();
      }
    });
  }

  // ==========================================
  // 5. IMPORT & EXPORT EXCEL
  // ==========================================

  exportData(): void {
    this.showToast('Mempersiapkan file Excel...', 'success');
    
    this.employeeApi.export().subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Data_Karyawan_${new Date().getTime()}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      },
      error: (err: any) => this.showToast('Gagal mendownload data.', 'error')
    });
  }

  openImportModal(): void {
    this.showImportModal = true;
    this.selectedFile = null;
    this.sheetNames = [];
    this.selectedSheet = '';
  }

  closeImportModal(): void {
    this.showImportModal = false;
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      this.readExcelSheets(file);
    }
  }

  readExcelSheets(file: File): void {
    this.isLoadingSheets = true;
    const reader = new FileReader();

    reader.onload = (e: any) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        this.sheetNames = workbook.SheetNames;
        if (this.sheetNames.length > 0) {
          this.selectedSheet = this.sheetNames[0];
        }
      } catch (error) {
        console.error('Gagal membaca sheet excel:', error);
        this.showToast('Format Excel tidak valid.', 'error');
      } finally {
        this.isLoadingSheets = false;
      }
    };

    reader.readAsArrayBuffer(file);
  }

  uploadFile(): void {
    if (!this.selectedFile || !this.selectedSheet) return;

    this.isProcessing = true;
    const reader = new FileReader();

    reader.onload = (e: any) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[this.selectedSheet];
        
        // Convert to Array JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (jsonData.length === 0) {
          this.showToast('Sheet Excel kosong atau format tidak sesuai!', 'error');
          this.isProcessing = false;
          return;
        }

        this.employeeApi.import(jsonData).subscribe({
          next: (res: any) => {
            this.showToast('Data karyawan berhasil diimport!', 'success');
            this.isProcessing = false;
            this.closeImportModal();
            this.loadData();
          },
          error: (err: any) => {
            console.error('Error Import API:', err);
            const errorMsg = err.error?.message || 'Gagal melakukan import data. Cek template Anda.';
            this.showToast(errorMsg, 'error');
            this.isProcessing = false;
          }
        });

      } catch (error) {
        console.error('Gagal parsing Excel:', error);
        this.showToast('Gagal memproses file Excel.', 'error');
        this.isProcessing = false;
      }
    };

    reader.readAsArrayBuffer(this.selectedFile);
  }

  // ==========================================
  // 6. TOAST NOTIFICATION HELPERS
  // ==========================================

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
