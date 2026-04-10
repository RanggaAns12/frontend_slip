import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import {
  AttendanceSummaryApiService,
  AttendanceSummary,
} from '../services/attendance-summary-api.service';

@Component({
  selector: 'app-attendance-summary-list',
  templateUrl: './attendance-summary-list.component.html',
  styleUrls: ['./attendance-summary-list.component.scss'],
})
export class AttendanceSummaryListComponent implements OnInit {

  // ── Data State ─────────────────────────────────────────────
  items       : any[] = []; 
  isLoading   = false;
  currentPage = 1;
  lastPage    = 1;
  total       = 0;
  Math        = Math;

  // ── Filter State ───────────────────────────────────────────
  filterMonth  : number | '' = new Date().getMonth() + 1; 
  filterYear   : number      = new Date().getFullYear();
  filterSearch = '';
  filterDept   = '';
  filterPosisi = '';
  private searchTimeout: any;

  // 🏢 MASTER DATA DEPARTEMEN & POSISI (SINKRON 100% DENGAN MODUL KARYAWAN)
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

  // ── Options Mapping (Bulan) ───────────────────────────────
  months = [
    { value: 1,  label: 'Januari' }, { value: 2,  label: 'Februari' },
    { value: 3,  label: 'Maret'   }, { value: 4,  label: 'April'    },
    { value: 5,  label: 'Mei'     }, { value: 6,  label: 'Juni'     },
    { value: 7,  label: 'Juli'    }, { value: 8,  label: 'Agustus'  },
    { value: 9,  label: 'September'},{ value: 10, label: 'Oktober'  },
    { value: 11, label: 'November' }, { value: 12, label: 'Desember' },
  ];

  // ── Import State ───────────────────────────────────────────
  isImporting = false;

  // ── Modal Delete State ─────────────────────────────────────
  showDeleteModal = false;
  itemToDelete: any | null = null;
  isDeleting = false;

  // ── Toast State ────────────────────────────────────────────
  toastMessage = '';
  toastType    : 'success' | 'error' = 'success';
  private toastTimer: any;

  constructor(
    private api    : AttendanceSummaryApiService,
    private router : Router,
    private route  : ActivatedRoute,
    private http   : HttpClient
  ) {}

  ngOnInit(): void {
    // Tampilkan semua opsi posisi saat halaman dimuat pertama kali
    this.positions = this.departemenData.flatMap(d => d.posisi).sort();
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
    if (this.filterDept)         params['departemen'] = this.filterDept; // Param API untuk Departemen
    if (this.filterPosisi)       params['jabatan']    = this.filterPosisi; // Param API untuk Posisi

    this.api.getList(params).subscribe({
      next: (res: any) => {
        this.items       = res.data.data;
        this.total       = res.data.total;
        this.currentPage = res.data.current_page;
        this.lastPage    = res.data.last_page;
        this.isLoading   = false;
      },
      error: (err) => { 
        console.error(err);
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

  // 👇 Event Cascading Dropdown (Filter Dinamis)
  onDeptChange(): void {
    if (this.filterDept) {
      // Filter list posisi berdasarkan departemen yang dipilih
      const selected = this.departemenData.find(d => d.nama === this.filterDept);
      this.positions = selected ? selected.posisi : [];
    } else {
      // Jika "Semua Departemen", kembalikan semua opsi posisi
      this.positions = this.departemenData.flatMap(d => d.posisi).sort();
    }
    
    // Reset filter posisi dan ambil data baru dari server
    this.filterPosisi = ''; 
    this.currentPage = 1;
    this.load(); 
  }

  resetFilter(): void {
    this.filterSearch = '';
    this.filterMonth  = new Date().getMonth() + 1; 
    this.filterYear   = new Date().getFullYear();
    this.filterDept   = '';
    this.filterPosisi = '';
    
    // Kembalikan semua posisi ke opsi dropdown
    this.positions = this.departemenData.flatMap(d => d.posisi).sort();
    
    this.currentPage  = 1;
    this.load();
  }

  goPage(page: number): void {
    if (page < 1 || page > this.lastPage) return;
    this.currentPage = page;
    this.load();
  }

  goToDetail(id: number): void {
    this.router.navigate(['../show', id], { relativeTo: this.route });
  }

  // ── Feature: Delete with Modal ────────────────────────────
  confirmDelete(item: any): void {
    this.itemToDelete = item;
    this.showDeleteModal = true;
  }

  cancelDelete(): void {
    this.showDeleteModal = false;
    this.itemToDelete = null;
  }

  deleteData(): void {
    if (!this.itemToDelete) return;

    this.isDeleting = true;
    this.api.delete(this.itemToDelete.id).subscribe({
      next: () => {
        this.isDeleting = false;
        this.showDeleteModal = false;
        this.showToast('Data absensi berhasil dihapus', 'success');
        this.load(); 
      },
      error: (err) => {
        this.isDeleting = false;
        this.showDeleteModal = false;
        console.error(err);
        this.showToast('Gagal menghapus data absensi', 'error');
      }
    });
  }

  // ── Kalkulasi Kolom Dinamis (Perbaikan Bug Izin & Sakit) ──
  getTotalIzin(item: any): number {
    return (
      (item.izin_tidak_masuk_pribadi || 0) +
      (item.izin_pulang_awal_pribadi || 0) +
      (item.izin_datang_terlambat_pribadi || 0) +
      (item.izin_meninggalkan_tempat_kerja || 0) +
      (item.izin_dinas || 0) +
      (item.izin_datang_terlambat_kantor || 0) +
      (item.izin_pulang_awal_kantor || 0) +
      (item.cuti_normatif || 0) +
      (item.cuti_pribadi || 0) +
      (item.izin_lain_lain || 0)
    );
  }

  getTotalSakit(item: any): number {
    return (
      (item.sakit_dengan_surat_dokter || 0) +
      (item.sakit_tanpa_surat_dokter || 0)
    );
  }

  // ── Import Feature ─────────────────────────────────────────
  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      this.uploadFile(file);
    }
    // Reset value input agar bisa milih file yang sama lagi jika perlu
    event.target.value = '';
  }

  uploadFile(file: File): void {
    this.isImporting = true;
    const url = `${environment.apiUrl}/superadmin/attendance-summaries/import`;
    const formData = new FormData();
    formData.append('file', file);

    this.http.post(url, formData).subscribe({
      next: (res: any) => {
        this.isImporting = false;
        this.showToast(res.message || 'File Excel Absensi berhasil diimpor.', 'success');
        this.currentPage = 1;
        this.load(); 
      },
      error: (err: any) => {
        this.isImporting = false;
        console.error(err);
        let errorMsg = 'Gagal mengimpor file Excel.';
        if (err.error && err.error.message) {
            errorMsg = err.error.message;
        }
        this.showToast(errorMsg, 'error');
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