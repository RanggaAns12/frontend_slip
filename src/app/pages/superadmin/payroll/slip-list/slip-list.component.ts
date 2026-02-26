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
  total_income: number;
  total_deduction: number;
  net_salary: number;
  status: string;
  
  // Penambahan atribut potongan spesifik dari backend terbaru
  bpjs_kesehatan?: number;
  bpjs_ketenagakerjaan?: number;
  pph21_deduction?: number;
  absence_deduction?: number;
  other_deduction?: number;
  
  total_present?: number;
  total_absent?: number;
  total_late?: number;
  employee?: any; // Untuk mapping dari backend
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
    
    this.payrollApiService.getPayslips(this.selectedMonth, this.selectedYear).subscribe({
      next: (res: any) => {
        if (res.status === 'not_found' || !res.data) {
          Swal.fire('Info', res.message || 'Data tidak ditemukan.', 'info');
          this.allDataSlip = [];
          this.filteredDataSlip = [];
          this.isLoading = false;
          return;
        }

        // ===== MAPPING DATA (Update NIK_KTP, Dept, Posisi) =====
        this.allDataSlip = (res.data || []).map((item: any) => {
          const emp = item.employee || {};
          
          const deptVal = emp.department?.name || emp.department || item.department || '-';
          const posVal = emp.position?.name || emp.position || item.position || '-';
          const nikVal = emp.nik_ktp || emp.nik || item.nik || '-';
          const nameVal = emp.name || item.name || '-';

          return {
            ...item,
            name: nameVal,
            nik: nikVal,
            department: deptVal,
            position: posVal
          };
        });

        this.periodLabel = res.period?.label || '';
        
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

  terbilang(angka: number): string {
    const huruf = ["", "Satu", "Dua", "Tiga", "Empat", "Lima", "Enam", "Tujuh", "Delapan", "Sembilan", "Sepuluh", "Sebelas"];
    
    const baca = (n: number): string => {
      let hasil = "";
      if (n < 12) {
          hasil = " " + huruf[n];
      } else if (n < 20) {
          hasil = baca(n - 10) + " Belas";
      } else if (n < 100) {
          hasil = baca(Math.floor(n / 10)) + " Puluh" + baca(n % 10);
      } else if (n < 200) {
          hasil = " Seratus" + baca(n - 100);
      } else if (n < 1000) {
          hasil = baca(Math.floor(n / 100)) + " Ratus" + baca(n % 100);
      } else if (n < 2000) {
          hasil = " Seribu" + baca(n - 1000);
      } else if (n < 1000000) {
          hasil = baca(Math.floor(n / 1000)) + " Ribu" + baca(n % 1000);
      } else if (n < 1000000000) {
          hasil = baca(Math.floor(n / 1000000)) + " Juta" + baca(n % 1000000);
      } else if (n < 1000000000000) {
          hasil = baca(Math.floor(n / 1000000000)) + " Miliar" + baca(n % 1000000000);
      } else if (n < 1000000000000000) {
          hasil = baca(Math.floor(n / 1000000000000)) + " Triliun" + baca(n % 1000000000000);
      }
      return hasil;
    };

    if (angka === 0) return "Nol Rupiah";
    return baca(angka).trim() + " Rupiah";
  }

  formatRupiah(value: number): string {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value)
      .replace('Rp', 'Rp ')
      .replace(',00', '');
  }

  downloadSlip(slipId: number) {
    const item = this.filteredDataSlip.find(s => s.id === slipId);
    if (!item) return;

    Swal.fire({
      title: 'Menyiapkan Slip...',
      text: 'Mohon tunggu sebentar',
      timer: 1000,
      showConfirmButton: false,
      didOpen: () => { Swal.showLoading(); }
    }).then(() => {
      
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const bulanLabel = this.months.find(m => m.value === this.selectedMonth)?.label?.toUpperCase() || '';
      const tahunLabel = this.selectedYear;
      
      const hariKerja = item.total_present !== undefined ? item.total_present : 26;
      let alphaLainnya = (item.total_absent || 0) + (item.total_late || 0);
      
      // ✅ PERBAIKAN: Ambil langsung dari object item (database Laravel)
      let pph21Value = Number(item.pph21_deduction) || 0;
      let bpjsKesValue = Number(item.bpjs_kesehatan) || 0;
      let bpjsTkValue = Number(item.bpjs_ketenagakerjaan) || 0;
      let alpaValue = Number(item.absence_deduction) || 0;
      
      // Hitung "Potongan Lainnya" dengan mengurangi total dengan variabel spesifik
      let otherValue = Number(item.total_deduction || 0) - (pph21Value + bpjsKesValue + bpjsTkValue + alpaValue);
      if (otherValue < 0) otherValue = 0;

      const logoUrl = 'assets/images/logo.png'; 
      const img = new Image();
      img.src = logoUrl;

      const renderPDF = (logoObj: HTMLImageElement | null) => {
        
        const drawSlipSection = (startY: number, isArsipPerusahaan: boolean) => {
          
          if (logoObj) {
             doc.addImage(logoObj, 'PNG', 12, startY - 2, 12, 12);
          }

          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(0, 0, 0); 
          const textX = logoObj ? 28 : 15;
          doc.text('PT. AGRO DELI SERDANG', textX, startY + 3);
          
          doc.setFontSize(7);
          doc.setFont('helvetica', 'normal');
          doc.text('Dusun VII Desa/Kelurahan Dalu Sepuluh-A, 20362.', textX, startY + 6);
          doc.text('Kecamatan Tanjung Morawa. North Sumatera, Indonesia', textX, startY + 9);

          doc.setFontSize(7);
          doc.setFont('helvetica', 'italic');
          doc.setTextColor(120, 120, 120); 
          doc.text(isArsipPerusahaan ? 'ARSIP PERUSAHAAN' : 'ARSIP KARYAWAN', 195, startY + 3, { align: 'right' });
          
          doc.setLineWidth(0.5);
          doc.setDrawColor(0, 0, 0);
          doc.line(10, startY + 13, 200, startY + 13); 
          
          doc.setTextColor(0, 0, 0); 
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.text('SLIP GAJI KARYAWAN', 105, startY + 19, { align: 'center' });
          
          doc.setFontSize(8);
          doc.setFont('helvetica', 'normal');
          doc.text(`PERIODE: ${bulanLabel} ${tahunLabel}`, 105, startY + 23, { align: 'center' });

          doc.setFontSize(7);
          doc.text('NIK', 12, startY + 30);             doc.text(`: ${item.nik}`, 28, startY + 30);
          doc.text('Nama', 12, startY + 34);            doc.text(`: ${item.name}`, 28, startY + 34);
          doc.text('Jabatan', 12, startY + 38);         doc.text(`: ${item.position}`, 28, startY + 38);
          doc.text('Departemen', 12, startY + 42);      doc.text(`: ${item.department}`, 28, startY + 42);

          doc.text('DETAIL KEHADIRAN', 115, startY + 30);
          doc.line(115, startY + 31, 150, startY + 31);

          doc.text('Hari Kerja Efektif', 115, startY + 35);   
          doc.text(`: ${hariKerja} Hari`, 150, startY + 35);
          
          doc.text('Tidak Hadir (Alpa)', 115, startY + 38);   
          doc.text(`: ${item.total_absent || 0} Hari`, 150, startY + 38);
          
          doc.text('Total Lembur', 115, startY + 41);         
          doc.text(`: ${item.overtime_hours} Point`, 150, startY + 41);

          const arrPenghasilan = [
            { desc: 'Gaji Pokok', val: this.formatRupiah(item.base_salary) },
            { desc: `Upah Lembur (${item.overtime_hours} Point)`, val: this.formatRupiah(item.overtime_pay) }
          ];

          // ✅ Penambahan nilai BPJS yang sesuai dari database
          const arrPotongan = [
            { desc: 'Potongan PPh21', val: this.formatRupiah(pph21Value) },
            { desc: 'Potongan BPJS Kesehatan', val: this.formatRupiah(bpjsKesValue) },
            { desc: 'Potongan BPJS Ketenagakerjaan', val: this.formatRupiah(bpjsTkValue) },
            { desc: `Potongan Alpa (${alphaLainnya} hari)`, val: this.formatRupiah(alpaValue) }
          ];
          
          if (otherValue > 0) {
              arrPotongan.push({ desc: 'Potongan Lainnya', val: this.formatRupiah(otherValue) });
          }

          const maxRows = Math.max(arrPenghasilan.length, arrPotongan.length);
          const bodyData: any[] = [];

          for (let i = 0; i < maxRows; i++) {
            const kiriDesc = arrPenghasilan[i] ? arrPenghasilan[i].desc : '';
            const kiriVal = arrPenghasilan[i] ? arrPenghasilan[i].val : '';
            const kananDesc = arrPotongan[i] ? arrPotongan[i].desc : '';
            const kananVal = arrPotongan[i] ? arrPotongan[i].val : '';
            
            bodyData.push([kiriDesc, kiriVal, kananDesc, kananVal]);
          }

          bodyData.push([
            { content: 'TOTAL PENDAPATAN', styles: { fontStyle: 'bold' as 'bold', textColor: [0,0,0] } },
            { content: this.formatRupiah(item.total_income), styles: { fontStyle: 'bold' as 'bold', textColor: [0,0,0] } },
            { content: 'TOTAL POTONGAN', styles: { fontStyle: 'bold' as 'bold', textColor: [0,0,0] } },
            { content: this.formatRupiah(item.total_deduction), styles: { fontStyle: 'bold' as 'bold', textColor: [0,0,0] } }
          ]);

          autoTable(doc, {
            startY: startY + 46,
            theme: 'grid',
            styles: { 
              fontSize: 6.5, 
              cellPadding: 2.5,
              lineColor: [200, 200, 200], 
              lineWidth: 0.1,
              textColor: [40, 40, 40]
            },
            headStyles: { 
              fillColor: [230, 230, 230], 
              textColor: [0, 0, 0], 
              fontStyle: 'bold', 
              halign: 'center',
              fontSize: 7
            },
            columnStyles: {
              0: { cellWidth: 56 }, 
              1: { cellWidth: 38, halign: 'right' }, 
              2: { cellWidth: 56 }, 
              3: { cellWidth: 38, halign: 'right' }  
            },
            head: [
              ['PENGHASILAN', '', 'POTONGAN', '']
            ],
            body: bodyData,
            margin: { left: 10, right: 10 },
            tableWidth: 'auto' 
          });

          let thpY = (doc as any).lastAutoTable.finalY + 3;
          
          doc.setDrawColor(0, 0, 0);
          doc.setLineWidth(0.3);
          doc.rect(10, thpY, 190, 5); 

          doc.setFontSize(8);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(0, 0, 0);
          const textTHP = `TAKE HOME PAY: ${this.formatRupiah(item.net_salary)}`;
          doc.text(textTHP, 12, thpY + 3.5);

          doc.setFontSize(6);
          doc.setFont('helvetica', 'italic');
          
          const terbilangText = `# ${this.terbilang(item.net_salary)} #`;
          const maxTerbilangWidth = 180 - doc.getTextWidth(textTHP) - 10; 
          const splitTerbilang = doc.splitTextToSize(terbilangText, maxTerbilangWidth);
          if (splitTerbilang[0]) {
            doc.text(splitTerbilang[0], 198, thpY + 3.5, { align: 'right' });
          }

          let sigY = thpY + 12;
          
          doc.setFontSize(7);
          doc.setFont('helvetica', 'normal');
          
          const tglCetak = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
          doc.text(`Deli Serdang, ${tglCetak}`, 160, sigY, { align: 'center' });
          doc.text('Bendahara', 160, sigY + 4, { align: 'center' });
          doc.text('( ............................... )', 160, sigY + 22, { align: 'center' });
          
          doc.text('Penerima', 45, sigY + 4, { align: 'center' });
          doc.setFont('helvetica', 'bold');
          doc.text(`( ${item.name} )`, 45, sigY + 22, { align: 'center' });
        };

        drawSlipSection(8, true);

        const cutLineY = 148; 
        doc.setDrawColor(100, 100, 100);
        doc.setLineWidth(0.2);
        doc.setLineDashPattern([2, 2], 0); 
        doc.line(20, cutLineY, 190, cutLineY);
        
        doc.setFontSize(6);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(150, 150, 150);
        doc.text('- - - - - - - - - - Potong di sini - - - - - - - - - -', 105, cutLineY - 1, { align: 'center' });
        doc.setLineDashPattern([], 0); 
        doc.setTextColor(0, 0, 0);

        drawSlipSection(cutLineY + 6, false);

        const safeName = item.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const fileName = `Slip_Gaji_${safeName}_${bulanLabel}_${tahunLabel}.pdf`;
        doc.save(fileName);

        Swal.fire({
          toast: true, position: 'top-end', icon: 'success',
          title: `Slip ${item.name} berhasil diunduh!`,
          showConfirmButton: false, timer: 2500
        });
      };

      img.onload = () => { renderPDF(img); };     
      img.onerror = () => { renderPDF(null); };   
      
    });
  }

  viewSlip(slipId: number) {
    const item = this.filteredDataSlip.find(s => s.id === slipId);
    if (!item) return;
    Swal.fire({
      title: `Slip Gaji - ${item.name}`,
      html: `
        <div class="text-left space-y-2 text-sm">
          <p><strong>NIK:</strong> ${item.nik}</p>
          <p><strong>Departemen:</strong> ${item.department}</p>
          <p><strong>Posisi:</strong> ${item.position}</p>
          <p><strong>Gaji Pokok:</strong> ${this.formatRupiah(item.base_salary)}</p>
          <p><strong>Lembur:</strong> ${this.formatRupiah(item.overtime_pay)} (${item.overtime_hours} Point)</p>
          <p><strong>Potongan:</strong> ${this.formatRupiah(item.total_deduction)}</p>
          <hr class="my-3">
          <p class="text-base"><strong>Take Home Pay:</strong> <span class="text-orange-600 font-bold">${this.formatRupiah(item.net_salary)}</span></p>
        </div>
      `,
      confirmButtonColor: '#ea580c',
      confirmButtonText: 'Tutup'
    });
  }

  downloadAllSlips() {
    if (this.filteredDataSlip.length === 0) {
      Swal.fire('Info', 'Tidak ada data untuk diunduh.', 'info');
      return;
    }
    Swal.fire({
      title: 'Download Semua Slip?',
      text: `${this.filteredDataSlip.length} slip gaji akan diunduh secara berurutan.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#ea580c',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Ya, Download Semua',
      cancelButtonText: 'Batal'
    }).then((result: any) => {
      if (result.isConfirmed) {
        this.filteredDataSlip.forEach((item, index) => {
          setTimeout(() => { this.downloadSlip(item.id); }, index * 1000); 
        });
        Swal.fire({
          icon: 'success', title: 'Proses Dimulai!',
          text: 'Semua slip sedang diunduh satu per satu.',
          confirmButtonColor: '#ea580c'
        });
      }
    });
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
