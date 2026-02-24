import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { OvertimesRoutingModule } from './overtimes.routing';
import { OvertimesComponent } from './overtimes.component';
import { OvertimeListComponent } from './overtime-list/overtime-list.component';
import { OvertimeShowComponent } from './overtime-show/overtime-show.component';

@NgModule({
  declarations: [
    OvertimesComponent,
    OvertimeListComponent,
    OvertimeShowComponent,
  ],
  imports: [
    CommonModule,
    OvertimesRoutingModule,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class OvertimesModule { }
