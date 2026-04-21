import { Component, OnInit } from '@angular/core';
import { PayrollApiService } from '../services/payroll-api.service';
import Swal from 'sweetalert2';

// IMPORT LIBRARY PDF
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface SlipGajiItem {
  id: number;
  employee_id: number;
  name: string;
  nik: string;
  department: string;
  position: string;
  base_salary: number;
  overtime_hours: number;
  overtime_pay: number;
  bonus?: number; 
  total_income: number;
  total_deduction: number;
  net_salary: number;
  status: string;
  
  period_month?: number;
  period_year?: number;
  period_label?: string;
  effective_working_days?: number;

  bpjs_kesehatan?: number;
  bpjs_ketenagakerjaan?: number;
  pph21_deduction?: number;
  absence_deduction?: number;
  other_deduction?: number;
  
  total_present?: number;
  total_absent?: number;
  total_late?: number;
  employee?: any; 
  allowances?: any[];
}

@Component({
  selector: 'app-slip-list',
  standalone: false,
  templateUrl: './slip-list.component.html'
})
export class SlipListComponent implements OnInit {
  
  months = [
    { value: 1, label: 'Januari' }, { value: 2, label: 'Februari' },
    { value: 3, label: 'Maret' }, { value: 4, label: 'April' },
    { value: 5, label: 'Mei' }, { value: 6, label: 'Juni' },
    { value: 7, label: 'Juli' }, { value: 8, label: 'Agustus' },
    { value: 9, label: 'September' }, { value: 10, label: 'Oktober' },
    { value: 11, label: 'November' }, { value: 12, label: 'Desember' }
  ];
  
  years: number[] = [];
  selectedMonth: number = new Date().getMonth() + 1;
  selectedYear: number = new Date().getFullYear();
  
  allDataSlip: SlipGajiItem[] = [];
  filteredDataSlip: SlipGajiItem[] = [];
  
  departmentList: string[] = [];
  positionList: string[] = [];
  selectedDepartment: string | null = null;
  selectedPosition: string | null = null;
  
  searchQuery: string = '';
  isLoading: boolean = false;
  
  isDeptDropdownOpen = false;
  isPosDropdownOpen = false;
  periodLabel: string = '';

  // [BARU] State untuk Gembok Unlock
  isLocked: boolean = true;
  currentPayrollId: number | null = null;

  constructor(private payrollApiService: PayrollApiService) {
    const currentYear = new Date().getFullYear();
    for (let i = 0; i < 5; i++) {
      this.years.push(currentYear - i);
    }
  }

  ngOnInit(): void {}

