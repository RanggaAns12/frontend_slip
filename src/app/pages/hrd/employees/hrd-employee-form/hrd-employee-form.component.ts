import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';

@Component({
  selector: 'app-hrd-employee-form',
  standalone: false,
  templateUrl: './hrd-employee-form.component.html',
  styleUrls: ['./hrd-employee-form.component.scss']
})
export class HrdEmployeeFormComponent implements OnChanges {
  @Input() isOpen: boolean = false;
  @Input() employeeData: any = null;
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<any>();

  isEditMode: boolean = false;
  isLoading: boolean = false;
  isSubmitting: boolean = false;

  formData: any = {};

  agamaOptions = ['Islam', 'Kristen Protestan', 'Katolik', 'Hindu', 'Buddha', 'Konghucu'];
  pendidikanOptions = ['SD', 'SMP', 'SMA/SMK', 'D3', 'S1', 'S2', 'S3'];
  statusKaryawanOptions = ['PKWTT (Tetap)', 'PKWT (Kontrak)', 'Harian', 'Magang'];
  deptOptions = ['Umum', 'IT', 'HRD', 'Keuangan', 'Operasional', 'Pemasaran'];
  posisiOptions = ['Staff', 'Supervisor', 'Manajer', 'Direktur'];
  // DIKEMBALIKAN: Opsi Bank & Pajak
  bankOptions = ['BCA', 'Mandiri', 'BNI', 'BRI', 'BSI', 'CIMB Niaga', 'Lainnya'];
  statusPajakOptions = ['TK/0', 'TK/1', 'TK/2', 'TK/3', 'K/0', 'K/1', 'K/2', 'K/3'];

  showSuccessModal: boolean = false;
  showErrorModal: boolean = false;
  errorMessage: string = '';
  errorDetails: string[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['employeeData'] && this.isOpen) {
      if (this.employeeData) {
        this.isEditMode = true;
        this.formData = { ...this.employeeData };
      } else {
        this.isEditMode = false;
        this.resetForm();
      }
    }
  }

  resetForm() {
    this.formData = {
      nama_lengkap: '', nik_ktp: '', jenis_kelamin: 'Laki-laki',
      tempat_lahir: '', tanggal_lahir: '', agama: 'Islam',
      pendidikan: 'SMA/SMK', alamat: '', nik_karyawan: '',
      status_karyawan: 'PKWTT (Tetap)', dept: '', posisi: '',
      tanggal_diterima: '',
      // DIKEMBALIKAN: Inisiasi data Bank & Pajak
      nama_bank: 'BCA', no_rekening: '', pemilik_rekening: '',
      npwp: '', status_pajak: 'TK/0', bpjs_ketenagakerjaan: ''
    };
  }

  // DIKEMBALIKAN: Autofill Pemilik Rekening
  onNameChange() {
    if (this.formData.nama_lengkap) {
      this.formData.pemilik_rekening = this.formData.nama_lengkap.toUpperCase();
    }
  }

  goBack() {
    this.close.emit();
  }

  onSubmit() {
    this.isSubmitting = true;
    this.save.emit(this.formData);
    setTimeout(() => {
      this.isSubmitting = false;
    }, 1000);
  }

  closeSuccessModal() {
    this.showSuccessModal = false;
    this.close.emit();
  }

  closeErrorModal() {
    this.showErrorModal = false;
  }
}