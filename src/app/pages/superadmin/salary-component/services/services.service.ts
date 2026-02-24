import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment' // Sesuaikan path environment Mas

@Injectable({
  providedIn: 'root'
})
export class SalaryComponentService {
  private apiUrl = `${environment.apiUrl}/superadmin/salary-components`;

  constructor(private http: HttpClient) { }

  getAll(): Observable<any> {
    return this.http.get(this.apiUrl);
  }

  create(data: { nama_komponen: string }): Observable<any> {
    return this.http.post(this.apiUrl, data);
  }

  update(id: number | string, data: { nama_komponen: string }): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, data);
  }

  delete(id: number | string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
