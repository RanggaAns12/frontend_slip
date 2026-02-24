import { TestBed } from '@angular/core/testing';

import { OvertimeApiService } from './overtime-api.service';

describe('OvertimeApiService', () => {
  let service: OvertimeApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OvertimeApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
