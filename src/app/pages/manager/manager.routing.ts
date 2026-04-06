import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// 👇 TAMBAHAN: Import Layout dari Shared Folder
import { LayoutComponent } from '../../shared/layout/layout.component';

// Import semua komponen Manager
import { DashboardComponent } from './dashboard/dashboard.component';
import { UserListComponent } from './users/user-list/user-list.component';
import { EmployeeListComponent } from './employees/employee-list/employee-list.component';
import { EmployeeDetailComponent } from './employees/employee-detail/employee-detail.component';
import { AttendanceSummaryListComponent } from './attendance-summaries/attendance-summary-list/attendance-summary-list.component';
import { AttendanceSummaryShowComponent } from './attendance-summaries/attendance-summary-show/attendance-summary-show.component';
import { OvertimeListComponent } from './overtimes/overtime-list/overtime-list.component';
import { OvertimeShowComponent } from './overtimes/overtime-show/overtime-show.component';
import { SlipListComponent } from './payroll/slip-list/slip-list.component';
import { SlipDetailComponent } from './payroll/slip-detail/slip-detail.component';
import { SalaryComponentComponent } from './salary-component/salary-component.component';
import { ProfileComponent } from './profile/profile.component';

const routes: Routes = [
  {
    path: '',
    component: LayoutComponent, // 👈 PENTING: Semua halaman Manager dibungkus layout ini
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      
      // Dashboard
      { path: 'dashboard', component: DashboardComponent },

      // Master Data
      { path: 'users', component: UserListComponent },
      { path: 'employee-list', component: EmployeeListComponent },
      { path: 'employees/detail/:id', component: EmployeeDetailComponent },

      // Kehadiran & Lembur
      { path: 'attendance-summaries', component: AttendanceSummaryListComponent },
      { path: 'attendance-summaries/detail/:id', component: AttendanceSummaryShowComponent },
      { path: 'overtimes', component: OvertimeListComponent },
      { path: 'overtimes/detail/:nama_karyawan', component: OvertimeShowComponent },

      // Penggajian (Hanya Slip)
      { path: 'payroll/slips', component: SlipListComponent },
      { path: 'payroll/slips/detail/:id', component: SlipDetailComponent },

      // Pengaturan
      { path: 'settings/salary-components', component: SalaryComponentComponent },
      { path: 'settings/profile', component: ProfileComponent }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ManagerRoutingModule { }