import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { OvertimeApiService } from '../services/overtime-api.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-overtime-list',
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
  
  // State Filter
  filterSearch = '';
  filterDept = '';
  filterPosisi = '';
  selectedMonth: number | string = ''; 
  selectedYear: number | string = '';
  
  // 👇 MASTER DATA DEPARTEMEN & POSISI (Terbaru)
  departemenData = [
    { nama: "Marketing", posisi: ["Marketing Staff", "Export", "Import"] },
    { nama: "Purchasing", posisi: ["Purchasing Staff"] },
    { nama: "Finance & Accounting", posisi: ["Finance Staff", "Accounting Staff"] },
    { nama: "Legal", posisi: ["Legal Staff"] },
    { nama: "Auditor / ISO", posisi: ["Auditor / ISO Staff"] },
    { nama: "PPIC", posisi: ["PPIC Staff"] },
    { nama: "HRD & HSE & Civil", posisi: ["HRD Staff", "HSE", "Civil", "Supervisor"] },
    { nama: "Kepala Pabrik", posisi: ["Kepala Pabrik", "Wakil Kepala Pabrik", "Adm Pabrik"] },
    { nama: "Security & Kebersihan", posisi: ["Kepala Regu Security", "Security", "Cleaning Service & Taman"] },
    { nama: "Timbangan, Bahan Baku & Chemical", posisi: ["SPV Timbangan, B. Baku & Chemical", "Ang. Timbangan", "Ang. Bahan Baku", "Ang. Chemical", "Ang. Ballpress"] },
    { nama: "Sparepart, Barang Jadi & Forklift", posisi: ["SPV Sparepart, B. Jadi & Forklift", "Gudang Sparepart", "Op. Forklift B. Baku & B.", "Gudang Barang Jadi"] },
    { nama: "WTP & WWTP", posisi: ["SPV WTP & WWTP", "WTP", "WWTP"] },
    { nama: "Engineering", posisi: ["Engineering SPV", "Engineer Planner", "IT", "Drafter"] },
    { nama: "Mekanik", posisi: ["Karu Mekanik", "Mekanik General & Alat Berat", "Fabrikasi", "Oil & Greases"] },
    { nama: "Elektrikal & A/I", posisi: ["Kepala Regu Elektrikal & A/I", "Elektrik Shift", "A/I Shift", "Elektrik Preventif", "A/I Preventif", "Elektrik Repair", "A/I Repair"] },
    { nama: "Boiler & Turbine", posisi: ["Karu Boiler & Turbine", "Boiler & Turbine"] },
    { nama: "PM & Winder", posisi: ["Karu PM & Winder", "PM", "Winder"] },
    { nama: "SP & Starch", posisi: ["Karu SP & Starch", "SP", "Starch", "Operator Pulper"] },
    { nama: "Produksi", posisi: ["Kepala Shift Produksi", "Mekanik Shift"] },
    { nama: "QC & R&D", posisi: ["SPV QC / R&D", "QC", "R&D"] }
  ];

  departments = this.departemenData.map(d => d.nama);
  positions: string[] = [];

  months = [
    { value: 1, name: 'Januari' }, { value: 2, name: 'Februari' },
    { value: 3, name: 'Maret' }, { value: 4, name: 'April' },
    { value: 5, name: 'Mei' }, { value: 6, name: 'Juni' },
    { value: 7, name: 'Juli' }, { value: 8, name: 'Agustus' },
    { value: 9, name: 'September' }, { value: 10, name: 'Oktober' },
    { value: 11, name: 'November' }, { value: 12, name: 'Desember' }
  ];
  years: number[] = [];

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
    const currentYear = new Date().getFullYear();
    for (let i = currentYear - 3; i <= currentYear + 1; i++) {
      this.years.push(i);
    }
    
    // MENCEGAH RESET SAAT KEMBALI (BACK) + FILTER BARU
    const savedMonth = sessionStorage.getItem('ovt_month');
    const savedYear = sessionStorage.getItem('ovt_year');
    const savedSearch = sessionStorage.getItem('ovt_search');
    const savedPage = sessionStorage.getItem('ovt_page');
    const savedDept = sessionStorage.getItem('ovt_dept');
    const savedPosisi = sessionStorage.getItem('ovt_posisi');

    if (savedMonth) this.selectedMonth = Number(savedMonth);
    if (savedYear) this.selectedYear = Number(savedYear);
    if (savedSearch) this.filterSearch = savedSearch;
    if (savedPage) this.currentPage = Number(savedPage);
    if (savedDept) this.filterDept = savedDept;
    if (savedPosisi) this.filterPosisi = savedPosisi;
    
    // Inisialisasi dropdown posisi berdasarkan filter Dept yang tersimpan
    if (this.filterDept) {
      const selected = this.departemenData.find(d => d.nama === this.filterDept);
      this.positions = selected ? selected.posisi : [];
    } else {
      this.positions = this.departemenData.flatMap(d => d.posisi).sort();
    }
    
    this.loadData();
  }

  private saveFilters(): void {
    sessionStorage.setItem('ovt_month', this.selectedMonth.toString());
    sessionStorage.setItem('ovt_year', this.selectedYear.toString());
    sessionStorage.setItem('ovt_search', this.filterSearch);
    sessionStorage.setItem('ovt_page', this.currentPage.toString());
    sessionStorage.setItem('ovt_dept', this.filterDept);
    sessionStorage.setItem('ovt_posisi', this.filterPosisi);
  }

  toNumber(value: any): number {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'number') return value;

    let strValue = String(value).trim();
    
    if (strValue.includes('.') && strValue.includes(',')) {
        if (strValue.indexOf('.') < strValue.indexOf(',')) {
            strValue = strValue.replace(/\./g, '').replace(',', '.');
        } else {
            strValue = strValue.replace(/,/g, '');
        }
    } else if (strValue.includes(',')) {
        strValue = strValue.replace(/,/g, '.');
    }

    const n = Number(strValue);
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

  get totalPoinKeseluruhan(): number {
    return this.items.reduce((acc, curr) => {
      return acc + this.toNumber(curr?.konversi_lembur ?? curr?.total_poin ?? 0);
    }, 0);
  }

  get totalUpahKeseluruhan(): number {
    return this.items.reduce((acc, curr) => {
      return acc + this.toNumber(curr?.hitungan_lembur ?? curr?.total_bayar ?? 0);
    }, 0);
  }

  // ===== Load Data & KALKULASI DINAMIS =====
  loadData(): void {
    if (!this.selectedMonth || !this.selectedYear) {
      this.items = [];
      this.total = 0;
      this.isLoading = false;
      return;
    }

    this.isLoading = true;
    this.saveFilters(); 

    const params: any = {
      page: this.currentPage,
      per_page: this.itemsPerPage,
      month: this.selectedMonth,
      year: this.selectedYear
    };
    
    if (this.filterSearch) params.search = this.filterSearch;
    // Parameter filter tambahan dikirim ke backend
    if (this.filterDept) params.departemen = this.filterDept; 
    if (this.filterPosisi) params.jabatan = this.filterPosisi;

    this.overtimeApi.getList(params).subscribe({
      next: (res) => {
        const paginatedData = res?.data || res;
        const rawItems = paginatedData?.data || [];
        
       this.items = rawItems.map((item: any) => {
          let poin = this.toNumber(item?.total_poin) || this.toNumber(item?.konversi_lembur) || 0;
          let hari = this.toNumber(item?.jumlah_hari) || this.toNumber(item?.total_hari) || 0;
          
          const gp = this.toNumber(item?.employee?.gaji_pokok ?? 0);
          const tarifPerJam = gp > 0 ? Math.round(gp / 173) : 0;
          const totalUpah = gp > 0 ? Math.round(tarifPerJam * poin) : 0;

          return {
            ...item,
            konversi_lembur: poin,
            total_poin: poin,
            jumlah_hari: hari,    
            total_hari: hari,     
            gaji_pokok: gp,               
            per_jam: tarifPerJam,         
            tarif_per_jam: tarifPerJam,
            hitungan_lembur: totalUpah,   
            total_bayar: totalUpah
          };
        });

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

  // 👇 Event Cascading Dropdown
  onDeptChange(): void {
    if (this.filterDept) {
      const selected = this.departemenData.find(d => d.nama === this.filterDept);
      this.positions = selected ? selected.posisi : [];
    } else {
      this.positions = this.departemenData.flatMap(d => d.posisi).sort();
    }
    
    this.filterPosisi = ''; 
    this.currentPage = 1;
    this.loadData();
  }

  onSearchDebounce(): void {
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.currentPage = 1;
      this.loadData();
    }, 500);
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.loadData();
  }

  resetFilter(): void {
    this.filterSearch = '';
    this.filterDept = '';
    this.filterPosisi = '';
    this.positions = this.departemenData.flatMap(d => d.posisi).sort();
    this.currentPage = 1;
    this.loadData();
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
    this.router.navigate(['/superadmin/overtimes/show', nama], {
      queryParams: {
        month: this.selectedMonth,
        year: this.selectedYear
      }
    });
  }

  onFileSelected(event: any): void {
    const file: File = event?.target?.files?.[0];
    if (!file) return;

    if (!this.selectedMonth || !this.selectedYear) {
      Swal.fire('Perhatian', 'Pilih Bulan dan Tahun terlebih dahulu sebelum melakukan Import.', 'warning');
      event.target.value = '';
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('month', this.selectedMonth.toString());
    formData.append('year', this.selectedYear.toString());

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