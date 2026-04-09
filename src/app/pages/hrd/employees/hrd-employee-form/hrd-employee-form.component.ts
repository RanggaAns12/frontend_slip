import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';

@Component({
  selector: 'app-hrd-employee-form',
  standalone: false,
  templateUrl: './hrd-employee-form.component.html',
  styleUrls: ['./hrd-employee-form.component.scss']
})
export class HrdEmployeeFormComponent implements OnChanges {
  @Input() isOpen: boolean = false;
  @Input() employeeData: any = null;
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<any>();

  isEditMode: boolean = false;
  isLoading: boolean = false;
  isSubmitting: boolean = false;

  formData: any = {};

  // 👇 MASTER DATA DEPARTEMEN & POSISI (Sesuai Mapping Terbaru)
  departemenData = [
    { 
      nama: "Engineering", 
      posisi: ["Supervisor", "Karu Mekanik", "Karu Elektrik", "Elektrik Preventif Repair", "Drafter", "Mekanik", "Instrument", "Electrical", "Admin Engineering"] 
    },
    { 
      nama: "Produksi", 
      posisi: ["Supervisor", "Shift Leader PM", "Shift Leader SP", "Karu Rewinder", "Boiler", "Op. Boiler", "Operator", "Operator Alat Berat", "Operator Dryer", "Operator Wire Press", "Operator DCS PM", "Operator Size Press", "Operator Coarse Screen", "Operator SCS SP", "Operator Pulper"] 
    },
    { 
      nama: "WTP/WWTP", 
      posisi: ["SPV", "Karu WWTP", "Operator RO", "Operator WWTP", "Kebersihan", "Anggota"] 
    },
    { 
      nama: "Logistik", 
      posisi: ["Supervisor", "Admin", "Anggota"] 
    },
    { 
      nama: "HRD", 
      posisi: ["Supervisor", "Staff"] 
    },
    { 
      nama: "QC/R&D", 
      posisi: ["Supervisor", "QC"] 
    },
    { 
      nama: "UMUM", 
      posisi: ["Kebersihan", "Supir", "Driver", "Office Boy", "Office Girl", "Gardener"] 
    },
    { nama: "Security", posisi: ["Danru"] },
    { nama: "CIVIL", posisi: ["CIVIL"] },
    { nama: "Fabrikasi", posisi: ["Engineering"] },
    { nama: "Bahan Baku", posisi: ["SPV"] },
    { nama: "HSE", posisi: ["HSE"] },
    { nama: "IT", posisi: ["IT"] },
    { nama: "Purchasing", posisi: [] },
    { nama: "Finance", posisi: [] },
    { nama: "Accounting", posisi: [] }
  ];

  deptOptions = this.departemenData.map(d => d.nama);
  posisiOptions: string[] = []; // Akan terisi otomatis oleh fungsi onDeptChange()

  agamaOptions = ['Islam', 'Kristen Protestan', 'Katolik', 'Hindu', 'Buddha', 'Konghucu'];
  pendidikanOptions = ['SD', 'SMP', 'SMA/SMK', 'D3', 'S1', 'S2', 'S3'];
  statusKaryawanOptions = ['PKWTT (Tetap)', 'PKWT (Kontrak)', 'Harian', 'Magang'];
  
  // DIKEMBALIKAN: Opsi Bank & Pajak
  bankOptions = ['BCA', 'Mandiri', 'BNI', 'BRI', 'BSI', 'CIMB Niaga', 'Lainnya'];
  statusPajakOptions = ['TK/0', 'TK/1', 'TK/2', 'TK/3', 'K/0', 'K/1', 'K/2', 'K/3'];

  showSuccessModal: boolean = false;
  showErrorModal: boolean = false;
  errorMessage: string = '';
  errorDetails: string[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['employeeData'] && this.isOpen) {
      if (this.employeeData) {
        this.isEditMode = true;
        this.formData = { ...this.employeeData };
        
        // 👇 Panggil saat Edit agar pilihan dropdown posisi terbuka sesuai dengan departemen karyawan
        this.onDeptChange();
      } else {
        this.isEditMode = false;
        this.resetForm();
      }
    }
  }

  // 👇 Fungsi untuk Cascading Dropdown Posisi
  onDeptChange() {
    const selected = this.departemenData.find(d => d.nama === this.formData.dept);
    this.posisiOptions = selected ? selected.posisi : [];

    // Jika posisi sebelumnya tidak ada di departemen yang baru dipilih, kosongkan posisinya
    if (!this.posisiOptions.includes(this.formData.posisi)) {
      this.formData.posisi = '';
    }
  }

  resetForm() {
    this.formData = {
      nama_lengkap: '', nik_ktp: '', jenis_kelamin: 'Laki-laki',
      tempat_lahir: '', tanggal_lahir: '', agama: 'Islam',
      pendidikan: 'SMA/SMK', alamat: '', nik_karyawan: '',
      status_karyawan: 'PKWTT (Tetap)', dept: '', posisi: '',
      tanggal_diterima: '',
      // DIKEMBALIKAN: Inisiasi data Bank & Pajak
      nama_bank: 'BCA', no_rekening: '', pemilik_rekening: '',
      npwp: '', status_pajak: 'TK/0', bpjs_ketenagakerjaan: ''
    };
    this.posisiOptions = []; // Kosongkan posisi saat form direset
  }

  // DIKEMBALIKAN: Autofill Pemilik Rekening
  onNameChange() {
    if (this.formData.nama_lengkap) {
      this.formData.pemilik_rekening = this.formData.nama_lengkap.toUpperCase();
    }
  }

  goBack() {
    this.close.emit();
  }

  onSubmit() {
    this.isSubmitting = true;
    this.save.emit(this.formData);
    setTimeout(() => {
      this.isSubmitting = false;
    }, 1000);
  }

  closeSuccessModal() {
    this.showSuccessModal = false;
    this.close.emit();
  }

  closeErrorModal() {
    this.showErrorModal = false;
  }
}