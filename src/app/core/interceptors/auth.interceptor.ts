import { Injectable, Injector } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  // Menggunakan Injector untuk mencegah error "Circular Dependency" (NG0200)
  constructor(private injector: Injector) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    
    // 1. Ambil Token dari LocalStorage dengan AMAN (Mencegah error SSR di Angular 17)
    let token = null;
    if (typeof window !== 'undefined') {
      token = localStorage.getItem('auth_token'); // Pastikan key-nya benar 'auth_token' ya Mas
    }

    // 2. Jika Token Ada, Clone Request & Tambah Header Authorization
    if (token) {
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }

    // 3. Lanjutkan Request ke Backend
    return next.handle(request).pipe(
      
      // 4. Global Error Handling
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          
          // Ambil router melalui injector hanya saat error terjadi
          const router = this.injector.get(Router);
          
          // Hapus token dengan aman
          if (typeof window !== 'undefined') {
            localStorage.clear();
          }
          
          // Redirect ke halaman login
          router.navigate(['/auth/login']);
        }
        return throwError(() => error);
      })
    );
  }
}