  onSearchSlips() {
    if (!this.selectedMonth || !this.selectedYear) {
      Swal.fire('Perhatian', 'Pilih bulan dan tahun terlebih dahulu.', 'warning');
      return;
    }

    this.isLoading = true;

    // [BARU] 1. Cek Status Gembok (Draft/Locked) dan dapatkan ID Payroll
    this.payrollApiService.checkStatus(this.selectedMonth, this.selectedYear).subscribe({
      next: (statusRes: any) => {
        if (statusRes.is_generated) {
          this.isLocked = statusRes.payroll_status === 'locked';
          this.currentPayrollId = statusRes.payroll_id;
        } else {
          this.isLocked = false;
          this.currentPayrollId = null;
        }
      },
      error: (err) => console.error('Gagal mengecek status payroll', err)
    });
    
    // 2. Load Data Slip Gaji
    this.payrollApiService.getPayslips(this.selectedMonth, this.selectedYear).subscribe({
      next: (res: any) => {
        if (res.status === 'not_found' || !res.data) {
          Swal.fire('Info', res.message || 'Data tidak ditemukan.', 'info');
          this.allDataSlip = [];
          this.filteredDataSlip = [];
          this.isLoading = false;
          return;
        }

        this.allDataSlip = (res.data || []).map((item: any) => {
          const emp = item.employee || {};
          
          const deptVal = emp.department?.name || emp.department || item.department || '-';
          const posVal = emp.position?.name || emp.position || item.position || '-';
          const nikVal = emp.nik_ktp || emp.nik || item.nik || '-';
          const nameVal = emp.name || item.name || '-';

          let rawComponents = item.allowances || item.salary_components || emp.salary_components || [];
          let mappedAllowances = rawComponents.map((comp: any) => {
              return {
                  name: comp.nama_komponen || comp.name || 'Tunjangan',
                  amount: Number(comp.pivot?.custom_amount || comp.amount || comp.nominal || 0)
              };
          });

          mappedAllowances = mappedAllowances.filter((c: any) => c.amount > 0);

          return {
            ...item,
            name: nameVal,
            nik: nikVal,
            department: deptVal,
            position: posVal,
            bonus: item.bonus || 0,
            allowances: mappedAllowances,
            total_present: item.total_present !== undefined ? Number(item.total_present) : 0,
            total_absent: item.total_absent !== undefined ? Number(item.total_absent) : 0,
            total_late: item.total_late !== undefined ? Number(item.total_late) : 0,
            effective_working_days: item.effective_working_days || 0,
            period_label: item.period_label || res.period?.label || ''
          };
        });

        this.periodLabel = res.period?.label || `${this.months.find(m => m.value === this.selectedMonth)?.label} ${this.selectedYear}`;
        
        if (res.filters?.departments) {
          this.departmentList = res.filters.departments;
        } else {
          this.departmentList = [...new Set(this.allDataSlip.map(x => x.department).filter(x => x !== '-'))] as string[];
        }

        if (res.filters?.positions) {
          this.positionList = res.filters.positions;
        } else {
          this.positionList = [...new Set(this.allDataSlip.map(x => x.position).filter(x => x !== '-'))] as string[];
        }
        
        this.selectedDepartment = null;
        this.selectedPosition = null;
        this.searchQuery = '';
        
        this.applyFilters();
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('Error load slips:', err);
        Swal.fire('Error', 'Gagal memuat data slip gaji.', 'error');
        this.isLoading = false;
      }
    });
  }

  // [BARU] Fungsi Buka Gembok
  unlockPayroll() {
    if (!this.currentPayrollId) {
      Swal.fire('Error', 'ID Payroll tidak ditemukan.', 'error');
      return;
    }

    Swal.fire({
      title: 'Buka Kunci Gaji?',
      text: 'Dengan membuka kunci, Anda dapat kembali ke menu Generate Payroll untuk melakukan Kalkulasi Ulang (Recalculate) jika ada perubahan Gaji Pokok atau Absensi di Master Data.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#f97316',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Ya, Buka Gembok (Unlock)',
      cancelButtonText: 'Batal'
    }).then((result) => {
      if (result.isConfirmed) {
        this.isLoading = true;
        this.payrollApiService.unlockPayroll(this.currentPayrollId!).subscribe({
          next: (res: any) => {
            this.isLoading = false;
            this.isLocked = false;
            Swal.fire('Terbuka!', res.message || 'Gaji berhasil di-Unlock. Silakan menuju menu Generate Payroll jika ingin menghitung ulang.', 'success');
            this.onSearchSlips(); // Refresh State
          },
          error: (err: any) => {
            this.isLoading = false;
            Swal.fire('Error', 'Gagal membuka kunci.', 'error');
          }
        });
      }
    });
  }

  applyFilters() {
    let result = [...this.allDataSlip];
    if (this.selectedDepartment) {
      result = result.filter(item => item.department === this.selectedDepartment);
    }
    if (this.selectedPosition) {
      result = result.filter(item => item.position === this.selectedPosition);
    }
    if (this.searchQuery.trim() !== '') {
      const query = this.searchQuery.toLowerCase();
      result = result.filter(item =>
        item.name.toLowerCase().includes(query) ||
        item.nik.toLowerCase().includes(query)
      );
    }
    this.filteredDataSlip = result;
  }

