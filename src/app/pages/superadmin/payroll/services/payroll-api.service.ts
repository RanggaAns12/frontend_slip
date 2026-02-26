import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PayrollApiService {
  
  // URL dasar endpoint payroll di Laravel
  private baseUrl = 'http://localhost:8000/api/superadmin/payrolls';

  constructor(private http: HttpClient) {}

  /**
   * 1. Cek Kesiapan Periode (Apakah sudah di-lock atau masih kosong)
   */
  checkStatus(month: number, year: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/check`, { 
      params: { 
        month: month.toString(), 
        year: year.toString() 
      } 
    });
  }

  /**
   * 2. Preview Kalkulasi Draft Gaji (Menerima 2 parameter month & year)
   * Backend akan membalas dengan status_ptkp, pph21_deduction otomatis, dll.
   */
  previewPayroll(month: number, year: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/preview`, { 
      month: month, 
      year: year 
    });
  }

  /**
   * 3. Generate & Kunci Data Gaji
   * Menerima array `draft_data` yang mungkin sudah diedit nilai PPh21-nya oleh HRD
   */
  generatePayroll(payload: { month: number, year: number, draft_data: any[] }): Observable<any> {
    return this.http.post(`${this.baseUrl}/generate`, payload);
  }

  /**
   * 4. Dapatkan Daftar Slip Gaji yang sudah di-generate (Untuk List & PDF)
   */
  getPayslips(month: number, year: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/slips`, {
      params: { 
        month: month.toString(), 
        year: year.toString() 
      }
    });
  }

  /**
   * 5. (Opsional) Update Potongan / Bonus secara satuan meskipun sudah di-generate
   */
  updatePayrollDetail(detailId: number, data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/details/${detailId}`, data);
  }

  resetPayrollPeriod(month: number, year: number) {
    // Karena kita memakai DELETE request, kita kirimkan data melalui 'body'
    return this.http.request('delete', `${this.baseUrl}/reset-period`, {
      body: { month, year }
    });
  }
}
