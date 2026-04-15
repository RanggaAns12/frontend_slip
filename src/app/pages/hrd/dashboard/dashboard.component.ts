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
  @ViewChild('deptChart') deptChartRef!: ElementRef; // Ganti nama ref
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

        // --- LOGIKA HITUNG PER DEPARTEMEN ---
        const deptCounts: { [key: string]: number } = {};
        employees.forEach((e: any) => {
          const dName = e.dept || 'Lain-lain';
          deptCounts[dName] = (deptCounts[dName] || 0) + 1;
        });

        // Ubah ke array dan urutkan dari yang terbanyak
        const sortedDepts = Object.entries(deptCounts)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 7); // Ambil Top 7 Departemen saja agar tidak kepanjangan

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