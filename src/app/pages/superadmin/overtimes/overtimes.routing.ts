import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { OvertimesComponent } from './overtimes.component';
import { OvertimeListComponent } from './overtime-list/overtime-list.component';
import { OvertimeShowComponent } from './overtime-show/overtime-show.component';

const routes: Routes = [
  {
    path: '',
    component: OvertimesComponent, // Ini parent router outlet
    children: [
      { path: '', redirectTo: 'list', pathMatch: 'full' },
      { path: 'list', component: OvertimeListComponent },
      { path: 'show/:nama', component: OvertimeShowComponent },
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class OvertimesRoutingModule { }
