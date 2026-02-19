import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { EmployeeApiService } from '../services/employee-api.service';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import * as XLSX from 'xlsx'; // Pastikan sudah install: npm install xlsx

@Component({
  selector: 'app-employee-list',
  templateUrl: './employee-list.component.html',
  styles: [`
    /* Utility Scrollbar */
    .hide-scrollbar::-webkit-scrollbar { display: none; }
    .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

    /* Animations */
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
  allEmployees: any[] = [];      // Data mentah dari API
  filteredEmployees: any[] = []; // Data setelah difilter
  paginatedEmployees: any[] = []; // Data yang tampil di halaman
  isLoading = false;

  // === 2. FILTER STATE ===
  searchKeyword = '';
  filterDept = '';
  filterPosisi = '';
  departments: string[] = [];
  positions: string[] = [];

  // RxJS Subjects untuk Search Real-time
  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>(); // Untuk cleanup memory

  // === 3. PAGINATION STATE ===
  currentPage = 1;
  pageSize = 25;
  totalPages = 1;

  // === 4. UI STATE (MODAL & TOAST) ===
  // Delete Modal
  showDeleteModal = false;
  selectedEmployee: any = null; 
  
  // Toast Notification
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';
  toastTimeout: any;

  // Import Modal
  showImportModal = false;
  selectedFile: File | null = null;
  isProcessing = false; // Untuk Import

  // === 5. SALARY MODAL STATE (NEW) ===
  showSalaryModal = false;
  isSalaryProcessing = false; // Loading khusus simpan gaji
  salaryData: any = {
    id: null,
    nama: '',
    gaji_pokok: 0
  };

  constructor(
    private employeeApi: EmployeeApiService, 
    private router: Router
  ) {}

  ngOnInit(): void { 
    this.loadEmployees(); 

    // SETUP SEARCH REAL-TIME (DEBOUNCE)
    // Mencegah lag saat user mengetik cepat
    this.searchSubject.pipe(
      debounceTime(400),       // Tunggu 400ms setelah berhenti mengetik
      distinctUntilChanged(),  // Jangan eksekusi jika kata kunci sama
      takeUntil(this.destroy$) // Unsubscribe otomatis saat component hancur
    ).subscribe(searchTerm => {
      this.searchKeyword = searchTerm;
      this.applyFilter();      // Jalankan filter
    });
  }

  ngOnDestroy(): void {
    // Bersihkan subscription memory leak
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
    // Ambil data unik untuk dropdown filter
    this.departments = [...new Set(this.allEmployees.map(e => e.dept).filter(d => d))].sort();
    this.positions = [...new Set(this.allEmployees.map(e => e.posisi).filter(p => p))].sort();
  }

  // Method dipanggil saat user mengetik di HTML (input)="onSearch($event)"
  onSearch(event: any) {
    const value = event.target.value;
    this.searchSubject.next(value);
  }

  applyFilter() {
    let temp = [...this.allEmployees];

    // Filter Search
    if (this.searchKeyword) {
      const key = this.searchKeyword.toLowerCase();
      temp = temp.filter(e => 
        (e.nama_lengkap && e.nama_lengkap.toLowerCase().includes(key)) || 
        (e.nik_karyawan && e.nik_karyawan.toLowerCase().includes(key))
      );
    }

    // Filter Dropdown
    if (this.filterDept) temp = temp.filter(e => e.dept === this.filterDept);
    if (this.filterPosisi) temp = temp.filter(e => e.posisi === this.filterPosisi);

    this.filteredEmployees = temp;
    
    // Recalculate Pagination
    this.totalPages = Math.ceil(this.filteredEmployees.length / this.pageSize) || 1;
    this.changePage(1); // Reset ke halaman 1
  }

  resetFilter() {
    this.searchKeyword = '';
    this.filterDept = '';
    this.filterPosisi = '';
    
    // Reset value di input HTML jika perlu
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
  
  getEndIndex() {
    return Math.min(this.currentPage * this.pageSize, this.filteredEmployees.length);
  }

  // ==========================================
  // DELETE LOGIC (MODAL)
  // ==========================================
  confirmDelete(emp: any) {
    this.selectedEmployee = emp;
    this.showDeleteModal = true;
  }

  closeDeleteModal() {
    this.showDeleteModal = false;
    this.selectedEmployee = null;
  }

  deleteEmployee() {
    if (!this.selectedEmployee) return;
    
    this.employeeApi.delete(this.selectedEmployee.id).subscribe({
      next: () => {
        this.closeDeleteModal();
        this.loadEmployees();
        this.showToast('Data karyawan berhasil dihapus!', 'success');
      },
      error: (err) => {
        this.closeDeleteModal();
        this.showToast('Gagal menghapus data. Coba lagi.', 'error');
        console.error(err);
      }
    });
  }

  // ==========================================
  // IMPORT EXCEL LOGIC (COMPLEX)
  // ==========================================
  openImportModal() { this.showImportModal = true; }
  
  closeImportModal() { 
    this.showImportModal = false; 
    this.selectedFile = null; 
    this.isProcessing = false; 
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) this.selectedFile = file;
  }
  
  uploadFile() {
    if (!this.selectedFile) return;

    this.isProcessing = true;
    const reader = new FileReader();

    reader.onload = (e: any) => {
      try {
        const bstr: string = e.target.result;
        const wb: XLSX.WorkBook = XLSX.read(bstr, { type: 'binary' });
        
        const wsname: string = wb.SheetNames[0];
        const ws: XLSX.WorkSheet = wb.Sheets[wsname];

        /* HARDCODE INDEX MAPPING: Baris 1-4 Header, Data mulai Baris 5 (Index 4) */
        const rawData: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });
        
        if (rawData.length < 5) {
            this.showToast('File Excel kosong atau format salah (Baris kurang).', 'error');
            this.isProcessing = false;
            return;
        }

        const dataRows = rawData.slice(4); // Skip 4 baris pertama

        const mappedData = dataRows.map((row: any[]) => {
          return {
            nik_karyawan: row[1] || '',  // Kolom B
            nik_ktp: row[2] || '',       // Kolom C
            status_karyawan: row[3] || 'PKWTT', // Kolom D
            nama_lengkap: row[4] || '',  // Kolom E
            no_rekening: row[6] || '',   // Kolom G
            status_pajak: row[7] || 'TK/0', // Kolom H
            posisi: row[8] || '',        // Kolom I
            dept: row[9] || '',          // Kolom J
            tanggal_diterima: row[10] || null, // Kolom K
            tanggal_lahir: row[11] || null,    // Kolom L
            npwp: row[12] || '',         // Kolom M
            bpjs_ketenagakerjaan: row[13] || '', // Kolom N
            pendidikan: row[14] || '',   // Kolom O
            agama: row[15] || '',        // Kolom P
            jenis_kelamin: row[16] || '',// Kolom Q
            alamat: row[17] || '',       // Kolom R
            is_active: 1
          };
        });

        const cleanData = mappedData.filter(d => d.nama_lengkap && d.nik_karyawan);

        if (cleanData.length === 0) {
            this.showToast('Tidak ada data valid ditemukan. Pastikan data mulai dari baris 5.', 'error');
            this.isProcessing = false;
            return;
        }

        // KIRIM ARRAY DATA LANGSUNG (sesuai EmployeeApiService)
        this.employeeApi.import(cleanData).subscribe({ 
          next: (res: any) => {
            this.isProcessing = false;
            this.closeImportModal();
            this.loadEmployees();
            this.showToast(`Import Berhasil! ${cleanData.length} data tersimpan.`, 'success');
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
        this.showToast('Gagal membaca file Excel.', 'error');
      }
    };
    
    reader.readAsBinaryString(this.selectedFile);
  }

  // ==========================================
  // EXPORT EXCEL LOGIC
  // ==========================================
  exportData() {
    this.employeeApi.export().subscribe({
      next: (blob: any) => {
        // Create virtual download link
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Data_Karyawan_${new Date().toISOString().slice(0,10)}.xlsx`;
        document.body.appendChild(a);
        a.click();
        
        // Cleanup
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
  // EDIT GAJI LOGIC (UPDATED & WORKING)
  // ==========================================
  editGaji(input: any) { 
    // Menerima Input ID (number) atau Object (any) agar fleksibel
    let empData: any;

    if (typeof input === 'number') {
       empData = this.allEmployees.find(e => e.id === input);
    } else {
       empData = input;
    }

    if (!empData) return;

    // Isi state modal
    this.salaryData = {
      id: empData.id,
      nama: empData.nama_lengkap,
      gaji_pokok: empData.gaji_pokok ? Number(empData.gaji_pokok) : 0
    };

    // Buka Modal
    this.showSalaryModal = true;
  }

  closeSalaryModal() {
    this.showSalaryModal = false;
  }

  updateSalary() {
    if (!this.salaryData.id) return;
    this.isSalaryProcessing = true;

    // Payload Partial Update
    const payload = { gaji_pokok: this.salaryData.gaji_pokok };

    this.employeeApi.update(this.salaryData.id, payload).subscribe({
      next: (res: any) => {
        this.isSalaryProcessing = false;
        this.closeSalaryModal();
        this.showToast(`Gaji ${this.salaryData.nama} berhasil diperbarui!`, 'success');
        
        // Refresh data agar tabel menampilkan angka terbaru
        this.loadEmployees();
      },
      error: (err) => {
        this.isSalaryProcessing = false;
        console.error(err);
        this.showToast('Gagal update gaji. Periksa koneksi.', 'error');
      }
    });
  }

  // ==========================================
  // NAVIGATION & ACTIONS
  // ==========================================
  createEmployee() { this.router.navigate(['/superadmin/employees/create']); }
  
  viewDetail(id: number) { this.router.navigate(['/superadmin/employees', id]); }
  
  goToFullDatabase() { this.router.navigate(['/superadmin/employees/database']); }

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
