import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AttendanceSummaryListComponent } from './attendance-summary-list.component';

describe('AttendanceSummaryListComponent', () => {
  let component: AttendanceSummaryListComponent;
  let fixture: ComponentFixture<AttendanceSummaryListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AttendanceSummaryListComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AttendanceSummaryListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
