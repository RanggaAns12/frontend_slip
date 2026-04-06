import { Component, OnInit, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment'; 
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

  currentDate: Date = new Date();
  userName: string = 'Superadmin'; 
  isLoading: boolean = true; 

  // Variabel Data Murni (Diambil dari API)
  totalEmployees = 0;
  totalUsers = 0;
  activeEmployees = 0;
  inactiveEmployees = 0;

  barChart: any;
  doughnutChart: any;

  constructor(private http: HttpClient) {}

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

  // 🔴 MENGAMBIL DATA MURNI DARI DATABASE
  fetchDashboardData() {
    this.isLoading = true;
    const apiUrl = `${environment.apiUrl}/superadmin/dashboard`; 

    this.http.get<any>(apiUrl).subscribe({
      next: (res) => {
        const data = res.data || res; 
        
        // Membaca data yang dikirim Laravel
        this.totalEmployees    = Number(data?.total_employees || data?.totalEmployees || 0);
        this.totalUsers        = Number(data?.total_users || data?.totalUsers || 0);
        this.activeEmployees   = Number(data?.active_employees || data?.activeEmployees || 0);
        this.inactiveEmployees = Number(data?.inactive_employees || data?.inactiveEmployees || 0);

        this.isLoading = false;

        setTimeout(() => {
          this.renderBarChart(data?.weekly_stats);
          
          const statusKaryawan = [this.activeEmployees, this.inactiveEmployees];
          this.renderDoughnutChart(statusKaryawan);
        }, 200);
      },
      error: (err) => {
        console.error('Gagal mengambil data dari database:', err);
        
        this.totalEmployees = 0;
        this.totalUsers = 0;
        this.activeEmployees = 0;
        this.inactiveEmployees = 0;
        this.isLoading = false;
        
        setTimeout(() => {
          this.renderBarChart(null); 
          this.renderDoughnutChart([0, 0]); 
        }, 200);
      }
    });
  }

  // 🔴 RENDER BAR CHART 
  renderBarChart(weeklyStats: any) {
    if (!this.attendanceChartRef) return;
    if (this.barChart) this.barChart.destroy();

    const labels = weeklyStats?.labels || ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    const dataHadir = weeklyStats?.hadir || [0, 0, 0, 0, 0, 0];
    const dataIzin = weeklyStats?.izin || [0, 0, 0, 0, 0, 0];
    const dataSakit = weeklyStats?.sakit || [0, 0, 0, 0, 0, 0];

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