  selectDepartment(dept: string | null) {
    this.selectedDepartment = dept;
    this.isDeptDropdownOpen = false;
    this.applyFilters();
  }

  selectPosition(pos: string | null) {
    this.selectedPosition = pos;
    this.isPosDropdownOpen = false;
    this.applyFilters();
  }

  onSearchInput() {
    this.applyFilters();
  }

  getSelectedDepartmentLabel(): string {
    return this.selectedDepartment || 'Semua Departemen';
  }

  getSelectedPositionLabel(): string {
    return this.selectedPosition || 'Semua Posisi';
  }

  formatPoin(point: number | string): string {
    const p = Number(point) || 0;
    return parseFloat(p.toFixed(2)).toString();
  }

  convertPoinToJam(point: number | string): string {
    const p = Number(point) || 0;
    const estimasiJam = p / 1.5; 
    return parseFloat(estimasiJam.toFixed(1)).toString();
  }

  terbilang(angka: number): string {
    const huruf = ["", "Satu", "Dua", "Tiga", "Empat", "Lima", "Enam", "Tujuh", "Delapan", "Sembilan", "Sepuluh", "Sebelas"];
    const baca = (n: number): string => {
      let hasil = "";
      if (n < 12) hasil = " " + huruf[n];
      else if (n < 20) hasil = baca(n - 10) + " Belas";
      else if (n < 100) hasil = baca(Math.floor(n / 10)) + " Puluh" + baca(n % 10);
      else if (n < 200) hasil = " Seratus" + baca(n - 100);
      else if (n < 1000) hasil = baca(Math.floor(n / 100)) + " Ratus" + baca(n % 100);
      else if (n < 2000) hasil = " Seribu" + baca(n - 1000);
      else if (n < 1000000) hasil = baca(Math.floor(n / 1000)) + " Ribu" + baca(n % 1000);
      else if (n < 1000000000) hasil = baca(Math.floor(n / 1000000)) + " Juta" + baca(n % 1000000);
      else if (n < 1000000000000) hasil = baca(Math.floor(n / 1000000000)) + " Miliar" + baca(n % 1000000000);
      else if (n < 1000000000000000) hasil = baca(Math.floor(n / 1000000000000)) + " Triliun" + baca(n % 1000000000000);
      return hasil;
    };
    if (angka === 0) return "Nol Rupiah";
    return baca(angka).trim() + " Rupiah";
  }

