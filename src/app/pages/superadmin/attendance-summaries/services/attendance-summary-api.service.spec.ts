import { TestBed } from '@angular/core/testing';

import { AttendanceSummaryApiService } from './attendance-summary-api.service';

describe('AttendanceSummaryApiService', () => {
  let service: AttendanceSummaryApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AttendanceSummaryApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
