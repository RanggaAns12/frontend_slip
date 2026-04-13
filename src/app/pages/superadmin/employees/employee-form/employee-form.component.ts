import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { EmployeeApiService } from '../services/employee-api.service';

@Component({
  selector: 'app-employee-form',
  templateUrl: './employee-form.component.html',
  styles: [`
    .animate-slide-up { animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1); }
    .animate-pop-in { animation: popIn 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
    @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    @keyframes popIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
    
    .input-field { @apply w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none transition-all duration-200; }
    .input-field:focus { @apply bg-white border-orange-400 ring-4 ring-orange-50; }
    .label-text { @apply block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1; }
  `]
})
export class EmployeeFormComponent implements OnInit {

  isEditMode = false;
  employeeId: number | null = null;
  isLoading = false;
  isSubmitting = false;

  // === STATE MODAL NOTIFIKASI ===
  showSuccessModal = false;
  showErrorModal = false;
  errorMessage = '';
  errorDetails: string[] = []; // Untuk list error validasi

  formData: any = {
    nama_lengkap: '', nik_ktp: '', tempat_lahir: '', tanggal_lahir: '',
    jenis_kelamin: 'Laki-laki', agama: 'Islam', pendidikan: 'SMA', alamat: '',
    nik_karyawan: '', status_karyawan: 'PKWTT', dept: '', posisi: '', tanggal_diterima: '',
    nama_bank: 'MESTIKA', no_rekening: '', pemilik_rekening: '', npwp: '',
    status_pajak: 'TK/0', bpjs_ketenagakerjaan: ''
  };

  // 👇 MASTER DATA DEPARTEMEN & POSISI (Sudah Terintegrasi)
  departemenData = [
    { nama: "Marketing", posisi: ["Marketing Staff", "Export", "Import"] },
    { nama: "Purchasing", posisi: ["Purchasing Staff"] },
    { nama: "Finance & Accounting", posisi: ["Finance Staff", "Accounting Staff"] },
    { nama: "Legal", posisi: ["Legal Staff"] },
    { nama: "Auditor / ISO", posisi: ["Auditor / ISO Staff"] },
    { nama: "PPIC", posisi: ["PPIC Staff"] },
    { nama: "HRD & HSE & Civil", posisi: ["HRD","HRD Staff", "HSE", "Civil", "Supervisor"] },
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
    { nama: "QC & R&D", posisi: ["SPV QC / R&D", "QC", "R&D"] },
    { nama: "Umum", posisi: ["Driver"] }
  ];

  deptOptions = this.departemenData.map(d => d.nama);
  posisiOptions: string[] = []; // Dikosongkan agar otomatis menyesuaikan dept

  agamaOptions = ['Islam', 'Kristen', 'Katolik', 'Hindu', 'Buddha'];
  pendidikanOptions = ['SD', 'SMP', 'SMA', 'SMK', 'D3', 'S1', 'S2'];
  statusKaryawanOptions = ['PKWTT', 'PKWT', 'Harian Lepas', 'Magang'];
  statusPajakOptions = ['TK/0', 'TK/1', 'TK/2', 'TK/3', 'K/0', 'K/1', 'K/2', 'K/3'];
  bankOptions = ['MESTIKA'];

  constructor(
    private employeeApi: EmployeeApiService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.isEditMode = true;
        this.employeeId = +id;
        this.loadEmployeeData(this.employeeId);
      }
    });
  }

  loadEmployeeData(id: number) {
    this.isLoading = true;
    this.employeeApi.getById(id).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        const rawData = res.data;
        this.formData = {
            ...this.formData, ...rawData,
            no_rekening: rawData.no_rekening || '',
            pemilik_rekening: rawData.pemilik_rekening || '',
            nik_ktp: rawData.nik_ktp || '',
            npwp: rawData.npwp || '',
            bpjs_ketenagakerjaan: rawData.bpjs_ketenagakerjaan || '',
            nama_bank: rawData.nama_bank || 'MESTIKA',
            status_pajak: rawData.status_pajak || 'TK/0',
            agama: rawData.agama || 'Islam',
            jenis_kelamin: rawData.jenis_kelamin || 'Laki-laki'
        };

        // 👇 Panggil fungsi ini untuk mengisi dropdown Posisi saat Edit Data
        this.onDeptChange();
      },
      error: () => {
        this.isLoading = false;
        this.goBack();
      }
    });
  }

  // 👇 Event Cascading Dropdown (Dipanggil dari HTML saat Departemen diganti)
  onDeptChange() {
    const selected = this.departemenData.find(d => d.nama === this.formData.dept);
    this.posisiOptions = selected ? selected.posisi : [];

    // Jika posisi yang sebelumnya dipilih ternyata tidak ada di departemen yang baru, kosongkan posisinya
    if (!this.posisiOptions.includes(this.formData.posisi)) {
      this.formData.posisi = '';
    }
  }

  onNameChange() {
    if (!this.formData.pemilik_rekening) this.formData.pemilik_rekening = this.formData.nama_lengkap;
  }

  onSubmit() {
    this.isSubmitting = true;
    this.errorDetails = []; // Reset error

    const payload = { ...this.formData };
    if (!payload.pemilik_rekening || payload.pemilik_rekening.trim() === '') payload.pemilik_rekening = payload.nama_lengkap;
    if (!payload.no_rekening) payload.no_rekening = '';

    const request = this.isEditMode && this.employeeId 
      ? this.employeeApi.update(this.employeeId, payload)
      : this.employeeApi.create(payload);

    request.subscribe({
      next: () => {
        this.isSubmitting = false;
        this.showSuccessModal = true;
      },
      error: (err) => {
        this.isSubmitting = false;
        this.errorMessage = 'Gagal menyimpan data.';
        
        if (err.error && err.error.errors) {
            this.errorMessage = err.error.message || 'Validasi Gagal';
            this.errorDetails = Object.values(err.error.errors).flat() as string[];
        } else if (err.error && err.error.message) {
            this.errorMessage = err.error.message;
        }

        this.showErrorModal = true;
      }
    });
  }

  closeSuccessModal() {
    this.showSuccessModal = false;
    this.goBack();
  }

  closeErrorModal() {
    this.showErrorModal = false;
  }

  goBack() {
    this.router.navigate(['/superadmin/employees']);
  }
}