import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
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

  isImporting = false;
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';
  private toastTimer: any;

  constructor(
    private overtimeApi: OvertimeApiService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Menangkap parameter dari URL (persistence filter)
    this.route.queryParams.subscribe(params => {
      if (params['month']) this.filterMonth = +params['month'];
      if (params['year']) this.filterYear = +params['year'];
      this.loadData();
    });
  }

  toNumber(value: any): number {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }

  getInitial(name: any): string {
    const s = (name ?? '').toString().trim();
    return s.length > 0 ? s.charAt(0).toUpperCase() : '?';
  }

  get totalPoinKeseluruhan(): number {
    return this.items.reduce((acc, curr) => {
      const poin = this.toNumber(curr?.total_poin ?? curr?.konversi_lembur);
      return acc + poin;
    }, 0);
  }

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

  goToDetail(nama: string): void {
    this.router.navigate(['/hrd/overtimes/show', nama], {
      queryParams: {
        month: this.filterMonth,
        year: this.filterYear
      }
    });
  }

  onFileSelected(event: any): void {
    const file: File = event?.target?.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    
    // SELARAS DENGAN SUPERADMIN: Kirim bulan & tahun agar tanggal Excel dikunci di backend
    formData.append('month', this.filterMonth.toString());
    formData.append('year', this.filterYear.toString());

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