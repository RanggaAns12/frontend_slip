import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { EmployeeApiService } from '../services/employee-api.service';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-employee-list',
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

  // === 2. FILTER STATE & MASTER DATA ===
  searchKeyword = '';
  filterDept = '';
  filterPosisi = '';

  // 👇 MASTER DATA DEPARTEMEN & POSISI (Format Baku/Rapi yang akan digunakan di Frontend & DB)
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
      nama: "Umum", // <-- Format baku yang diinginkan
      posisi: ["Kebersihan", "Supir", "Driver", "Office Boy", "Office Girl", "Gardener"] 
    },
    { nama: "Security", posisi: ["Danru"] },
    { nama: "Civil", posisi: ["Civil"] }, // Dirapikan dari CIVIL
    { nama: "Fabrikasi", posisi: ["Engineering"] },
    { nama: "Bahan Baku", posisi: ["SPV"] },
    { nama: "HSE", posisi: ["HSE"] },
    { nama: "IT", posisi: ["IT"] },
    { nama: "Purchasing", posisi: [] },
    { nama: "Finance", posisi: [] },
    { nama: "Accounting", posisi: [] }
  ];

  departments = this.departemenData.map(d => d.nama);
  positions: string[] = [];

  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>(); 

  // === 3. PAGINATION STATE ===
  currentPage = 1;
  pageSize = 25;
  totalPages = 1;

  // === 4. UI STATE ===
  showDeleteModal = false;
  selectedEmployee: any = null; 
  
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';
  toastTimeout: any;

  showImportModal = false;
  selectedFile: File | null = null;
  isProcessing = false; 
  
  sheetNames: string[] = [];
  selectedSheet: string = '';
  isLoadingSheets = false;

  constructor(
    private employeeApi: EmployeeApiService, 
    private router: Router
  ) {}

  ngOnInit(): void { 
    this.positions = this.departemenData.flatMap(d => d.posisi).sort();
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
        this.applyFilter();
      },
      error: (err) => {
        this.isLoading = false;
        this.showToast('Gagal memuat data dari server', 'error');
        console.error(err);
      }
    });
  }

  onDeptChange() {
    if (this.filterDept) {
      const selected = this.departemenData.find(d => d.nama === this.filterDept);
      this.positions = selected ? selected.posisi : [];
    } else {
      this.positions = this.departemenData.flatMap(d => d.posisi).sort();
    }
    this.filterPosisi = ''; 
    this.applyFilter();
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
    
    this.positions = this.departemenData.flatMap(d => d.posisi).sort();
    
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

    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
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
  // IMPORT EXCEL LOGIC (SMART MATCHING V3)
  // ==========================================
  openImportModal() { this.showImportModal = true; }
  
  closeImportModal() { 
    this.showImportModal = false; 
    this.selectedFile = null; 
    this.isProcessing = false; 
    this.sheetNames = [];
    this.selectedSheet = '';
    this.isLoadingSheets = false;
  }

  onFileSelected(event: any) {
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

        const rawData: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });
        
        if (rawData.length < 5) {
            this.showToast('File Excel kosong atau format salah (Baris kurang).', 'error');
            this.isProcessing = false;
            return;
        }

        const dataRows = rawData.slice(4); 

        const mappedData = dataRows.map((row: any[]) => {
          
          // 👇 LOGIKA SMART MATCHING V3: Mengabaikan kapitalisasi (case-insensitive)
          const rawPosisi = String(row[8] || '').trim().toLowerCase();
          const rawDept = String(row[9] || '').trim().toLowerCase();
          
          let finalDept = rawDept; // Default awal jika tidak ada kecocokan
          let finalPosisi = rawPosisi; // Default awal jika tidak ada kecocokan

          // 1. Coba cocokkan berdasarkan POSISI terlebih dahulu
          if (rawPosisi) {
            for (const dept of this.departemenData) {
              const foundPos = dept.posisi.find(p => 
                p.toLowerCase() === rawPosisi ||
                p.toLowerCase().includes(rawPosisi) ||
                rawPosisi.includes(p.toLowerCase())
              );
              
              if (foundPos) {
                // Jika posisi ditemukan di master data, gunakan penulisan baku dari frontend
                finalPosisi = foundPos;
                finalDept = dept.nama; 
                break;
              }
            }
          }

          // 2. Jika Posisi tidak menghasilkan Dept yang valid, coba cocokkan Departemen langsung
          if ((!finalDept || finalDept === rawDept) && rawDept) {
            const foundDept = this.departemenData.find(d => 
              d.nama.toLowerCase() === rawDept || 
              d.nama.toLowerCase().includes(rawDept) || 
              rawDept.includes(d.nama.toLowerCase())
            );
            
            if (foundDept) {
              // Jika departemen ditemukan ("UMUM" === "umum"), gunakan penulisan baku dari frontend ("Umum")
              finalDept = foundDept.nama;
            } else {
              // Jika benar-benar tidak terdaftar di master data, rapikan kapitalisasinya (Title Case)
              finalDept = rawDept.replace(
                /\w\S*/g,
                (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
              );
            }
          }

          return {
            nik_karyawan: row[1] || '',  
            nik_ktp: row[2] || '',       
            status_karyawan: row[3] || 'PKWTT', 
            nama_lengkap: row[4] || '',  
            status_pajak: row[5] || 'TK/0',      
            no_rekening: row[6] || '',   
            status_pajak_2026: row[7] || '', 
            posisi: finalPosisi,  
            dept: finalDept,      // Akan selalu tersimpan sebagai "Umum" bukan "UMUM"
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

        const cleanData = mappedData.filter(d => d.nama_lengkap && d.nik_karyawan);

        if (cleanData.length === 0) {
            this.showToast('Tidak ada data valid ditemukan. Pastikan data mulai dari baris 5.', 'error');
            this.isProcessing = false;
            return;
        }

        this.employeeApi.import(cleanData).subscribe({ 
          next: (res: any) => {
            this.isProcessing = false;
            this.closeImportModal();
            this.loadEmployees();
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