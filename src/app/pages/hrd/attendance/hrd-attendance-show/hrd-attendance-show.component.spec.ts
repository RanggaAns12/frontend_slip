import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HrdAttendanceShowComponent } from './hrd-attendance-show.component';

describe('HrdAttendanceShowComponent', () => {
  let component: HrdAttendanceShowComponent;
  let fixture: ComponentFixture<HrdAttendanceShowComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [HrdAttendanceShowComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(HrdAttendanceShowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
