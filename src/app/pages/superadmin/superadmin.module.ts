import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms'; // <--- WAJIB IMPORT INI

import { SuperadminRoutingModule } from './superadmin.routing';
import { DashboardComponent } from './dashboard/dashboard.component';
import { EmployeesComponent } from './employees/employees.component';

import { SharedModule } from '../../shared/shared.module';
import { EmployeeListComponent } from './employees/employee-list/employee-list.component';
import { EmployeeFormComponent } from './employees/employee-form/employee-form.component';
import { EmployeeDetailComponent } from './employees/employee-detail/employee-detail.component';
import { EmployeeDatabaseComponent } from './employees/employee-database/employee-database.component';
import { EmployeeSalaryComponent } from './employees/employee-salary/employee-salary.component';

// --- TAMBAHAN IMPORT UNTUK KOMPONEN YANG ERROR SEBELUMNYA ---
import { UserListComponent } from './users/user-list/user-list.component';
import { SalaryComponentComponent } from './salary-component/salary-component.component';
import { GeneratePayrollComponent } from './payroll/generate-payroll/generate-payroll.component';
import { SlipListComponent } from './payroll/slip-list/slip-list.component';
import { SlipDetailComponent } from './payroll/slip-detail/slip-detail.component';
import { EmployeeComponentComponent } from './employees/employee-component/employee-component.component';
import { ProfileComponent } from './profile/profile.component'; // Nanti di-uncomment kalau komponen Profile sudah dibuat
// -------------------------------------------------------------

@NgModule({
  declarations: [
    DashboardComponent,
    EmployeesComponent,
    EmployeeListComponent,
    EmployeeFormComponent,
    EmployeeDetailComponent,
    EmployeeDatabaseComponent,
    EmployeeSalaryComponent,
    GeneratePayrollComponent,
    SlipListComponent,
    SlipDetailComponent,
    
    // --- WAJIB DIDEKLARASIKAN AGAR ngClass & ngModel DIKENALI ---
    UserListComponent,
    SalaryComponentComponent,
    EmployeeComponentComponent,
    ProfileComponent
    // -------------------------------------------------------------
  ],
  imports: [
    CommonModule,
    SuperadminRoutingModule,
    FormsModule,         // Mengaktifkan [(ngModel)]
    ReactiveFormsModule, // Mengaktifkan FormBuilder (Jika dibutuhkan di masa depan)
    SharedModule
  ]
})
export class SuperadminModule { }
