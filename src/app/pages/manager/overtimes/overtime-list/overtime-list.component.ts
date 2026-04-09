import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { OvertimeApiService } from '../../../superadmin/overtimes/services/overtime-api.service'; // Path aman bawaan mas

@Component({
  selector: 'app-manager-overtime-list',
  standalone: false,
  templateUrl: './overtime-list.component.html',
  styleUrls: ['./overtime-list.component.scss']
})
export class OvertimeListComponent implements OnInit {
  items: any[] = [];
  isLoading = false;

  // Pagination & Filter
  currentPage = 1;
  lastPage = 1;
  total = 0;
  itemsPerPage = 15;
  filterSearch = '';
  private searchTimeout: any;

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

  // ===== Helpers =====
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

  // ===== Rekap Header =====
  get totalPoinKeseluruhan(): number {
    return this.items.reduce((acc, curr) => {
      const poin = this.toNumber(curr?.total_poin ?? curr?.total_jam);
      return acc + poin;
    }, 0);
  }

  get totalUpahKeseluruhan(): number {
    return this.items.reduce((acc, curr) => {
      const bayar = this.toNumber(curr?.total_bayar);
      return acc + bayar;
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

  // ===== Navigasi Read-Only =====
  goToDetail(nama: string): void {
    this.router.navigate(['/manager/overtimes/detail', nama]); 
  }

  private showToast(msg: string, type: 'success' | 'error'): void {
    this.toastMessage = msg;
    this.toastType = type;
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => (this.toastMessage = ''), 4000);
  }
}