import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AttendanceSummaryApiService, AttendanceSummary, AttendanceSummaryDetail } from '../../../superadmin/attendance-summaries/services/attendance-summary-api.service';

@Component({
  selector: 'app-hrd-attendance-list',
  standalone: false,
  templateUrl: './hrd-attendance-list.component.html',
  styleUrls: ['./hrd-attendance-list.component.scss'],
})
export class HrdAttendanceListComponent implements OnInit {

  // ── Data ─────────────────────────────────────────────────
  items       : AttendanceSummary[] = [];
  isLoading   = false;
  currentPage = 1;
  lastPage    = 1;
  total       = 0;
  Math        = Math; // Agar bisa dipakai di HTML

  // ── Filter ─────────────────────────────────────────────────
  filterMonth : number | '' = new Date().getMonth() + 1; 
  filterYear  : number      = new Date().getFullYear();
  filterSearch= '';
  filterDept  = '';
  filterPosisi= '';

  private searchTimeout: any;

  // ── Modal State (Import Excel & Edit Manual) ──────────────
  showImportModal = false;
  selectedFile: File | null = null;
  isProcessing = false;

  showEditModal = false;
  selectedAttendance: Partial<AttendanceSummaryDetail> | null = null;
  isEditing = false;

  // ── Options Mapping ───────────────────────────────────────
  months = [
    { value: 1,  label: 'Januari' }, { value: 2,  label: 'Februari' },
    { value: 3,  label: 'Maret'   }, { value: 4,  label: 'April'    },
    { value: 5,  label: 'Mei'     }, { value: 6,  label: 'Juni'     },
    { value: 7,  label: 'Juli'    }, { value: 8,  label: 'Agustus'  },
    { value: 9,  label: 'September'},{ value: 10, label: 'Oktober'  },
    { value: 11, label: 'November' }, { value: 12, label: 'Desember' },
  ];

  departments = [
    'Umum', 'HRD', 'Keuangan', 'Operasional', 
    'IT', 'Produksi', 'Lapangan', 'Logistik', 'Pemasaran'
  ];

  positions = [
    'Manager', 'Supervisor', 'Staff', 'Admin', 
    'Operator', 'Mandor', 'Buruh Harian', 'Security', 'Driver'
  ];

  // ── Toast ─────────────────────────────────────────────────
  toastMessage = '';
  toastType    : 'success' | 'error' = 'success';
  private toastTimer: any;

  constructor(
    private api    : AttendanceSummaryApiService,
    private router : Router,
    private route  : ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.load();
  }

  // ── Data Loading ──────────────────────────────────────────
  load(): void {
    this.isLoading = true;

    const params: any = {
      page: this.currentPage,
      year: this.filterYear,
    };
    
    if (this.filterMonth !== '') params['month']      = this.filterMonth;
    if (this.filterSearch)       params['search']     = this.filterSearch;
    if (this.filterDept)         params['departemen'] = this.filterDept;
    if (this.filterPosisi)       params['jabatan']    = this.filterPosisi;

    this.api.getList(params).subscribe({
      next: (res) => {
        this.items       = res.data.data;
        this.total       = res.data.total;
        this.currentPage = res.data.current_page;
        this.lastPage    = res.data.last_page;
        this.isLoading   = false;
      },
      error: () => { 
        this.isLoading = false; 
        this.items = [];
        this.showToast('Gagal memuat data rekap absensi.', 'error');
      },
    });
  }

  // ── Event Handlers: Search & Filter ───────────────────────
  onSearchDebounce(): void {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    this.searchTimeout = setTimeout(() => {
      this.currentPage = 1;
      this.load();
    }, 500);
  }

  onSearch(): void {
    this.currentPage = 1;
    this.load();
  }

  resetFilter(): void {
    this.filterSearch = '';
    this.filterMonth  = new Date().getMonth() + 1; 
    this.filterYear   = new Date().getFullYear();
    this.filterDept   = '';
    this.filterPosisi = '';
    this.currentPage  = 1;
    this.load();
  }

  goPage(page: number): void {
    if (page < 1 || page > this.lastPage) return;
    this.currentPage = page;
    this.load();
  }

  // ── Feature: Import Excel ─────────────────────────────────
  openImportModal(): void {
    this.showImportModal = true;
    this.selectedFile = null;
  }

  closeImportModal(): void {
    this.showImportModal = false;
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  uploadFile(): void {
    if (!this.selectedFile || this.filterMonth === '') {
      this.showToast('Pastikan file Excel dan Bulan sudah dipilih.', 'error');
      return;
    }

    this.isProcessing = true;
    this.api.import(this.selectedFile, Number(this.filterMonth), this.filterYear).subscribe({
      next: (res) => {
        if (res.success) {
          this.showToast(`Import Berhasil! ${res.data?.saved || 0} data disimpan.`, 'success');
          this.closeImportModal();
          this.load();
        } else {
          this.showToast(res.message || 'Gagal melakukan import.', 'error');
        }
        this.isProcessing = false;
      },
      error: (err) => {
        const errorMsg = err.error?.message || 'Terjadi kesalahan sistem saat import.';
        this.showToast(errorMsg, 'error');
        this.isProcessing = false;
      }
    });
  }

  // ── Feature: Edit Manual (Modal HRD) ──────────────────────
  // Di HRD kita ganti navigasi Detail menjadi Modal Edit
  openEditModal(item: AttendanceSummary): void {
    this.isEditing = true;
    this.api.getById(item.id).subscribe({
      next: (res) => {
        if (res.success) {
          this.selectedAttendance = { ...res.data };
          this.showEditModal = true;
        }
        this.isEditing = false;
      },
      error: () => {
        this.showToast('Gagal memuat detail absensi.', 'error');
        this.isEditing = false;
      }
    });
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.selectedAttendance = null;
  }

  saveAttendance(): void {
    if (!this.selectedAttendance || !this.selectedAttendance.id) return;

    this.isProcessing = true;
    this.api.update(this.selectedAttendance.id, this.selectedAttendance).subscribe({
      next: (res) => {
        if (res.success) {
          this.showToast('Data absensi berhasil diperbarui.', 'success');
          this.closeEditModal();
          this.load(); 
        }
        this.isProcessing = false;
      },
      error: () => {
        this.showToast('Gagal menyimpan perubahan absensi.', 'error');
        this.isProcessing = false;
      }
    });
  }

  // ── Helpers ──────────────────────────────────────────────
  get pageNumbers(): number[] {
    const pages = [];
    const start = Math.max(1, this.currentPage - 2);
    const end   = Math.min(this.lastPage, start + 4);
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  getMonthName(m: number): string {
    if (!m) return '-';
    return new Date(2000, m - 1).toLocaleString('id-ID', { month: 'long' });
  }

  private showToast(msg: string, type: 'success' | 'error'): void {
    this.toastMessage = msg;
    this.toastType    = type;
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => { this.toastMessage = ''; }, 4000);
  }
}
