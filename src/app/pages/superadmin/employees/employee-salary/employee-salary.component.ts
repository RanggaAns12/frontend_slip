import { Component, OnInit } from '@angular/core';
import { EmployeeApiService } from '../services/employee-api.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-employee-salary',
  templateUrl: './employee-salary.component.html',
  styles: [`
    .animate-fade-in { animation: fadeIn 0.4s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    
    .salary-input {
      @apply w-full px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 font-bold font-mono outline-none transition-all text-right;
    }
    .salary-input:focus {
      @apply bg-white ring-2 ring-emerald-400 border-emerald-500 shadow-lg shadow-emerald-100;
    }
  `]
})
export class EmployeeSalaryComponent implements OnInit {

  employees: any[] = [];
  filteredEmployees: any[] = [];
  isLoading = true;
  searchKeyword = '';
  isProcessing: number | null = null; // Menyimpan ID karyawan yang sedang diproses

  // Toast State
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';
  toastTimeout: any;

  constructor(
    private employeeApi: EmployeeApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadEmployees();
  }

  loadEmployees() {
    this.isLoading = true;
    this.employeeApi.getAll().subscribe({
      next: (res: any) => {
        this.isLoading = false;
        // Kita clone data supaya aman saat editing
        this.employees = res.data.map((e: any) => ({
          ...e,
          gaji_pokok: e.gaji_pokok ? Number(e.gaji_pokok) : 0,
          original_gaji: e.gaji_pokok ? Number(e.gaji_pokok) : 0 // Untuk deteksi perubahan
        }));
        this.filteredEmployees = this.employees;
      },
      error: () => {
        this.isLoading = false;
        this.showToast('Gagal memuat data.', 'error');
      }
    });
  }

  onSearch(keyword: string) {
    this.searchKeyword = keyword;
    const k = keyword.toLowerCase();
    this.filteredEmployees = this.employees.filter(e => 
      e.nama_lengkap.toLowerCase().includes(k) || 
      e.nik_karyawan.toLowerCase().includes(k) ||
      (e.posisi && e.posisi.toLowerCase().includes(k))
    );
  }

  // === UPDATE SALARY ===
  saveSalary(emp: any) {
    // Validasi: Jangan simpan jika tidak ada perubahan
    if (emp.gaji_pokok === emp.original_gaji) return;

    this.isProcessing = emp.id;

    const payload = { gaji_pokok: emp.gaji_pokok };

    this.employeeApi.update(emp.id, payload).subscribe({
      next: () => {
        this.isProcessing = null;
        emp.original_gaji = emp.gaji_pokok; // Update state original
        this.showToast(`Gaji ${emp.nama_lengkap} disimpan!`, 'success');
      },
      error: () => {
        this.isProcessing = null;
        this.showToast(`Gagal simpan gaji ${emp.nama_lengkap}.`, 'error');
      }
    });
  }

  // === UTILS ===
  goBack() {
    this.router.navigate(['/superadmin/employees']);
  }

  showToast(msg: string, type: 'success' | 'error') {
    this.toastMessage = msg;
    this.toastType = type;
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => { this.toastMessage = ''; }, 3000);
  }
  
  closeToast() { this.toastMessage = ''; }
}
