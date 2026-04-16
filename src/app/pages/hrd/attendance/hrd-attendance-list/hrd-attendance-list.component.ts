import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AttendanceSummaryApiService, AttendanceSummary, AttendanceSummaryDetail } from '../../../superadmin/attendance-summaries/services/attendance-summary-api.service';

@Component({
  selector: 'app-hrd-attendance-list',
  standalone: false, // 🔥 Kembali menjadi false (Module Based)
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
  Math        = Math; 

  // ── Filter ─────────────────────────────────────────────────
  filterMonth : number | '' = new Date().getMonth() + 1; 
  filterYear  : number      = new Date().getFullYear();
  filterSearch= '';
  filterDept  = '';
  filterPosisi= '';
  private searchTimeout: any;

  // ── Modal State (Import HTML & Edit Manual) ──────────────
  showImportModal = false;
  selectedFile: File | null = null;
  isProcessing = false;

  showEditModal = false;
  selectedAttendance: Partial<AttendanceSummaryDetail> | null = null;
  isEditing = false;

  // ── Dynamic Date Rows State ──────────────────────────────
  izinDates : { val: string }[] = [];
  sakitDates: { val: string }[] = [];
  alpaDates : { val: string }[] = [];

  // 🏢 MASTER DATA DEPARTEMEN & POSISI
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
    { nama: "QC & R&D", posisi: ["SPV QC / R&D", "QC", "R&D"] },
    { nama: "Umum", posisi: ["Driver"] }
  ];

  departments = this.departemenData.map(d => d.nama);
  positions: string[] = [];

  months = [
    { value: 1,  label: 'Januari' }, { value: 2,  label: 'Februari' },
    { value: 3,  label: 'Maret'   }, { value: 4,  label: 'April'    },
    { value: 5,  label: 'Mei'     }, { value: 6,  label: 'Juni'     },
    { value: 7,  label: 'Juli'    }, { value: 8,  label: 'Agustus'  },
    { value: 9,  label: 'September'},{ value: 10, label: 'Oktober'  },
    { value: 11, label: 'November' }, { value: 12, label: 'Desember' },
  ];

  toastMessage = '';
  toastType    : 'success' | 'error' = 'success';
  private toastTimer: any;

  constructor(
    private api    : AttendanceSummaryApiService,
    private router : Router,
    private route  : ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.positions = this.departemenData.flatMap(d => d.posisi).sort();
    this.load();
  }

  load(): void {
    this.isLoading = true;
    const params: any = { page: this.currentPage, year: this.filterYear };
    
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

  onSearchDebounce(): void {
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.currentPage = 1;
      this.load();
    }, 500);
  }

  onSearch(): void {
    this.currentPage = 1;
    this.load();
  }

  onDeptChange(): void {
    if (this.filterDept) {
      const selected = this.departemenData.find(d => d.nama === this.filterDept);
      this.positions = selected ? selected.posisi : [];
    } else {
      this.positions = this.departemenData.flatMap(d => d.posisi).sort();
    }
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
    this.positions = this.departemenData.flatMap(d => d.posisi).sort();
    this.currentPage  = 1;
    this.load();
  }

  goPage(page: number): void {
    if (page < 1 || page > this.lastPage) return;
    this.currentPage = page;
    this.load();
  }

  goToDetail(id: number | null): void {
    if (!id) {
        this.showToast('Karyawan ini belum memiliki data absensi bulan ini. Silakan input edit manual terlebih dahulu.', 'error');
        return;
    }
    this.router.navigate(['/hrd/attendance/show', id]);
  }

  getTotalIzin(item: any): number {
    return (item.izin_tidak_masuk_pribadi || 0);
  }

  getTotalSakit(item: any): number {
    return (item.sakit_dengan_surat_dokter || 0) + (item.sakit_tanpa_surat_dokter || 0);
  }

  openImportModal(): void {
    this.showImportModal = true;
    this.selectedFile = null;
  }

  closeImportModal(): void {
    this.showImportModal = false;
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) this.selectedFile = file;
    event.target.value = '';
  }

  uploadFile(): void {
    if (!this.selectedFile || this.filterMonth === '') {
      this.showToast('Pastikan file HTML dan Bulan sudah dipilih.', 'error');
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

  openEditModal(item: any): void {
    this.isEditing = true;
    this.izinDates = [];
    this.sakitDates = [];
    this.alpaDates = [];

    // JIKA DATA BELUM ADA DI DATABASE (IS_EMPTY === TRUE)
    if (item.is_empty || !item.id) {
        this.selectedAttendance = {
            id: null as any,
            employee_id: item.employee_id,
            nama: item.nama,
            nik_karyawan: item.nik_karyawan,
            izin_tidak_masuk_pribadi: item.izin_tidak_masuk_pribadi || 0,
            sakit_dengan_surat_dokter: item.sakit_dengan_surat_dokter || 0,
            tanpa_izin: item.tanpa_izin || 0,
            kehadiran_jml: 0,
            lembur_jam: 0,
            lembur_menit: 0
        };

        const machineIzin = this.selectedAttendance.izin_tidak_masuk_pribadi || 0;
        while (this.izinDates.length < machineIzin) this.izinDates.push({ val: '' });

        const machineSakit = this.selectedAttendance.sakit_dengan_surat_dokter || 0;
        while (this.sakitDates.length < machineSakit) this.sakitDates.push({ val: '' });

        const machineAlpa = this.selectedAttendance.tanpa_izin || 0;
        while (this.alpaDates.length < machineAlpa) this.alpaDates.push({ val: '' });

        this.showEditModal = true;
        this.isEditing = false;

    } else {
        // JIKA DATA SUDAH ADA DI DATABASE
        this.api.getById(item.id).subscribe({
          next: (res) => {
            if (res.success) {
              this.selectedAttendance = { ...res.data };
              
              this.izinDates  = this.parseDatesString((this.selectedAttendance as any).tanggal_izin);
              this.sakitDates = this.parseDatesString((this.selectedAttendance as any).tanggal_sakit);
              this.alpaDates  = this.parseDatesString((this.selectedAttendance as any).tanggal_alpa);

              const machineIzin = (this.selectedAttendance as any).izin_tidak_masuk_pribadi || 0;
              while (this.izinDates.length < machineIzin) this.izinDates.push({ val: '' });

              const machineSakit = (this.selectedAttendance as any).sakit_dengan_surat_dokter || 0;
              while (this.sakitDates.length < machineSakit) this.sakitDates.push({ val: '' });

              const machineAlpa = (this.selectedAttendance as any).tanpa_izin || 0;
              while (this.alpaDates.length < machineAlpa) this.alpaDates.push({ val: '' });

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
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.selectedAttendance = null;
    this.izinDates = [];
    this.sakitDates = [];
    this.alpaDates = [];
  }

  parseDatesString(dateStr?: string | null): { val: string }[] {
    if (!dateStr) return [];
    return dateStr.split(',').map(s => ({ val: s.trim() })).filter(item => item.val !== '');
  }

  addDateRow(type: 'izin' | 'sakit' | 'alpa'): void {
    if (type === 'izin') {
      this.izinDates.push({ val: '' });
      if (this.selectedAttendance) (this.selectedAttendance as any).izin_tidak_masuk_pribadi = this.izinDates.length;
    } else if (type === 'sakit') {
      this.sakitDates.push({ val: '' });
      if (this.selectedAttendance) (this.selectedAttendance as any).sakit_dengan_surat_dokter = this.sakitDates.length;
    } else if (type === 'alpa') {
      this.alpaDates.push({ val: '' });
      if (this.selectedAttendance) (this.selectedAttendance as any).tanpa_izin = this.alpaDates.length;
    }
  }

  removeDateRow(type: 'izin' | 'sakit' | 'alpa', index: number): void {
    if (type === 'izin') {
      this.izinDates.splice(index, 1);
      if (this.selectedAttendance) (this.selectedAttendance as any).izin_tidak_masuk_pribadi = this.izinDates.length;
    } else if (type === 'sakit') {
      this.sakitDates.splice(index, 1);
      if (this.selectedAttendance) (this.selectedAttendance as any).sakit_dengan_surat_dokter = this.sakitDates.length;
    } else if (type === 'alpa') {
      this.alpaDates.splice(index, 1);
      if (this.selectedAttendance) (this.selectedAttendance as any).tanpa_izin = this.alpaDates.length;
    }
  }

  saveAttendance(): void {
    if (!this.selectedAttendance || !this.selectedAttendance.employee_id) return;

    const payload: any = {
        ...this.selectedAttendance,
        tanggal_izin  : this.izinDates.map(d => d.val).filter(v => v).join(', '),
        tanggal_sakit : this.sakitDates.map(d => d.val).filter(v => v).join(', '),
        tanggal_alpa  : this.alpaDates.map(d => d.val).filter(v => v).join(', '),
        month         : Number(this.filterMonth),
        year          : this.filterYear
    };

    this.isProcessing = true;

    if (this.selectedAttendance.id) {
        this.api.update(this.selectedAttendance.id, payload).subscribe({
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
    } else {
        this.api.create(payload).subscribe({
          next: (res) => {
            if (res.success) {
              this.showToast('Data absensi manual berhasil ditambahkan.', 'success');
              this.closeEditModal();
              this.load(); 
            }
            this.isProcessing = false;
          },
          error: () => {
            this.showToast('Gagal menambahkan data absensi manual.', 'error');
            this.isProcessing = false;
          }
        });
    }
  }

  get pageNumbers(): number[] {
    const pages = [];
    const start = Math.max(1, this.currentPage - 2);
    const end   = Math.min(this.lastPage, start + 4);
    for (let i = start; i <= end; i++) pages.push(i);
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