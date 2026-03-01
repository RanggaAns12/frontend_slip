import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { Chart, registerables } from 'chart.js';

// Daftarkan semua komponen Chart.js
Chart.register(...registerables);

@Component({
  selector: 'app-hrd-dashboard',
  standalone: false, // hapus jika versi Angular Mas mengharuskan
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, AfterViewInit {
  
  @ViewChild('attendanceChart') attendanceChartRef!: ElementRef;
  @ViewChild('statusChart') statusChartRef!: ElementRef;

  // Data Dummy untuk UI (Nanti bisa diganti dengan Service API)
  userName: string = 'Admin HRD';
  currentDate: Date = new Date();
  
  totalEmployees: number = 145;
  presentToday: number = 138;
  lateToday: number = 12;
  overtimeHours: number = 45;
  attendancePercentage: number = 95;

  chartInstance1: any;
  chartInstance2: any;

  constructor() {}

  ngOnInit(): void {
    // Ambil nama user dari local storage
    const userStr = localStorage.getItem('user_data') || localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        this.userName = user.name || 'Admin HRD';
      } catch (e) {
        console.error('Error parsing user data', e);
      }
    }
  }

  ngAfterViewInit(): void {
    this.renderAttendanceChart();
    this.renderStatusChart();
  }

  renderAttendanceChart() {
    const ctx = this.attendanceChartRef.nativeElement.getContext('2d');
    
    this.chartInstance1 = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'],
        datasets: [
          {
            label: 'Hadir',
            data: [135, 138, 140, 139, 142, 130, 0],
            backgroundColor: '#f97316', // orange-500
            borderRadius: 4,
            barPercentage: 0.6,
            categoryPercentage: 0.8
          },
          {
            label: 'Izin',
            data: [5, 3, 2, 4, 1, 8, 0],
            backgroundColor: '#fbbf24', // amber-400
            borderRadius: 4,
            barPercentage: 0.6,
            categoryPercentage: 0.8
          },
          {
            label: 'Sakit',
            data: [2, 1, 3, 2, 2, 1, 0],
            backgroundColor: '#f43f5e', // rose-500
            borderRadius: 4,
            barPercentage: 0.6,
            categoryPercentage: 0.8
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false } // Legend dibuat manual di HTML
        },
        scales: {
          y: { 
            beginAtZero: true, 
            grid: { color: '#f1f5f9' }, 
            border: { display: false } 
          },
          x: { 
            grid: { display: false }, 
            border: { display: false } 
          }
        }
      }
    });
  }

  renderStatusChart() {
    const ctx = this.statusChartRef.nativeElement.getContext('2d');
    
    this.chartInstance2 = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Hadir', 'Absen/Sakit/Izin'],
        datasets: [{
          data: [this.presentToday, this.totalEmployees - this.presentToday],
          backgroundColor: [
            '#10b981', // emerald-500
            '#f1f5f9'  // slate-100
          ],
          borderWidth: 0,
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '75%',
        plugins: {
          legend: { display: false }
        }
      }
    });
  }
}
