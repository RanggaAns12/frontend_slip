import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Location } from '@angular/common';

@Component({
  selector: 'app-slip-detail',
  standalone: false,
  templateUrl: './slip-detail.component.html',
  styleUrls: ['./slip-detail.component.scss']
})
export class SlipDetailComponent implements OnInit {
  slipData: any = null;

  constructor(private router: Router, private location: Location) {
    // Menangkap data yang dikirim via state saat di-klik dari Slip List
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras.state && navigation.extras.state['data']) {
      this.slipData = navigation.extras.state['data'];
    }
  }

  ngOnInit(): void {
    // Jika data kosong (karena halaman di-refresh), kembalikan ke halaman sebelumnya
    if (!this.slipData) {
      this.location.back();
    }
  }

  // Fungsi untuk memicu print browser
  printSlip(): void {
    window.print();
  }

  goBack(): void {
    this.location.back();
  }

  formatRupiah(value: number): string {
    return new Intl.NumberFormat('id-ID', { 
      style: 'currency', 
      currency: 'IDR', 
      minimumFractionDigits: 0 
    }).format(value || 0);
  }
}