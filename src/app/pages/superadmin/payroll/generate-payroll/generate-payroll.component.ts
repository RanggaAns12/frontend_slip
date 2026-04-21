import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

// Pastikan import rxjs ini ada
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { PayrollApiService } from '../services/payroll-api.service';
import { AttendanceSummaryApiService } from '../../attendance-summaries/services/attendance-summary-api.service';
import { OvertimeApiService } from '../../overtimes/services/overtime-api.service';

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

  // Fitur Filter & Search
  searchQuery: string = '';
  selectedDepartment: string = '';
  departments: string[] = [];

  // Status Gembok & Data
  isLocked: boolean = false;
  currentPayrollId: number | null = null;
  dataSource: 'live_calculation' | 'database' = 'live_calculation';

  constructor(
    private payrollApi: PayrollApiService,
    private attendanceApi: AttendanceSummaryApiService,
    private overtimeApi: OvertimeApiService,
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
    if (value === 0 || !value) return ''; 
    return new Intl.NumberFormat('id-ID').format(Number(value));
  }

  onInputCurrency(value: string, item: any, field: string) {
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
  onPreview(forceRecalculate: boolean = false) {
    if (!this.selectedMonth || !this.selectedYear) {
      Swal.fire('Peringatan', 'Pilih bulan dan tahun terlebih dahulu!', 'warning');
      return;
    }

    if (forceRecalculate && this.isLocked) {
        Swal.fire('Terkunci', 'Gaji bulan ini sudah dikunci. Silakan buka gembok (Unlock) di menu Daftar Slip Gaji terlebih dahulu.', 'error');
        return;
    }

    this.isLoading = true;
    this.draftData = [];
    this.searchQuery = '';
    this.selectedDepartment = '';
    
    this.payrollApi.checkStatus(this.selectedMonth, this.selectedYear).subscribe({
      next: (statusRes: any) => {
        this.isLocked = statusRes.payroll_status === 'locked';
        this.currentPayrollId = statusRes.payroll_id || null;

        this.payrollApi.previewPayroll(this.selectedMonth, this.selectedYear, forceRecalculate).subscribe({
          next: (res: any) => {
            this.isLoading = false;
            this.periodLabel = res.period.label;
            this.draftData = res.data;
            this.dataSource = res.source; 
            this.isLocked = res.is_locked || this.isLocked; 
            
            const depts = this.draftData.map(d => d.department).filter(d => d);
            this.departments = [...new Set(depts)] as string[];

            if (this.draftData.length === 0) {
              Swal.fire('Kosong', 'Tidak ada data karyawan aktif untuk periode ini.', 'warning');
            } else if (forceRecalculate) {
              Swal.fire({
                toast: true, position: 'top-end', icon: 'success', 
                title: 'Data berhasil dihitung ulang dengan Master terbaru!', 
                showConfirmButton: false, timer: 3000 
              });
            }
          },
          error: (err: any) => {
            this.isLoading = false;
            Swal.fire('Error', err.error?.message || 'Gagal memuat preview data.', 'error');
          }
        });
      },
      error: (err: any) => {
        this.isLoading = false;
        console.error('Gagal mengecek status payroll', err);
      }
    });
  }

  unlockPayroll() {
    if (!this.currentPayrollId) {
      Swal.fire('Error', 'ID Payroll tidak ditemukan.', 'error');
      return;
    }

    Swal.fire({
      title: 'Buka Kunci Gaji?',
      text: 'Dengan membuka kunci, Anda dapat mengedit potongan atau melakukan hitung ulang (Recalculate) jika ada perubahan Master Data.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#f97316',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Ya, Buka Gembok (Unlock)',
      cancelButtonText: 'Batal'
    }).then((result) => {
      if (result.isConfirmed) {
        this.isLoading = true;
        this.payrollApi.unlockPayroll(this.currentPayrollId!).subscribe({
          next: (res: any) => {
            this.isLoading = false;
            this.isLocked = false;
            Swal.fire('Terbuka!', res.message || 'Gaji berhasil di-Unlock. Sekarang Anda bisa melakukan Hitung Ulang (Recalculate) atau Generate ulang.', 'success');
            this.onPreview(false); 
          },
          error: (err: any) => {
            this.isLoading = false;
            Swal.fire('Error', 'Gagal membuka kunci.', 'error');
          }
        });
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

    if (this.isLocked) {
      Swal.fire('Terkunci', 'Gaji bulan ini sudah dikunci dan tidak bisa ditimpa. Silakan Unlock terlebih dahulu.', 'error');
      return;
    }

    Swal.fire({
      title: 'Simpan & Kunci Penggajian?',
      text: "Data slip gaji ini akan disimpan dan OTOMATIS DIKUNCI. Karyawan akan melihat slip gajinya di aplikasi.",
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

  // 👇 PERBAIKAN: Poin Lembur kini 100% Sinkron dan Error TypeScript sudah dibypass
  showDetailAbsensi(item: any) {
    const empName = item.name || item.employee?.name || 'Karyawan';
    const empNik = item.nik || item.employee?.nik_karyawan || item.employee?.nik || '-';
    const empId = item.user_id || item.employee_id || item.employee?.id; 

    if (!empId) {
      Swal.fire('Peringatan', 'ID karyawan tidak ditemukan. Tidak dapat mengecek presensi.', 'warning');
      return;
    }

    Swal.fire({
      title: 'Memuat Data...',
      text: `Mencari Absensi untuk ${empName}`,
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    // 💡 PENAMBAHAN 'as any' AGAR TYPESCRIPT TIDAK PROTES SOAL 'employee_id'
    this.attendanceApi.getList({
      month: this.selectedMonth,
      year: this.selectedYear,
      employee_id: empId 
    } as any).subscribe({
      next: (res: any) => {
        const summaries = res.data?.data || res.data || [];
        
        // Ambil data pertama yang didapat (karena sudah difilter by ID, pasti ini orang yang benar)
        const att = summaries.length > 0 ? summaries[0] : null;

        // Ekstrak Nilai Absensi (Jika kosong/null, anggap 0)
        const izin = (att?.izin_lain_lain || 0) + (att?.cuti_pribadi || 0);
        const sakit = (att?.sakit_dengan_dokter || 0) + (att?.sakit_tanpa_dokter || 0);
        const alpha = att?.absent_no_permission || 0;
        const telat = att?.late_count || 0;
        
        // --- 3. AMBIL POIN LEMBUR (SINKRON DENGAN TABEL PAYROLL) ---
        const lemburPoin = parseFloat(item.overtime_hours || 0);
        const estimasiJamLembur = (lemburPoin / 1.5).toFixed(1);

        Swal.fire({
          title: `<span class="text-lg font-bold text-gray-800">Detail Kehadiran</span>`,
          html: `
            <div class="text-left bg-gray-50/50 p-5 rounded-2xl border border-gray-100 mt-2">
              <div class="mb-4 border-b border-gray-100 pb-4">
                <p class="text-sm font-bold text-gray-800">${empName}</p>
                <p class="text-xs text-gray-500 font-medium">NIK: <span class="font-mono bg-gray-200 px-1 rounded">${empNik}</span></p>
                ${!att ? `<p class="text-xs text-red-500 mt-2 font-bold flex items-center gap-1"><svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg> Data Absen Mesin Kosong / Belum Diimport</p>` : ''}
              </div>
              
              <div class="grid grid-cols-2 gap-4 text-sm mb-4">
                <div>
                  <span class="block text-gray-500 font-medium text-[11px] uppercase tracking-wider mb-1">Telat</span>
                  <span class="font-semibold text-gray-800">${telat} Hari</span>
                </div>
                <div>
                  <span class="block text-gray-500 font-medium text-[11px] uppercase tracking-wider mb-1">Izin / Cuti</span>
                  <span class="font-semibold text-indigo-600">${izin} Hari</span>
                </div>
                <div>
                  <span class="block text-gray-500 font-medium text-[11px] uppercase tracking-wider mb-1">Sakit</span>
                  <span class="font-semibold text-teal-600">${sakit} Hari</span>
                </div>
                <div>
                  <span class="block text-gray-500 font-medium text-[11px] uppercase tracking-wider mb-1">Alpha / Mangkir</span>
                  <span class="font-semibold text-rose-600">${alpha} Hari</span>
                </div>
              </div>

              <div class="flex justify-between items-center pt-3 mt-1 border-t border-gray-100">
                <span class="text-gray-500 font-medium">Total Lembur</span>
                <span class="font-semibold text-emerald-600">${lemburPoin} Pts <span class="text-xs text-gray-400 font-normal">(~${estimasiJamLembur} Jam)</span></span>
              </div>
            </div>
          `,
          showConfirmButton: true,
          confirmButtonText: 'Tutup',
          confirmButtonColor: '#1e293b',
          customClass: { popup: 'rounded-3xl' }
        });
      },
      error: (err: any) => {
        console.error(err);
        Swal.fire('Gagal', 'Tidak dapat terhubung ke server untuk mengecek presensi. Pastikan koneksi stabil.', 'error');
      }
    });
  }
}