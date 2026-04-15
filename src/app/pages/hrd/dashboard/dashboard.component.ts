import { Component, OnInit, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment'; 
import { Chart, registerables } from 'chart.js';

// 👇 Import Service Karyawan agar sinkron 100% dengan data tabel
import { EmployeeApiService } from '../../superadmin/employees/services/employee-api.service';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, AfterViewInit {
  @ViewChild('attendanceChart') attendanceChartRef!: ElementRef;
  @ViewChild('statusChart') statusChartRef!: ElementRef;

  currentDate: Date = new Date();
  userName: string = 'HRD'; 
  isLoading: boolean = true; 

  // Variabel Data Murni
  totalEmployees = 0;
  totalUsers = 0;
  activeEmployees = 0;
  inactiveEmployees = 0;

  barChart: any;
  doughnutChart: any;

  constructor(
    private http: HttpClient,
    private employeeApi: EmployeeApiService // 👈 Daftarkan service di sini
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
        if (userObj && userObj.name) {
          this.userName = userObj.name;
        }
      } catch (e) {
        console.error('Gagal parsing data user', e);
      }
    }
  }

  // 🔴 MENGAMBIL DATA DAN MENSINKRONKAN GRAFIK
  fetchDashboardData() {
    this.isLoading = true;

    // 1. Ambil data User & Statistik Absensi dari API Dashboard Backend
    const apiUrl = `${environment.apiUrl}/hrd/dashboard`; 
    this.http.get<any>(apiUrl).subscribe({
      next: (res) => {
        const data = res.data || res; 
        this.totalUsers = Number(data?.total_users || data?.totalUsers || 0);

        setTimeout(() => {
          this.renderBarChart(data?.weekly_stats);
        }, 200);
      },
      error: (err) => {
        console.error('Gagal mengambil data dashboard backend:', err);
        this.totalUsers = 0;
        setTimeout(() => {
          this.renderBarChart(null); 
        }, 200);
      }
    });

    // 2. Ambil data Karyawan SECARA LANGSUNG dari tabel Karyawan (SINKRON 100%)
    this.employeeApi.getAll().subscribe({
      next: (res: any) => {
        const employees = res.data || res || [];
        
        // SINKRONISASI MUTLAK: Jika ada yang dihapus, length akan otomatis berkurang
        this.totalEmployees = employees.length;

        // Hitung Rasio Aktif vs Non-Aktif secara dinamis
        this.activeEmployees = employees.filter((e: any) => {
           // Sesuaikan dengan nama field status di database (status / status_karyawan)
           const status = String(e.status || e.status_karyawan || 'Aktif').toLowerCase();
           
           // Kita anggap Non-Aktif jika di dalam teksnya ada kata 'non', 'resign', atau 'keluar'
           return !status.includes('non') && !status.includes('resign') && !status.includes('keluar');
        }).length;

        this.inactiveEmployees = this.totalEmployees - this.activeEmployees;
        this.isLoading = false;

        // Render ulang grafik donat dengan data yang paling fresh!
        setTimeout(() => {
          this.renderDoughnutChart([this.activeEmployees, this.inactiveEmployees]);
        }, 200);
      },
      error: (err) => {
        console.error('Gagal mengambil sinkronisasi data karyawan:', err);
        this.totalEmployees = 0;
        this.activeEmployees = 0;
        this.inactiveEmployees = 0;
        this.isLoading = false;

        setTimeout(() => {
          this.renderDoughnutChart([0, 0]); 
        }, 200);
      }
    });
  }

  // 🔴 RENDER BAR CHART (Ditambahkan "Alpa" dan warna disesuaikan UI)
  renderBarChart(weeklyStats: any) {
    if (!this.attendanceChartRef) return;
    if (this.barChart) this.barChart.destroy();

    const labels = weeklyStats?.labels || ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const dataHadir = weeklyStats?.hadir || [0, 0, 0, 0, 0, 0];
    const dataIzin  = weeklyStats?.izin  || [0, 0, 0, 0, 0, 0];
    const dataSakit = weeklyStats?.sakit || [0, 0, 0, 0, 0, 0];
    const dataAlpa  = weeklyStats?.alpa  || [0, 0, 0, 0, 0, 0];

    this.barChart = new Chart(this.attendanceChartRef.nativeElement, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          { label: 'Hadir', data: dataHadir, backgroundColor: '#10b981', borderRadius: 4, barThickness: 14 },
          { label: 'Izin',  data: dataIzin,  backgroundColor: '#6366f1', borderRadius: 4, barThickness: 14 },
          { label: 'Sakit', data: dataSakit, backgroundColor: '#14b8a6', borderRadius: 4, barThickness: 14 },
          { label: 'Alpa',  data: dataAlpa,  backgroundColor: '#f43f5e', borderRadius: 4, barThickness: 14 }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { 
          legend: { 
            display: true, 
            position: 'top',
            labels: { usePointStyle: true, boxWidth: 8, padding: 20 }
          } 
        },
        scales: {
          y: { beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { stepSize: 1 } },
          x: { grid: { display: false } }
        }
      }
    });
  }

  // 🔴 RENDER DOUGHNUT CHART 
  renderDoughnutChart(statusArray: any[]) {
    if (!this.statusChartRef) return;
    if (this.doughnutChart) this.doughnutChart.destroy();

    this.doughnutChart = new Chart(this.statusChartRef.nativeElement, {
      type: 'doughnut',
      data: {
        labels: ['Karyawan Aktif', 'Non-Aktif / Resign'],
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
          legend: { position: 'bottom', labels: { usePointStyle: true, padding: 20 } }
        },
        cutout: '75%'
      }
    });
  }
}