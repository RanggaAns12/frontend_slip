import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class EmployeeApiService {
  private apiUrl = `${environment.apiUrl}/superadmin/employees`;

  constructor(private http: HttpClient) {}

  getAll(search: string = ''): Observable<any> {
    let params = new HttpParams();
    if (search) params = params.set('search', search);
    return this.http.get(this.apiUrl, { params });
  }

  // Ambil 1 Data (Detail/Edit)
  getById(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  // Create Baru
  create(data: any): Observable<any> {
    return this.http.post(this.apiUrl, data);
  }

  // Update Data
  update(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, data);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  import(data: any[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/import`, data);
  }

  export(): Observable<any> {
    return this.http.get(`${this.apiUrl}/export`);
  }
}
