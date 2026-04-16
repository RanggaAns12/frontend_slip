import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

// ─── Interfaces ────────────────────────────────────────────────────

export interface AttendancePreviewItemData {
  pin                            : string | null;
  nip                            : string | null;
  nama                           : string | null;
  jabatan                        : string | null;
  departemen                     : string | null;
  kantor                         : string | null;
  izin_libur                     : number;
  kehadiran_jml                  : number;
  kehadiran_jam_menit            : string;
  terlambat_jml                  : number;
  terlambat_jam_menit            : string;
  pulang_awal_jml                : number;
  pulang_awal_jam_menit          : string;
  istirahat_lebih_jml            : number;
  istirahat_lebih_jam_menit      : string;
  scan_kerja_masuk               : number;
  scan_kerja_keluar              : number;
  lembur_jam                     : number;
  lembur_menit                   : number;
  lembur_scan_1x                 : number;
  tanpa_izin                     : number;
  rutin_umum                     : number;
  izin_tidak_masuk_pribadi       : number;
  izin_pulang_awal_pribadi       : number;
  izin_datang_terlambat_pribadi  : number;
  sakit_dengan_surat_dokter      : number;
  sakit_tanpa_surat_dokter       : number;
  izin_meninggalkan_tempat_kerja : number;
  izin_dinas                     : number;
  izin_datang_terlambat_kantor   : number;
  izin_pulang_awal_kantor        : number;
  cuti_normatif                  : number;
  cuti_pribadi                   : number;
  tidak_scan_masuk               : number;
  tidak_scan_pulang              : number;
  tidak_scan_mulai_istirahat     : number;
  tidak_scan_selesai_istirahat   : number;
  tidak_scan_mulai_lembur        : number;
  tidak_scan_selesai_lembur      : number;
  izin_lain_lain                 : number;
}

export interface AttendancePreviewItem {
  row_number   : number;
  employee_id  : number | null;
  pin          : string | null;
  nip          : string | null;
  nik_karyawan : string | null;
  nama         : string | null;
  found        : boolean;
  valid        : boolean;
  errors       : string[];
  data         : AttendancePreviewItemData;
}

export interface AttendancePreviewMeta {
  month        : number;
  year         : number;
  total_rows   : number;
  total_valid  : number;
  total_errors : number;
}

export interface AttendancePreviewError {
  row     : number;
  nip     : string;
  nama    : string;
  message : string;
}

export interface AttendancePreviewResponse {
  success : boolean;
  data    : {
    items  : AttendancePreviewItem[];
    errors : AttendancePreviewError[];
    meta   : AttendancePreviewMeta;
  };
}

export interface AttendanceImportResponse {
  success : boolean;
  message : string;
  data    : {
    saved  : number;
    failed : number;
    meta   : AttendancePreviewMeta;
  };
}

export interface AttendanceSummary {
  id                             : number | null; // 🔥 Disesuaikan karena bisa null dari backend
  employee_id                    : number;
  month                          : number;
  year                           : number;
  nik_karyawan                   : string;
  pin                            : string;
  nip                            : string;
  nama                           : string;
  jabatan                        : string;
  departemen                     : string;
  kantor                         : string;
  kehadiran_jml                  : number;
  kehadiran_jam_menit            : string;
  terlambat_jml                  : number;
  lembur_jam                     : number;
  lembur_menit                   : number;
  tanpa_izin                     : number;
  imported_at                    : string;

  tanggal_izin?                  : string | null;
  tanggal_sakit?                 : string | null;
  tanggal_alpa?                  : string | null;
  is_empty?                      : boolean; // 🔥 Penanda data kosong dari backend
}

export interface AttendanceSummaryListResponse {
  success : boolean;
  data    : {
    data         : AttendanceSummary[];
    total        : number;
    current_page : number;
    last_page    : number;
    per_page     : number;
  };
}

// ─── Tambahan Interface (Di luar class) ────────────────────────────

export interface AttendanceSummaryDetail extends AttendanceSummary {
  izin_libur                     : number;
  terlambat_jam_menit            : string;
  pulang_awal_jml                : number;
  pulang_awal_jam_menit          : string;
  istirahat_lebih_jml            : number;
  istirahat_lebih_jam_menit      : string;
  scan_kerja_masuk               : number;
  scan_kerja_keluar              : number;
  lembur_scan_1x                 : number;
  rutin_umum                     : number;
  izin_tidak_masuk_pribadi       : number;
  izin_pulang_awal_pribadi       : number;
  izin_datang_terlambat_pribadi  : number;
  sakit_dengan_surat_dokter      : number;
  sakit_tanpa_surat_dokter       : number;
  izin_meninggalkan_tempat_kerja : number;
  izin_dinas                     : number;
  izin_datang_terlambat_kantor   : number;
  izin_pulang_awal_kantor        : number;
  cuti_normatif                  : number;
  cuti_pribadi                   : number;
  tidak_scan_masuk               : number;
  tidak_scan_pulang              : number;
  tidak_scan_mulai_istirahat     : number;
  tidak_scan_selesai_istirahat   : number;
  tidak_scan_mulai_lembur        : number;
  tidak_scan_selesai_lembur      : number;
  izin_lain_lain                 : number;
}

export interface AttendanceSummaryDetailResponse {
  success : boolean;
  data    : AttendanceSummaryDetail;
}

export interface AttendanceSummaryUpdateResponse {
  success : boolean;
  message : string;
  data    : AttendanceSummaryDetail;
}

// ─── Service ───────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class AttendanceSummaryApiService {

  private baseUrl = `${environment.apiUrl}/superadmin/attendance-summaries`;

  constructor(private http: HttpClient) {}

  preview(
    file  : File,
    month : number,
    year  : number
  ): Observable<AttendancePreviewResponse> {
    const form = new FormData();
    form.append('file',  file);
    form.append('month', month.toString());
    form.append('year',  year.toString());
    return this.http.post<AttendancePreviewResponse>(
      `${this.baseUrl}/import-preview`, form
    );
  }

  import(
    file  : File,
    month : number,
    year  : number
  ): Observable<AttendanceImportResponse> {
    const form = new FormData();
    form.append('file',  file);
    form.append('month', month.toString());
    form.append('year',  year.toString());
    return this.http.post<AttendanceImportResponse>(
      `${this.baseUrl}/import-confirm`, form
    );
  }

  getList(params: {
    month ?: number;
    year  ?: number;
    search?: string;
    page  ?: number;
    departemen ?: string; 
    jabatan ?: string;    
  }): Observable<AttendanceSummaryListResponse> {
    return this.http.get<AttendanceSummaryListResponse>(
      `${this.baseUrl}`, { params: params as any }
    );
  }

  getById(id: number): Observable<AttendanceSummaryDetailResponse> {
    return this.http.get<AttendanceSummaryDetailResponse>(`${this.baseUrl}/${id}`);
  }

  // 🔥 FUNGSI BARU UNTUK SAVE KARYAWAN YANG BELUM PUNYA RECORD ABSEN 🔥
  create(data: any): Observable<AttendanceSummaryUpdateResponse> {
    return this.http.post<AttendanceSummaryUpdateResponse>(this.baseUrl, data);
  }

  update(
    id   : number,
    data : Partial<AttendanceSummaryDetail>
  ): Observable<AttendanceSummaryUpdateResponse> {
    return this.http.put<AttendanceSummaryUpdateResponse>(`${this.baseUrl}/${id}`, data);
  }

  delete(id: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/${id}`);
  }
}