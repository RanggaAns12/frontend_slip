import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

import { PayrollApiService } from '../services/payroll-api.service';

@Component({
  selector: 'app-generate-payroll',
  templateUrl: './generate-payroll.component.html',
  styleUrls: ['./generate-payroll.component.scss']
})
export class GeneratePayrollComponent implements OnInit {
  selectedMonth: number = new Date().getMonth() + 1;
  selectedYear: number = new Date().getFullYear();
  
  months = [
    { value: 1, name: 'Januari' }, { value: 2, name: 'Februari' },
    { value: 3, name: 'Maret' }, { value: 4, name: 'April' },
    { value: 5, name: 'Mei' }, { value: 6, name: 'Juni' },
    { value: 7, name: 'Juli' }, { value: 8, name: 'Agustus' },
    { value: 9, name: 'September' }, { value: 10, name: 'Oktober' },
    { value: 11, name: 'November' }, { value: 12, name: 'Desember' }
  ];
  
  years: number[] = [];
  
  isLoading: boolean = false;
  isGenerating: boolean = false;
  
  periodLabel: string = '';
  draftData: any[] = [];
  isAlreadyGenerated: boolean = false;

  // Fitur Filter & Search
  searchQuery: string = '';
  selectedDepartment: string = '';
  departments: string[] = [];

  constructor(
    private payrollApi: PayrollApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const currentYear = new Date().getFullYear();
    for (let i = currentYear - 2; i <= currentYear + 1; i++) {
      this.years.push(i);
    }
  }

  trackByFn(index: number, item: any): any {
    return item.user_id; 
  }

  // ===== Helper Output Rupiah =====
  toNumber(value: any): number {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }

  formatRupiah(value: any): string {
    const numValue = this.toNumber(value);
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(numValue);
  }

  // ===== Helper Input Rupiah (Menghilangkan 0 & Auto Format) =====
  formatInputRupiah(value: any): string {
    if (value === 0 || !value) return ''; // Kosongkan jika 0
    return new Intl.NumberFormat('id-ID').format(Number(value));
  }

  onInputCurrency(value: string, item: any, field: string) {
    // Hapus semua karakter selain angka
    const cleanValue = value.replace(/[^0-9]/g, '');
    item[field] = cleanValue ? parseInt(cleanValue, 10) : 0;
    this.recalculateTotal(item);
  }

  // ===== Getter untuk Tabel (Search & Filter) =====
  get filteredData() {
    let data = this.draftData;

    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      data = data.filter(d => 
        d.name?.toLowerCase().includes(q) || 
        d.nik?.toLowerCase().includes(q)
      );
    }

    if (this.selectedDepartment) {
      data = data.filter(d => d.department === this.selectedDepartment);
    }

