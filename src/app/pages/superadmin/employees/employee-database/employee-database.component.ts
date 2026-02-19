import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { EmployeeApiService } from '../services/employee-api.service';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-employee-database',
  templateUrl: './employee-database.component.html',
  styleUrls: [], 
  // 🔥 RAHASIA NGEBUT: Matikan auto-check Angular yang bikin berat
  changeDetection: ChangeDetectionStrategy.OnPush 
})
export class EmployeeDatabaseComponent implements OnInit {

  employees: any[] = [];
  isLoading = false;
  searchKeyword = '';

  constructor(
    private employeeApi: EmployeeApiService, 
    private router: Router,
    private cdr: ChangeDetectorRef // Inject ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadAllData();
  }

  loadAllData() {
    this.isLoading = true;
    this.cdr.markForCheck(); // Update UI Loading

    // Panggil API
    this.employeeApi.getAll(this.searchKeyword).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        
        // Handling Format Response (Array langsung atau Wrapper)
        if (Array.isArray(res)) {
            this.employees = res;
        } else if (res.data && Array.isArray(res.data)) {
            this.employees = res.data;
        } else if (res.employees && Array.isArray(res.employees)) {
            this.employees = res.employees;
        } else {
            this.employees = [];
        }

        // 🔥 PAKSA UPDATE UI SETELAH DATA MASUK
        this.cdr.markForCheck(); 
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Error load data:', err);
        this.cdr.markForCheck();
      }
    });
  }

  // Optimasi Rendering List Panjang
  trackByFn(index: number, item: any): number {
    return item.id; 
  }

  goBack() {
    this.router.navigate(['/superadmin/employees']);
  }

  // === EXPORT EXCEL SESUAI TABEL ===
  downloadExcel() {
    if (this.employees.length === 0) {
      alert('Tidak ada data untuk didownload.');
      return;
    }

    // 1. Mapping Data agar Kolom Sesuai Tampilan Tabel HTML
    const exportData = this.employees.map((emp, index) => ({
      'No.': index + 1,
      'NIK Karyawan': emp.nik_karyawan,
      'NIK KTP': emp.nik_ktp,
      'Status Karyawan': emp.status_karyawan,
      'Nama Lengkap': emp.nama_lengkap,
      'Status': '-', // Kolom kosong/duplikat sesuai gambar
      'No Rekening': emp.no_rekening,
      'Status Pajak 2026': emp.status_pajak,
      'Posisi': emp.posisi,      // Group Jabatan
      'Departemen': emp.dept,    // Group Jabatan
      'Tanggal Diterima': emp.tanggal_diterima,
      'Tanggal Lahir': emp.tanggal_lahir,
      'NPWP': emp.npwp,
      'BPJS Ketenagakerjaan': emp.bpjs_ketenagakerjaan,
      'Pendidikan': emp.pendidikan,
      'Agama': emp.agama,
      'Jenis Kelamin': emp.jenis_kelamin,
      'Alamat': emp.alamat
    }));

    // 2. Buat Worksheet
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportData);
    
    // 3. Atur Lebar Kolom (Auto Width ala Excel)
    const colWidths = [
      { wch: 5 },  // No
      { wch: 20 }, // NIK Karyawan
      { wch: 20 }, // NIK KTP
      { wch: 10 }, // Status Karyawan
      { wch: 30 }, // Nama
      { wch: 8 },  // Status (-)
      { wch: 15 }, // Rekening
      { wch: 10 }, // Pajak
      { wch: 25 }, // Posisi
      { wch: 15 }, // Dept
      { wch: 18 }, // Tgl Terima
      { wch: 18 }, // Tgl Lahir
      { wch: 20 }, // NPWP
      { wch: 15 }, // BPJS
      { wch: 10 }, // Pendidikan
      { wch: 10 }, // Agama
      { wch: 12 }, // Gender
      { wch: 50 }  // Alamat
    ];
    ws['!cols'] = colWidths;

    // 4. Buat Workbook & Download
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Database Master");
    
    // Nama file unik dengan tanggal
    const fileName = `Database_Karyawan_Agro_${new Date().toISOString().slice(0,10)}.xlsx`;
    XLSX.writeFile(wb, fileName);
  }
}
