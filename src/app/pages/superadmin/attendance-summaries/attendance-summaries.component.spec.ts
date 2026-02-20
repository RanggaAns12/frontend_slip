import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AttendanceSummariesComponent } from './attendance-summaries.component';

describe('AttendanceSummariesComponent', () => {
  let component: AttendanceSummariesComponent;
  let fixture: ComponentFixture<AttendanceSummariesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AttendanceSummariesComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AttendanceSummariesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
