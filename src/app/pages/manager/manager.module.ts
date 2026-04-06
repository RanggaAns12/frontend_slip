import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // 👈 1. TAMBAHKAN IMPORT INI

import { ManagerRoutingModule } from './manager.routing';
import { SharedModule } from '../../shared/shared.module';

// Import komponen-komponen Manager
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

@NgModule({
  declarations: [
    DashboardComponent,
    UserListComponent,
    EmployeeListComponent,
    EmployeeDetailComponent,
    AttendanceSummaryListComponent,
    AttendanceSummaryShowComponent,
    OvertimeListComponent,
    OvertimeShowComponent,
    SlipListComponent,
    SlipDetailComponent,
    SalaryComponentComponent,
    ProfileComponent
  ],
  imports: [
    CommonModule,
    ManagerRoutingModule,
    SharedModule,
    FormsModule // 👈 2. DAFTARKAN DI DALAM IMPORTS SINI
  ]
})
export class ManagerModule { }