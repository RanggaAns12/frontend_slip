import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import {
  AttendanceSummaryApiService,
  AttendanceSummary,
} from '../../../superadmin/attendance-summaries/services/attendance-summary-api.service'; // Sesuaikan jika strukturnya berbeda

@Component({
  selector: 'app-manager-attendance-summary-list',
  templateUrl: './attendance-summary-list.component.html',
  styleUrls: ['./attendance-summary-list.component.scss'],
})
export class AttendanceSummaryListComponent implements OnInit {

  // ── Data ─────────────────────────────────────────────────
  items       : AttendanceSummary[] = [];
  isLoading   = false;
  currentPage = 1;
  lastPage    = 1;
  total       = 0;
  Math        = Math; 

  // ── Filter ─────────────────────────────────────────────────
  filterMonth  : number | '' = new Date().getMonth() + 1; 
  filterYear   : number      = new Date().getFullYear();
  filterSearch = '';
  filterDept   = '';
  filterPosisi = '';

  private searchTimeout: any;

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
    private router : Router
  ) {}

  ngOnInit(): void {
    this.load();
  }

  // ── Data Loading ──────────────────────────────────────────

  load(): void {
    this.isLoading = true;

    const params: any = {
      page : this.currentPage,
      year : this.filterYear,
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

  // ── NAVIGASI (PERBAIKAN ROUTE KE MANAGER) ──────────────
  goToDetail(id: number): void {
    this.router.navigate(['/manager/attendance-summaries/detail', id]);
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