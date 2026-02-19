import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // <--- WAJIB IMPORT INI

import { SuperadminRoutingModule } from './superadmin.routing';
import { DashboardComponent } from './dashboard/dashboard.component';
import { EmployeesComponent } from './employees/employees.component';
import { AttendanceComponent } from './attendance/attendance.component';
import { SharedModule } from '../../shared/shared.module';
import { EmployeeListComponent } from './employees/employee-list/employee-list.component';
import { EmployeeFormComponent } from './employees/employee-form/employee-form.component';
import { EmployeeDetailComponent } from './employees/employee-detail/employee-detail.component';
import { EmployeeDatabaseComponent } from './employees/employee-database/employee-database.component';
import { EmployeeSalaryComponent } from './employees/employee-salary/employee-salary.component';

@NgModule({
  declarations: [
    DashboardComponent,
    EmployeesComponent,
    AttendanceComponent,
    EmployeeListComponent,
    EmployeeFormComponent,
    EmployeeDetailComponent,
    EmployeeDatabaseComponent,
    EmployeeSalaryComponent
  ],
  imports: [
    CommonModule,
    SuperadminRoutingModule,
    FormsModule,
    SharedModule
  ]
})
export class SuperadminModule { }