    return data;
  }

  // ===== Main Logic =====
  onPreview() {
    if (!this.selectedMonth || !this.selectedYear) {
      Swal.fire('Peringatan', 'Pilih bulan dan tahun terlebih dahulu!', 'warning');
      return;
    }

    this.isLoading = true;
    this.draftData = [];
    this.searchQuery = '';
    this.selectedDepartment = '';
    
    this.payrollApi.previewPayroll(this.selectedMonth, this.selectedYear).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        this.periodLabel = res.period.label;
        this.draftData = res.data;
        
        // Ekstrak departemen unik untuk opsi filter dropdown
        const depts = this.draftData.map(d => d.department).filter(d => d);
        this.departments = [...new Set(depts)] as string[];

        this.isAlreadyGenerated = res.source === 'database';

        if (this.isAlreadyGenerated) {
          Swal.fire({
            title: 'Gaji Terkunci',
            text: 'Data gaji untuk periode ini sudah dikunci dan tidak bisa diubah.',
            icon: 'info',
            confirmButtonColor: '#1e293b' // gray-800
          });
        } else if (this.draftData.length === 0) {
          Swal.fire('Kosong', 'Tidak ada data karyawan aktif untuk periode ini.', 'warning');
        }
      },
      error: (err: any) => {
        this.isLoading = false;
        Swal.fire('Error', err.error?.message || 'Gagal memuat preview data.', 'error');
      }
    });
  }

  recalculateTotal(item: any) {
    const pph = this.toNumber(item.pph21_deduction);
    const bpjsK = this.toNumber(item.bpjs_kesehatan);
    const bpjsT = this.toNumber(item.bpjs_ketenagakerjaan);
    const alpha = this.toNumber(item.absence_deduction);
    const other = this.toNumber(item.other_deduction);
    
    item.total_deduction = alpha + bpjsK + bpjsT + pph + other;
    item.net_salary = item.total_income - item.total_deduction;
    item.is_pph21_manual = true;
  }

  onGenerate() {
    if (this.draftData.length === 0) return;

    Swal.fire({
      title: 'Kunci Data Gaji?',
      text: "Data yang sudah digenerate tidak bisa diubah lagi. Pastikan semua rincian sudah sesuai.",
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#1e293b', 
      cancelButtonColor: '#94a3b8', 
      confirmButtonText: 'Ya, Simpan & Kunci',
      cancelButtonText: 'Batal'
    }).then((result) => {
      if (result.isConfirmed) {
        this.isGenerating = true;
        const payload = { month: this.selectedMonth, year: this.selectedYear, draft_data: this.draftData };

        this.payrollApi.generatePayroll(payload).subscribe({
          next: (res: any) => {
            this.isGenerating = false;
            Swal.fire('Berhasil!', res.message, 'success').then(() => {
              this.router.navigate(['/superadmin/payroll/slips']);
            });
          },
          error: (err: any) => {
            this.isGenerating = false;
            Swal.fire('Gagal', err.error?.message || 'Terjadi kesalahan saat menyimpan.', 'error');
          }
        });
      }
    });
  }

  onUnlockPayroll() {
    Swal.fire({
      title: 'Buka Kunci Gaji?',
      text: "Data slip gaji bulan ini akan dibatalkan. Anda harus melakukan generate ulang.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444', 
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Buka Kunci',
      cancelButtonText: 'Batal'
    }).then((result) => {
      if (result.isConfirmed) {
        this.isLoading = true; 
        this.payrollApi.resetPayrollPeriod(this.selectedMonth, this.selectedYear).subscribe({
          next: (res: any) => {
            Swal.fire('Berhasil!', res.message, 'success');
            this.isAlreadyGenerated = false;
            this.onPreview(); 
          },
          error: (err: any) => {
            this.isLoading = false;
            Swal.fire('Gagal', err.error?.message || 'Gagal membuka kunci gaji.', 'error');
          }
        });
      }
    });
  }

  showDetailAbsensi(item: any) {
    const empName = item.employee?.name || item.name || 'Karyawan';
    const empNik = item.employee?.nik_ktp || item.employee?.nik || item.nik || '-';
    const hadir = item.total_present || 0;
    const alpha = item.total_absent || 0;
    const telat = item.total_late || 0;
    const lemburPoin = item.overtime_hours || 0;
    const estimasiJamLembur = (lemburPoin / 1.5).toFixed(1);

    Swal.fire({
      title: `<span class="text-lg font-bold text-gray-800">Detail Kehadiran</span>`,
      html: `
        <div class="text-left bg-gray-50/50 p-5 rounded-2xl border border-gray-100 mt-2">
          <div class="mb-4 border-b border-gray-100 pb-4">
            <p class="text-sm font-bold text-gray-800">${empName}</p>
            <p class="text-xs text-gray-500 font-medium">NIK: ${empNik}</p>
          </div>
          <div class="space-y-3 text-sm">
            <div class="flex justify-between items-center">
              <span class="text-gray-500 font-medium">Hari Kerja (Hadir)</span>
              <span class="font-semibold text-gray-800">${hadir} Hari</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-gray-500 font-medium">Alpha / Tidak Hadir</span>
              <span class="font-semibold text-gray-800">${alpha} Hari</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-gray-500 font-medium">Terlambat</span>
              <span class="font-semibold text-gray-800">${telat} Hari</span>
            </div>
            <div class="flex justify-between items-center pt-3 mt-1 border-t border-gray-100">
              <span class="text-gray-500 font-medium">Total Lembur</span>
              <span class="font-semibold text-gray-800">${lemburPoin} Pts <span class="text-xs text-gray-400 font-normal">(~${estimasiJamLembur} Jam)</span></span>
            </div>
          </div>
        </div>
      `,
      showConfirmButton: true,
      confirmButtonText: 'Tutup',
      confirmButtonColor: '#1e293b',
      customClass: { popup: 'rounded-3xl' }
    });
  }
}
