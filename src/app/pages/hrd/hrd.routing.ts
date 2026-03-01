import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { LayoutHrdComponent } from '../../shared/layout-hrd/layout-hrd.component'; 

import { DashboardComponent } from './dashboard/dashboard.component';
import { HrdEmployeeListComponent } from './employees/hrd-employee-list/hrd-employee-list.component';
import { HrdAttendanceListComponent } from './attendance/hrd-attendance-list/hrd-attendance-list.component';
import { HrdOvertimeListComponent } from './overtimes/hrd-overtime-list/hrd-overtime-list.component';
import { HrdProfileComponent } from './profile/hrd-profile/hrd-profile.component';
import { HrdOvertimeShowComponent } from './overtimes/hrd-overtime-show/hrd-overtime-show.component';

const routes: Routes = [
  {
    path: '',
    component: LayoutHrdComponent, // <-- Ini yang memunculkan Sidebar & Navbar
    children: [
      { 
        path: 'dashboard', 
        component: DashboardComponent 
      },
      { 
        path: 'employees', 
        component: HrdEmployeeListComponent 
      },
      { 
        path: 'attendance', 
        component: HrdAttendanceListComponent 
      },
      { 
        path: 'overtimes', 
        component: HrdOvertimeListComponent 
      },
      {
        path: 'overtimes/show/:nama',
        component: HrdOvertimeShowComponent
      }, // <--- FIX: Di sini tadi kurang tanda koma Mas
      { 
        path: 'profile', 
        component: HrdProfileComponent 
      },
      
      // Default redirect jika HRD hanya mengakses '/hrd'
      { 
        path: '', 
        redirectTo: 'dashboard', 
        pathMatch: 'full' 
      },
    ]
  },

  // 3. Wildcard (Catch-all) diletakkan di luar children
  { 
    path: '**', 
    redirectTo: 'dashboard' 
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class HrdRoutingModule { }
