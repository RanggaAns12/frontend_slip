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

  // 🏢 MASTER DATA DEPARTEMEN & POSISI (Sudah Disamakan Persis dengan Data Excel)
  departemenData = [
    { nama: "Marketing", posisi: ["Marketing Staff", "Export", "Import"] },
    { nama: "Purchasing", posisi: ["Purchasing Staff"] },
    { nama: "Finance & Accounting", posisi: ["Finance Staff", "Accounting Staff"] },
    { nama: "Legal", posisi: ["Legal Staff"] },
    { nama: "Auditor / ISO", posisi: ["Auditor / ISO Staff"] },
    { nama: "PPIC", posisi: ["PPIC Staff"] },
    { nama: "HRD & HSE & Civil", posisi: ["HRD", "HRD Staff", "HSE", "Civil", "Supervisor"] },
    { nama: "Kepala Pabrik", posisi: ["Kepala Pabrik", "Wakil Kepala Pabrik", "Adm Pabrik"] },
    { nama: "Security & Kebersihan", posisi: ["Kepala Regu Security", "Security", "Cleaning Service & Taman"] },
    { nama: "Timbangan, Bahan Baku & Chemical", posisi: ["SPV Timbangan, B. Baku & Chemical", "Ang. Timbangan", "Ang. Bahan Baku", "Ang. Chemical", "Ang. Ballpress"] },
    { nama: "Sparepart, Barang Jadi & Forklift", posisi: ["SPV Sparepart, B. Jadi & Forklift", "Gudang Sparepart", "Op. Forklift B. Baku & B.", "Gudang Barang Jadi"] },
    { nama: "WTP & WWTP", posisi: ["SPV WTP & WWTP", "WTP", "WWTP", "Operator RO"] },
    { nama: "Engineering", posisi: ["Engineering SPV", "Engineer Planner", "IT", "Drafter", "Karu Elektrik", "Instrument"] },
    { nama: "Mekanik", posisi: ["Karu Mekanik", "Mekanik General & Alat Berat", "Fabrikasi", "Oil & Greases"] },
    { nama: "Elektrikal & A/I", posisi: ["Kepala Regu Elektrikal & A/I", "Elektrik Shift", "A/I Shift", "Elektrik Preventif", "A/I Preventif", "Elektrik Repair", "A/I Repair"] },
    { nama: "Boiler & Turbine", posisi: ["Karu Boiler & Turbine", "Boiler & Turbine"] },
    { nama: "PM & Winder", posisi: ["Karu PM & Winder", "PM", "Winder"] },
    { nama: "SP & Starch", posisi: ["Karu SP & Starch", "SP", "Starch", "Operator Pulper"] },
    { nama: "Produksi", posisi: ["Kepala Shift Produksi", "Mekanik Shift", "Operator Wire Press", "Operator Coarse Screen", "Operator Size Press"] },
    { nama: "QC & R&D", posisi: ["SPV QC / R&D", "QC", "R&D"] }
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
    // Muat semua posisi saat halaman pertama kali dibuka
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

  // Event Cascading Dropdown untuk Filter UI
  onDeptChange() {
    if (this.filterDept) {
      // Jika departemen tertentu dipilih, tampilkan posisi departemen itu saja
      const selected = this.departemenData.find(d => d.nama === this.filterDept);
      this.positions = selected ? selected.posisi : [];
    } else {
      // Jika "Semua Dept" dipilih (kosong), tampilkan kembali SEMUA posisi
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
    
    // Kembalikan semua pilihan posisi saat di-reset
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
  // IMPORT EXCEL LOGIC (SMART MATCHING EXCEL FIRST)
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
          
          // 🚀 LOGIKA: EXCEL ADALAH SUMBER UTAMA (Ambil data asli, hilangkan spasi sisa)
          const excelPosisi = String(row[8] || '').trim();
          const excelDept = String(row[9] || '').trim();
          
          let finalDept = excelDept;
          let finalPosisi = excelPosisi;

          // FALLBACK LOGIC: 
          // Jika HRD lupa mengisi kolom Departemen di Excel, tapi kolom Posisi diisi:
          if (finalPosisi && !finalDept) {
            const foundDept = this.departemenData.find(d => 
              d.posisi.some(p => p.toLowerCase() === finalPosisi.toLowerCase())
            );
            if (foundDept) {
              finalDept = foundDept.nama;
            }
          }

          return {
            nik_karyawan: String(row[1] || '').trim(),  
            nik_ktp: String(row[2] || '').trim(),       
            status_karyawan: String(row[3] || '').trim() || 'PKWTT', 
            nama_lengkap: String(row[4] || '').trim(),  
            status_pajak: String(row[5] || '').trim() || 'TK/0',      
            no_rekening: String(row[6] || '').trim(),   
            status_pajak_2026: String(row[7] || '').trim(), 
            posisi: finalPosisi,  
            dept: finalDept,      
            tanggal_diterima: row[10] || null, 
            tanggal_lahir: row[11] || null,    
            npwp: String(row[12] || '').trim(),         
            bpjs_ketenagakerjaan: String(row[13] || '').trim(), 
            pendidikan: String(row[14] || '').trim(),   
            agama: String(row[15] || '').trim(),        
            jenis_kelamin: String(row[16] || '').trim(),
            alamat: String(row[17] || '').trim(),       
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