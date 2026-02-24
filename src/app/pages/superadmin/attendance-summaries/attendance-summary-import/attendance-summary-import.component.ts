import { Component } from '@angular/core';
import {
  AttendanceSummaryApiService,
  AttendancePreviewItem,
  AttendancePreviewMeta,
  AttendancePreviewError,
} from '../services/attendance-summary-api.service';

@Component({
  selector: 'app-attendance-summary-import',
  templateUrl: './attendance-summary-import.component.html',
  styleUrls: ['./attendance-summary-import.component.scss'],
})
export class AttendanceSummaryImportComponent {

  // ── Form ─────────────────────────────────────────────────
  month        : number   = new Date().getMonth() + 1;
  year         : number   = new Date().getFullYear();
  selectedFile : File | null = null;

  // ── State ─────────────────────────────────────────────────
  isLoadingPreview = false;
  isLoadingImport  = false;
  previewDone      = false;
  importDone       = false;
  errorMessage     = '';

  // ── Data ─────────────────────────────────────────────────
  previewItems  : AttendancePreviewItem[]  = [];
  previewErrors : AttendancePreviewError[] = [];
  meta          : AttendancePreviewMeta | null = null;

  importSaved  = 0;
  importFailed = 0;

  // ── Toast (Baru) ─────────────────────────────────────────
  toastMessage = '';
  toastType    : 'success' | 'error' = 'success';
  private toastTimer: any;

  constructor(private api: AttendanceSummaryApiService) {}

  // ── Handlers ─────────────────────────────────────────────

  onFileChange(event: Event): void {
    const input      = event.target as HTMLInputElement;
    this.selectedFile = input.files?.[0] ?? null;
    this.reset();
  }

  doPreview(): void {
    if (!this.selectedFile || this.isLoadingPreview) return;

    this.reset();
    this.isLoadingPreview = true;

    this.api.preview(this.selectedFile, this.month, this.year).subscribe({
      next: (res) => {
        // ✅ Baca res.data.items — bukan res.data
        this.previewItems  = res.data.items;
        this.previewErrors = res.data.errors;
        this.meta          = res.data.meta;
        this.previewDone   = true;
        this.isLoadingPreview = false;

        // Tampilkan Toast Success
        this.showToast(`Preview berhasil! ${this.meta.total_valid} valid, ${this.meta.total_errors} error.`, 'success');
      },
      error: (err) => {
        this.errorMessage     = err?.error?.message ?? 'Preview gagal.';
        this.isLoadingPreview = false;

        // Tampilkan Toast Error
        this.showToast(this.errorMessage, 'error');
      },
    });
  }

  doImport(): void {
    if (!this.selectedFile || !this.canImport) return;

    this.isLoadingImport = true;
    this.errorMessage    = '';

    this.api.import(this.selectedFile, this.month, this.year).subscribe({
      next: (res) => {
        this.importSaved     = res.data.saved;
        this.importFailed    = res.data.failed;
        this.importDone      = true;
        this.isLoadingImport = false;

        // Tampilkan Toast Success
        this.showToast(`Import berhasil! ${this.importSaved} data tersimpan.`, 'success');
      },
      error: (err) => {
        this.errorMessage    = err?.error?.message ?? 'Import gagal.';
        this.isLoadingImport = false;

        // Tampilkan Toast Error
        this.showToast(this.errorMessage, 'error');
      },
    });
  }

  // ── Helpers ──────────────────────────────────────────────

  private reset(): void {
    this.previewDone   = false;
    this.importDone    = false;
    this.previewItems  = [];
    this.previewErrors = [];
    this.meta          = null;
    this.importSaved   = 0;
    this.importFailed  = 0;
    this.errorMessage  = '';
  }

  // Helper Toast (Baru)
  private showToast(message: string, type: 'success' | 'error'): void {
    this.toastMessage = message;
    this.toastType    = type;
    
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }
    
    this.toastTimer = setTimeout(() => {
      this.toastMessage = '';
    }, 4000);
  }

  get canImport(): boolean {
    return (
      this.previewDone &&
      !this.importDone &&
      !this.isLoadingImport &&
      (this.meta?.total_valid ?? 0) > 0
    );
  }

  get totalValid(): number  { return this.meta?.total_valid  ?? 0; }
  get totalErrors(): number { return this.meta?.total_errors ?? 0; }
  get totalRows(): number   { return this.meta?.total_rows   ?? 0; }

  getMonthName(m: number): string {
    return new Date(2000, m - 1).toLocaleString('id-ID', { month: 'long' });
  }
}
