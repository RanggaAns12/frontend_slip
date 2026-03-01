import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProfileApiService {
  // 👇 1. Tambahkan /superadmin/profile di sini
  private apiUrl = `${environment.apiUrl}/superadmin/profile`;

  public profileUpdated = new Subject<any>();

  constructor(private http: HttpClient) {}

  getProfile() {
    return this.http.get(this.apiUrl);
  }

  updateProfile(data: any) {
    // 👇 2. Tambahkan /update di sini sesuai route Laravel (Route::put('/update', ...))
    return this.http.put(`${this.apiUrl}/update`, data);
  }

  updatePassword(data: any) {
    // Ini sudah benar (Route::put('/password', ...))
    return this.http.put(`${this.apiUrl}/password`, data);
  }
}
