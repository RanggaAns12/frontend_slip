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

  // 🏢 MASTER DATA DEPARTEMEN & POSISI (SINKRON 100% DENGAN EXCEL & SUPERADMIN)
  departemenData = [
    { nama: "Marketing", posisi: ["Marketing Staff", "Export", "Import"] },
    { nama: "Purchasing", posisi: ["Purchasing Staff"] },
    { nama: "Finance & Accounting", posisi: ["Finance Staff", "Accounting Staff"] },
    { nama: "Legal", posisi: ["Legal Staff"] },
    { nama: "Auditor / ISO", posisi: ["Auditor / ISO Staff"] },
    { nama: "PPIC", posisi: ["PPIC Staff"] },
    { nama: "HRD & HSE & Civil", posisi: ["HRD", "HRD Staff", "HSE", "Civil", "Supervisor"] },
    { nama: "Kepala Pabrik", posisi: ["Kepala Pabrik", "Wakil Kepala Pabrik", "Adm Pabrik"] },
    { nama: "Security & Kebersihan", posisi: ["Kepala Regu Security", "Security", "Cleaning Service & Taman"] },
    { nama: "Timbangan, Bahan Baku & Chemical", posisi: ["SPV Timbangan, B. Baku & Chemical", "Ang. Timbangan", "Ang. Bahan Baku", "Ang. Chemical", "Ang. Ballpress"] },
    { nama: "Sparepart, Barang Jadi & Forklift", posisi: ["SPV Sparepart, B. Jadi & Forklift", "Gudang Sparepart", "Op. Forklift B. Baku & B.", "Gudang Barang Jadi"] },
    { nama: "WTP & WWTP", posisi: ["SPV WTP & WWTP", "WTP", "WWTP", "Operator RO"] },
    { nama: "Engineering", posisi: ["Engineering SPV", "Engineer Planner", "IT", "Drafter", "Karu Elektrik", "Instrument"] },
    { nama: "Mekanik", posisi: ["Karu Mekanik", "Mekanik General & Alat Berat", "Fabrikasi", "Oil & Greases"] },
    { nama: "Elektrikal & A/I", posisi: ["Kepala Regu Elektrikal & A/I", "Elektrik Shift", "A/I Shift", "Elektrik Preventif", "A/I Preventif", "Elektrik Repair", "A/I Repair"] },
    { nama: "Boiler & Turbine", posisi: ["Karu Boiler & Turbine", "Boiler & Turbine"] },
    { nama: "PM & Winder", posisi: ["Karu PM & Winder", "PM", "Winder"] },
    { nama: "SP & Starch", posisi: ["Karu SP & Starch", "SP", "Starch", "Operator Pulper"] },
    { nama: "Produksi", posisi: ["Kepala Shift Produksi", "Mekanik Shift", "Operator Wire Press", "Operator Coarse Screen", "Operator Size Press"] },
    { nama: "QC & R&D", posisi: ["SPV QC / R&D", "QC", "R&D"] }
  ];

  deptOptions = this.departemenData.map(d => d.nama);
  posisiOptions: string[] = []; // Akan terisi otomatis oleh fungsi onDeptChange()

  // Opsi Dropdown Standar
  agamaOptions = ['Islam', 'Kristen', 'Katolik', 'Hindu', 'Buddha', 'Konghucu'];
  pendidikanOptions = ['SD', 'SMP', 'SMA', 'SMK', 'D3', 'S1', 'S2'];
  statusKaryawanOptions = ['PKWTT', 'PKWT', 'Harian Lepas', 'Magang', 'Borongan'];
  
  // Opsi Bank & Pajak (Default Bank Mestika sesuai standar)
  bankOptions = ['MESTIKA', 'BCA', 'Mandiri', 'BNI', 'BRI', 'BSI', 'CIMB Niaga', 'Lainnya'];
  statusPajakOptions = ['TK/0', 'TK/1', 'TK/2', 'TK/3', 'K/0', 'K/1', 'K/2', 'K/3'];

  showSuccessModal: boolean = false;
  showErrorModal: boolean = false;
  errorMessage: string = '';
  errorDetails: string[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['employeeData'] && this.isOpen) {
      if (this.employeeData) {
        // STATE: EDIT DATA
        this.isEditMode = true;
        this.formData = { ...this.employeeData };
        
        // Panggil ini agar pilihan dropdown posisi langsung terbuka sesuai dengan departemen karyawan
        this.onDeptChange();
      } else {
        // STATE: TAMBAH DATA BARU
        this.isEditMode = false;
        this.resetForm();
      }
    }
  }

  // 🚀 FUNGSI CASCADING DROPDOWN POSISI
  onDeptChange() {
    const selected = this.departemenData.find(d => d.nama === this.formData.dept);
    this.posisiOptions = selected ? selected.posisi : [];

    // Jika user ganti departemen, dan posisi lamanya nggak ada di departemen baru, kosongkan posisinya!
    if (!this.posisiOptions.includes(this.formData.posisi)) {
      this.formData.posisi = '';
    }
  }

  resetForm() {
    this.formData = {
      nama_lengkap: '', 
      nik_ktp: '', 
      jenis_kelamin: 'Laki-laki',
      tempat_lahir: '', 
      tanggal_lahir: '', 
      agama: 'Islam',
      pendidikan: 'SMA', 
      alamat: '', 
      nik_karyawan: '',
      status_karyawan: 'PKWTT', 
      dept: '', 
      posisi: '',
      tanggal_diterima: '',
      nama_bank: 'MESTIKA', // Default disamakan dengan sistem
      no_rekening: '', 
      pemilik_rekening: '',
      npwp: '', 
      status_pajak: 'TK/0', 
      bpjs_ketenagakerjaan: '',
      is_active: 1
    };
    this.posisiOptions = []; 
  }

  // AUTO-FILL Pemilik Rekening sesuai Nama Lengkap jika diketik
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
    
    // Validasi & fallback default sebelum dilempar ke server
    if (!this.formData.pemilik_rekening) {
      this.formData.pemilik_rekening = this.formData.nama_lengkap;
    }
    
    this.save.emit(this.formData);
    
    // Matikan loading animasi setelah dikirim
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