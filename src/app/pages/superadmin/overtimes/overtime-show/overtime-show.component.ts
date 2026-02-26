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

  // --- STATE POTONGAN GAJI ---
  potongan = { pph21: 0, bpjs_kes: 0, bpjs_tk: 0 };
  showPotonganModal = false;
  potonganFormStr = { pph21: '', bpjs_kes: '', bpjs_tk: '' };

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
      this.loadSavedPotongan(); 
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

  // --- CALCULATION GETTERS ---
  get totalPotongan(): number {
    return Number(this.potongan.pph21) + Number(this.potongan.bpjs_kes) + Number(this.potongan.bpjs_tk);
  }

  get totalBersih(): number {
    return this.totalBayar - this.totalPotongan;
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

  // --- FUNGSI EDIT POTONGAN ---
  loadSavedPotongan() {
    const saved = localStorage.getItem(`potongan_${this.namaKaryawan}`);
    if (saved) {
      this.potongan = JSON.parse(saved);
    } else {
      const kompSaved = localStorage.getItem(`komponen_${this.namaKaryawan}`);
      if (kompSaved) {
        const data = JSON.parse(kompSaved);
        this.potongan = data.potongan || { pph21: 0, bpjs_kes: 0, bpjs_tk: 0 };
      }
    }
  }

  openPotonganModal() {
    this.potonganFormStr = { 
      pph21: this.potongan.pph21 ? this.potongan.pph21.toString() : '',
      bpjs_kes: this.potongan.bpjs_kes ? this.potongan.bpjs_kes.toString() : '',
      bpjs_tk: this.potongan.bpjs_tk ? this.potongan.bpjs_tk.toString() : ''
    };
    this.showPotonganModal = true;
  }

  onCurrencyInput(field: 'pph21' | 'bpjs_kes' | 'bpjs_tk', event: Event) {
    const inputElement = event.target as HTMLInputElement;
    this.potonganFormStr[field] = inputElement.value.replace(/[^0-9]/g, '');
  }

    savePotongan() {
    // 1. Ambil nilai inputan
    this.potongan = { 
      pph21: Number(this.potonganFormStr.pph21) || 0,
      bpjs_kes: Number(this.potonganFormStr.bpjs_kes) || 0,
      bpjs_tk: Number(this.potonganFormStr.bpjs_tk) || 0
    };
    
    // 2. Total seluruh potongan
    const sumPotongan = this.potongan.pph21 + this.potongan.bpjs_kes + this.potongan.bpjs_tk;

    // 3. Ambil query params 'month' dan 'year' dari URL (jika user sedang memfilter bulan tertentu)
    const month = this.route.snapshot.queryParamMap.get('month') || undefined;
    const year = this.route.snapshot.queryParamMap.get('year') || undefined;

    // 4. Buat Payload untuk API
    const payload: any = {
      potongan_pph_bpjs: sumPotongan
    };

    // 5. Tambahkan ke payload jika ada (kirim sebagai query param atau body tergantung API)
    // Supaya Laravel tahu potongan ini untuk bulan apa
    if (month) payload.month = month;
    if (year) payload.year = year;

    // 6. Panggil API ke Backend
    this.overtimeApi.updatePotongan(this.namaKaryawan, payload).subscribe({
      next: (res) => {
        // Jika sukses, simpan juga di local storage untuk load awal yang cepat
        localStorage.setItem(`potongan_${this.namaKaryawan}`, JSON.stringify(this.potongan));
        
        this.showPotonganModal = false;
        this.showToast('Potongan lembur berhasil disimpan ke database!', 'success');
        
        // Reload detail agar angka terbaru terhitung
        this.loadDetail();
      },
      error: (err) => {
        console.error(err);
        this.showToast(err.error?.message || 'Gagal menyimpan potongan ke database', 'error');
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
