import { Component, OnInit } from '@angular/core';
import {
  AttendanceSummaryApiService,
  AttendanceSummary,
} from '../services/attendance-summary-api.service';

@Component({
  selector: 'app-attendance-summary-list',
  templateUrl: './attendance-summary-list.component.html',
  styleUrls: ['./attendance-summary-list.component.scss'],
})
export class AttendanceSummaryListComponent implements OnInit {

  items       : AttendanceSummary[] = [];
  isLoading   = false;
  currentPage = 1;
  lastPage    = 1;
  total       = 0;

  filterMonth  : number | '' = new Date().getMonth() + 1;
  filterYear   : number      = new Date().getFullYear();
  filterSearch = '';

  constructor(private api: AttendanceSummaryApiService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading = true;

    const params: any = {
      page  : this.currentPage,
      year  : this.filterYear,
    };
    if (this.filterMonth !== '') params['month']  = this.filterMonth;
    if (this.filterSearch !== '') params['search'] = this.filterSearch;

    this.api.getList(params).subscribe({
      next: (res) => {
        this.items       = res.data.data;
        this.total       = res.data.total;
        this.currentPage = res.data.current_page;
        this.lastPage    = res.data.last_page;
        this.isLoading   = false;
      },
      error: () => { this.isLoading = false; },
    });
  }

  onSearch(): void {
    this.currentPage = 1;
    this.load();
  }

  goPage(page: number): void {
    if (page < 1 || page > this.lastPage) return;
    this.currentPage = page;
    this.load();
  }

  getMonthName(m: number): string {
    return new Date(2000, m - 1).toLocaleString('id-ID', { month: 'long' });
  }
}
