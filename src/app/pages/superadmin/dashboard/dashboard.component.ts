import { Component, OnInit, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment'; // Pastikan path sesuai
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, AfterViewInit {
  @ViewChild('attendanceChart') attendanceChartRef!: ElementRef;
  @ViewChild('statusChart') statusChartRef!: ElementRef;

  // Variabel Header
  currentDate: Date = new Date();
  userName: string = 'Superadmin'; 
  isLoading: boolean = true; 

  // Variabel Data (Default di set 0 dulu)
  totalEmployees = 0;
  presentToday = 0;
  lateToday = 0;
  overtimeHours = 0;

  barChart: any;
  doughnutChart: any;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadUserData();
    this.fetchDashboardData();
  }

  ngAfterViewInit(): void {
    // Render dipanggil dari dalam fetchDashboardData
  }

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

  get attendancePercentage(): string {
    if (this.totalEmployees === 0) return '0.0';
    return ((this.presentToday / this.totalEmployees) * 100).toFixed(1);
  }

  // 🔴 MENGAMBIL DATA DARI BACKEND SESUAI ROUTE LIST
  fetchDashboardData() {
    this.isLoading = true;
    
    // 👇 Menggunakan route yang ada di daftar artisan route:list Mas Rangga
    const apiUrl = `${environment.apiUrl}/superadmin/dashboard`;

    this.http.get<any>(apiUrl).subscribe({
      next: (res) => {
        const data = res.data || res; 
        
        // Coba ambil dari API, kalau kosong/belum dibuat di backend, pakai data DUMMY (124, 110, dst)
        this.totalEmployees = data?.total_employees ?? 124;
        this.presentToday   = data?.present_today ?? 110;
        this.lateToday      = data?.late_today ?? 5;
        this.overtimeHours  = data?.overtime_hours ?? 45;

        this.isLoading = false;

        setTimeout(() => {
          this.renderBarChart(data?.weekly_stats);
          this.renderDoughnutChart(data?.today_status);
        }, 100);
      },
      error: (err) => {
        console.error('API Dashboard error/belum siap. Menampilkan data fallback.', err);
        
        // Jika API error (misal 404/500), tetap tampilkan data DUMMY agar UI tidak rusak
        this.totalEmployees = 124;
        this.presentToday = 110;
        this.lateToday = 5;
        this.overtimeHours = 45;
        this.isLoading = false;
        
        setTimeout(() => {
          this.renderBarChart(null); 
          this.renderDoughnutChart(null);
        }, 100);
      }
    });
  }

  // 🔴 RENDER BAR CHART 
  renderBarChart(weeklyStats: any) {
    if (!this.attendanceChartRef) return;
    if (this.barChart) this.barChart.destroy();

    // Jika API belum ngirim 'weekly_stats', pakai data dummy yang cantik ini
    const labels = weeklyStats?.labels || ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    const dataHadir = weeklyStats?.hadir || [110, 115, 112, 118, 120, 90];
    const dataIzin = weeklyStats?.izin || [8, 5, 6, 4, 2, 10];
    const dataSakit = weeklyStats?.sakit || [6, 4, 6, 2, 2, 24];

    this.barChart = new Chart(this.attendanceChartRef.nativeElement, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          { label: 'Hadir', data: dataHadir, backgroundColor: '#f97316', borderRadius: 6, barThickness: 16 },
          { label: 'Izin', data: dataIzin, backgroundColor: '#fbbf24', borderRadius: 6, barThickness: 16 },
          { label: 'Sakit', data: dataSakit, backgroundColor: '#f43f5e', borderRadius: 6, barThickness: 16 }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, grid: { color: '#f1f5f9' } },
          x: { grid: { display: false } }
        }
      }
    });
  }

  // 🔴 RENDER DOUGHNUT CHART
  renderDoughnutChart(todayStatus: any) {
    if (!this.statusChartRef) return;
    if (this.doughnutChart) this.doughnutChart.destroy();

    // Jika API belum ngirim 'today_status', pakai data dummy [Hadir, Izin, Sakit, Alpa]
    const dataStatus = todayStatus || [110, 8, 4, 2];

    this.doughnutChart = new Chart(this.statusChartRef.nativeElement, {
      type: 'doughnut',
      data: {
        labels: ['Hadir', 'Izin', 'Sakit', 'Alpa'],
        datasets: [{
          data: dataStatus,
          backgroundColor: ['#10b981', '#f59e0b', '#f43f5e', '#ef4444'],
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
