import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { EmployeeApiService } from '../services/employee-api.service';

@Component({
  selector: 'app-employee-form',
  templateUrl: './employee-form.component.html',
  styles: [`
    .animate-fade-in-up { animation: fadeInUp 0.5s ease-out; }
    @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class EmployeeFormComponent implements OnInit {
  employeeForm!: FormGroup;
  isEditMode = false;
  employeeId!: number;
  isLoading = false;
  isSubmitting = false;

  // 🏢 MASTER DATA (Disamakan dengan Form List & Excel)
  departemenData = [
    { nama: "Marketing", posisi: ["Marketing Staff", "Export", "Import"] },
    { nama: "Purchasing", posisi: ["Purchasing Staff"] },
    { nama: "Finance & Accounting", posisi: ["Finance Staff", "Accounting Staff"] },
    { nama: "Legal", posisi: ["Legal Staff"] },
    { nama: "Auditor / ISO", posisi: ["Auditor / ISO Staff"] },
    { nama: "PPIC", posisi: ["PPIC Staff"] },
    { nama: "HRD & HSE & Civil", posisi: ["HRD", "HRD Staff", "HSE", "Civil", "Supervisor"] },
    { nama: "Kepala Pabrik", posisi: ["Kepala Pabrik", "Wakil Kepala Pabrik", "Adm Pabrik"] },
    { nama: "Security & Kebersihan", posisi: ["Kepala Regu Security", "Security", "Cleaning Service & Taman"] },
    { nama: "Timbangan, Bahan Baku & Chemical", posisi: ["SPV Timbangan, B. Baku & Chemical", "Ang. Timbangan", "Ang. Bahan Baku", "Ang. Chemical", "Ang. Ballpress"] },
    { nama: "Sparepart, Barang Jadi & Forklift", posisi: ["SPV Sparepart, B. Jadi & Forklift", "Gudang Sparepart", "Op. Forklift B. Baku & B.", "Gudang Barang Jadi"] },
    { nama: "WTP & WWTP", posisi: ["SPV WTP & WWTP", "WTP", "WWTP", "Operator RO"] },
    { nama: "Engineering", posisi: ["Engineering SPV", "Engineer Planner", "IT", "Drafter", "Karu Elektrik", "Instrument"] },
    { nama: "Mekanik", posisi: ["Karu Mekanik", "Mekanik General & Alat Berat", "Fabrikasi", "Oil & Greases"] },
    { nama: "Elektrikal & A/I", posisi: ["Kepala Regu Elektrikal & A/I", "Elektrik Shift", "A/I Shift", "Elektrik Preventif", "A/I Preventif", "Elektrik Repair", "A/I Repair"] },
    { nama: "Boiler & Turbine", posisi: ["Karu Boiler & Turbine", "Boiler & Turbine"] },
    { nama: "PM & Winder", posisi: ["Karu PM & Winder", "PM", "Winder"] },
    { nama: "SP & Starch", posisi: ["Karu SP & Starch", "SP", "Starch", "Operator Pulper"] },
    { nama: "Produksi", posisi: ["Kepala Shift Produksi", "Mekanik Shift", "Operator Wire Press", "Operator Coarse Screen", "Operator Size Press"] },
    { nama: "QC & R&D", posisi: ["SPV QC / R&D", "QC", "R&D"] }
  ];

  departments = this.departemenData.map(d => d.nama);
  positions: string[] = [];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private employeeApi: EmployeeApiService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.checkModeAndLoadData();
  }

  // === Inisialisasi FormGroup & Field ===
  initForm() {
    this.employeeForm = this.fb.group({
      nik_karyawan: ['', Validators.required],
      nama_lengkap: ['', Validators.required],
      dept: ['', Validators.required],
      posisi: ['', Validators.required],
      status_karyawan: ['PKWTT', Validators.required],
      tanggal_diterima: [''],
      
      nik_ktp: [''],
      tanggal_lahir: [''],
      jenis_kelamin: [''],
      agama: [''],
      pendidikan: [''],
      alamat: [''],

      npwp: [''],
      bpjs_ketenagakerjaan: [''],
      no_rekening: [''],
      status_pajak: ['TK/0'],
      status_pajak_2026: [''],
      
      is_active: [1]
    });

    // Deteksi otomatis perubahan pada field Departemen
    this.employeeForm.get('dept')?.valueChanges.subscribe(selectedDept => {
      this.updatePositions(selectedDept);
    });
  }

  // === Logika Cascading Dropdown (Dept -> Posisi) ===
  updatePositions(deptName: string, resetPosisiValue: boolean = true) {
    if (!deptName) {
      this.positions = [];
      if (resetPosisiValue) this.employeeForm.get('posisi')?.setValue('');
      return;
    }
    const foundDept = this.departemenData.find(d => d.nama === deptName);
    this.positions = foundDept ? foundDept.posisi : [];
    
    if (resetPosisiValue) {
      this.employeeForm.get('posisi')?.setValue('');
    }
  }

  // === Cek Mode (Create / Edit) & Load Data ===
  checkModeAndLoadData() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.employeeId = Number(id);
      this.isLoading = true;

      this.employeeApi.getById(this.employeeId).subscribe({
        next: (res: any) => {
          this.isLoading = false;
          const data = res.data || res;
          
          // Setup pilihan Dropdown posisi sebelum melakukan patchValue (agar data tidak hilang)
          if (data.dept) {
            this.updatePositions(data.dept, false);
          }
          this.employeeForm.patchValue(data);
        },
        error: (err) => {
          this.isLoading = false;
          console.error('Gagal meload data karyawan', err);
          this.goBack();
        }
      });
    }
  }

  // === Submit Form ===
  onSubmit() {
    if (this.employeeForm.invalid) {
      // Tandai semua field agar peringatan merah/error tampil di layar
      this.employeeForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const payload = this.employeeForm.value;

    if (this.isEditMode) {
      this.employeeApi.update(this.employeeId, payload).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.goBack();
        },
        error: (err) => {
          this.isSubmitting = false;
          console.error('Gagal update', err);
          alert('Terjadi kesalahan saat mengupdate data.');
        }
      });
    } else {
      this.employeeApi.create(payload).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.goBack();
        },
        error: (err) => {
          this.isSubmitting = false;
          console.error('Gagal simpan', err);
          alert('Terjadi kesalahan saat menyimpan data.');
        }
      });
    }
  }

  goBack() {
    this.router.navigate(['/superadmin/employees']);
  }
}