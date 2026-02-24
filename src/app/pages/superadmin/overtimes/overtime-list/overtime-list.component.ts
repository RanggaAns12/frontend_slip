import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { OvertimeApiService, OvertimeSummary } from '../services/overtime-api.service';

@Component({
  selector: 'app-overtime-list',
  templateUrl: './overtime-list.component.html',
  styleUrls: ['./overtime-list.component.scss']
})
export class OvertimeListComponent implements OnInit {
  items: any[] = []; // Diubah sementara ke any agar tidak error jika interface belum di-update dengan field baru
  isLoading = false;
  
  // Pagination & Filter
  currentPage = 1;
  lastPage = 1;
  total = 0;
  itemsPerPage = 15;
  filterSearch = '';
  Math = Math;
  private searchTimeout: any;

  // Import Upload State
  isImporting = false;
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';
  private toastTimer: any;

  constructor(
    private overtimeApi: OvertimeApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  // --- PERBAIKAN: Penambahan Rekap Poin dan Parsing Float ---
  get totalPoinKeseluruhan(): number {
    return this.items.reduce((acc, curr) => {
      // Ambil dari total_poin (atau fallback ke total_jam kalau field blm diupdate)
      const poin = parseFloat(curr.total_poin || curr.total_jam || 0);
      return acc + poin;
    }, 0);
  }

  get totalJamKeseluruhan(): number {
    return this.items.reduce((acc, curr) => {
      const jam = parseFloat(curr.total_jam || 0);
      return acc + jam;
    }, 0);
  }

  get totalUpahKeseluruhan(): number {
    return this.items.reduce((acc, curr) => {
      const bayar = parseFloat(curr.total_bayar || 0);
      return acc + bayar;
    }, 0);
  }
  // ----------------------------------------------------------

  loadData(): void {
    this.isLoading = true;
    const params: any = { 
      page: this.currentPage, 
      per_page: this.itemsPerPage 
    };
    if (this.filterSearch) params['search'] = this.filterSearch;

    this.overtimeApi.getList(params).subscribe({
      next: (res) => {
        const paginatedData = res.data || res;
        this.items = paginatedData.data || [];
        this.total = paginatedData.total || this.items.length;
        this.currentPage = paginatedData.current_page || 1;
        this.lastPage = paginatedData.last_page || 1;
        this.isLoading = false;
      },
      error: (err) => {
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

  goPage(page: number): void {
    if (page >= 1 && page <= this.lastPage) {
      this.currentPage = page;
      this.loadData();
    }
  }

  get pageNumbers(): number[] {
    const pages = [];
    const start = Math.max(1, this.currentPage - 2);
    const end = Math.min(this.lastPage, start + 4);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }

  goToDetail(nama: string): void {
    this.router.navigate(['/superadmin/overtimes/show', nama]);
  }

  getJamBadgeClass(jam: any): string {
    const j = parseFloat(jam || 0);
    if (j > 120) return 'badge-red';
    if (j >= 60 && j <= 120) return 'badge-yellow';
    return 'badge-green';
  }

  formatRupiah(value: any): string {
    const numValue = parseFloat(value || 0);
    return new Intl.NumberFormat('id-ID', { 
      style: 'currency', 
      currency: 'IDR', 
      minimumFractionDigits: 0 
    }).format(numValue);
  }

  // ----------------------------------------------------
  // LOGIKA IMPORT EXCEL
  // ----------------------------------------------------
  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    this.isImporting = true;
    this.overtimeApi.importExcel(formData).subscribe({
      next: () => {
        this.isImporting = false;
        this.showToast('File Excel berhasil diimpor & disimpan!', 'success');
        this.currentPage = 1; // Kembali ke halaman 1
        this.loadData(); // Refresh isi tabel
      },
      error: (err) => {
        this.isImporting = false;
        this.showToast('Terjadi kesalahan saat mengimpor file.', 'error');
        console.error('Error import:', err);
      }
    });

    // Reset input agar bisa upload file yang sama jika dibutuhkan lagi
    event.target.value = '';
  }

  private showToast(msg: string, type: 'success' | 'error'): void {
    this.toastMessage = msg;
    this.toastType = type;
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toastMessage = '', 4000);
  }
}
