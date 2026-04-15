import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { HrdRoutingModule } from './hrd.routing';
import { SharedModule } from '../../shared/shared.module';

// Komponen
import { DashboardComponent } from './dashboard/dashboard.component';
import { HrdEmployeeListComponent } from './employees/hrd-employee-list/hrd-employee-list.component';
import { HrdAttendanceListComponent } from './attendance/hrd-attendance-list/hrd-attendance-list.component';
import { HrdOvertimeListComponent } from './overtimes/hrd-overtime-list/hrd-overtime-list.component';
import { HrdProfileComponent } from './profile/hrd-profile/hrd-profile.component';
import { HrdEmployeeFormComponent } from './employees/hrd-employee-form/hrd-employee-form.component';
import { HrdEmployeeDetailComponent } from './employees/hrd-employee-detail/hrd-employee-detail.component';
import { HrdOvertimeShowComponent } from './overtimes/hrd-overtime-show/hrd-overtime-show.component';
import { HrdAttendanceShowComponent } from './attendance/hrd-attendance-show/hrd-attendance-show.component';

@NgModule({
  declarations: [
    DashboardComponent,
    HrdEmployeeListComponent,
    HrdAttendanceListComponent,
    HrdOvertimeListComponent,
    HrdProfileComponent,
    HrdEmployeeFormComponent,
    HrdEmployeeDetailComponent,
    HrdOvertimeShowComponent,
    HrdAttendanceShowComponent
  ],
  imports: [
    CommonModule,
    HrdRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule // <-- Pastikan ini di-import agar HRD bisa pakai layout yang sama
  ]
})
export class HrdModule { }
