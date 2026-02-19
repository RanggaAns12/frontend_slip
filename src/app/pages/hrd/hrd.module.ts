import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { HrdRoutingModule } from './hrd-routing.module';
import { DashboardComponent } from './dashboard/dashboard.component';


@NgModule({
  declarations: [
    DashboardComponent
  ],
  imports: [
    CommonModule,
    HrdRoutingModule
  ]
})
export class HrdModule { }
