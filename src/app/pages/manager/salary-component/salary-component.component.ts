import { Component, OnInit } from '@angular/core';
import { SalaryComponentService } from '../../superadmin/salary-component/services/services.service' // Pastikan path ini benar mengarah ke service superadmin

@Component({
  selector: 'app-manager-salary-component',
  templateUrl: './salary-component.component.html',
  styleUrls: ['./salary-component.component.scss']
})
export class SalaryComponentComponent implements OnInit {

  komponenList: any[] = [];
  filteredKomponen: any[] = [];
  isLoading = false;

  // Variabel Pencarian
  searchQuery: string = '';

  // STATE TOAST ALERT
  toastMessage: string = '';
  toastType: 'success' | 'error' = 'success';

  constructor(private salaryApi: SalaryComponentService) { }

  ngOnInit(): void {
    this.loadData();
  }

  showToast(message: string, type: 'success' | 'error') {
    this.toastMessage = message;
    this.toastType = type;
    setTimeout(() => {
      this.toastMessage = '';
    }, 3500); 
  }

  loadData(): void {
    this.isLoading = true;
    this.salaryApi.getAll().subscribe({
      next: (res: any) => {
        this.komponenList = res.data || res;
        this.filteredKomponen = [...this.komponenList]; // Inisialisasi awal
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Gagal mengambil data', err);
        this.showToast('Gagal memuat data komponen', 'error');
        this.isLoading = false;
      }
    });
  }

  // Fungsi Pencarian Lokal (Client-Side Filtering)
  filterData(): void {
    if (!this.searchQuery) {
      this.filteredKomponen = [...this.komponenList];
      return;
    }
    
    const term = this.searchQuery.toLowerCase();
    this.filteredKomponen = this.komponenList.filter(item => 
      item.nama_komponen.toLowerCase().includes(term)
    );
  }

  // FORMATTER RUPIAH
  formatRupiah(value: number | string): string {
    const val = parseFloat(value as string || '0');
    if (val === 0) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', { 
      style: 'currency', 
      currency: 'IDR', 
      minimumFractionDigits: 0 
    }).format(val);
  }

}