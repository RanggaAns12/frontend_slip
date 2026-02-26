import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { Observable } from 'rxjs';

// Interface untuk Form Gaji Karyawan (Agar Auto-Complete di Angular jalan)
export interface SalaryComponentMaster {
  id: number;
  nama_komponen: string;
}

export interface EmployeeSalaryComponent {
  id?: number;
  salary_component_id: number;
  custom_amount: number;
  component?: SalaryComponentMaster;
}

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
  // Di controller, method ini sekarang juga me-load relasi salaryComponents
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

  // Import Data (Sudah benar: Menerima array JSON hasil parsing sheet dari Frontend)
  import(data: any[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/import`, data);
  }

  // Export Data (PERBAIKAN: Tambahkan responseType 'blob' agar download Excel tidak error)
  export(): Observable<any> {
    return this.http.get(`${this.apiUrl}/export`, { responseType: 'blob' });
  }

  // =========================================================================
  // TAMBAHAN BARU UNTUK FITUR KOMPONEN GAJI PER KARYAWAN
  // =========================================================================

  // 1. Ambil daftar master komponen gaji (Tunjangan/Potongan)
  getSalaryComponents(): Observable<any> {
    return this.http.get(`${environment.apiUrl}/superadmin/salary-components`);
  }

  // 2. Simpan (Sync) komponen gaji yang dipilih ke karyawan tertentu
  syncEmployeeSalaryComponents(employeeId: number, components: any[]): Observable<any> {
    const payload = { components: components };
    return this.http.post(`${this.apiUrl}/${employeeId}/salary-components/sync`, payload);
  }
}