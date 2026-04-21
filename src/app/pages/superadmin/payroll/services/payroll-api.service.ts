import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PayrollApiService {
  
  /**
   * Menggunakan environment.apiUrl agar dinamis.
   */
  private baseUrl = `${environment.apiUrl}/superadmin/payrolls`;

  constructor(private http: HttpClient) {}

  /**
   * 1. Cek Kesiapan Periode (Apakah sudah di-lock atau masih kosong)
   * [PERBAIKAN] Menggunakan POST untuk menghindari error Method Not Allowed
   */
  checkStatus(month: number, year: number): Observable<any> {
    const body = { month, year };
    // Pastikan endpoint di api.php Laravel Mas adalah '/check-status' (atau sesuaikan jika '/check')
    return this.http.post(`${this.baseUrl}/check-status`, body);
  }

  /**
   * 2. Preview Kalkulasi Draft Gaji
   * [PERBAIKAN] Menggunakan POST. month & year dikirim via Body.
   * Parameter recalculate dikirim via Query URL (?recalculate=true)
   */
  previewPayroll(month: number, year: number, recalculate: boolean = false): Observable<any> {
    const body = { month, year };
    let params = new HttpParams();
    
    if (recalculate) {
      params = params.append('recalculate', 'true');
    }

    return this.http.post(`${this.baseUrl}/preview`, body, { params });
  }

  /**
   * 3. Buka Kunci (Unlock) Gaji
   * Mengubah status dari 'locked' menjadi 'draft'
   */
  unlockPayroll(id: number): Observable<any> {
    return this.http.put(`${this.baseUrl}/${id}/unlock`, {});
  }

  /**
   * 4. Generate & Kunci Data Gaji
   * Menerima array `draft_data` yang mungkin sudah diedit nominalnya oleh HRD
   */
  generatePayroll(payload: { month: number, year: number, draft_data: any[] }): Observable<any> {
    return this.http.post(`${this.baseUrl}/generate`, payload);
  }

  /**
   * 5. Dapatkan Daftar Slip Gaji yang sudah di-generate (Untuk List & PDF)
   */
  getPayslips(month: number, year: number): Observable<any> {
    let params = new HttpParams()
      .set('month', month.toString())
      .set('year', year.toString());

    return this.http.get(`${this.baseUrl}/slips`, { params });
  }

  /**
   * 6. Update Potongan / Bonus secara satuan meskipun sudah di-generate
   */
  updatePayrollDetail(detailId: number, data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/details/${detailId}`, data);
  }

  /**
   * 7. Reset Periode Gaji (Hapus permanen data gaji bulan tersebut)
   */
  resetPayrollPeriod(month: number, year: number): Observable<any> {
    return this.http.request('delete', `${this.baseUrl}/reset-period`, {
      body: { month, year }
    });
  }
}