import { Component, OnInit, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
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
  userName: string = 'Superadmin'; // Nilai default jika data gagal dimuat

  // Variabel Dummy Data Card
  totalEmployees = 124;
  presentToday = 110;
  lateToday = 5;
  overtimeHours = 45;

  barChart: any;
  doughnutChart: any;

  constructor() {}

  ngOnInit(): void {
    this.loadUserData();
  }

  // Fungsi membaca nama dari localStorage yang diisi waktu proses login
  loadUserData() {
    const userDataStr = localStorage.getItem('user_data') || localStorage.getItem('user');
    if (userDataStr) {
      try {
        const userObj = JSON.parse(userDataStr);
        // Jika nama tersedia, timpa variabel default
        if (userObj && userObj.name) {
          this.userName = userObj.name;
        }
      } catch (e) {
        console.error('Gagal parsing data user', e);
      }
    }
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.renderBarChart();
      this.renderDoughnutChart();
    }, 200);
  }

  get attendancePercentage(): string {
    if (this.totalEmployees === 0) return '0.0';
    return ((this.presentToday / this.totalEmployees) * 100).toFixed(1);
  }

  renderBarChart() {
    if (this.attendanceChartRef) {
      this.barChart = new Chart(this.attendanceChartRef.nativeElement, {
        type: 'bar',
        data: {
          labels: ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'],
          datasets: [
            {
              label: 'Hadir',
              data: [110, 115, 112, 118, 120, 90],
              backgroundColor: '#f97316', // orange-500
              borderRadius: 6,
              barThickness: 16
            },
            {
              label: 'Izin',
              data: [8, 5, 6, 4, 2, 10],
              backgroundColor: '#fbbf24', // amber-400
              borderRadius: 6,
              barThickness: 16
            },
            {
              label: 'Sakit',
              data: [6, 4, 6, 2, 2, 24],
              backgroundColor: '#f43f5e', // rose-500
              borderRadius: 6,
              barThickness: 16
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            y: { 
              beginAtZero: true,
              grid: { color: '#f1f5f9' }
            },
            x: {
              grid: { display: false }
            }
          }
        }
      });
    }
  }

  renderDoughnutChart() {
    if (this.statusChartRef) {
      this.doughnutChart = new Chart(this.statusChartRef.nativeElement, {
        type: 'doughnut',
        data: {
          labels: ['Hadir', 'Izin', 'Sakit', 'Alpa'],
          datasets: [{
            data: [110, 8, 4, 2],
            backgroundColor: [
              '#10b981', // emerald-500
              '#f59e0b', // amber-500
              '#f43f5e', // rose-500
              '#ef4444'  // red-500
            ],
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
}
