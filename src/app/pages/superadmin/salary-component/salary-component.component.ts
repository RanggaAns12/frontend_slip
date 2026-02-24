import { Component, OnInit } from '@angular/core';
import { SalaryComponentService } from './services/services.service';

@Component({
  selector: 'app-salary-component',
  templateUrl: './salary-component.component.html',
  styleUrls: ['./salary-component.component.scss']
})
export class SalaryComponentComponent implements OnInit {

  komponenList: any[] = [];
  isLoading = false;

  // --- STATE FORM MODAL ---
  showFormModal = false;
  isEditMode = false;
  isSaving = false;
  
  // Model data aktual yang dikirim ke API
  komponenForm: any = { id: null, nama_komponen: '', nominal: 0 };
  
  // Model string sementara untuk input format Rupiah
  komponenFormStr = { nominal: '' };

  // --- STATE DELETE MODAL ---
  showDeleteModal = false;
  isDeleting = false;
  deleteId: number | string | null = null;

  // --- STATE TOAST ALERT ---
  toastMessage: string = '';
  toastType: 'success' | 'error' = 'success';

  constructor(private salaryApi: SalaryComponentService) { }

  ngOnInit(): void {
    this.loadData();
  }

  showToast(message: string, type: 'success' | 'error') {
    this.toastMessage = message;
    this.toastType = type;
    setTimeout(() => {
      this.toastMessage = '';
    }, 3500); 
  }

  loadData(): void {
    this.isLoading = true;
    this.salaryApi.getAll().subscribe({
      next: (res: any) => {
        // Ambil data dari res.data sesuai standar response API Laravel
        this.komponenList = res.data || res;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Gagal mengambil data', err);
        this.showToast('Gagal memuat data komponen', 'error');
        this.isLoading = false;
      }
    });
  }

  // --- FORMATTER RUPIAH ---
  formatRupiah(value: number | string): string {
    const val = parseFloat(value as string || '0');
    if (val === 0) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);
  }

  // Format angka ke string dengan pemisah ribuan saat mengetik di input
  formatRupiahForm(value: string | number): string {
    if (!value) return '';
    const numericValue = Number(value.toString().replace(/[^0-9]/g, ''));
    if (numericValue === 0) return '';
    return numericValue.toLocaleString('id-ID');
  }

  // Menangkap ketikan user di kolom Nominal, menghapus huruf, dan menyimpan raw number-nya
  onNominalInput(event: Event) {
    const inputElement = event.target as HTMLInputElement;
    const cleanValue = inputElement.value.replace(/[^0-9]/g, '');
    this.komponenFormStr.nominal = cleanValue;
    this.komponenForm.nominal = Number(cleanValue) || 0;
  }

  // --- FUNGSI CREATE & EDIT ---
  openCreateModal() {
    this.isEditMode = false;
    this.komponenForm = { id: null, nama_komponen: '', nominal: 0 };
    this.komponenFormStr = { nominal: '' };
    this.showFormModal = true;
  }

  openEditModal(item: any) {
    this.isEditMode = true;
    this.komponenForm = { ...item };
    // Set format string untuk form modal
    this.komponenFormStr.nominal = item.nominal ? item.nominal.toString() : '';
    this.showFormModal = true;
  }

  saveKomponen() {
    this.isSaving = true;

    // Siapkan payload, pastikan nominal terkirim (default 0 jika kosong)
    const payload = {
      nama_komponen: this.komponenForm.nama_komponen,
      nominal: this.komponenForm.nominal || 0
    };

    const request = this.isEditMode 
      ? this.salaryApi.update(this.komponenForm.id, payload)
      : this.salaryApi.create(payload);

    request.subscribe({
      next: () => {
        this.isSaving = false;
        this.showFormModal = false;
        this.loadData();
        this.showToast(this.isEditMode ? 'Komponen berhasil diperbarui!' : 'Komponen berhasil ditambahkan!', 'success');
      },
      error: (err) => {
        console.error('Gagal menyimpan', err);
        this.isSaving = false;
        this.showToast('Terjadi kesalahan saat menyimpan data', 'error');
      }
    });
  }

  // --- FUNGSI HAPUS ---
  openDeleteModal(id: number | string) {
    this.deleteId = id;
    this.showDeleteModal = true;
  }

  confirmDelete() {
    if (!this.deleteId) return;
    this.isDeleting = true;
    
    this.salaryApi.delete(this.deleteId).subscribe({
      next: () => {
        this.isDeleting = false;
        this.showDeleteModal = false;
        this.deleteId = null;
        this.loadData();
        this.showToast('Komponen berhasil dihapus!', 'success');
      },
      error: (err) => {
        console.error('Gagal menghapus', err);
        this.isDeleting = false;
        this.showDeleteModal = false;
        this.showToast('Gagal menghapus komponen', 'error');
      }
    });
  }
}