  formatRupiah(value: number): string {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })
      .format(value).replace('Rp', 'Rp ').replace(',00', '');
  }

  // ==========================================
  // VIEW SLIP - Modal HTML
  // ==========================================
  viewSlip(slipId: number) {
    const item = this.filteredDataSlip.find(s => s.id === slipId);
    if (!item) return;

    const hariKerjaEfektif = item.effective_working_days || 0;
    const hadir = item.total_present || 0;
    const alpaLainnya = item.total_absent || 0;
    
    const formatPts = this.formatPoin(item.overtime_hours);

    let pph21Value = Number(item.pph21_deduction) || 0;
    let bpjsKesValue = Number(item.bpjs_kesehatan) || 0;
    let bpjsTkValue = Number(item.bpjs_ketenagakerjaan) || 0;
    let alpaValue = Number(item.absence_deduction) || 0;
    let otherValue = Math.max(0, Number(item.total_deduction || 0) - (pph21Value + bpjsKesValue + bpjsTkValue + alpaValue));

    let tunjanganHtml = '';
    if (item.allowances && item.allowances.length > 0) {
      item.allowances.forEach(allowance => {
        tunjanganHtml += `<div class="flex justify-between"><span class="text-gray-600">${allowance.name}</span><span class="font-semibold text-gray-900">${this.formatRupiah(allowance.amount)}</span></div>`;
      });
    } else if (item.bonus && item.bonus > 0) {
      tunjanganHtml = `<div class="flex justify-between"><span class="text-gray-600">Tunjangan Lainnya</span><span class="font-semibold text-gray-900">${this.formatRupiah(item.bonus)}</span></div>`;
    }

    let lemburHtml = '';
    if (item.overtime_pay > 0) {
        lemburHtml = `<div class="flex justify-between"><span class="text-gray-600">Upah Lembur</span><span class="font-semibold text-gray-900">${this.formatRupiah(item.overtime_pay)}</span></div>`;
    }

    let textNote = '-';
    if (item.overtime_pay > 0 || item.overtime_hours > 0) {
        const monthNames = ["", "Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
        
        let currentMonthValue = this.selectedMonth;
        let currentYearValue = this.selectedYear;
        
        let prevMonthValue = currentMonthValue - 1;
        let prevYearValue = currentYearValue;
        
        if (prevMonthValue < 1) {
            prevMonthValue = 12;
            prevYearValue -= 1;
        }

        const prevMonthStr = monthNames[prevMonthValue];
        const currentMonthStr = monthNames[currentMonthValue];
        const tahunLaluTeks = (prevMonthValue === 12) ? ` ${prevYearValue}` : '';

        textNote = `Lembur periode tanggal 21 ${prevMonthStr}${tahunLaluTeks} sampai 20 ${currentMonthStr} ${currentYearValue}`;
    }

    Swal.fire({
      showConfirmButton: false,
      showCloseButton: true,
      customClass: { popup: 'rounded-3xl p-0 overflow-hidden max-w-lg w-full' },
      html: `
        <div class="bg-white text-left font-sans">
          
          <div class="bg-gray-50/80 p-6 border-b border-gray-200">
            <div class="flex items-center gap-4">
              <img src="assets/images/logo.png" alt="Logo" class="w-12 h-12 object-contain" onerror="this.style.display='none'">
              <div>
                <h2 class="text-base font-extrabold text-gray-900 tracking-tight leading-none mb-1">PT. AGRO DELI SERDANG</h2>
                <p class="text-xs text-gray-500 font-medium">Slip Gaji • ${item.period_label || this.periodLabel}</p>
              </div>
            </div>
          </div>

          <div class="p-6 space-y-6">
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p class="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-1">Nama Karyawan</p>
                <p class="font-bold text-gray-800">${item.name}</p>
                <p class="text-xs text-gray-500 mt-0.5">${item.nik}</p>
              </div>
              <div class="text-right">
                <p class="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-1">Jabatan & Departemen</p>
                <p class="font-bold text-gray-800">${item.position}</p>
                <p class="text-xs text-gray-500 mt-0.5">${item.department}</p>
              </div>
            </div>

            <div class="bg-gray-50 rounded-xl p-4 border border-gray-100 flex justify-between text-xs">
              <div class="text-center">
                <span class="block text-gray-500 font-medium mb-1">H.K Efektif</span>
                <span class="font-bold text-gray-900">${hariKerjaEfektif} <span class="font-normal text-gray-500">Hari</span></span>
              </div>
              <div class="text-center">
                <span class="block text-gray-500 font-medium mb-1">Total Hadir</span>
                <span class="font-bold text-emerald-600">${hadir} <span class="font-normal text-gray-500">Hari</span></span>
              </div>
              <div class="text-center">
                <span class="block text-gray-500 font-medium mb-1">Alpa (T. Izin)</span>
                <span class="font-bold text-red-600">${alpaLainnya} <span class="font-normal text-gray-500">Hari</span></span>
              </div>
              <div class="text-center border-l pl-3 ml-1">
                <span class="block text-gray-500 font-medium mb-1">Lembur</span>
                <span class="font-bold text-indigo-600">${formatPts} <span class="font-normal text-gray-500">Pts</span></span>
              </div>
            </div>

            <div>
              <p class="text-[11px] uppercase tracking-widest text-gray-400 font-bold mb-3 border-b border-gray-100 pb-2">Pendapatan</p>
              <div class="space-y-2.5 text-sm">
                <div class="flex justify-between"><span class="text-gray-600">Gaji Pokok</span><span class="font-semibold text-gray-900">${this.formatRupiah(item.base_salary)}</span></div>
                ${lemburHtml}
                ${tunjanganHtml}
              </div>
            </div>

            <div>
              <p class="text-[11px] uppercase tracking-widest text-gray-400 font-bold mb-3 border-b border-gray-100 pb-2">Potongan</p>
              <div class="space-y-2.5 text-sm">
                ${pph21Value > 0 ? `<div class="flex justify-between"><span class="text-gray-600">PPh21</span><span class="font-semibold text-red-500">- ${this.formatRupiah(pph21Value)}</span></div>` : ''}
                ${bpjsKesValue > 0 ? `<div class="flex justify-between"><span class="text-gray-600">BPJS Kesehatan</span><span class="font-semibold text-red-500">- ${this.formatRupiah(bpjsKesValue)}</span></div>` : ''}
                ${bpjsTkValue > 0 ? `<div class="flex justify-between"><span class="text-gray-600">BPJS Ketenagakerjaan</span><span class="font-semibold text-red-500">- ${this.formatRupiah(bpjsTkValue)}</span></div>` : ''}
                ${alpaValue > 0 ? `<div class="flex justify-between"><span class="text-gray-600">Potongan Alpa</span><span class="font-semibold text-red-500">- ${this.formatRupiah(alpaValue)}</span></div>` : ''}
                ${otherValue > 0 ? `<div class="flex justify-between"><span class="text-gray-600">Potongan Lainnya</span><span class="font-semibold text-red-500">- ${this.formatRupiah(otherValue)}</span></div>` : ''}
                ${item.total_deduction === 0 ? `<div class="text-gray-400 italic">Tidak ada potongan</div>` : ''}
              </div>
            </div>
          </div>

          <div class="bg-gray-900 text-white p-6 border-b-4 border-gray-800">
            <p class="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-1">Take Home Pay</p>
            <p class="text-3xl font-black tracking-tight mb-2">${this.formatRupiah(item.net_salary)}</p>
            <p class="text-[10px] text-gray-400 italic">Terbilang: ${this.terbilang(item.net_salary)}</p>
          </div>
          
          <div class="bg-gray-50 p-4 text-xs font-medium text-gray-700">
            <p class="italic">Note : ${textNote}</p>
          </div>

        </div>
      `
    });
  }

  // ==========================================
  // LOGIC GAMBAR SLIP KE PDF (REUSABLE)
  // ==========================================
  private drawSingleSlip(doc: jsPDF, startY: number, item: any, logoObj: HTMLImageElement | null, bulanLabel: string, tahunLabel: string | number) {
    if (logoObj) doc.addImage(logoObj, 'PNG', 12, startY - 2, 12, 12);

    doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.setTextColor(0, 0, 0); 
    const textX = logoObj ? 28 : 15;
    doc.text('PT. AGRO DELI SERDANG', textX, startY + 3);
    
    doc.setFontSize(7); doc.setFont('helvetica', 'normal');
    doc.text('Dusun VII Desa/Kelurahan Dalu Sepuluh-A, 20362.', textX, startY + 6);
    doc.text('Kecamatan Tanjung Morawa. North Sumatera, Indonesia', textX, startY + 9);
    
    doc.setLineWidth(0.5); doc.setDrawColor(0, 0, 0); doc.line(10, startY + 13, 200, startY + 13); 
    
    doc.setTextColor(0, 0, 0); doc.setFontSize(10); doc.setFont('helvetica', 'bold');
    doc.text('SLIP GAJI KARYAWAN', 105, startY + 19, { align: 'center' });
    
    const cetakPeriode = item.period_label ? item.period_label.toUpperCase() : `${bulanLabel} ${tahunLabel}`;
    doc.setFontSize(8); doc.setFont('helvetica', 'normal');
    doc.text(`PERIODE: ${cetakPeriode}`, 105, startY + 23, { align: 'center' });

    doc.setFontSize(7);
    doc.text('NIK', 12, startY + 30);              doc.text(`: ${item.nik}`, 28, startY + 30);
    doc.text('Nama', 12, startY + 34);             doc.text(`: ${item.name}`, 28, startY + 34);
    doc.text('Jabatan', 12, startY + 38);          doc.text(`: ${item.position}`, 28, startY + 38);
    doc.text('Departemen', 12, startY + 42);       doc.text(`: ${item.department}`, 28, startY + 42);

    const hariKerjaEfektif = item.effective_working_days || 0;
    const hadir = item.total_present || 0;
    const alphaLainnya = item.total_absent || 0;
    const formatPts = this.formatPoin(item.overtime_hours);
    const formatJam = this.convertPoinToJam(item.overtime_hours);

    doc.text('DETAIL KEHADIRAN', 115, startY + 30); doc.line(115, startY + 31, 150, startY + 31);
    doc.text('Hari Kerja Efektif', 115, startY + 35);  doc.text(`: ${hariKerjaEfektif} Hari`, 150, startY + 35);
    doc.text('Total Hadir', 115, startY + 38);         doc.text(`: ${hadir} Hari`, 150, startY + 38);
    doc.text('Tidak Hadir (Alpa)', 115, startY + 41);  doc.text(`: ${alphaLainnya} Hari`, 150, startY + 41);
    doc.text('Total Lembur', 115, startY + 44);        
    doc.text(`: ${formatPts} Poin (~${formatJam} Jam)`, 150, startY + 44);

    const arrPenghasilan: { desc: string; val: string }[] = [
      { desc: 'Gaji Pokok', val: this.formatRupiah(item.base_salary) }
    ];
    
    if (item.overtime_pay > 0) {
      arrPenghasilan.push({ desc: `Upah Lembur (${formatPts} Poin)`, val: this.formatRupiah(item.overtime_pay) });
    }

    if (item.allowances && item.allowances.length > 0) {
      item.allowances.forEach((allowance: any) => {
        arrPenghasilan.push({ desc: allowance.name, val: this.formatRupiah(allowance.amount) });
      });
    } else if (item.bonus && item.bonus > 0) {
      arrPenghasilan.push({ desc: 'Tunjangan Lainnya', val: this.formatRupiah(item.bonus) });
    }

    let pph21Value = Number(item.pph21_deduction) || 0;
    let bpjsKesValue = Number(item.bpjs_kesehatan) || 0;
    let bpjsTkValue = Number(item.bpjs_ketenagakerjaan) || 0;
    let alpaValue = Number(item.absence_deduction) || 0;
    let otherValue = Math.max(0, Number(item.total_deduction || 0) - (pph21Value + bpjsKesValue + bpjsTkValue + alpaValue));

    const arrPotongan = [];
    if (pph21Value > 0) arrPotongan.push({ desc: 'Potongan PPh21', val: this.formatRupiah(pph21Value) });
    if (bpjsKesValue > 0) arrPotongan.push({ desc: 'Potongan BPJS Kes.', val: this.formatRupiah(bpjsKesValue) });
    if (bpjsTkValue > 0) arrPotongan.push({ desc: 'Potongan BPJS TK', val: this.formatRupiah(bpjsTkValue) });
    if (alpaValue > 0) arrPotongan.push({ desc: `Potongan Alpa (${alphaLainnya} hr)`, val: this.formatRupiah(alpaValue) });
    if (otherValue > 0) arrPotongan.push({ desc: 'Potongan Lainnya', val: this.formatRupiah(otherValue) });

    const maxRows = Math.max(arrPenghasilan.length, arrPotongan.length);
    const bodyData: any[] = [];

    for (let i = 0; i < maxRows; i++) {
      bodyData.push([
        arrPenghasilan[i] ? arrPenghasilan[i].desc : '', arrPenghasilan[i] ? arrPenghasilan[i].val : '',
        arrPotongan[i] ? arrPotongan[i].desc : '', arrPotongan[i] ? arrPotongan[i].val : ''
      ]);
    }

    const colorBlack: [number, number, number] = [0, 0, 0];
    bodyData.push([
      { content: 'TOTAL PENDAPATAN', styles: { fontStyle: 'bold' as const, textColor: colorBlack } },
      { content: this.formatRupiah(item.total_income), styles: { fontStyle: 'bold' as const, textColor: colorBlack } },
      { content: 'TOTAL POTONGAN', styles: { fontStyle: 'bold' as const, textColor: colorBlack } },
      { content: this.formatRupiah(item.total_deduction), styles: { fontStyle: 'bold' as const, textColor: colorBlack } }
    ]);

    autoTable(doc, {
      startY: startY + 49, theme: 'grid',
      styles: { fontSize: 6.5, cellPadding: 2.5, lineColor: [200, 200, 200], lineWidth: 0.1, textColor: [40, 40, 40] },
      headStyles: { fillColor: [230, 230, 230], textColor: [0, 0, 0], fontStyle: 'bold', halign: 'center', fontSize: 7 },
      columnStyles: { 0: { cellWidth: 56 }, 1: { cellWidth: 38, halign: 'right' }, 2: { cellWidth: 56 }, 3: { cellWidth: 38, halign: 'right' } },
      head: [['PENGHASILAN', '', 'POTONGAN', '']], body: bodyData, margin: { left: 10, right: 10 }, tableWidth: 'auto' 
    });

    let thpY = (doc as any).lastAutoTable.finalY + 3;
    doc.setDrawColor(0, 0, 0); doc.setLineWidth(0.3); doc.rect(10, thpY, 190, 5); 

    doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(0, 0, 0);
    const textTHP = `TAKE HOME PAY: ${this.formatRupiah(item.net_salary)}`;
    doc.text(textTHP, 12, thpY + 3.5);

    doc.setFontSize(6); doc.setFont('helvetica', 'italic');
    const terbilangText = `# ${this.terbilang(item.net_salary)} #`;
    const splitTerbilang = doc.splitTextToSize(terbilangText, 180 - doc.getTextWidth(textTHP) - 10);
    if (splitTerbilang[0]) doc.text(splitTerbilang[0], 198, thpY + 3.5, { align: 'right' });

    let textNotePDF = '-';
    if (item.overtime_pay > 0 || item.overtime_hours > 0) {
        const monthNames = ["", "Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
        
        let currentMonthValue = this.selectedMonth;
        let currentYearValue = this.selectedYear;
        
        let prevMonthValue = currentMonthValue - 1;
        let prevYearValue = currentYearValue;
        
        if (prevMonthValue < 1) {
            prevMonthValue = 12;
            prevYearValue -= 1;
        }

        const prevMonthStr = monthNames[prevMonthValue];
        const currentMonthStr = monthNames[currentMonthValue];
        const tahunLaluTeks = (prevMonthValue === 12) ? ` ${prevYearValue}` : '';

        textNotePDF = `Lembur periode tanggal 21 ${prevMonthStr}${tahunLaluTeks} sampai 20 ${currentMonthStr} ${currentYearValue}`;
    }

    doc.setFontSize(8); doc.setFont('helvetica', 'italic'); doc.setTextColor(0, 0, 0);
    doc.text(`Note : ${textNotePDF}`, 12, thpY + 9);
  }

  // ==========================================
  // DOWNLOAD 1 SLIP (Setengah Halaman)
  // ==========================================
  downloadSlip(slipId: number) {
    const item = this.filteredDataSlip.find(s => s.id === slipId);
    if (!item) return;

    Swal.fire({
      title: 'Menyiapkan Slip...', text: 'Mohon tunggu sebentar', timer: 1000, showConfirmButton: false, didOpen: () => { Swal.showLoading(); }
    }).then(() => {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const bulanLabel = this.months.find(m => m.value === this.selectedMonth)?.label?.toUpperCase() || '';
      
      const img = new Image();
      img.src = 'assets/images/logo.png';

      const renderPDF = (logoObj: HTMLImageElement | null) => {
        this.drawSingleSlip(doc, 8, item, logoObj, bulanLabel, this.selectedYear);

        const safeName = item.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const fileName = `Slip_Gaji_${safeName}_${bulanLabel}_${this.selectedYear}.pdf`;
        doc.save(fileName);

        Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: `Slip ${item.name} berhasil diunduh!`, showConfirmButton: false, timer: 2500 });
      };

      img.onload = () => { renderPDF(img); };     
      img.onerror = () => { renderPDF(null); };   
    });
  }

  // ==========================================
  // DOWNLOAD SEMUA SLIP (2 SLIP PER HALAMAN)
  // ==========================================
  downloadAllSlips() {
    if (this.filteredDataSlip.length === 0) {
      Swal.fire('Peringatan', 'Tidak ada data slip yang bisa diunduh.', 'warning');
      return;
    }

    Swal.fire({
      title: 'Download Semua Slip?',
      html: `<p class="text-sm text-gray-600">Akan mengunduh PDF berisi <b class="text-gray-900">${this.filteredDataSlip.length} slip gaji</b>. (2 Slip / Halaman)</p>`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#1e293b',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Ya, Download PDF!',
      cancelButtonText: 'Batal'
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: 'Menyiapkan PDF...', html: `Mohon tunggu, sedang menyusun...`,
          timer: 2000, showConfirmButton: false, didOpen: () => { Swal.showLoading(); }
        }).then(() => { this.generateCombinedPDF(); });
      }
    });
  }

  generateCombinedPDF() {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const bulanLabel = this.months.find(m => m.value === this.selectedMonth)?.label?.toUpperCase() || '';
    
    const img = new Image();
    img.src = 'assets/images/logo.png';

    const prosesRenderSemua = (logoObj: HTMLImageElement | null) => {
      
      let isFirstPage = true;

      for (let i = 0; i < this.filteredDataSlip.length; i += 2) {
        if (!isFirstPage) doc.addPage();
        isFirstPage = false;

        const item1 = this.filteredDataSlip[i];
        const item2 = this.filteredDataSlip[i + 1];

        this.drawSingleSlip(doc, 8, item1, logoObj, bulanLabel, this.selectedYear);

        if (item2) {
          const cutLineY = 148; 
          doc.setDrawColor(100, 100, 100); doc.setLineWidth(0.2); doc.setLineDashPattern([2, 2], 0); doc.line(20, cutLineY, 190, cutLineY);
          doc.setFontSize(6); doc.setFont('helvetica', 'normal'); doc.setTextColor(150, 150, 150);
          doc.text('- - - - - - - - - - Potong di sini - - - - - - - - - -', 105, cutLineY - 1, { align: 'center' });
          doc.setLineDashPattern([], 0); doc.setTextColor(0, 0, 0);

          this.drawSingleSlip(doc, 154, item2, logoObj, bulanLabel, this.selectedYear);
        }
      }

      const namaFile = `Rekap_Slip_Gaji_${bulanLabel}_${this.selectedYear}.pdf`;
      doc.save(namaFile);
      Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: `Berhasil menggabungkan slip!`, showConfirmButton: false, timer: 3000 });
    };

    img.onload = () => prosesRenderSemua(img);
    img.onerror = () => prosesRenderSemua(null);
  }

  viewAllSlips() {
    Swal.fire('Info', 'Gunakan tabel di halaman ini untuk melihat data secara massal.', 'info');
  }

  getInitials(name: string): string {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
}