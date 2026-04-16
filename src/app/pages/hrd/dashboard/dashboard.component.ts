import { Component, OnInit, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment'; 
import { Chart, registerables } from 'chart.js';
import { EmployeeApiService } from '../../superadmin/employees/services/employee-api.service'; 

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, AfterViewInit {
  @ViewChild('deptChart') deptChartRef!: ElementRef; 
  @ViewChild('statusChart') statusChartRef!: ElementRef;

  currentDate: Date = new Date();
  userName: string = 'HRD'; 
  isLoading: boolean = true; 

  totalEmployees = 0;
  totalUsers = 0;
  activeEmployees = 0;
  inactiveEmployees = 0;

  deptChart: any;
  doughnutChart: any;

  constructor(
    private http: HttpClient,
    private employeeApi: EmployeeApiService 
  ) {}

  ngOnInit(): void {
    this.loadUserData();
    this.fetchDashboardData();
  }

  ngAfterViewInit(): void {}

  loadUserData() {
    const userDataStr = localStorage.getItem('user_data') || localStorage.getItem('user');
    if (userDataStr) {
      try {
        const userObj = JSON.parse(userDataStr);
        if (userObj && userObj.name) this.userName = userObj.name;
      } catch (e) { console.error('Gagal parsing data user', e); }
    }
  }

  fetchDashboardData() {
    this.isLoading = true;

    // 1. Ambil data User dari API Dashboard
    const apiUrl = `${environment.apiUrl}/hrd/dashboard`; 
    this.http.get<any>(apiUrl).subscribe({
      next: (res) => {
        const data = res.data || res; 
        this.totalUsers = Number(data?.total_users || data?.totalUsers || 0);
      },
      error: () => this.totalUsers = 0
    });

    // 2. SINKRONISASI DATA KARYAWAN & GRAFIK DEPARTEMEN
    this.employeeApi.getAll().subscribe({
      next: (res: any) => {
        const employees = res.data || res || [];
        this.totalEmployees = employees.length;

        // Hitung Rasio Aktif
        this.activeEmployees = employees.filter((e: any) => {
           const status = String(e.status || e.status_karyawan || 'Aktif').toLowerCase();
           return !status.includes('non') && !status.includes('resign') && !status.includes('keluar');
        }).length;
        this.inactiveEmployees = this.totalEmployees - this.activeEmployees;

        // --- LOGIKA BARU: PENGELOMPOKAN DEPARTEMEN SESUAI REQUEST ATASAN ---
        // Kita siapkan wadah dengan nilai awal 0
        const targetDepts: { [key: string]: number } = {
          'Produksi': 0,
          'WTP/WWTP': 0,
          'QA/QC': 0, // Mengasumsikan 'wa' yang Mas maksud adalah QA/QC
          'Engineering': 0,
          'HR': 0,
          'Purchasing': 0,
          'Marketing': 0,
          'Logistic': 0,
          'OCC': 0,
          'Lain-lain': 0
        };

        employees.forEach((e: any) => {
          const rawDept = String(e.dept || '').toLowerCase().trim();

          // Pengecekan kata kunci agar data yang salah ketik di DB tetap masuk kategori yang benar
          if (rawDept.includes('produksi') || rawDept.includes('production')) {
            targetDepts['Produksi']++;
          } else if (rawDept.includes('wtp') || rawDept.includes('wwtp')) {
            targetDepts['WTP/WWTP']++;
          } else if (rawDept.includes('qa') || rawDept.includes('qc') || rawDept.includes('quality') || rawDept === 'wa') {
            targetDepts['QA/QC']++;
          } else if (rawDept.includes('engineer') || rawDept.includes('teknik') || rawDept.includes('engeenering')) {
            targetDepts['Engineering']++;
          } else if (rawDept.includes('hr') || rawDept.includes('human') || rawDept.includes('personalia')) {
            targetDepts['HR']++;
          } else if (rawDept.includes('purchas') || rawDept.includes('pembelian')) {
            targetDepts['Purchasing']++;
          } else if (rawDept.includes('market') || rawDept.includes('pemasaran')) {
            targetDepts['Marketing']++;
          } else if (rawDept.includes('logis') || rawDept.includes('gudang') || rawDept.includes('warehouse')) {
            targetDepts['Logistic']++;
          } else if (rawDept.includes('occ')) {
            targetDepts['OCC']++;
          } else {
            targetDepts['Lain-lain']++; // Sisa departemen yang tidak ada di daftar masuk ke sini
          }
        });

        // Ubah format Object ke Array, buang departemen yang nilainya 0 (opsional, agar grafik rapi), 
        // LALU URUTKAN DARI YANG TERBESAR
        const sortedDepts = Object.entries(targetDepts)
          .filter(([name, count]) => count > 0) // Hilangkan baris ini jika ingin departemen bersaldo 0 tetap muncul
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count); // Logika sorting Descending (Terbesar ke Terkecil)

        this.isLoading = false;

        setTimeout(() => {
          this.renderDeptChart(sortedDepts);
          this.renderDoughnutChart([this.activeEmployees, this.inactiveEmployees]);
        }, 300);
      },
      error: (err) => {
        this.isLoading = false;
        console.error(err);
      }
    });
  }

  // 🔴 RENDER HORIZONTAL BAR CHART (Headcount per Dept)
  renderDeptChart(deptData: any[]) {
    if (!this.deptChartRef) return;
    if (this.deptChart) this.deptChart.destroy();

    const labels = deptData.map(d => d.name);
    const counts = deptData.map(d => d.count);

    this.deptChart = new Chart(this.deptChartRef.nativeElement, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Jumlah Karyawan',
          data: counts,
          backgroundColor: '#f97316', // Orange ADS
          borderRadius: 6,
          barThickness: 20
        }]
      },
      options: {
        indexAxis: 'y', // MEMBUAT JADI HORIZONTAL
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: { 
            beginAtZero: true, 
            grid: { color: '#f1f5f9' },
            ticks: { stepSize: 1, color: '#94a3b8', font: { size: 10 } }
          },
          y: { 
            grid: { display: false },
            ticks: { color: '#475569', font: { weight: 'bold', size: 11 } }
          }
        }
      }
    });
  }

  renderDoughnutChart(statusArray: any[]) {
    if (!this.statusChartRef) return;
    if (this.doughnutChart) this.doughnutChart.destroy();

    this.doughnutChart = new Chart(this.statusChartRef.nativeElement, {
      type: 'doughnut',
      data: {
        labels: ['Aktif', 'Non-Aktif'],
        datasets: [{
          data: statusArray,
          backgroundColor: ['#10b981', '#f43f5e'],
          borderWidth: 0,
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { usePointStyle: true, padding: 15, font: { size: 11 } } }
        },
        cutout: '75%'
      }
    });
  }
}