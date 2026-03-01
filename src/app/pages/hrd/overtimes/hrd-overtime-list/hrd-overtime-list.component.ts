import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
// Sesuaikan path import service ini dengan struktur folder Mas Rangga
import { OvertimeApiService } from '../../../superadmin/overtimes/services/overtime-api.service';

@Component({
  selector: 'app-hrd-overtime-list',
  standalone: false,
  templateUrl: './hrd-overtime-list.component.html',
  styleUrls: ['./hrd-overtime-list.component.scss']
})
export class HrdOvertimeListComponent implements OnInit {
  items: any[] = [];
  isLoading = false;

  // Pagination & Filter
  currentPage = 1;
  lastPage = 1;
  total = 0;
  itemsPerPage = 15;
  filterSearch = '';
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

  // ===== Helpers (aman untuk data string/number/null) =====
  toNumber(value: any): number {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }

  getInitial(name: any): string {
    const s = (name ?? '').toString().trim();
    return s.length > 0 ? s.charAt(0).toUpperCase() : '?';
  }

  formatRupiah(value: any): string {
    const numValue = this.toNumber(value);
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(numValue);
  }

  // ===== Rekap =====
  get totalPoinKeseluruhan(): number {
    return this.items.reduce((acc, curr) => {
      const poin = this.toNumber(curr?.total_poin ?? curr?.total_jam);
      return acc + poin;
    }, 0);
  }

  // ===== Load Data =====
  loadData(): void {
    this.isLoading = true;

    const params: any = {
      page: this.currentPage,
      per_page: this.itemsPerPage
    };
    if (this.filterSearch) params.search = this.filterSearch;

    this.overtimeApi.getList(params).subscribe({
      next: (res) => {
        const paginatedData = res?.data || res;
        this.items = paginatedData?.data || [];
        this.total = paginatedData?.total ?? this.items.length;
        this.currentPage = paginatedData?.current_page ?? 1;
        this.lastPage = paginatedData?.last_page ?? 1;
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
    const pages: number[] = [];
    const start = Math.max(1, this.currentPage - 2);
    const end = Math.min(this.lastPage, start + 4);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }

  goToDetail(nama: string): void {
    this.router.navigate(['/hrd/overtimes/show', nama]);
  }

  // ===== Import Excel =====
  onFileSelected(event: any): void {
    const file: File = event?.target?.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    this.isImporting = true;
    this.overtimeApi.importExcel(formData).subscribe({
      next: () => {
        this.isImporting = false;
        this.showToast('File Excel berhasil diimpor & disimpan!', 'success');
        this.currentPage = 1;
        this.loadData();
      },
      error: (err) => {
        this.isImporting = false;
        this.showToast('Terjadi kesalahan saat mengimpor file.', 'error');
        console.error('Error import:', err);
      }
    });

    event.target.value = '';
  }

  private showToast(msg: string, type: 'success' | 'error'): void {
    this.toastMessage = msg;
    this.toastType = type;
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => (this.toastMessage = ''), 4000);
  }
}
