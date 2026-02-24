import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // <--- WAJIB IMPORT INI

import { SuperadminRoutingModule } from './superadmin.routing';
import { DashboardComponent } from './dashboard/dashboard.component';
import { EmployeesComponent } from './employees/employees.component';

import { SharedModule } from '../../shared/shared.module';
import { EmployeeListComponent } from './employees/employee-list/employee-list.component';
import { EmployeeFormComponent } from './employees/employee-form/employee-form.component';
import { EmployeeDetailComponent } from './employees/employee-detail/employee-detail.component';
import { EmployeeDatabaseComponent } from './employees/employee-database/employee-database.component';
import { EmployeeSalaryComponent } from './employees/employee-salary/employee-salary.component';
import { SalaryComponentComponent } from './salary-component/salary-component.component';
import { GeneratePayrollComponent } from './payroll/generate-payroll/generate-payroll.component';
import { SlipListComponent } from './payroll/slip-list/slip-list.component';
import { SlipDetailComponent } from './payroll/slip-detail/slip-detail.component';
import { ProfileComponent } from './profile/profile.component';
import { UserListComponent } from './users/user-list/user-list.component';
import { UserFormComponent } from './users/user-form/user-form.component';

@NgModule({
  declarations: [
    DashboardComponent,
    EmployeesComponent,
    EmployeeListComponent,
    EmployeeFormComponent,
    EmployeeDetailComponent,
    EmployeeDatabaseComponent,
    EmployeeSalaryComponent,
    SalaryComponentComponent,
    GeneratePayrollComponent,
    SlipListComponent,
    SlipDetailComponent,
    ProfileComponent,
    UserListComponent,
    UserFormComponent
  ],
  imports: [
    CommonModule,
    SuperadminRoutingModule,
    FormsModule,
    SharedModule
  ]
})
export class SuperadminModule { }
