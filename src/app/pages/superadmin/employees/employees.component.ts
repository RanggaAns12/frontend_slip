import { Component, OnInit } from '@angular/core';
import { EmployeeApiService } from './services/employee-api.service';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-employees',
  templateUrl: './employees.component.html',
})
export class EmployeesComponent implements OnInit {
  // --- VARIABLES ---
  employees: any[] = [];
  isLoading = false;
  searchKeyword = '';

  // Modal State
  showImportModal = false;
  selectedFile: File | null = null;
  isProcessing = false;

  constructor(private employeeApi: EmployeeApiService) {}

  ngOnInit(): void {
    this.loadEmployees();
  }

  // --- API METHODS ---
  
  loadEmployees() {
    this.isLoading = true;
    this.employeeApi.getAll(this.searchKeyword).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        // Handle jika responsenya dibungkus 'data' atau array langsung
        this.employees = res.data || res; 
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Gagal load data:', err);
      }
    });
  }

  // --- TABLE ACTIONS ---

  viewDetail(emp: any) {
    alert('Fitur Detail untuk: ' + emp.nama_lengkap + '\n(Nanti akan membuka halaman detail)');
  }

  editEmployee(emp: any) {
    alert('Fitur Edit untuk: ' + emp.nama_lengkap + '\n(Nanti akan membuka modal edit gaji)');
  }

  deleteEmployee(emp: any) {
    if (confirm(`Yakin hapus data karyawan ${emp.nama_lengkap}?`)) {
      this.employeeApi.delete(emp.id).subscribe({
        next: () => {
          alert('Data berhasil dihapus');
          this.loadEmployees();
        },
        error: (err) => {
          alert('Gagal menghapus: ' + (err.error?.message || 'Error server'));
        }
      });
    }
  }

  exportData() {
    this.employeeApi.export().subscribe({
      next: (res: any) => {
        console.log('Data Export:', res);
        alert('Data berhasil diambil (Cek Console). Fitur download Excel akan kita pasang nanti.');
      },
      error: (err) => {
        alert('Gagal export data');
      }
    });
  }

  // --- IMPORT MODAL LOGIC ---

  openImportModal() {
    this.showImportModal = true;
  }

  closeImportModal() {
    this.showImportModal = false;
    this.selectedFile = null;
    this.isProcessing = false;
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  uploadFile() {
    if (!this.selectedFile) return;

    this.isProcessing = true;
    const reader = new FileReader();

    reader.onload = (e: any) => {
      try {
        const bstr: string = e.target.result;
        const wb: XLSX.WorkBook = XLSX.read(bstr, { type: 'binary' });
        const wsname: string = wb.SheetNames[0];
        const ws: XLSX.WorkSheet = wb.Sheets[wsname];

        /* 
           SOLUSI HARDCODE INDEX (PALING STABIL)
           Baca sebagai Array of Array (Baris -> Kolom)
           header: 1 artinya kita dapat raw data array mentah [[...], [...]]
        */
        const rawData: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });
        
        console.log('Raw Data Array:', rawData);

        // Hapus 4 Baris Pertama (Judul & Header) -> Data mulai baris ke-5 (Index 4)
        // Baris 0: Judul
        // Baris 1: Kosong/Pabrik
        // Baris 2: Header Utama (No, NIK...)
        // Baris 3: Sub Header (Posisi, Dept...)
        // Baris 4: DATA PERTAMA (Dedi Rianto...)
        const dataRows = rawData.slice(4); 

        const mappedData = dataRows.map((row: any[]) => {
          // Mapping Berdasarkan Urutan Kolom Excel (Index dimulai dari 0 = Kolom A)
          // A=0, B=1, C=2, D=3, E=4, F=5, G=6, H=7, I=8, J=9, K=10, L=11, M=12, N=13, O=14, P=15, Q=16, R=17
          
          return {
            nik_karyawan: row[1] || '',  // Kolom B (NIK Karyawan)
            nik_ktp: row[2] || '',       // Kolom C (NIK KTP)
            
            status_karyawan: row[3] || 'PKWTT', // Kolom D (Status 1)
            
            nama_lengkap: row[4] || '',  // Kolom E (Nama Lengkap)
            
            // Kolom F (Status Lagi? Sepertinya kosong di screenshot atau Status Nikah?)
            // Jika kolom F di screenshot itu "Status" juga, mungkin Status Nikah?
            // Tapi Status Pajak ada di Kolom H (Status Pajak 2026).
            // Kita skip F sementara atau mapping ke status_pernikahan jika ada.
            
            no_rekening: row[6] || '',   // Kolom G (No rek)
            
            status_pajak: row[7] || 'TK/0', // Kolom H (Status Pajak 2026)
            
            // Jabatan (Posisi & Dept)
            posisi: row[8] || '',        // Kolom I (Posisi)
            dept: row[9] || '',          // Kolom J (Dept)
            
            tanggal_diterima: row[10] || '', // Kolom K (Tanggal Diterima)
            tanggal_lahir: row[11] || '',    // Kolom L (Tanggal Lahir)
            
            npwp: row[12] || '',         // Kolom M (NPWP)
            
            bpjs_ketenagakerjaan: row[13] || '', // Kolom N (BPJS Ketenagakerjaan)
            
            pendidikan: row[14] || '',   // Kolom O (Pendidikan)
            agama: row[15] || '',        // Kolom P (Agama)
            jenis_kelamin: row[16] || '',// Kolom Q (Jenis Kelamin)
            alamat: row[17] || '',       // Kolom R (Alamat)
            
            is_active: 1
          };
        });

        // Validasi: Hanya ambil baris yang ada Namanya (menghindari baris kosong di bawah)
        const cleanData = mappedData.filter(d => d.nama_lengkap && d.nik_karyawan);

        console.log('Final Mapped Data (Index):', cleanData);

        if (cleanData.length === 0) {
            alert('Tidak ada data yang terbaca. Cek apakah baris data dimulai dari baris ke-5?');
            this.isProcessing = false;
            return;
        }

        this.employeeApi.import(cleanData).subscribe({
          next: (res: any) => {
            this.isProcessing = false;
            this.closeImportModal();
            this.loadEmployees();
            alert(`Import Berhasil! ${cleanData.length} data tersimpan.`);
          },
          error: (err: any) => {
            this.isProcessing = false;
            console.error(err);
            alert('Gagal Import: ' + (err.error?.message || 'Error Server'));
          }
        });

      } catch (error) {
        this.isProcessing = false;
        console.error(error);
        alert('Gagal membaca file Excel.');
      }
    };
    
    reader.readAsBinaryString(this.selectedFile);
  }

}
