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
  isProcessing: number | null = null;

  toastMessage = '';
  toastType: 'success' | 'error' = 'success';
  toastTimeout: any;

  // =========================================================================
  // STATE FILTER & MASTER DATA
  // =========================================================================
  searchKeyword = '';
  filterDept = '';
  filterPosisi = '';

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
    { nama: "QC & R&D", posisi: ["SPV QC / R&D", "QC", "R&D"] },
    { nama: "Umum", posisi: ["Driver"] }
  ];

  departments = this.departemenData.map(d => d.nama);
  positions: string[] = [];

  // =========================================================================
  // STATE MODAL KOMPONEN GAJI
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
    // Inisialisasi awal: tampilkan semua posisi jika belum ada departemen yang dipilih
    this.positions = this.departemenData.flatMap(d => d.posisi).sort();
    
    this.loadEmployees();
    this.loadMasterSalaryComponents();
  }

  loadEmployees() {
    this.isLoading = true;
    this.employeeApi.getAll().subscribe({
      next: (res: any) => {
        this.isLoading = false;
        
        this.employees = res.data.map((e: any) => {
          const gajiPokokMurni = e.gaji_pokok ? Math.round(Number(e.gaji_pokok)) : 0;
          return {
            ...e,
            gaji_pokok: gajiPokokMurni,
            original_gaji: gajiPokokMurni,
            formatted_gaji: this.formatRupiah(gajiPokokMurni)
          };
        });
        
        this.applyFilter();
      },
      error: () => {
        this.isLoading = false;
        this.showToast('Gagal memuat data.', 'error');
      }
    });
  }

  // =====================================================================
  // LOGIKA FILTERING
  // =====================================================================
  onSearch(keyword: string) {
    this.searchKeyword = keyword;
    this.applyFilter();
  }

  onDeptChange() {
    if (this.filterDept) {
      const selected = this.departemenData.find(d => d.nama === this.filterDept);
      this.positions = selected ? selected.posisi : [];
    } else {
      this.positions = this.departemenData.flatMap(d => d.posisi).sort();
    }
    
    this.filterPosisi = ''; 
    this.applyFilter();
  }

  applyFilter() {
    let temp = [...this.employees];

    if (this.searchKeyword) {
      const k = this.searchKeyword.toLowerCase();
      temp = temp.filter(e => 
        (e.nama_lengkap && e.nama_lengkap.toLowerCase().includes(k)) || 
        (e.nik_karyawan && e.nik_karyawan.toLowerCase().includes(k))
      );
    }

    if (this.filterDept) temp = temp.filter(e => e.dept === this.filterDept);
    if (this.filterPosisi) temp = temp.filter(e => e.posisi === this.filterPosisi);

    this.filteredEmployees = temp;
  }

  resetFilter() {
    this.searchKeyword = '';
    this.filterDept = '';
    this.filterPosisi = '';
    this.positions = this.departemenData.flatMap(d => d.posisi).sort();
    
    const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;
    if (searchInput) searchInput.value = '';

    this.applyFilter();
  }

  // =====================================================================
  // RUPIAH FORMATTER & SALARY LOGIC
  // =====================================================================
  formatRupiah(value: string | number): string {
    if (value === null || value === undefined || value === '') return '0';
    const numericValue = Math.round(Number(value));
    let valString = numericValue.toString().replace(/[^0-9]/g, '');
    if (!valString) return '0';
    return parseInt(valString, 10).toLocaleString('id-ID');
  }

  onRupiahInput(event: any, emp: any) {
    let inputVal = event.target.value;
    let numericVal = inputVal.replace(/[^0-9]/g, '');
    emp.gaji_pokok = numericVal ? Number(numericVal) : 0;
    emp.formatted_gaji = this.formatRupiah(numericVal);
    event.target.value = emp.formatted_gaji;
  }

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
  // LOGIKA KOMPONEN GAJI
  // =====================================================================
  loadMasterSalaryComponents() {
    this.employeeApi.getSalaryComponents().subscribe({
      next: (res: any) => { this.masterComponents = res.data || res; },
      error: (err) => console.error('Gagal memuat master komponen gaji', err)
    });
  }

  openComponentModal(employee: any) {
    this.selectedEmployeeForComponent = employee;
    this.showModalComponent = true;
    this.employeeComponents = [];

    this.employeeApi.getById(employee.id).subscribe({
      next: (res: any) => {
        if (res.data && res.data.salary_components) {
          this.employeeComponents = res.data.salary_components.map((item: any) => {
            const pivotAmount = item.pivot && item.pivot.custom_amount ? item.pivot.custom_amount : 0;
            return {
              salary_component_id: item.id,
              custom_amount: Math.round(Number(pivotAmount)),
              component: item
            };
          });
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
    this.employeeComponents.push({ salary_component_id: 0, custom_amount: 0 });
  }

  removeComponentRow(index: number): void {
    this.employeeComponents.splice(index, 1);
  }

  onComponentSelect(index: number, event: any): void {
    const id = Number(event.target.value);
    const isAlreadySelected = this.employeeComponents.some((comp, i) => i !== index && Number(comp.salary_component_id) === id);
    
    if (isAlreadySelected) {
      this.showToast('Komponen ini sudah ditambahkan sebelumnya!', 'error');
      this.employeeComponents[index].salary_component_id = 0;
      event.target.value = 0;
      return;
    }

    const selectedComp: any = this.masterComponents.find(c => c.id === id);
    if (selectedComp) {
      this.employeeComponents[index].salary_component_id = id;
      // Berikan nilai default dari master saat pertama kali dipilih
      this.employeeComponents[index].custom_amount = selectedComp.nominal ? Math.round(Number(selectedComp.nominal)) : 0;
    }
  }

  saveEmployeeComponents(): void {
    if (!this.selectedEmployeeForComponent) return;
    
    // PERBAIKAN: Mapping ulang validComponents agar tipe datanya terjamin murni angka (Number)
    const validComponents = this.employeeComponents
      .filter(c => c.salary_component_id > 0)
      .map(c => ({
        salary_component_id: Number(c.salary_component_id),
        custom_amount: Number(c.custom_amount) || 0 // Jaring pengaman
      }));
    
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
  goBack() { this.router.navigate(['/superadmin/employees']); }
  
  showToast(msg: string, type: 'success' | 'error') {
    this.toastMessage = msg;
    this.toastType = type;
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => { this.toastMessage = ''; }, 3000);
  }
  
  closeToast() { this.toastMessage = ''; }
  
  trackByIndex(index: number, obj: any): any { return index; }
}