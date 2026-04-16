import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';


export interface Overtime {
  id?: number;
  nama_karyawan: string;
  tanggal_lembur: string;
  konversi_lembur: number;
  gaji_pokok: number;
  per_jam: number;
  hitungan_lembur: number;
  potongan_pph_bpjs?: number; 
  total_bersih?: number;      
  is_manually_edited?: boolean; // <-- [BARU] Penanda data diedit manual
}


export interface OvertimeSummary {
  nama_karyawan: string;
  employee_id: number | null;
  gaji_pokok: number;
  total_jam: number;
  total_poin?: number;
  tarif_per_jam?: number;
  total_bayar: number;
  total_potongan?: number;        
  total_bersih_diterima?: number; 
  total_hari: number;
  is_empty?: boolean; // <-- [BARU] Penanda karyawan belum punya data lembur
}


// Interface untuk payload updatePotongan
export interface PotonganPayload {
  potongan_pph_bpjs: number;
  month?: number | string;
  year?: number | string;
}


@Injectable({
  providedIn: 'root'
})
export class OvertimeApiService {
  private apiUrl = `${environment.apiUrl}/superadmin/overtimes`;


  constructor(private http: HttpClient) {}


  // 1. GET LIST REKAP (Di-Group Berdasarkan Nama Karyawan - Pagination)
  getList(params: any): Observable<any> {
    let httpParams = new HttpParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
        httpParams = httpParams.append(key, params[key]);
      }
    });
    return this.http.get<any>(this.apiUrl, { params: httpParams });
  }


  // 1.B GET DETAIL TANGGAL LEMBUR PER KARYAWAN
  getDetail(namaKaryawan: string, params: any): Observable<Overtime[]> {
    let httpParams = new HttpParams();
    if (params.month) httpParams = httpParams.append('month', params.month);
    if (params.year) httpParams = httpParams.append('year', params.year);

    return this.http.get<any>(
      `${this.apiUrl}/detail/${encodeURIComponent(namaKaryawan)}`,
      { params: httpParams }
    ).pipe(
      map(res => res.data || [])
    );
  }


  // 1.C UPDATE POTONGAN PPh21 & BPJS PER KARYAWAN
  updatePotongan(namaKaryawan: string, payload: any): Observable<any> {
    let httpParams = new HttpParams();
    
    // Pindahkan month & year dari payload ke Query Params agar dibaca oleh $request->query() di Laravel
    if (payload.month) httpParams = httpParams.append('month', payload.month);
    if (payload.year) httpParams = httpParams.append('year', payload.year);

    // Sisakan nilai uangnya saja di body
    const body = {
      potongan_pph_bpjs: payload.potongan_pph_bpjs
    };

    return this.http.post<any>(
      `${this.apiUrl}/potongan/${encodeURIComponent(namaKaryawan)}`,
      body,
      { params: httpParams }
    );
  }


  create(data: any): Observable<any> {
    return this.http.post(this.apiUrl, data);
  }


  update(id: number | string, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, data);
  }


  delete(id: number | string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }


  importExcel(formData: FormData): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/import`, formData);
  }
}