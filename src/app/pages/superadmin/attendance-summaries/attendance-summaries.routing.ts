import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AttendanceSummariesComponent } from './attendance-summaries.component';
import { AttendanceSummaryListComponent } from './attendance-summary-list/attendance-summary-list.component';
import { AttendanceSummaryImportComponent } from './attendance-summary-import/attendance-summary-import.component';

const routes: Routes = [
  {
    path: '',
    component: AttendanceSummariesComponent,
    children: [
      { path: '',       redirectTo: 'list', pathMatch: 'full' },
      { path: 'list',   component: AttendanceSummaryListComponent },
      { path: 'import', component: AttendanceSummaryImportComponent },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AttendanceSummariesRoutingModule {}
