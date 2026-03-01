import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  { path: '', redirectTo: 'auth/login', pathMatch: 'full' },
  
  {
    path: 'auth',
    loadChildren: () => import('./pages/auth/auth.module').then(m => m.AuthModule)
  },
  
  // RUTE SUPERADMIN (Cukup loadChildren saja, HAPUS component: LayoutComponent)
  {
    path: 'superadmin',
    loadChildren: () => import('./pages/superadmin/superadmin.module').then(m => m.SuperadminModule)
  },

  // RUTE HRD (Cukup loadChildren saja, HAPUS component: LayoutHrdComponent)
  {
    path: 'hrd',
    loadChildren: () => import('./pages/hrd/hrd.module').then(m => m.HrdModule)
  },

  { path: '**', redirectTo: 'auth/login' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
