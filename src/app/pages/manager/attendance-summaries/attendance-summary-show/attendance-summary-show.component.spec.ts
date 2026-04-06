import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AttendanceSummaryShowComponent } from './attendance-summary-show.component';

describe('AttendanceSummaryShowComponent', () => {
  let component: AttendanceSummaryShowComponent;
  let fixture: ComponentFixture<AttendanceSummaryShowComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AttendanceSummaryShowComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AttendanceSummaryShowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
