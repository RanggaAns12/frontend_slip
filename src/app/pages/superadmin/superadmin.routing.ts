import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LayoutComponent } from '../../shared/layout/layout.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { EmployeesComponent } from './employees/employees.component';
import { AttendanceComponent } from './attendance/attendance.component';
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
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },

      // === ROUTE EMPLOYEES (Perhatikan Urutannya!) ===
      
      // 1. List Utama
      { path: 'employees', component: EmployeeListComponent },
      
      // 2. Route STATIS (Database, Create) -> WAJIB DI ATAS Route Dinamis (:id)
      // Tambahkan 'employees/' di depannya agar sesuai dengan tombol navigasi
      { path: 'employees/database', component: EmployeeDatabaseComponent }, 
      { path: 'employees/create', component: EmployeeFormComponent },
      { path: 'superadmin/employees/salary', component: EmployeeSalaryComponent },
      
      // 3. Route DINAMIS (:id) -> WAJIB PALING BAWAH
      // Karena kalau ditaruh di atas, kata 'database' atau 'create' akan dianggap sebagai ID
      { path: 'employees/edit/:id', component: EmployeeFormComponent },
      { path: 'employees/:id', component: EmployeeDetailComponent },

      // (Opsional) Route sisa/sampah ini sebaiknya dihapus saja biar tidak bingung:
      // { path: 'database', component: EmployeeDatabaseComponent },
      // { path: ':id', component: EmployeeDetailComponent }, 
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SuperadminRoutingModule { }
