import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // Wajib buat ngModel
import { HttpClientModule } from '@angular/common/http'; // Wajib buat API

import { AuthRoutingModule } from './auth.routing';
import { LoginComponent } from './login/login.component';

@NgModule({
  declarations: [
    LoginComponent
  ],
  imports: [
    CommonModule,
    AuthRoutingModule,
    FormsModule,      // <--- Tambahkan ini
    HttpClientModule  // <--- Tambahkan ini
  ]
})
export class AuthModule { }
