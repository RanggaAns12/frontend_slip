import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
// Sesuaikan path ini dengan lokasi service Mas Rangga
import { OvertimeApiService } from '../../../superadmin/overtimes/services/overtime-api.service';

@Component({
  selector: 'app-hrd-overtime-show',
  standalone: false,
  templateUrl: './hrd-overtime-show.component.html',
  styleUrls: ['./hrd-overtime-show.component.scss']
})
export class HrdOvertimeShowComponent implements OnInit {
  namaKaryawan: string = '';
  details: any[] = [];
  isLoading = false;
  maxJam = 0;

  // Header Summary Data (Khusus HRD: Hanya Hari & Poin)
  totalPoin = 0;
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
          this.maxJam = Math.max(...data.map((d: any) => parseFloat(d.konversi_lembur || 0)));
          this.totalPoin = data.reduce((acc: number, curr: any) => acc + parseFloat(curr.konversi_lembur || 0), 0);
        } else {
          this.totalPoin = 0;
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
      konversi_lembur: 0
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
        this.showToast(this.isEditMode ? 'Data lembur diperbarui!' : 'Data lembur ditambahkan!', 'success');
      },
      error: (err) => {
        this.isSaving = false;
        this.showToast('Terjadi kesalahan saat menyimpan data', 'error');
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
      }
    });
  }

  // --- HELPERS ---
  goBack(): void {
    // 🔴 Kembalikan navigasi ke list HRD
    this.router.navigate(['/hrd/overtimes']);
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
}
