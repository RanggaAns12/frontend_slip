import { Injectable } from '@angular/core';
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

  constructor(private router: Router) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    
    // 1. Ambil Token dari LocalStorage
    const token = localStorage.getItem('auth_token');

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
      
      // 4. Global Error Handling (Opsional tapi berguna)
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          // Jika Token Expired / Tidak Valid -> Logout & Redirect Login
          localStorage.clear();
          this.router.navigate(['/auth/login']);
        }
        return throwError(() => error);
      })
    );
  }
}
