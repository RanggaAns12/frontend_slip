import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { EmployeeApiService } from '../../../superadmin/employees/services/employee-api.service';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-hrd-employee-list',
  standalone: false,
  templateUrl: './hrd-employee-list.component.html',
  styleUrls: ['./hrd-employee-list.component.scss']
})
export class HrdEmployeeListComponent implements OnInit, OnDestroy {

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

  // ✅ MASTER DATA DEPARTEMEN & POSISI (Wajib Baku untuk Smart Matching Import)
  departemenData = [
    { 
      nama: "Engineering", 
      posisi: ["Supervisor", "Karu Mekanik", "Karu Elektrik", "Elektrik Preventif Repair", "Drafter", "Mekanik", "Instrument", "Electrical", "Admin Engineering"] 
    },
    { 
      nama: "Produksi", 
      posisi: ["Supervisor", "Shift Leader PM", "Shift Leader SP", "Karu Rewinder", "Boiler", "Op. Boiler", "Operator", "Operator Alat Berat", "Operator Dryer", "Operator Wire Press", "Operator DCS PM", "Operator Size Press", "Operator Coarse Screen", "Operator SCS SP", "Operator Pulper"] 
    },
    { 
      nama: "WTP/WWTP", 
      posisi: ["SPV", "Karu WWTP", "Operator RO", "Operator WWTP", "Kebersihan", "Anggota"] 
    },
    { 
      nama: "Logistik", 
      posisi: ["Supervisor", "Admin", "Anggota"] 
    },
    { 
      nama: "HRD", 
      posisi: ["Supervisor", "Staff"] 
    },
    { 
      nama: "QC/R&D", 
      posisi: ["Supervisor", "QC"] 
    },
    { 
      nama: "UMUM", 
      posisi: ["Kebersihan", "Supir", "Driver", "Office Boy", "Office Girl", "Gardener"] 
    },
    { nama: "Security", posisi: ["Danru"] },
    { nama: "CIVIL", posisi: ["CIVIL"] },
    { nama: "Fabrikasi", posisi: ["Engineering"] },
    { nama: "Bahan Baku", posisi: ["SPV"] },
    { nama: "HSE", posisi: ["HSE"] },
    { nama: "IT", posisi: ["IT"] },
    { nama: "Purchasing", posisi: [] },
    { nama: "Finance", posisi: [] },
    { nama: "Accounting", posisi: [] }
  ];

  // Toast Notifikasi
  toastMessage: string = '';
  toastType: 'success' | 'error' = 'success';
  toastTimer: any;

  // Modal State (Form Create/Edit & Detail)
  isFormOpen: boolean = false;
  isDetailOpen: boolean = false;
  selectedEmployeeForm: any = null;

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

  openCreateModal(): void {
    this.selectedEmployeeForm = null;
    this.isFormOpen = true;
  }

  openEditModal(emp: any): void {
    this.selectedEmployeeForm = { ...emp };
    this.isFormOpen = true;
  }

  openDetailModal(emp: any): void {
    this.selectedEmployeeForm = emp;
    this.isDetailOpen = true;
  }

