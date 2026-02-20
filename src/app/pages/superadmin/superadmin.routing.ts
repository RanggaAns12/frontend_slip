import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { LayoutComponent } from '../../shared/layout/layout.component';

import { DashboardComponent } from './dashboard/dashboard.component';

// Employees
import { EmployeeListComponent } from './employees/employee-list/employee-list.component';
import { EmployeeDatabaseComponent } from './employees/employee-database/employee-database.component';
import { EmployeeFormComponent } from './employees/employee-form/employee-form.component';
import { EmployeeDetailComponent } from './employees/employee-detail/employee-detail.component';
import { EmployeeSalaryComponent } from './employees/employee-salary/employee-salary.component';

const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      // Default
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }, // pathMatch full untuk redirect root. [web:115]
      { path: 'dashboard', component: DashboardComponent },

      // =========================
      // EMPLOYEES
      // =========================
      // List utama
      { path: 'employees', component: EmployeeListComponent },

      // Route statis (HARUS di atas route dinamis)
      { path: 'employees/database', component: EmployeeDatabaseComponent },
      { path: 'employees/create', component: EmployeeFormComponent },
      { path: 'employees/salary', component: EmployeeSalaryComponent },

      // Route dinamis (taruh paling bawah)
      { path: 'employees/edit/:id', component: EmployeeFormComponent },
      { path: 'employees/:id', component: EmployeeDetailComponent },

      // =========================
      // ATTENDANCE SUMMARY (REKAP)
      // =========================
      // Kalau Mas sudah bikin lazy module AttendanceSummariesModule,
      // ini yang paling clean:
      {
        path: 'attendance-summaries',
        loadChildren: () =>
          import('./attendance-summaries/attendance-summaries.module').then(
            (m) => m.AttendanceSummariesModule
          ),
      },

      // Optional: fallback (kalau mau)
      // { path: '**', redirectTo: 'dashboard' },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SuperadminRoutingModule {}
