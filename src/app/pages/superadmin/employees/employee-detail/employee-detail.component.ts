import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { EmployeeApiService } from '../services/employee-api.service';

@Component({
  selector: 'app-employee-detail',
  templateUrl: './employee-detail.component.html',
  styles: [`
    .animate-fade-in-up { animation: fadeInUp 0.5s ease-out; }
    @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class EmployeeDetailComponent implements OnInit {
  employeeId!: number;
  employee: any = null;
  isLoading = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private employeeApi: EmployeeApiService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.employeeId = Number(id);
      this.loadEmployeeData();
    } else {
      this.goBack();
    }
  }

  loadEmployeeData() {
    this.isLoading = true;
    this.employeeApi.getById(this.employeeId).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        // Menangani format response standard (bisa res.data atau langsung objeknya)
        this.employee = res.data || res;
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Gagal memuat detail karyawan:', err);
        alert('Data karyawan tidak ditemukan atau terjadi kesalahan server.');
        this.goBack();
      }
    });
  }

  goBack() {
    this.router.navigate(['/superadmin/employees']);
  }

  goToEdit() {
    this.router.navigate(['/superadmin/employees/edit', this.employeeId]);
  }
  
  // Fungsi kecil untuk memformat tanggal ke format Indonesia yang rapi
  formatDate(dateString: string | null): string {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }
}