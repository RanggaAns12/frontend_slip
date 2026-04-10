import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { EmployeeApiService } from '../services/employee-api.service';

@Component({
  selector: 'app-employee-detail',
  templateUrl: './employee-detail.component.html',
  styles: [`
    .animate-slide-up { animation: slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1); }
    .animate-scale-in { animation: scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
    .animate-fade-in { animation: fadeIn 0.3s ease-out; }
    
    @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    @keyframes scaleIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

    .hide-scrollbar::-webkit-scrollbar { display: none; }
    .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
    
    /* Input Style untuk Form Modal */
    .modal-input {
      @apply w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none transition-all text-sm;
    }
    .modal-input:focus {
      @apply bg-white border-orange-400 ring-2 ring-orange-100;
    }
    .modal-label {
      @apply block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1;
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

  // 🏢 MASTER DATA DEPARTEMEN & POSISI (Sesuai Struktur Excel)
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
    { nama: "QC & R&D", posisi: ["SPV QC / R&D", "QC", "R&D"] }
  ];

  deptOptions = this.departemenData.map(d => d.nama);
  posisiOptions: string[] = []; 

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
        // Ambil dari res.data jika API membungkusnya dalam 'data'
        this.employee = res.data || res; 
        this.editData = { ...this.employee };
      },
      error: () => {
        this.isLoading = false;
        this.errorMessage = 'Data karyawan tidak ditemukan.';
      }
    });
  }

  // === UI ACTIONS ===
  setTab(tab: 'overview' | 'personal' | 'payroll') { 
    this.activeTab = tab; 
  }

  openEditModal() {
    this.editData = { ...this.employee }; 
    this.onDeptChange(); 
    this.showEditModal = true;
  }
  
  closeEditModal() { this.showEditModal = false; }

  // 🚀 LOGIKA CASCADING DROPDOWN
  onDeptChange() {
    const selected = this.departemenData.find(d => d.nama === this.editData.dept);
    this.posisiOptions = selected ? selected.posisi : [];

    // Reset posisi jika tidak ada di departemen yang baru dipilih
    if (!this.posisiOptions.includes(this.editData.posisi)) {
      this.editData.posisi = '';
    }
  }

  updateEmployee() {
    if (!this.employeeId) return;
    this.isProcessing = true;

    // Validasi & Defaulting
    if (!this.editData.pemilik_rekening) {
        this.editData.pemilik_rekening = this.editData.nama_lengkap; 
    }
    if (!this.editData.no_rekening) {
        this.editData.no_rekening = '';
    }
    if (!this.editData.nama_bank) {
        this.editData.nama_bank = 'MESTIKA';
    }

    this.employeeApi.update(this.employeeId, this.editData).subscribe({
      next: (res: any) => {
        this.isProcessing = false;
        this.employee = res.data || this.editData; // Update UI langsung
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
        setTimeout(() => this.router.navigate(['/superadmin/employees']), 1500);
      },
      error: () => {
        this.isProcessing = false;
        this.closeDeleteModal();
        this.showToast('Gagal menghapus.', 'error');
      }
    });
  }

  goBack() { this.router.navigate(['/superadmin/employees']); }

  // === HELPER ===
  formatDate(dateString: string | null): string {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
  }

  showToast(msg: string, type: 'success' | 'error') {
    this.toastMessage = msg;
    this.toastType = type;
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => { this.toastMessage = ''; }, 3000);
  }
  
  closeToast() { this.toastMessage = ''; }
}