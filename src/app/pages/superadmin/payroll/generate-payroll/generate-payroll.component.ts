import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

// PERBAIKAN 1: Pastikan path ini menunjuk ke lokasi file payroll-api.service.ts dengan benar
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

  onPreview() {
    if (!this.selectedMonth || !this.selectedYear) {
      Swal.fire('Peringatan', 'Pilih bulan dan tahun terlebih dahulu!', 'warning');
      return;
    }

    this.isLoading = true;
    this.draftData = [];
    
    this.payrollApi.previewPayroll(this.selectedMonth, this.selectedYear).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        this.periodLabel = res.period.label;
        this.draftData = res.data;
        
        this.isAlreadyGenerated = res.source === 'database';

        if (this.isAlreadyGenerated) {
          Swal.fire('Info', 'Data gaji untuk periode ini sudah dikunci (Tidak bisa diubah).', 'info');
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

  // Dipanggil setiap kali HRD mengetik di input PPh21 atau BPJS
  recalculateTotal(item: any) {
    // Pastikan nilai selalu angka valid
    item.bpjs_kesehatan = Number(item.bpjs_kesehatan) || 0;
    item.bpjs_ketenagakerjaan = Number(item.bpjs_ketenagakerjaan) || 0;
    item.pph21_deduction = Number(item.pph21_deduction) || 0;
    item.absence_deduction = Number(item.absence_deduction) || 0;
    item.other_deduction = Number(item.other_deduction) || 0;
    
    // Hitung ulang total potongan
    item.total_deduction = item.absence_deduction 
                           + item.bpjs_kesehatan 
                           + item.bpjs_ketenagakerjaan 
                           + item.pph21_deduction 
                           + item.other_deduction;
                           
    // Hitung ulang Gaji Bersih
    item.net_salary = item.total_income - item.total_deduction;
    
    // Tandai bahwa PPh21 sudah di-override secara manual (berguna jika dikirim ke DB)
    item.is_pph21_manual = true;
  }

  onGenerate() {
    if (this.draftData.length === 0) return;

    Swal.fire({
      title: 'Kunci Data Gaji?',
      text: "Data yang sudah digenerate tidak bisa diubah lagi. Pastikan semua inputan potongan sudah benar!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ea580c',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Ya, Generate & Kunci!',
      cancelButtonText: 'Batal'
    }).then((result) => {
      if (result.isConfirmed) {
        this.isGenerating = true;

        const payload = {
          month: this.selectedMonth,
          year: this.selectedYear,
          draft_data: this.draftData 
        };

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
      text: "Data slip gaji bulan ini akan DIBATALKAN dan dihapus dari sistem. Anda harus melakukan Generate ulang setelah mengubah data kehadiran/tunjangan.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Ya, Buka Kunci!',
      cancelButtonText: 'Batal'
    }).then((result) => {
      if (result.isConfirmed) {
        this.isLoading = true; // Munculkan loading spinner
        
        this.payrollApi.resetPayrollPeriod(this.selectedMonth, this.selectedYear).subscribe({
          next: (res: any) => {
            Swal.fire('Berhasil!', res.message, 'success');
            
            // Re-load preview dari awal (Draft mode dari absensi/tunjangan mentah)
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
}
