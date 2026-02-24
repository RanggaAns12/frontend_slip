import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AttendanceSummariesRoutingModule } from './attendance-summaries.routing';

import { AttendanceSummariesComponent } from './attendance-summaries.component';
import { AttendanceSummaryListComponent } from './attendance-summary-list/attendance-summary-list.component';
import { AttendanceSummaryImportComponent } from './attendance-summary-import/attendance-summary-import.component';
import { AttendanceSummaryShowComponent } from './attendance-summary-show/attendance-summary-show.component';

@NgModule({
  declarations: [
    AttendanceSummariesComponent,
    AttendanceSummaryListComponent,
    AttendanceSummaryImportComponent,
    AttendanceSummaryShowComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    AttendanceSummariesRoutingModule,
  ],
})
export class AttendanceSummariesModule {}
