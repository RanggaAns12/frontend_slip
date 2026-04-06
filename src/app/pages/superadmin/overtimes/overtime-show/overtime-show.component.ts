import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { OvertimeApiService } from '../services/overtime-api.service';

@Component({
  selector: 'app-overtime-show',
  templateUrl: './overtime-show.component.html',
  styleUrls: ['./overtime-show.component.scss']
})
export class OvertimeShowComponent implements OnInit {
  namaKaryawan: string = '';
  details: any[] = [];
  isLoading = false;
  maxJam = 0;

  // Header Summary Data
  gajiPokok = 0;
  tarifPerJam = 0;
  totalPoin = 0;
  totalBayar = 0;
  totalHari = 0;

  // --- STATE FORM LEMBUR (CREATE & EDIT) ---
  showFormModal = false;
  isEditMode = false;
  isSaving = false;
  lemburForm: any = {};

  // --- STATE DELETE MODAL ---
  showDeleteModal = false;
  isDeleting = false;
  deleteId: number | string | null = null;

  // --- STATE TOAST ALERT ---
  toastMessage: string = '';
  toastType: 'success' | 'error' = 'success';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private overtimeApi: OvertimeApiService
  ) {}

  ngOnInit(): void {
    this.namaKaryawan = this.route.snapshot.paramMap.get('nama') ?? '';
    if (this.namaKaryawan) {
      this.loadDetail();
    } else {
      this.goBack();
    }
  }

  showToast(message: string, type: 'success' | 'error') {
    this.toastMessage = message;
    this.toastType = type;
    setTimeout(() => {
      this.toastMessage = '';
    }, 3500); 
  }

  // --- LOAD DATA ---
  loadDetail(): void {
    this.isLoading = true;
    this.overtimeApi.getDetail(this.namaKaryawan, {}).subscribe({
      next: (res: any) => {
        const data = res.data || res; 
        this.details = data;
        this.totalHari = data.length;
        
        if (data.length > 0) {
          // Ambil dari row pertama (karena GP/Tarif sama untuk 1 periode)
          this.gajiPokok = parseFloat(data[0].gaji_pokok || 0);
          this.tarifPerJam = parseFloat(data[0].per_jam || 0);
          this.maxJam = Math.max(...data.map((d: any) => parseFloat(d.konversi_lembur || 0)));
          
          this.totalPoin = data.reduce((acc: number, curr: any) => acc + parseFloat(curr.konversi_lembur || 0), 0);
          this.totalBayar = data.reduce((acc: number, curr: any) => acc + parseFloat(curr.hitungan_lembur || 0), 0);
        } else {
          this.gajiPokok = 0; this.tarifPerJam = 0; this.totalPoin = 0; this.totalBayar = 0;
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Gagal memuat detail lembur', err);
        this.showToast('Gagal memuat data lembur', 'error');
        this.isLoading = false;
      }
    });
  }

  // --- FUNGSI CREATE & EDIT LEMBUR ---
  openCreateModal() {
    this.isEditMode = false;
    this.lemburForm = {
      nama_karyawan: this.namaKaryawan,
      tanggal_lembur: '',
      konversi_lembur: 0,
      per_jam: this.tarifPerJam,
      gaji_pokok: this.gajiPokok,
      hitungan_lembur: 0
    };
    this.showFormModal = true;
  }

  openEditModal(item: any) {
    this.isEditMode = true;
    this.lemburForm = { ...item };
    this.showFormModal = true;
  }

  closeFormModal() {
    this.showFormModal = false;
  }

  recalcLembur() {
    const poin = parseFloat(this.lemburForm.konversi_lembur || 0);
    const gapok = parseFloat(this.lemburForm.gaji_pokok || 0);
    const tarifPresisi = gapok / 173; 
    
    this.lemburForm.hitungan_lembur = Math.round(poin * tarifPresisi);
    this.lemburForm.per_jam = Math.round(tarifPresisi); 
  }

  saveLembur() {
    this.isSaving = true;
    const request = this.isEditMode 
      ? this.overtimeApi.update(this.lemburForm.id, this.lemburForm)
      : this.overtimeApi.create(this.lemburForm);

    request.subscribe({
      next: () => {
        this.isSaving = false;
        this.showFormModal = false;
        this.loadDetail();
        this.showToast(this.isEditMode ? 'Data lembur berhasil diperbarui!' : 'Data lembur berhasil ditambahkan!', 'success');
      },
      error: (err) => {
        this.isSaving = false;
        this.showToast('Terjadi kesalahan saat menyimpan data', 'error');
        console.error(err);
      }
    });
  }

  // --- FUNGSI DELETE BARIS LEMBUR ---
  openDeleteModal(id: number | string) {
    this.deleteId = id;
    this.showDeleteModal = true;
  }

  confirmDeleteLembur() {
    if (!this.deleteId) return;
    this.isDeleting = true;
    this.overtimeApi.delete(this.deleteId).subscribe({
      next: () => {
        this.isDeleting = false;
        this.showDeleteModal = false;
        this.deleteId = null;
        this.loadDetail();
        this.showToast('Data lembur berhasil dihapus!', 'success');
      },
      error: (err) => {
        this.isDeleting = false;
        this.showDeleteModal = false;
        this.showToast('Gagal menghapus data lembur', 'error');
        console.error(err);
      }
    });
  }

  // --- HELPERS ---
  goBack(): void {
    this.router.navigate(['/superadmin/overtimes/list']);
  }

  formatTanggal(tanggal: string): string {
    if (!tanggal) return '-';
    const validDate = tanggal.includes('T') ? tanggal : `${tanggal}T00:00:00`;
    return new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(validDate));
  }

  getProgressWidth(jam: number | string): string {
    const val = parseFloat(jam as string || '0');
    if (this.maxJam === 0 || val === 0) return '0%';
    return `${(val / this.maxJam) * 100}%`;
  }

  formatRupiahForm(value: string | number): string {
    if (!value) return '';
    const numericValue = Number(value.toString().replace(/[^0-9]/g, ''));
    if (numericValue === 0) return '';
    return 'Rp ' + numericValue.toLocaleString('id-ID');
  }

  formatRupiah(value: number | string): string {
    const val = parseFloat(value as string || '0');
    if (val === 0) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);
  }
}