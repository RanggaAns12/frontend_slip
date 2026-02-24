import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// =========================
// SHARED LAYOUT
// =========================
import { LayoutComponent } from '../../shared/layout/layout.component';

// =========================
// DASHBOARD
// =========================
import { DashboardComponent } from './dashboard/dashboard.component';

// =========================
// EMPLOYEES
// =========================
import { EmployeeListComponent } from './employees/employee-list/employee-list.component';
import { EmployeeDatabaseComponent } from './employees/employee-database/employee-database.component';
import { EmployeeFormComponent } from './employees/employee-form/employee-form.component';
import { EmployeeDetailComponent } from './employees/employee-detail/employee-detail.component';
import { EmployeeSalaryComponent } from './employees/employee-salary/employee-salary.component';

// =========================
// USERS
// =========================
import { UserListComponent } from './users/user-list/user-list.component';
import { UserFormComponent } from './users/user-form/user-form.component';

// =========================
// PENGATURAN (SETTINGS)
// =========================
import { SalaryComponentComponent } from './salary-component/salary-component.component';
// import { ProfileComponent } from './profile/profile.component'; // Nanti di-uncomment kalau komponen Profile sudah dibuat

// =========================
// PENGGAJIAN (PAYROLL)
// =========================
// import { GeneratePayrollComponent } from './payroll/generate-payroll/generate-payroll.component'; // Nanti di-uncomment
// import { SlipListComponent } from './payroll/slip-list/slip-list.component'; // Nanti di-uncomment

const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      // ----------------------------------------
      // 1. DEFAULT ROUTE
      // ----------------------------------------
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },

      // ----------------------------------------
      // 2. USERS (ADMIN USERS)
      // ----------------------------------------
      { path: 'users', component: UserListComponent },
      { path: 'users/create', component: UserFormComponent },
      { path: 'users/edit/:id', component: UserFormComponent },

      // ----------------------------------------
      // 3. EMPLOYEES (DATA KARYAWAN)
      // ----------------------------------------
      { path: 'employees', component: EmployeeListComponent },
      
      // Route statis (Harus di atas route dinamis)
      { path: 'employees/database', component: EmployeeDatabaseComponent },
      { path: 'employees/create', component: EmployeeFormComponent },
      { path: 'employees/salary', component: EmployeeSalaryComponent },

      // Route dinamis (Harus di bawah route statis)
      { path: 'employees/edit/:id', component: EmployeeFormComponent },
      { path: 'employees/:id', component: EmployeeDetailComponent },

      // ----------------------------------------
      // 4. KEHADIRAN (ABSENSI & LEMBUR) - LAZY LOADED
      // ----------------------------------------
      {
        path: 'attendance-summaries',
        loadChildren: () =>
          import('./attendance-summaries/attendance-summaries.module').then(
            (m) => m.AttendanceSummariesModule
          ),
      },
      {
        path: 'overtimes',
        loadChildren: () =>
          import('./overtimes/overtimes.module').then(
            (m) => m.OvertimesModule
          ),
      },

      // ----------------------------------------
      // 5. PENGGAJIAN (PAYROLL)
      // Nanti akan kita buka komentarnya setelah komponen dibuat
      // ----------------------------------------
      // { path: 'payroll/generate', component: GeneratePayrollComponent },
      // { path: 'payroll/slips', component: SlipListComponent },

      // ----------------------------------------
      // 6. PENGATURAN (SETTINGS)
      // ----------------------------------------
      { path: 'settings/salary-components', component: SalaryComponentComponent },
      
      // Nanti akan kita buka komentarnya setelah komponen Profile dibuat
      // { path: 'settings/profile', component: ProfileComponent },

      // ----------------------------------------
      // FALLBACK ROUTE (Jika URL tidak ditemukan)
      // ----------------------------------------
      // { path: '**', redirectTo: 'dashboard' },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SuperadminRoutingModule {}
