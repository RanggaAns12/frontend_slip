import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthApiService {
  // Gunakan URL dari Environment
  private apiUrl = `${environment.apiUrl}/auth`; 

  constructor(private http: HttpClient) {}

  // Login
  login(credentials: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, credentials);
  }

  // --- TAMBAHKAN INI ---
  logout(): Observable<any> {
    // Hapus data lokal dulu biar UI langsung berubah
    localStorage.clear();
    
    // Kirim request ke backend untuk invalidasi token (Opsional tapi Recommended)
    return this.http.post(`${this.apiUrl}/logout`, {}).pipe(
      tap(() => {
        // Double check clear
        localStorage.clear();
      })
    );
  }
}
