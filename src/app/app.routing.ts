import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  { path: '', redirectTo: 'auth/login', pathMatch: 'full' },
  
  {
    path: 'auth',
    loadChildren: () => import('./pages/auth/auth.module').then(m => m.AuthModule)
  },
  
  // RUTE SUPERADMIN
  {
    path: 'superadmin',
    loadChildren: () => import('./pages/superadmin/superadmin.module').then(m => m.SuperadminModule)
  },

  // RUTE HRD 
  {
    path: 'hrd',
    loadChildren: () => import('./pages/hrd/hrd.module').then(m => m.HrdModule)
  },

  // 👇 TAMBAHAN: RUTE MANAGER
  {
    path: 'manager',
    loadChildren: () => import('./pages/manager/manager.module').then(m => m.ManagerModule)
  },

  { path: '**', redirectTo: 'auth/login' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }