import { Component, OnInit } from '@angular/core';
import { EmployeeApiService, SalaryComponentMaster, EmployeeSalaryComponent as EmpSalComp } from '../services/employee-api.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-employee-salary',
  templateUrl: './employee-salary.component.html',
  styles: [`
    .animate-fade-in { animation: fadeIn 0.4s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class EmployeeSalaryComponent implements OnInit {

  employees: any[] = [];
  filteredEmployees: any[] = [];
  isLoading = true;
  searchKeyword = '';
  isProcessing: number | null = null;

  toastMessage = '';
  toastType: 'success' | 'error' = 'success';
  toastTimeout: any;

  // =========================================================================
  // STATE BARU UNTUK FITUR MODAL KOMPONEN GAJI (TUNJANGAN / POTONGAN)
  // =========================================================================
  showModalComponent = false;
  selectedEmployeeForComponent: any = null;
  masterComponents: SalaryComponentMaster[] = [];
  employeeComponents: EmpSalComp[] = [];
  isSavingComponents = false;

  constructor(
    private employeeApi: EmployeeApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadEmployees();
    this.loadMasterSalaryComponents(); // Load master tunjangan di awal
  }

  loadEmployees() {
    this.isLoading = true;
    this.employeeApi.getAll().subscribe({
      next: (res: any) => {
        this.isLoading = false;
        
        this.employees = res.data.map((e: any) => {
          // PERBAIKAN: Gunakan Math.round / parseInt untuk membuang angka .00 dari database
          const gajiPokokMurni = e.gaji_pokok ? Math.round(Number(e.gaji_pokok)) : 0;

          return {
            ...e,
            gaji_pokok: gajiPokokMurni,
            original_gaji: gajiPokokMurni,
            // Format ke string Rupiah ("4.200.000")
            formatted_gaji: this.formatRupiah(gajiPokokMurni)
          };
        });
        
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

  // =====================================================================
  // RUPIAH FORMATTER 
  // =====================================================================
  formatRupiah(value: string | number): string {
    if (value === null || value === undefined || value === '') return '0';
    
    // Konversi ke string. Jika awalnya float (ex: 4200000.00), pastikan dibulatkan dulu.
    const numericValue = Math.round(Number(value));
    
    // Hapus semua karakter non-angka (sebagai pengaman tambahan)
    let valString = numericValue.toString().replace(/[^0-9]/g, '');
    if (!valString) return '0';
    
    return parseInt(valString, 10).toLocaleString('id-ID');
  }

  onRupiahInput(event: any, emp: any) {
    let inputVal = event.target.value;
    
    // Hapus semua karakter non-angka yang diketik user
    let numericVal = inputVal.replace(/[^0-9]/g, '');
    
    // Simpan angka murni ke state (misal: 4200000)
    emp.gaji_pokok = numericVal ? Number(numericVal) : 0;
    
    // Tampilkan kembali ke input HTML dengan format titik
    emp.formatted_gaji = this.formatRupiah(numericVal);
    event.target.value = emp.formatted_gaji;
  }

  // === UPDATE SALARY ===
  saveSalary(emp: any) {
    if (emp.gaji_pokok === emp.original_gaji) return;

    this.isProcessing = emp.id;
    const payload = { gaji_pokok: emp.gaji_pokok };

    this.employeeApi.update(emp.id, payload).subscribe({
      next: () => {
        this.isProcessing = null;
        emp.original_gaji = emp.gaji_pokok; 
        this.showToast(`Gaji ${emp.nama_lengkap} berhasil disimpan!`, 'success');
      },
      error: () => {
        this.isProcessing = null;
        this.showToast(`Gagal menyimpan gaji ${emp.nama_lengkap}.`, 'error');
      }
    });
  }

  // =====================================================================
  // LOGIKA BARU UNTUK FITUR KOMPONEN GAJI
  // =====================================================================
  
  loadMasterSalaryComponents() {
    this.employeeApi.getSalaryComponents().subscribe({
      next: (res: any) => {
        this.masterComponents = res.data || res;
      },
      error: (err) => console.error('Gagal memuat master komponen gaji', err)
    });
  }

  openComponentModal(employee: any) {
    this.selectedEmployeeForComponent = employee;
    this.showModalComponent = true;
    this.employeeComponents = [];

    // Fetch data tunjangan karyawan ini dari backend
    this.employeeApi.getById(employee.id).subscribe({
      next: (res: any) => {
        if (res.data && res.data.salary_components) {
          this.employeeComponents = res.data.salary_components.map((item: any) => ({
            salary_component_id: item.salary_component_id,
            custom_amount: item.custom_amount ? Math.round(Number(item.custom_amount)) : 0,
            component: item.component
          }));
        }
      },
      error: () => this.showToast('Gagal mengambil data komponen gaji karyawan', 'error')
    });
  }

  closeComponentModal() {
    this.showModalComponent = false;
    this.selectedEmployeeForComponent = null;
    this.employeeComponents = [];
  }

  addComponentRow(): void {
    this.employeeComponents.push({
      salary_component_id: 0,
      custom_amount: 0
    });
  }

  removeComponentRow(index: number): void {
    this.employeeComponents.splice(index, 1);
  }

  onComponentSelect(index: number, event: any): void {
    const id = Number(event.target.value);
    const selectedComp: any = this.masterComponents.find(c => c.id === id);
    
    if (selectedComp) {
      this.employeeComponents[index].component = selectedComp;
      
      // Mengisi nominal secara otomatis dari data master (jika master punya kolom 'nominal').
      // Nilainya dibulatkan agar tidak ada desimal (.00).
      this.employeeComponents[index].custom_amount = selectedComp.nominal 
        ? Math.round(Number(selectedComp.nominal)) 
        : 0;
    }
  }

  saveEmployeeComponents(): void {
    if (!this.selectedEmployeeForComponent) return;

    // Filter yang sudah dipilih dropdown-nya saja
    const validComponents = this.employeeComponents.filter(c => c.salary_component_id > 0);
    
    this.isSavingComponents = true;
    this.employeeApi.syncEmployeeSalaryComponents(this.selectedEmployeeForComponent.id, validComponents).subscribe({
      next: (res: any) => {
        this.isSavingComponents = false;
        this.showToast('Penyesuaian tunjangan/potongan berhasil disimpan!', 'success');
        this.closeComponentModal();
      },
      error: (err) => {
        this.isSavingComponents = false;
        this.showToast('Gagal menyimpan penyesuaian komponen.', 'error');
        console.error(err);
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
