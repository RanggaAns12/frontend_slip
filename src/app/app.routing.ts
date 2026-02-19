import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  // 1. Route Default: Langsung Redirect ke Login
  // Jika path kosong ('') arahkan ke halaman login
  { 
    path: '', 
    redirectTo: 'auth/login', 
    pathMatch: 'full' 
  },

  // 2. Modul Auth (Login, Register, Forgot Password)
  // Diload secara Lazy Loading (biar aplikasi cepat saat pertama dibuka)
  { 
    path: 'auth', 
    loadChildren: () => import('./pages/auth/auth.module').then(m => m.AuthModule) 
  },

  // 3. Modul Superadmin (Dashboard, Employee, Absensi)
  // Diload Lazy Loading + Nanti tambahkan Guard di sini
  { 
    path: 'superadmin', 
    loadChildren: () => import('./pages/superadmin/superadmin.module').then(m => m.SuperadminModule)
    // canActivate: [AuthGuard] <-- Pasang Guard nanti agar user login wajib
  },

  // 4. Modul HRD (Dashboard Khusus HRD)
  { 
    path: 'hrd', 
    loadChildren: () => import('./pages/hrd/hrd.module').then(m => m.HrdModule) 
  },
  
  // 5. Wildcard (404 Not Found)
  // Tangani URL nyasar -> kembalikan ke login atau halaman 404
  { 
    path: '**', 
    redirectTo: 'auth/login' 
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
