import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AttendanceSummaryImportComponent } from './attendance-summary-import.component';

describe('AttendanceSummaryImportComponent', () => {
  let component: AttendanceSummaryImportComponent;
  let fixture: ComponentFixture<AttendanceSummaryImportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AttendanceSummaryImportComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AttendanceSummaryImportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
