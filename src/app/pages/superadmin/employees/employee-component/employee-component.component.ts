import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { EmployeeApiService } from '../services/employee-api.service';

@Component({
  selector: 'app-employee-component',
  templateUrl: './employee-component.component.html',
  styles: [`
    .animate-fade-in { animation: fadeIn 0.4s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class EmployeeComponentComponent implements OnInit {
  employeeId!: number;
  employeeData: any = null;
  
  // Master Data Komponen Gaji
  availableComponents: any[] = [];
  
  // Data yang sedang dipilih/diedit oleh form
  selectedComponents: any[] = [];

  isLoading: boolean = true;
  isSaving: boolean = false;
  
  // Toast State
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';
  toastTimeout: any;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private employeeApi: EmployeeApiService
  ) {}

  ngOnInit(): void {
    // Ambil ID dari URL params
    this.employeeId = Number(this.route.snapshot.paramMap.get('id'));
    if (this.employeeId) {
      this.loadInitialData();
    }
  }

  loadInitialData() {
    this.isLoading = true;
    
    // 1. Ambil Master Komponen Gaji
    this.employeeApi.getSalaryComponents().subscribe({
      next: (resComp: any) => {
        this.availableComponents = resComp.data || resComp; // Sesuaikan dengan format response backend

        // 2. Ambil Data Karyawan (beserta relasi salaryComponents)
        this.employeeApi.getById(this.employeeId).subscribe({
          next: (resEmp: any) => {
            this.employeeData = resEmp.data;
            this.mapExistingComponents();
            this.isLoading = false;
          },
          error: (err) => {
            this.isLoading = false;
            this.showToast('Gagal memuat data karyawan.', 'error');
          }
        });
      },
      error: (err) => {
        this.isLoading = false;
        this.showToast('Gagal memuat master komponen gaji.', 'error');
      }
    });
  }

  // Petakan komponen yang sudah dimiliki karyawan ke dalam list master
  mapExistingComponents() {
    const existing = this.employeeData.salary_components || [];
    
    this.selectedComponents = this.availableComponents.map(comp => {
      // Cek apakah karyawan sudah punya komponen ini di pivot tabelnya
      const found = existing.find((e: any) => e.id === comp.id);
      
      // Jika found.pivot.custom_amount ada angkanya, pakai itu.
      // Jika null, biarkan string kosong agar UI menampilkan placeholder default
      let customVal = '';
      if (found && found.pivot && found.pivot.custom_amount !== null) {
         customVal = found.pivot.custom_amount.toString();
      }

      return {
        salary_component_id: comp.id,
        name: comp.name,
        type: comp.type, // 'pendapatan' atau 'potongan'
        default_amount: comp.amount, // Nominal bawaan dari master
        
        // Form states
        is_selected: !!found, // true jika sudah punya
        custom_amount: customVal
      };
    });
  }

  // Fungsi saat checkbox di-klik
  toggleComponentSelection(index: number) {
    const item = this.selectedComponents[index];
    item.is_selected = !item.is_selected;
    
    // Jika di-uncheck, bersihkan custom amount-nya agar bersih
    if (!item.is_selected) {
      item.custom_amount = '';
    }
  }

  // =====================================================================
  // FITUR PPH21 TER (TARIF EFEKTIF RATA-RATA)
  // =====================================================================

  // Cek apakah baris komponen ini adalah PPh21
  isPph21Component(name: string): boolean {
    return name.toLowerCase().includes('pph21') || name.toLowerCase().includes('pph 21');
  }

  // Kalkulator Frontend untuk mengestimasi potongan PPh21 (Hanya untuk Display UI)
  getEstimatedPph21(): number {
    if (!this.employeeData) return 0;
    
    // 1. Hitung Estimasi Gaji Bruto (Gaji Pokok + Semua Komponen Pendapatan yang dicentang)
    let bruto = Number(this.employeeData.gaji_pokok) || 0;
    
    this.selectedComponents.forEach(comp => {
      if (comp.is_selected && comp.type === 'pendapatan') {
        const amt = comp.custom_amount ? Number(comp.custom_amount) : Number(comp.default_amount);
        bruto += amt;
      }
    });

    if (bruto <= 0) return 0;

    // 2. Tentukan Kategori TER Berdasarkan Status Pajak (Sesuai Logic Backend Laravel kita)
    const statusPajak = this.employeeData.status_pajak_2026 
      ? this.employeeData.status_pajak_2026.toUpperCase().trim().replace('/', '') 
      : 'TK0';

    let kategori = 'A';
    if (['TK2', 'TK3', 'K1', 'K2'].includes(statusPajak)) {
      kategori = 'B';
    } else if (['K3'].includes(statusPajak)) {
      kategori = 'C';
    }

    let persenTer = 0;

    // 3. Pengecekan Persentase Sederhana (Mirroring Backend Laravel)
    if (kategori === 'A') {
        if (bruto <= 5400000) persenTer = 0;
        else if (bruto <= 5650000) persenTer = 0.25;
        else if (bruto <= 5950000) persenTer = 0.5;
        else if (bruto <= 6300000) persenTer = 0.75;
        else if (bruto <= 6750000) persenTer = 1;
        else if (bruto <= 7500000) persenTer = 1.25;
        else if (bruto <= 8550000) persenTer = 1.5;
        else if (bruto <= 9650000) persenTer = 1.75;
        else if (bruto <= 10050000) persenTer = 2;
        else if (bruto <= 10350000) persenTer = 2.25;
        else if (bruto <= 10700000) persenTer = 2.5;
        else if (bruto <= 11050000) persenTer = 3;
        else if (bruto <= 11600000) persenTer = 3.5;
        else if (bruto <= 12500000) persenTer = 4;
        else if (bruto <= 13750000) persenTer = 5;
        else if (bruto <= 15100000) persenTer = 6;
        else if (bruto <= 16950000) persenTer = 7;
        else if (bruto <= 19750000) persenTer = 8;
        else if (bruto <= 24150000) persenTer = 9;
        else if (bruto <= 26450000) persenTer = 10;
        else persenTer = 15;
    } 
    else if (kategori === 'B') {
        if (bruto <= 6200000) persenTer = 0;
        else if (bruto <= 6500000) persenTer = 0.25;
        else if (bruto <= 6850000) persenTer = 0.5;
        else if (bruto <= 7300000) persenTer = 0.75;
        else if (bruto <= 7925000) persenTer = 1;
        else if (bruto <= 8550000) persenTer = 1.5;
        else if (bruto <= 9650000) persenTer = 1.75;
        else if (bruto <= 10050000) persenTer = 2;
        else if (bruto <= 10350000) persenTer = 2.25;
        else if (bruto <= 10700000) persenTer = 2.5;
        else if (bruto <= 11050000) persenTer = 3;
        else if (bruto <= 11600000) persenTer = 3.5;
        else if (bruto <= 12500000) persenTer = 4;
        else if (bruto <= 13750000) persenTer = 5;
        else if (bruto <= 15100000) persenTer = 6;
        else if (bruto <= 16950000) persenTer = 7;
        else if (bruto <= 19750000) persenTer = 8;
        else if (bruto <= 24150000) persenTer = 9;
        else if (bruto <= 26450000) persenTer = 10;
        else persenTer = 15;
    } 
    else if (kategori === 'C') {
        if (bruto <= 6600000) persenTer = 0;
        else if (bruto <= 6950000) persenTer = 0.25;
        else if (bruto <= 7350000) persenTer = 0.5;
        else if (bruto <= 7800000) persenTer = 0.75;
        else if (bruto <= 8310000) persenTer = 1;
        else if (bruto <= 8550000) persenTer = 1.25;
        else if (bruto <= 9650000) persenTer = 1.5;
        else if (bruto <= 10050000) persenTer = 1.75;
        else if (bruto <= 10350000) persenTer = 2;
        else if (bruto <= 10700000) persenTer = 2.25;
        else if (bruto <= 11050000) persenTer = 2.5;
        else if (bruto <= 11600000) persenTer = 3;
        else if (bruto <= 12500000) persenTer = 4;
        else if (bruto <= 13750000) persenTer = 5;
        else if (bruto <= 15100000) persenTer = 6;
        else if (bruto <= 16950000) persenTer = 7;
        else if (bruto <= 19750000) persenTer = 8;
        else if (bruto <= 24150000) persenTer = 9;
        else if (bruto <= 26450000) persenTer = 10;
        else persenTer = 15;
    }

    return (persenTer / 100) * bruto;
  }

  // =====================================================================
  // RUPIAH FORMATTER (Input UI jadi Rp 100.000, tapi nyimpan angka murni)
  // =====================================================================
  
  formatRupiah(value: string | number): string {
    if (value === null || value === undefined || value === '') return '';
    let valString = value.toString().replace(/[^0-9]/g, '');
    if (!valString) return '';
    
    // Format ke "100.000"
    return parseInt(valString, 10).toLocaleString('id-ID');
  }

  onRupiahInput(event: any, index: number) {
    let inputVal = event.target.value;
    
    // Hapus semua karakter non-angka
    let numericVal = inputVal.replace(/[^0-9]/g, '');
    
    // Simpan angka murni ke state array kita
    this.selectedComponents[index].custom_amount = numericVal ? numericVal : '';
    
    // Update tampilan input HTML jadi terformat titik
    event.target.value = this.formatRupiah(numericVal);
  }


  // =====================================================================
  // SIMPAN DATA KE API
  // =====================================================================

  onSave() {
    this.isSaving = true;

    // Filter hanya yang is_selected = true
    const payloadArray = this.selectedComponents
      .filter(item => item.is_selected)
      .map(item => ({
        salary_component_id: item.salary_component_id,
        // Jika custom_amount kosong, kirim null (agar pakai default amount di backend atau Auto TER)
        custom_amount: item.custom_amount !== '' && item.custom_amount !== null ? Number(item.custom_amount) : null
      }));

    this.employeeApi.syncEmployeeSalaryComponents(this.employeeId, payloadArray).subscribe({
      next: (res) => {
        this.isSaving = false;
        this.showToast('Komponen gaji berhasil diperbarui!', 'success');
        
        // Kembali ke list setelah sukses (delay dikit biar user baca toast)
        setTimeout(() => {
             this.goBack();
        }, 1500);
      },
      error: (err) => {
        this.isSaving = false;
        this.showToast(err.error?.message || 'Terjadi kesalahan saat menyimpan.', 'error');
      }
    });
  }

  goBack() {
    // Kembali ke halaman Penyesuaian Gaji
    this.router.navigate(['/superadmin/employees/salary']); 
  }

  // ==========================================
  // TOAST HELPER
  // ==========================================
  showToast(msg: string, type: 'success' | 'error') {
    this.toastMessage = msg;
    this.toastType = type;
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => { this.toastMessage = ''; }, 3000);
  }
  
  closeToast() { this.toastMessage = ''; }
}