  saveEmployee(data: any): void {
    if (data.id) {
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
    this.selectedFile = null;
    this.isProcessing = false;
    this.sheetNames = [];
    this.selectedSheet = '';
    this.isLoadingSheets = false;
  }

  // ✅ PERBAIKAN: Menggunakan readAsBinaryString seperti Superadmin
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      this.isLoadingSheets = true;
      this.sheetNames = [];
      this.selectedSheet = '';

      const reader = new FileReader();
      reader.onload = (e: any) => {
        try {
          const bstr: string = e.target.result;
          const wb: XLSX.WorkBook = XLSX.read(bstr, { type: 'binary' });
          this.sheetNames = wb.SheetNames;
          if (this.sheetNames.length > 0) this.selectedSheet = this.sheetNames[0];
          this.isLoadingSheets = false;
        } catch (error) {
          this.isLoadingSheets = false;
          console.error(error);
          this.showToast('Gagal membaca daftar sheet pada file.', 'error');
        }
      };
      reader.readAsBinaryString(file);
    }
  }

  // ✅ PERBAIKAN: Menyalin penuh logika array 2D & Smart Matching dari Superadmin
  uploadFile() {
    if (!this.selectedFile || !this.selectedSheet) return;

    this.isProcessing = true;
    const reader = new FileReader();

    reader.onload = (e: any) => {
      try {
        const bstr: string = e.target.result;
        const wb: XLSX.WorkBook = XLSX.read(bstr, { type: 'binary' });
        const wsname: string = this.selectedSheet;
        const ws: XLSX.WorkSheet = wb.Sheets[wsname];

        // Membaca file sebagai array of arrays
        const rawData: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });
        
        if (rawData.length < 5) {
            this.showToast('File Excel kosong atau format salah (Harus melebihi 4 baris header).', 'error');
            this.isProcessing = false;
            return;
        }

        // Potong 4 baris pertama (karena isinya adalah judul / header dari perusahaan)
        const dataRows = rawData.slice(4); 

        const mappedData = dataRows.map((row: any[]) => {
          
          // === LOGIKA SMART MATCHING DEPARTEMEN ===
          const rawPosisi = String(row[8] || '').trim().toLowerCase();
          const rawDept = String(row[9] || '').trim().toLowerCase();
          
          let finalDept = '';
          let finalPosisi = '';

          // 1. Prioritas Utama: Cari berdasarkan POSISI
          if (rawPosisi) {
            for (const dept of this.departemenData) {
              const foundPos = dept.posisi.find(p => 
                p.toLowerCase() === rawPosisi ||
                p.toLowerCase().includes(rawPosisi) ||
                rawPosisi.includes(p.toLowerCase())
              );
              
              if (foundPos) {
                finalPosisi = foundPos;
                finalDept = dept.nama; 
                break;
              }
            }
          }

          // 2. Jika posisinya kosong/tidak valid, coba cari dari Departemennya saja
          if (!finalDept && rawDept) {
            const foundDept = this.departemenData.find(d => 
              d.nama.toLowerCase() === rawDept || 
              d.nama.toLowerCase().includes(rawDept) || 
              rawDept.includes(d.nama.toLowerCase())
            );
            if (foundDept) {
              finalDept = foundDept.nama;
            }
          }
          // === END SMART MATCHING ===

          return {
            nik_karyawan: row[1] || '',  
            nik_ktp: row[2] || '',       
            status_karyawan: row[3] || 'PKWTT', 
            nama_lengkap: row[4] || '',  
            status_pajak: row[5] || 'TK/0',      
            no_rekening: row[6] || '',   
            status_pajak_2026: row[7] || '', 
            posisi: finalPosisi,
            dept: finalDept,
            tanggal_diterima: row[10] || null, 
            tanggal_lahir: row[11] || null,    
            npwp: row[12] || '',         
            bpjs_ketenagakerjaan: row[13] || '', 
            pendidikan: row[14] || '',   
            agama: row[15] || '',        
            jenis_kelamin: row[16] || '',
            alamat: row[17] || '',       
            is_active: 1
          };
        });

        // Filter hanya yang memiliki nama dan nik karyawan
        const cleanData = mappedData.filter(d => d.nama_lengkap && d.nik_karyawan);

        if (cleanData.length === 0) {
            this.showToast('Tidak ada baris data valid ditemukan (Pastikan format data dimulai dari baris ke-5).', 'error');
            this.isProcessing = false;
            return;
        }

        // Kirim ke API Laravel
        this.employeeApi.import(cleanData).subscribe({ 
          next: (res: any) => {
            this.isProcessing = false;
            this.closeImportModal();
            this.loadData(); // Langsung fetch data ulang untuk memperbarui tabel
            this.showToast(`Import Berhasil! Data karyawan otomatis di-update.`, 'success');
          },
          error: (err: any) => {
            this.isProcessing = false;
            console.error(err);
            this.showToast('Gagal Import: ' + (err.error?.message || 'Error Server'), 'error');
          }
        });

      } catch (error) {
        this.isProcessing = false;
        console.error(error);
        this.showToast('Gagal membaca format data Excel.', 'error');
      }
    };
    
    reader.readAsBinaryString(this.selectedFile);
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