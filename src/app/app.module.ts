import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http'; 
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'; // Opsional: Untuk animasi smooth

// Routing Utama
import { AppRoutingModule } from './app.routing'; // Pastikan nama file routing benar

// Komponen Utama
import { AppComponent } from './app.component';

// Module Shared (Agar Layout bisa dipakai global jika perlu)
import { SharedModule } from './shared/shared.module';

// Interceptor
import { AuthInterceptor } from './core/interceptors/auth.interceptor'; 

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule, // Tambahan untuk animasi Angular Material / Transisi
    HttpClientModule,        // Wajib untuk API
    AppRoutingModule,        // Wajib untuk Navigasi
    SharedModule             // Import SharedModule agar komponen global tersedia
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true // Izinkan banyak interceptor
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
