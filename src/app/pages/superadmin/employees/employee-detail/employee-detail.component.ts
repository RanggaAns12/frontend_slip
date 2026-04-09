import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { EmployeeApiService } from '../services/employee-api.service';

@Component({
  selector: 'app-employee-detail',
  templateUrl: './employee-detail.component.html',
  styles: [`
    /* Animasi Halus */
    .animate-slide-up { animation: slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1); }
    .animate-scale-in { animation: scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
    .animate-fade-in { animation: fadeIn 0.3s ease-out; }
    
    @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    @keyframes scaleIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

    .hide-scrollbar::-webkit-scrollbar { display: none; }
    .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
    
    /* Input Style di Modal */
    .modal-input {
      @apply w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none transition-all;
    }
    .modal-input:focus {
      @apply bg-white border-orange-400 ring-2 ring-orange-100;
    }
    .modal-label {
      @apply block text-xs font-bold text-gray-500 mb-1 ml-1;
    }
  `]
})
export class EmployeeDetailComponent implements OnInit {

  employeeId: number | null = null;
  employee: any = null;
  isLoading = true;
  errorMessage = '';

  activeTab: 'overview' | 'personal' | 'payroll' = 'overview';
  
  showEditModal = false;
  showDeleteModal = false;
  isProcessing = false;

  editData: any = {};
  
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';
  toastTimeout: any;

  // 👇 MASTER DATA DEPARTEMEN & POSISI (Sesuai Format Baku Terbaru)
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
      nama: "Umum", // Format baku
      posisi: ["Kebersihan", "Supir", "Driver", "Office Boy", "Office Girl", "Gardener"] 
    },
    { nama: "Security", posisi: ["Danru"] },
    { nama: "Civil", posisi: ["Civil"] }, // Format baku
    { nama: "Fabrikasi", posisi: ["Engineering"] },
    { nama: "Bahan Baku", posisi: ["SPV"] },
    { nama: "HSE", posisi: ["HSE"] },
    { nama: "IT", posisi: ["IT"] },
    { nama: "Purchasing", posisi: [] },
    { nama: "Finance", posisi: [] },
    { nama: "Accounting", posisi: [] }
  ];

  deptOptions = this.departemenData.map(d => d.nama);
  posisiOptions: string[] = []; // Dikosongkan, diisi dinamis oleh fungsi onDeptChange()

  statusKaryawanOptions = ['PKWTT', 'PKWT', 'Harian Lepas', 'Magang'];
  agamaOptions = ['Islam', 'Kristen', 'Katolik', 'Hindu', 'Buddha'];
  pendidikanOptions = ['SD', 'SMP', 'SMA', 'SMK', 'D3', 'S1', 'S2'];
  statusPajakOptions = ['TK/0', 'TK/1', 'TK/2', 'TK/3', 'K/0', 'K/1', 'K/2', 'K/3'];
  bankOptions = ['MESTIKA'];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private employeeApi: EmployeeApiService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const idString = params.get('id');
      if (idString && !isNaN(Number(idString))) {
        this.employeeId = Number(idString);
        this.loadEmployeeDetail(this.employeeId);
      } else {
        this.isLoading = false;
        this.errorMessage = 'ID Karyawan tidak valid.';
      }
    });
  }

  loadEmployeeDetail(id: number) {
    this.isLoading = true;
    this.employeeApi.getById(id).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        this.employee = res.data;
        this.editData = { ...res.data };
      },
      error: () => {
        this.isLoading = false;
        this.errorMessage = 'Data tidak ditemukan.';
      }
    });
  }

  // === ACTIONS ===
  setTab(tab: any) { this.activeTab = tab; }

  openEditModal() {
    this.editData = { ...this.employee }; // Reset form dengan data terbaru
    this.onDeptChange(); // 👇 Panggil fungsi ini agar pilihan posisi langsung ter-load sesuai departemen
    this.showEditModal = true;
  }
  
  closeEditModal() { this.showEditModal = false; }

  // 👇 Event Cascading Dropdown (Dipanggil dari HTML Modal Edit saat Departemen diganti)
  onDeptChange() {
    const selected = this.departemenData.find(d => d.nama === this.editData.dept);
    this.posisiOptions = selected ? selected.posisi : [];

    // Jika posisi yang sebelumnya dipilih ternyata tidak ada di departemen yang baru, kosongkan posisinya
    if (!this.posisiOptions.includes(this.editData.posisi)) {
      this.editData.posisi = '';
    }
  }

  updateEmployee() {
    if (!this.employeeId) return;
    this.isProcessing = true;

    // VALIDASI MANUAL SEBELUM KIRIM
    if (!this.editData.pemilik_rekening) {
        this.editData.pemilik_rekening = this.editData.nama_lengkap; 
    }
    if (!this.editData.no_rekening) {
        this.editData.no_rekening = '';
    }
    if (!this.editData.nama_bank) {
        this.editData.nama_bank = 'MESTIKA'; // Sesuai standar bank perusahaan
    }

    this.employeeApi.update(this.employeeId, this.editData).subscribe({
      next: (res: any) => {
        this.isProcessing = false;
        this.employee = res.data; 
        this.closeEditModal();
        this.showToast('Data berhasil diperbarui!', 'success');
      },
      error: (err) => {
        this.isProcessing = false;
        console.error('Error Update:', err);
        if (err.error?.errors) {
            const firstError = Object.values(err.error.errors)[0];
            this.showToast(`Gagal: ${firstError}`, 'error');
        } else {
            this.showToast('Gagal update data. Periksa inputan Form.', 'error');
        }
      }
    });
  }

  openDeleteModal() { this.showDeleteModal = true; }
  closeDeleteModal() { this.showDeleteModal = false; }

  deleteEmployee() {
    if (!this.employeeId) return;
    this.isProcessing = true;
    this.employeeApi.delete(this.employeeId).subscribe({
      next: () => {
        this.showToast('Karyawan dihapus.', 'success');
        setTimeout(() => this.router.navigate(['/superadmin/employees']), 1000);
      },
      error: () => {
        this.isProcessing = false;
        this.closeDeleteModal();
        this.showToast('Gagal menghapus.', 'error');
      }
    });
  }

  goBack() { this.router.navigate(['/superadmin/employees']); }

  showToast(msg: string, type: 'success' | 'error') {
    this.toastMessage = msg;
    this.toastType = type;
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => { this.toastMessage = ''; }, 3000);
  }
  
  closeToast() { this.toastMessage = ''; }
}