import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  AttendanceSummaryApiService,
  AttendanceSummaryDetail,
} from '../../../superadmin/attendance-summaries/services/attendance-summary-api.service';

@Component({
  selector: 'app-hrd-attendance-show',
  standalone: false,
  templateUrl: './hrd-attendance-show.component.html',
  styleUrls: ['./hrd-attendance-show.component.scss'],
})
export class HrdAttendanceShowComponent implements OnInit {

  id     : number = 0;
  detail : AttendanceSummaryDetail | null = null;
  form   : AttendanceSummaryDetail | null = null;

  isLoading       = false;
  isEditMode      = false;
  isSaving        = false;

  toastMessage = '';
  toastType    : 'success' | 'error' = 'success';
  private toastTimer: any;

  constructor(
    private route  : ActivatedRoute,
    private router : Router,
    private api    : AttendanceSummaryApiService,
  ) {}

  ngOnInit(): void {
    this.id = Number(this.route.snapshot.paramMap.get('id'));
    this.loadDetail();
  }

  loadDetail(): void {
    this.isLoading = true;
    this.api.getById(this.id).subscribe({
      next: (res) => {
        this.detail    = res.data;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.showToast('Gagal memuat detail data.', 'error');
      },
    });
  }

  startEdit(): void {
    this.form       = { ...this.detail! };
    this.isEditMode = true;
  }

  cancelEdit(): void {
    this.form       = null;
    this.isEditMode = false;
  }

  saveEdit(): void {
    if (!this.form || this.isSaving) return;
    this.isSaving = true;

    this.api.update(this.id, this.form).subscribe({
      next: (res) => {
        this.detail     = res.data;
        this.form       = null;
        this.isEditMode = false;
        this.isSaving   = false;
        this.showToast('Data absensi berhasil diperbarui!', 'success');
      },
      error: (err) => {
        this.isSaving = false;
        this.showToast(err?.error?.message ?? 'Gagal menyimpan perubahan.', 'error');
      },
    });
  }

  goBack(): void {
    // Kembali ke halaman list HRD
    this.router.navigate(['../../list'], { relativeTo: this.route });
  }

  getMonthName(m: number): string {
    if (!m) return '-';
    return new Date(2000, m - 1).toLocaleString('id-ID', { month: 'long' });
  }

  private showToast(msg: string, type: 'success' | 'error'): void {
    this.toastMessage = msg;
    this.toastType    = type;
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => { this.toastMessage = ''; }, 4000);
  }
}