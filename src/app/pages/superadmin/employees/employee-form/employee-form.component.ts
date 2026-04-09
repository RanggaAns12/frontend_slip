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

  // 👇 MASTER DATA DEPARTEMEN & POSISI (Sudah Terintegrasi dengan Mapping Baru)
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