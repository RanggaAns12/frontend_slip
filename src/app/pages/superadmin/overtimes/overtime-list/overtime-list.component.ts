import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { OvertimeApiService } from '../services/overtime-api.service' // Sesuaikan path ini dengan struktur folder SuperAdmin Mas ya

@Component({
  selector: 'app-superadmin-overtime-list', // <-- Sudah diganti ke SuperAdmin
  standalone: false,
  templateUrl: './overtime-list.component.html',
  styleUrls: ['./overtime-list.component.scss']
})
export class OvertimeListComponent implements OnInit {
  items: any[] = [];
  isLoading = false;
  isUploading = false; // <-- Variabel baru untuk state upload

  // Pagination & Filter
  currentPage = 1;
  lastPage = 1;
  total = 0;
  itemsPerPage = 15;
  
  // State Filter Pencarian, Bulan, dan Tahun
  filterSearch = '';
  filterMonth: number | '' = new Date().getMonth() + 1; 
  filterYear: number = new Date().getFullYear();
  private searchTimeout: any;

  months = [
    { value: 1, label: 'Januari' }, { value: 2, label: 'Februari' },
    { value: 3, label: 'Maret' }, { value: 4, label: 'April' },
    { value: 5, label: 'Mei' }, { value: 6, label: 'Juni' },
    { value: 7, label: 'Juli' }, { value: 8, label: 'Agustus' },
    { value: 9, label: 'September' }, { value: 10, label: 'Oktober' },
    { value: 11, label: 'November' }, { value: 12, label: 'Desember' }
  ];

  toastMessage = '';
  toastType: 'success' | 'error' = 'success';
  private toastTimer: any;

  constructor(
    private overtimeApi: OvertimeApiService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['month']) this.filterMonth = +params['month'];
      if (params['year']) this.filterYear = +params['year'];
      this.loadData();
    });
  }

  // ===== Import Excel Logic =====
  triggerFileInput(fileInput: HTMLInputElement): void {
    fileInput.click();
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    this.isUploading = true;
    
    const formData = new FormData();
    formData.append('file', file);
    
    // Kirim filter bulan & tahun agar backend (OvertimesImport.php) bisa mengunci tanggal cut-off
    if (this.filterMonth) formData.append('month', this.filterMonth.toString());
    if (this.filterYear) formData.append('year', this.filterYear.toString());

    this.overtimeApi.importExcel(formData).subscribe({
      next: (res: any) => {
        this.isUploading = false;
        this.showToast('Data lembur berhasil diimpor!', 'success');
        this.loadData();
        event.target.value = ''; // Reset input
      },
      error: (err: any) => {
        console.error('Error import:', err);
        this.isUploading = false;
        this.showToast(err.error?.message || 'Gagal mengimpor data lembur.', 'error');
        event.target.value = ''; // Reset input
      }
    });
  }

  // ===== Helpers =====
  toNumber(value: any): number {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }

  getInitial(name: any): string {
    const s = (name ?? '').toString().trim();
    return s.length > 0 ? s.charAt(0).toUpperCase() : '?';
  }

  formatRupiah(value: number | string): string {
    const val = parseFloat(value as string || '0');
    if (val === 0) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);
  }

  // ===== Rekap Header =====
  get totalPoinKeseluruhan(): number {
    return this.items.reduce((acc, curr) => {
      const poin = this.toNumber(curr?.total_poin ?? curr?.konversi_lembur);
      return acc + poin;
    }, 0);
  }

  get totalUpahKeseluruhan(): number {
    return this.items.reduce((acc, curr) => {
      const upah = this.toNumber(curr?.total_upah ?? curr?.hitungan_lembur);
      return acc + upah;
    }, 0);
  }

  // ===== Load Data =====
  loadData(): void {
    this.isLoading = true;

    const params: any = {
      page: this.currentPage,
      per_page: this.itemsPerPage,
      year: this.filterYear
    };
    
    if (this.filterMonth !== '') params.month = this.filterMonth;
    if (this.filterSearch) params.search = this.filterSearch;

    this.overtimeApi.getList(params).subscribe({
      next: (res: any) => {
        const paginatedData = res?.data || res;
        this.items = paginatedData?.data || [];
        this.total = paginatedData?.total ?? this.items.length;
        this.currentPage = paginatedData?.current_page ?? 1;
        this.lastPage = paginatedData?.last_page ?? 1;
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('Gagal memuat rekap', err);
        this.isLoading = false;
        this.showToast('Gagal memuat data dari server.', 'error');
      }
    });
  }

  onSearchDebounce(): void {
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.currentPage = 1;
      this.loadData();
    }, 500);
  }

  onSearch(): void {
    this.currentPage = 1;
    this.loadData();
  }

  resetFilter(): void {
    this.filterSearch = '';
    this.filterMonth = new Date().getMonth() + 1;
    this.filterYear = new Date().getFullYear();
    this.currentPage = 1;
    this.loadData();
    
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {},
      replaceUrl: true
    });
  }

  goPage(page: number): void {
    if (page >= 1 && page <= this.lastPage) {
      this.currentPage = page;
      this.loadData();
    }
  }

  get pageNumbers(): number[] {
    const pages: number[] = [];
    const start = Math.max(1, this.currentPage - 2);
    const end = Math.min(this.lastPage, start + 4);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }

  // ===== RUTE DETAIL SUPERADMIN =====
  goToDetail(nama: string): void {
    // <-- Sudah diubah menjadi rute superadmin
    this.router.navigate(['/superadmin/overtimes/show', nama], {
      queryParams: {
        month: this.filterMonth,
        year: this.filterYear
      }
    });
  }

  private showToast(msg: string, type: 'success' | 'error'): void {
    this.toastMessage = msg;
    this.toastType = type;
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => (this.toastMessage = ''), 4000);
  }
}