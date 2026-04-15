import { Component, OnInit, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment'; 
import { Chart, registerables } from 'chart.js';

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
    // API Endpoint disesuaikan ke HRD
    const apiUrl = `${environment.apiUrl}/hrd/dashboard`; 

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

  // 🔴 RENDER BAR CHART (Disesuaikan dengan status absensi HRIS kita)
  renderBarChart(weeklyStats: any) {
    if (!this.attendanceChartRef) return;
    if (this.barChart) this.barChart.destroy();

    // Default label hari kerja
    const labels = weeklyStats?.labels || ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    
    // Data Default jika API kosong
    const dataHadir = weeklyStats?.hadir || [0, 0, 0, 0, 0, 0];
    const dataIzin  = weeklyStats?.izin  || [0, 0, 0, 0, 0, 0];
    const dataSakit = weeklyStats?.sakit || [0, 0, 0, 0, 0, 0];
    const dataAlpa  = weeklyStats?.alpa  || [0, 0, 0, 0, 0, 0]; // Tambahan Alpa

    this.barChart = new Chart(this.attendanceChartRef.nativeElement, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          { label: 'Hadir', data: dataHadir, backgroundColor: '#10b981', borderRadius: 4, barThickness: 14 }, // Emerald
          { label: 'Izin',  data: dataIzin,  backgroundColor: '#6366f1', borderRadius: 4, barThickness: 14 }, // Indigo
          { label: 'Sakit', data: dataSakit, backgroundColor: '#14b8a6', borderRadius: 4, barThickness: 14 }, // Teal
          { label: 'Alpa',  data: dataAlpa,  backgroundColor: '#f43f5e', borderRadius: 4, barThickness: 14 }  // Rose
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { 
          legend: { 
            display: true, // Diaktifkan agar HRD bisa melihat warna kategori
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